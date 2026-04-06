// src/modules/reports/etl/controllers/etl.controller.ts
import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Ecu911IngestaImprovedService } from '../services/ecu911-ingesta-improved.service';
import { ParishLoaderService } from '../services/parish-loader.service';
import { Readable } from 'stream';
import csv from 'csv-parser';
import type { Express } from 'express';

/**
 * Controlador para ETL de reportes ECU911
 */
@Controller('reports/etl')
export class EtlController {
  private readonly logger = new Logger(EtlController.name);

  constructor(
    private readonly ingestaService: Ecu911IngestaImprovedService,
    private readonly parishLoader: ParishLoaderService,
  ) {}

  /**
   * POST /reports/etl/upload-ecu911
   * Carga y procesa un archivo CSV de ECU911
   */
  @Post('upload-ecu911')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEcu911Csv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    this.logger.log(`Iniciando carga de archivo ECU911: ${file.originalname}`);

    const results: any[] = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from(file.buffer);

      stream
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', async () => {
          try {
            this.logger.log(`CSV parseado: ${results.length} filas`);
            const summary =
              await this.ingestaService.processEcu911Data(results);

            resolve({
              status: 'success',
              message: 'Procesamiento completado',
              data: summary,
            });
          } catch (error) {
            this.logger.error('Error en procesamiento ECU911', error);
            reject(
              new BadRequestException(
                'Error procesando el contenido del CSV',
              ),
            );
          }
        })
        .on('error', (err) => {
          this.logger.error('Error parseando CSV', err);
          reject(err);
        });
    });
  }

  /**
   * POST /reports/etl/upload-parishes
   * Carga el archivo Excel de parroquias con sus coordenadas
   */
  @Post('upload-parishes')
  @UseInterceptors(FileInterceptor('file'))
  async uploadParishesExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo Excel');
    }

    this.logger.log(
      `Iniciando carga de parroquias desde: ${file.originalname}`,
    );

    try {
      const summary =
        await this.parishLoader.loadParishesFromExcel(file.buffer);

      const cacheStats = this.parishLoader.getCacheStats();

      return {
        status: 'success',
        message: 'Parroquias cargadas exitosamente',
        data: {
          ...summary,
          cacheStats,
        },
      };
    } catch (error) {
      this.logger.error('Error cargando parroquias', error);
      throw new BadRequestException(
        `Error procesando archivo: ${error.message}`,
      );
    }
  }

  /**
   * GET /reports/etl/parish-cache-stats
   * Retorna estadísticas del caché de parroquias
   */
  @Get('parish-cache-stats')
  getParishCacheStats() {
    const stats = this.parishLoader.getCacheStats();
    return {
      status: 'success',
      data: stats,
    };
  }
  @Get('status')
  async getStatus() {
    return {
      status: 'ok',
      message: 'ETL ECU911 operativo',
      timestamp: new Date().toISOString(),
    };
  }
}
