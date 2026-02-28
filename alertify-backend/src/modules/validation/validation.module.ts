import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ValidationProcessor } from './validation.processor';
import { Report } from '../reports/entities/report.entity';
import { User } from '../identity/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, User]),
    BullModule.registerQueue({
      name: 'report-validation',
    }),
  ],
  providers: [ValidationProcessor],
})
export class ValidationModule {}