import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { AlertsService } from './alerts.service';
import { AlertsProcessor } from './alerts.processor';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../identity/entities/user.entity';

/**
 * Módulo de Alertas — Sprint 4 (T13 + T14)
 *
 * Registra:
 *   - La cola BullMQ 'alert-dispatch' (consumida por AlertsProcessor)
 *   - AlertsService: consultas espaciales STDistance para usuarios cercanos
 *   - AlertsProcessor: worker que despacha las notificaciones push
 *   - NotificationsModule: Firebase Admin SDK
 *
 * La cola 'alert-dispatch' también se registra en el Bull Board dashboard
 * para monitoreo visual en http://localhost:3000/admin/queues
 */
@Module({
  imports: [
    // Entidad User necesaria para la consulta STDistance
    TypeOrmModule.forFeature([User]),

    // Cola de despacho de alertas (independiente de 'report-validation')
    BullModule.registerQueue({
      name: 'alert-dispatch',
    }),

    // Panel de monitoreo de la nueva cola
    BullBoardModule.forFeature({
      name: 'alert-dispatch',
      adapter: BullMQAdapter,
    }),

    // Firebase Admin SDK
    NotificationsModule,
  ],
  providers: [AlertsService, AlertsProcessor],
  exports: [AlertsService],
})
export class AlertsModule {}
