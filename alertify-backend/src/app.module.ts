import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ReportsModule } from './modules/reports/reports.module';
import { ValidationModule } from './modules/validation/validation.module';
import { IdentityModule } from './modules/identity/identity.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

/**
 * Root application module. Configures database, queue broker (Redis),
 * monitoring dashboard (Bull Board), and feature modules.
 */
@Module({
  imports: [
    ConfigModule.forRoot(),

    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT as string, 10) || 6379,
      },
    }),

    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),

    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: ['error', 'warn'],
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 90000,
      },
      retryAttempts: 30,
      retryDelay: 3000,
      dropSchema: false,
    }),

    IdentityModule,
    ReportsModule,
    ValidationModule,
  ],
})
export class AppModule {}