import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfficialHistory } from './entities/official-history.entity';
import { BullModule } from '@nestjs/bullmq';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './entities/report.entity';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    // Registra la entidad para TypeORM [cite: 452]
    TypeOrmModule.forFeature([Report, OfficialHistory]),
    // Configura la cola para el Bus de Eventos (Redis) [cite: 618]
    BullModule.registerQueue({
      name: 'report-validation',
    }),
    // panel de reportes en esperaa
    BullBoardModule.forFeature({
      name: 'report-validation', // Nombre de tu cola 
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}