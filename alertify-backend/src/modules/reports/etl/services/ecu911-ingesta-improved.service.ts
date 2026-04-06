// src/modules/reports/etl/services/ecu911-ingesta-improved.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfficialHistory } from '../../entities/official-history.entity';
import { Ecu911FilterService } from './ecu911-filter.service';
import { ParishLoaderService } from './parish-loader.service';
import { normalizeText } from '../utils/text-normalizer.util';
import type {
  Ecu911RawRow,
  Ecu911ProcessingSummary,
} from '../interfaces/ecu911-processed.interface';

/**
 * Servicio principal de ingesta ECU911
 * Filtra, enriquece con parroquias y carga datos a la BD
 */
@Injectable()
export class Ecu911IngestaImprovedService {
  private readonly logger = new Logger(Ecu911IngestaImprovedService.name);

  // Caché de mapeo Subtipo → IdTipoIncidente
  private readonly incidentTypeMap: Record<string, number> = {
    'robo': 1,
    'robo a vehiculo': 1,
    'robo a comercio': 1,
    'robo a domicilio': 1,
    'robo a entidades': 1,
    'hurto': 2,
    'hurto de vehiculo': 2,
    'hurto en tienda': 2,
  };

  constructor(
    @InjectRepository(OfficialHistory)
    private readonly officialHistoryRepo: Repository<OfficialHistory>,
    private readonly filterService: Ecu911FilterService,
    private readonly parishLoader: ParishLoaderService,
  ) {}

  /**
   * Procesamiento principal de datos ECU911
   * Filtra → Enriquece con parroquias → Inserta
   * @param rawData Array de filas crudas del CSV
   * @returns Resumen del procesamiento
   */
  async processEcu911Data(rawData: Ecu911RawRow[]): Promise<Ecu911ProcessingSummary> {
    const startTime = Date.now();
    const summary: Ecu911ProcessingSummary = {
      totalRecibidos: rawData.length,
      totalFiltrados: 0,
      totalConParroquia: 0,
      totalInsertados: 0,
      totalActualizados: 0,
      erroresParroquia: [],
      tiempoMs: 0,
    };

    try {
      this.logger.log('Iniciando procesamiento ECU911 con enriquecimiento');

      // Fase 1: Filtrado
      const filteredRecords: any[] = [];
      for (const rawRow of rawData) {
        const processed = this.filterService.filterAndProcess(rawRow);
        if (processed) {
          filteredRecords.push(processed);
          summary.totalFiltrados++;
        }
      }

      this.logger.log(
        `Fase 1 - Filtrado: ${summary.totalFiltrados}/${summary.totalRecibidos} registros`,
      );

      // Fase 2: Enriquecimiento con parroquias
      const enrichedRecords: any[] = [];
      for (const record of filteredRecords) {
        try {
          const enriched = await this.enrichWithParishData(record);
          if (enriched) {
            enrichedRecords.push(enriched);
            summary.totalConParroquia++;
          } else {
            summary.erroresParroquia.push(
              `No se encontró parroquia para: ${record.nombreParroquia}`,
            );
          }
        } catch (error) {
          this.logger.error(`Error enriqueciendo registro`, error);
          summary.erroresParroquia.push(error.message);
        }
      }

      this.logger.log(
        `Fase 2 - Enriquecimiento: ${summary.totalConParroquia}/${summary.totalFiltrados} registros enriquecidos`,
      );

      // Fase 3: Inserción en BD
      for (const record of enrichedRecords) {
        try {
          // Crear punto geográfico WKT usando COORDENADAS DE PARROQUIAS
          const pointWKT = `POINT(${record.longitud} ${record.latitud})`;

          const newRecord = this.officialHistoryRepo.create({
            IdTipoIncidente: record.idTipoIncidente,
            IdExterno: 'ECU911',
            FechaHoraOcurrencia: record.fechaOcurrencia,
            UbicacionGeografica: pointWKT,
          });

          await this.officialHistoryRepo.save(newRecord);
          summary.totalInsertados++;
        } catch (error) {
          this.logger.error(`Error insertando registro`, error);
        }
      }

      summary.tiempoMs = Date.now() - startTime;
      this.logSummary(summary);

      return summary;
    } catch (error) {
      this.logger.error('Error fatal en procesamiento ECU911', error);
      throw error;
    }
  }

  /**
   * Enriquece un registro con datos de parroquia
   * Busca por nombre de parroquia y asigna coordenadas (normalización EN MEMORIA)
   */
  private async enrichWithParishData(record: any): Promise<any> {
    // Obtener nombre de parroquia del registro (viene del filtro)
    const parishName = record.nombreParroquia;

    if (!parishName) {
      this.logger.warn('Registro sin nombre de parroquia');
      return null;
    }

    // Buscar parroquia en BD/caché (normalización en memoria dentro de findParishByName)
    const parish = await this.parishLoader.findParishByName(parishName);

    if (!parish) {
      this.logger.warn(`Parroquia no encontrada: ${parishName}`);
      return null;
    }

    // Enriched record con coordenadas de parroquia
    return {
      ...record,
      idTipoIncidente: this.mapIncidentType(record.idTipoIncidente),
      nombreParroquiaEncontrada: parish.Nombre,
      latitud: parish.Latitud,
      longitud: parish.Longitud,
    };
  }

  /**
   * Mapea el tipo de incidente (subtipo) a IdTipoIncidente
   * @param subtipo Subtipo de delito (ej: "ROBO", "HURTO")
   * @returns IdTipoIncidente (1 para ROBO, 2 para HURTO)
   */
  private mapIncidentType(subtipo: string): number {
    if (!subtipo) {
      this.logger.warn('Subtipo vacío, asignando ROBO (1)');
      return 1;
    }

    const normalized = normalizeText(subtipo);

    // Buscar en mapeo
    for (const [key, value] of Object.entries(this.incidentTypeMap)) {
      if (normalized.includes(key)) {
        return value;
      }
    }

    // Default a ROBO si no coincide
    this.logger.warn(`Subtipo no reconocido: ${subtipo}, asignando ROBO (1)`);
    return 1;
  }

  /**
   * Log del resumen final
   */
  private logSummary(summary: Ecu911ProcessingSummary): void {
    this.logger.log('='.repeat(60));
    this.logger.log('📊 RESUMEN DE PROCESAMIENTO ECU911');
    this.logger.log('='.repeat(60));
    this.logger.log(`Total recibidos: ${summary.totalRecibidos}`);
    this.logger.log(`Total filtrados: ${summary.totalFiltrados}`);
    this.logger.log(`Total con parroquia: ${summary.totalConParroquia}`);
    this.logger.log(`Registros insertados: ${summary.totalInsertados}`);
    this.logger.log(`Tiempo total: ${summary.tiempoMs}ms`);
    
    if (summary.erroresParroquia.length > 0) {
      this.logger.warn(`Errores de parroquia: ${summary.erroresParroquia.length}`);
      summary.erroresParroquia.slice(0, 5).forEach(err => {
        this.logger.warn(`  - ${err}`);
      });
    }
    this.logger.log('='.repeat(60));
  }
}
