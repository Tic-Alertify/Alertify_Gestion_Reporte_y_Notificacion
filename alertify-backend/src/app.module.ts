import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ReportsModule } from './modules/reports/reports.module';
import { ValidationModule } from './modules/validation/validation.module'; // El módulo del Worker
import { IdentityModule } from './modules/identity/identity.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

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
      port: parseInt(process.env.DB_PORT as string, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // ¡Cuidado!: Solo usar true en desarrollo
      options: {
        encrypt: true, // Depende de tu config de SQL Server en Docker
        trustServerCertificate: true,
      },
    }),
    IdentityModule, // Necesario para consultar reputación en la validación [cite: 613]
    ReportsModule,  // Gestión de Reportes (T04) [cite: 76, 561]
    ValidationModule, // Worker de Validación Asíncrona (T17) [cite: 616, 620]
  ],
})
export class AppModule {}