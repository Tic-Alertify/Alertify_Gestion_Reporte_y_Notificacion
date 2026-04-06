import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfficialHistory } from './entities/official-history.entity';
import { IncidentType } from './entities/incident-type.entity';
import { BullModule } from '@nestjs/bullmq';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './entities/report.entity';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { EtlModule } from './etl/etl.module';
import { ReportsGateway } from './gateways/reports.gateway';

/**
 * Módulo de Reportes
 * Incluye:
 * - Gestión de reportes
 * - ETL mejorado de incidentes ECU911
 * - WebSocket Gateway para reportes en tiempo real
 */
@Module({
  imports: [
    // Registra la entidad para TypeORM
    TypeOrmModule.forFeature([Report, OfficialHistory, IncidentType]),
    // Configura la cola para el Bus de Eventos (Redis)
    BullModule.registerQueue({
      name: 'report-validation',
    }),
    // Panel de reportes en espera
    BullBoardModule.forFeature({
      name: 'report-validation',
      adapter: BullMQAdapter,
    }),
    // Módulo ETL mejorado con servicios de ingesta y heatmap
    EtlModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsGateway],
  exports: [ReportsService, ReportsGateway, EtlModule],
})
export class ReportsModule {}