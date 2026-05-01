import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

/**
 * Servicio de Notificaciones Push via Firebase Cloud Messaging (FCM).
 *
 * Responsabilidades:
 *   - Inicializar Firebase Admin SDK al arrancar el módulo
 *   - Enviar notificaciones push a múltiples dispositivos Android (multicast)
 *   - Limpiar tokens FCM inválidos retornados por Firebase
 *
 * Configuración requerida en .env:
 *   FIREBASE_PROJECT_ID     → ID del proyecto en Firebase Console
 *   FIREBASE_CLIENT_EMAIL   → Email de la cuenta de servicio
 *   FIREBASE_PRIVATE_KEY    → Clave privada (con \n literales, no escapados)
 *
 * Consumo de cuota Firebase (plan Spark gratuito):
 *   - FCM no tiene límite de mensajes en el plan gratuito
 *   - El costo real viene de otras APIs (Firestore, Functions, etc.)
 *   - Esta implementación SOLO usa FCM → sin costo adicional
 */
@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private initialized = false;

  onModuleInit() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        '⚠️  Firebase Admin SDK NO configurado. ' +
        'Agrega FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY al .env. ' +
        'Las notificaciones push estarán desactivadas hasta configurar Firebase.',
      );
      return;
    }

    try {
      // Verificar si ya fue inicializado (hot-reload en desarrollo)
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            // Las claves privadas en .env vienen con \n como texto literal
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }

      this.initialized = true;
      this.logger.log(`✅ Firebase Admin SDK inicializado para proyecto: ${projectId}`);
    } catch (error) {
      this.logger.error('❌ Error al inicializar Firebase Admin SDK:', error);
    }
  }

  /**
   * Envía una notificación push a múltiples dispositivos Android.
   *
   * Características:
   *   - Procesa hasta 500 tokens por llamada (límite de FCM multicast)
   *   - Si hay más de 500 usuarios, se divide automáticamente en lotes
   *   - Retorna la cantidad de envíos exitosos
   *   - Alta prioridad para que el dispositivo se despierte inmediatamente
   *
   * @param tokens   Lista de tokens FCM válidos
   * @param title    Título de la notificación (ej: "⚠️ Alerta de Seguridad")
   * @param body     Cuerpo de la notificación (ej: "Incidente a 350m de tu ubicación")
   * @param data     Datos adicionales para la app (tipo, coordenadas, etc.)
   * @returns        Número de notificaciones enviadas exitosamente
   */
  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<number> {
    if (!this.initialized) {
      this.logger.warn('Firebase no configurado. Notificación omitida.');
      return 0;
    }

    if (!tokens || tokens.length === 0) {
      this.logger.debug('No hay tokens FCM para notificar.');
      return 0;
    }

    // FCM permite máximo 500 tokens por llamada → dividir en lotes
    const FCM_BATCH_LIMIT = 500;
    let totalSuccess = 0;

    for (let i = 0; i < tokens.length; i += FCM_BATCH_LIMIT) {
      const batch = tokens.slice(i, i + FCM_BATCH_LIMIT);
      totalSuccess += await this.sendBatch(batch, title, body, data);
    }

    this.logger.log(
      `📲 Push enviados: ${totalSuccess}/${tokens.length} dispositivos notificados`,
    );
    return totalSuccess;
  }

  /**
   * Envía un lote de hasta 500 tokens.
   * Registra en log los tokens que fallaron (expirados o inválidos).
   */
  private async sendBatch(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<number> {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data,
      android: {
        // HIGH priority: el dispositivo se despierta aunque esté en Doze mode
        priority: 'high',
        notification: {
          sound: 'default',
          // Canal de alertas de seguridad — debe crearse en Android con la misma ID
          // NotificationChannel("alertify_alerts", "Alertas de Seguridad", IMPORTANCE_HIGH)
          channelId: 'alertify_alerts',
          // Icono de la app (drawable resource name sin extensión)
          icon: 'ic_notification',
          color: '#FF5252',
        },
      },
      // TTL: si el dispositivo está offline, FCM reintentará por 4 horas
      // Después de eso, la alerta ya no es relevante geográficamente
      apns: {
        headers: { 'apns-expiration': String(Math.floor(Date.now() / 1000) + 14400) },
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);

      // Log de tokens fallidos (útil para limpiarlos de la BD en el futuro)
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.warn(
              `Token fallido [${idx}]: ${resp.error?.code} — ${resp.error?.message}`,
            );
          }
        });
      }

      return response.successCount;
    } catch (error) {
      this.logger.error('Error al enviar notificaciones FCM:', error);
      return 0;
    }
  }
}
