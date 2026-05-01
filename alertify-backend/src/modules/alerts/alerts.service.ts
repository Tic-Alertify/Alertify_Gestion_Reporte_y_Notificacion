import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../identity/entities/user.entity';

/**
 * Resultado de la consulta espacial de usuarios cercanos.
 */
export interface NearbyUser {
  IdUsuario: number;
  FcmToken: string;
  DistanciaMetros: number;
}

/**
 * Servicio de Alertas — T13: Consultas Espaciales.
 *
 * Responsabilidad exclusiva: identificar qué usuarios están dentro
 * del radio de riesgo de un incidente usando STDistance de SQL Server.
 *
 * Por qué consulta raw y no QueryBuilder:
 *   TypeORM no soporta funciones de geography (STDistance, STGeomFromText)
 *   como expresiones en WHERE. Se usa query parametrizada directa.
 */
@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  // ─── CONFIGURACIÓN DE RADIO ───────────────────────────────────────────────
  //
  // Radio fijo de alerta en metros.
  // Para modificar la distancia de alerta, cambia este valor o la variable
  // de entorno ALERT_RADIUS_METERS en el archivo .env
  //
  // Ejemplos: 500 = 0.5km | 1000 = 1km | 2000 = 2km
  // ──────────────────────────────────────────────────────────────────────────
  private readonly alertRadiusMeters: number =
    parseInt(process.env.ALERT_RADIUS_METERS ?? '1000', 10);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * T13 — Consulta espacial: Encuentra usuarios dentro del radio de riesgo.
   *
   * Condiciones de la consulta:
   *   1. El usuario debe tener FcmToken registrado (dispositivo activo)
   *   2. El usuario debe tener UbicacionActual registrada (ha abierto la app)
   *   3. La distancia entre el incidente y el usuario <= alertRadiusMeters
   *
   * La columna UbicacionActual se actualiza cuando el usuario abre la app
   * (onStart/onResume en Android), lo que garantiza datos razonablemente frescos
   * sin necesidad de polling continuo en background.
   *
   * @param incidentLatitude   Latitud del incidente validado
   * @param incidentLongitude  Longitud del incidente validado
   * @param radiusMeters       Radio de búsqueda (opcional, usa el valor configurado por defecto)
   * @returns Lista de usuarios cercanos con su token FCM y distancia exacta
   */
  async findUsersInRadius(
    incidentLatitude: number,
    incidentLongitude: number,
    radiusMeters?: number,
  ): Promise<NearbyUser[]> {
    const radius = radiusMeters ?? this.alertRadiusMeters;
    const incidentPoint = `POINT(${incidentLongitude} ${incidentLatitude})`;

    this.logger.debug(
      `🔍 Buscando usuarios en radio ${radius}m alrededor de [${incidentLatitude}, ${incidentLongitude}]`,
    );

    try {
      const users: NearbyUser[] = await this.userRepository.query(
        `SELECT
           u.IdUsuario,
           u.FcmToken,
           ROUND(
             u.UbicacionActual.STDistance(geography::STGeomFromText(@0, 4326)),
             2
           ) AS DistanciaMetros
         FROM USUARIOS u
         WHERE
           u.FcmToken IS NOT NULL
           AND u.UbicacionActual IS NOT NULL
           AND u.UbicacionActual.STDistance(
             geography::STGeomFromText(@0, 4326)
           ) <= @1
         ORDER BY DistanciaMetros ASC`,
        [incidentPoint, radius],
      );

      this.logger.log(
        `📍 ${users.length} usuario(s) encontrado(s) en radio de ${radius}m`,
      );

      return users;
    } catch (error) {
      this.logger.error('Error en consulta espacial STDistance:', error);
      return [];
    }
  }
}
