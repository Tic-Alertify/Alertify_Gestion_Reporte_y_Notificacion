import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

/**
 * Módulo de Notificaciones Push (Firebase Cloud Messaging).
 *
 * Exporta NotificationsService para que AlertsModule pueda utilizarlo
 * al despachar alertas a usuarios cercanos.
 */
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
