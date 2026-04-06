import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ValidationProcessor } from './validation.processor';
import { Report } from '../reports/entities/report.entity';
import { User } from '../identity/entities/user.entity';
import { ReportsModule } from '../reports/reports.module';
import { EtlModule } from '../reports/etl/etl.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, User]),
    BullModule.registerQueue({
      name: 'report-validation',
    }),
    ReportsModule, // Para ReportsGateway
    EtlModule,     // Para HeatmapDataService y otros servicios de ETL
  ],
  providers: [ValidationProcessor],
})
export class ValidationModule {}