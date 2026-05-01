import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Report } from '../../reports/entities/report.entity';

@Entity('USUARIOS')
export class User {
  @PrimaryGeneratedColumn()
  IdUsuario: number;

  @Column({ unique: true })
  Email: string;

  @Column()
  Password: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  PuntajeReputacion: number;

  // ─── Sprint 4: Notificaciones Push ───────────────────────────────────────

  /**
   * Token FCM del dispositivo Android del usuario.
   * Se registra cuando la app llama a PATCH /users/:id/fcm-token.
   * Nullable: usuarios sin app móvil activa no recibirán push.
   */
  @Column({ type: 'nvarchar', length: 500, nullable: true, default: null })
  FcmToken: string | null;

  /**
   * Última ubicación conocida del usuario (GPS desde la app Android).
   * Se actualiza en PATCH /users/:id/location cuando:
   *   - La app arranca (onStart)
   *   - La app vuelve al primer plano (onResume)
   * Nullable: usuarios que nunca abrieron la app no tienen ubicación.
   */
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    default: null,
    transformer: {
      to(value: { latitude: number; longitude: number } | null) {
        if (!value) return null;
        return `POINT(${value.longitude} ${value.latitude})`;
      },
      from(value: string | null) {
        if (!value) return null;
        const match = value.match(/POINT\s*\(\s*([\-\d.]+)\s+([\-\d.]+)\s*\)/i);
        if (!match) return null;
        return {
          longitude: parseFloat(match[1]),
          latitude: parseFloat(match[2]),
        };
      },
    },
  })
  UbicacionActual: { latitude: number; longitude: number } | null;

  /**
   * Timestamp de la última actualización de ubicación.
   * Permite descartar ubicaciones obsoletas en el futuro si se requiere.
   */
  @Column({ type: 'datetime2', nullable: true, default: null })
  FechaUltimaUbicacion: Date | null;

  // ─────────────────────────────────────────────────────────────────────────

  @OneToMany(() => Report, (report) => report.IdUsuario)
  reports: Report[];
}