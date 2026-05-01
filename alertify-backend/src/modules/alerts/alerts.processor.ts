import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { AlertsService } from './alerts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AlertDispatchDto } from './dto/alert-dispatch.dto';

/**
 * AlertsProcessor — T14: Worker de Despacho de Alertas Push.
 *
 * Consume la cola 'alert-dispatch' publicada por ValidationProcessor
 * cuando un reporte ciudadano supera el umbral de confianza (CS >= 0.60).
 *
 * Flujo interno:
 *   1. Recibe job con datos del incidente validado
 *   2. Consulta STDistance (T13) → lista de usuarios en radio de riesgo
 *   3. Extrae tokens FCM de los usuarios encontrados
 *   4. Envía notificación push multicast via Firebase (T14)
 *
 * Separación de responsabilidades:
 *   - ValidationProcessor → valida reportes + publica en alert-dispatch
 *   - AlertsProcessor     → consume alert-dispatch + envía push
 *   Esto permite escalar cada worker de forma independiente.
 */
@Processor('alert-dispatch')
export class AlertsProcessor extends WorkerHost {
  private readonly logger = new Logger(AlertsProcessor.name);

  constructor(
    private readonly alertsService: AlertsService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  /**
   * Punto de entrada del worker BullMQ.
   * Se ejecuta de forma asíncrona para cada job en la cola 'alert-dispatch'.
   */
  async process(job: Job<AlertDispatchDto>): Promise<void> {
    const { reportId, incidentTypeId, incidentTypeName, location, trustScore } =
      job.data;

    this.logger.log(
      `🚨 Procesando alerta para reporte #${reportId} ` +
      `[${incidentTypeName ?? `Tipo ${incidentTypeId}`}] CS=${trustScore.toFixed(2)}`,
    );

    // ── Paso 1: T13 — Consulta espacial ────────────────────────────────────
    const nearbyUsers = await this.alertsService.findUsersInRadius(
      location.latitude,
      location.longitude,
      // Radio configurado en .env (ALERT_RADIUS_METERS) o 1000m por defecto
      // Para cambiar la distancia → modificar alerts.service.ts o variable de entorno
    );

    if (nearbyUsers.length === 0) {
      this.logger.log(
        `ℹ️  Reporte #${reportId}: ningún usuario en el radio de alerta. Sin push enviados.`,
      );
      return;
    }

    // ── Paso 2: Extraer tokens FCM válidos ──────────────────────────────────
    const tokens = nearbyUsers
      .map((u) => u.FcmToken)
      .filter((t): t is string => Boolean(t));

    if (tokens.length === 0) {
      this.logger.warn(
        `Reporte #${reportId}: usuarios encontrados pero sin tokens FCM válidos.`,
      );
      return;
    }

    // ── Paso 3: Construir mensaje de alerta ─────────────────────────────────
    const closestDistance = Math.round(nearbyUsers[0].DistanciaMetros);
    const incidentLabel = incidentTypeName ?? 'Incidente de seguridad';

    const title = `⚠️ ${incidentLabel} cerca de ti`;
    const body = `Incidente reportado a ${closestDistance}m de tu ubicación`;

    // Datos estructurados enviados a la app Android (se leen en onMessageReceived)
    const data: Record<string, string> = {
      type: 'SECURITY_ALERT',
      reportId: String(reportId),
      incidentTypeId: String(incidentTypeId),
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      trustScore: trustScore.toFixed(2),
      // La app usará estas coordenadas para mostrar el incidente en el mapa
    };

    // ── Paso 4: T14 — Enviar notificación push ──────────────────────────────
    const successCount = await this.notificationsService.sendMulticast(
      tokens,
      title,
      body,
      data,
    );

    this.logger.log(
      `✅ Alerta reporte #${reportId} → ${successCount}/${tokens.length} dispositivos notificados`,
    );
  }
}
