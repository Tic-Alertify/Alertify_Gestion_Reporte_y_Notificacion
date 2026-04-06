// src/modules/reports/etl/etl.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfficialHistory } from '../entities/official-history.entity';
import { Parish } from '../entities/parish.entity';
import { EtlController } from './controllers/etl.controller';
import { Ecu911IngestaImprovedService } from './services/ecu911-ingesta-improved.service';
import { Ecu911FilterService } from './services/ecu911-filter.service';
import { HeatmapDataService } from './services/heatmap-data.service';
import { ParishLoaderService } from './services/parish-loader.service';

/**
 * Módulo de ETL para procesamiento de reportes ECU911
 * Servicios incluidos:
 * - Ingesta y filtrado de CSV ECU911
 * - Carga y enriquecimiento de parroquias
 * - Generación de datos básicos
 */
@Module({
  imports: [TypeOrmModule.forFeature([OfficialHistory, Parish])],
  controllers: [EtlController],
  providers: [
    Ecu911IngestaImprovedService,
    Ecu911FilterService,
    HeatmapDataService,
    ParishLoaderService,
  ],
  exports: [
    Ecu911IngestaImprovedService,
    HeatmapDataService,
    ParishLoaderService,
  ],
})
export class EtlModule {}
