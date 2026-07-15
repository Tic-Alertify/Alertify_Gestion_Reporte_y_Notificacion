import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ValidationProcessor } from './validation.processor';
import { Report } from '../reports/entities/report.entity';
import { User } from '../identity/entities/user.entity';
import { ReportsModule } from '../reports/reports.module';
import { EtlModule } from '../reports/etl/etl.module';
import { IdentityModule } from '../identity/identity.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Report, User]),
    // Cola de validación (produce los jobs)
    BullModule.registerQueue({
      name: 'report-validation',
    }),
    // Cola de alertas — Sprint 4: ValidationProcessor necesita inyectarla para publicar
    BullModule.registerQueue({
      name: 'alert-dispatch',
    }),
    ReportsModule,
    IdentityModule,
    EtlModule,
  ],
  providers: [ValidationProcessor],
})
export class ValidationModule {}
