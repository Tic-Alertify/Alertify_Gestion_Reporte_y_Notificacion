import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class IdentityService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Retorna el puntaje de reputación de un usuario.
   * Usado por ValidationProcessor para el Algoritmo de Confianza.
   */
  async getUserReputation(userId: number): Promise<number> {
    const user = await this.userRepository.findOne({ where: { IdUsuario: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user.PuntajeReputacion;
  }

  /**
   * Actualiza la reputación del usuario tras validación o reporte falso.
   * El valor se mantiene normalizado entre 0 y 10.
   */
  async updateReputation(userId: number, points: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { IdUsuario: userId } });
    if (user) {
      user.PuntajeReputacion += points;
      user.PuntajeReputacion = Math.max(0, Math.min(10, user.PuntajeReputacion));
      await this.userRepository.save(user);
    }
  }

  // ─── Sprint 4: Notificaciones Push ───────────────────────────────────────

  /**
   * Registra o actualiza el token FCM del dispositivo del usuario.
   * Debe llamarse desde Android en:
   *   - FirebaseMessagingService.onNewToken(token)
   *   - Al iniciar la app si ya existe token guardado localmente
   *
   * @param userId  ID del usuario
   * @param fcmToken  Token FCM del dispositivo (puede ser null para desregistrar)
   */
  async updateFcmToken(userId: number, fcmToken: string | null): Promise<void> {
    const user = await this.userRepository.findOne({ where: { IdUsuario: userId } });
    if (!user) throw new NotFoundException(`Usuario ${userId} no encontrado`);
    user.FcmToken = fcmToken;
    await this.userRepository.save(user);
  }

  /**
   * Actualiza la última ubicación conocida del usuario.
   *
   * Estrategia de eficiencia (sin consumir recursos en exceso):
   *   - Llamar en onStart() y onResume() de la Activity principal Android
   *   - NO llamar en background continuo (innecesario: el backend hace el filtrado)
   *   - La consulta STDistance del AlertsService usará esta ubicación almacenada
   *
   * Se usa raw query para manejar el tipo GEOGRAPHY de SQL Server correctamente.
   *
   * @param userId     ID del usuario
   * @param latitude   Latitud GPS
   * @param longitude  Longitud GPS
   */
  async updateLocation(userId: number, latitude: number, longitude: number): Promise<void> {
    // Verificar que el usuario existe antes de actualizar
    const user = await this.userRepository.findOne({ where: { IdUsuario: userId } });
    if (!user) throw new NotFoundException(`Usuario ${userId} no encontrado`);

    // Raw query necesaria: TypeORM no soporta bien la asignación directa de geography
    await this.userRepository.query(
      `UPDATE USUARIOS
       SET UbicacionActual = geography::STGeomFromText(@0, 4326),
           FechaUltimaUbicacion = GETDATE()
       WHERE IdUsuario = @1`,
      [`POINT(${longitude} ${latitude})`, userId],
    );
  }
}