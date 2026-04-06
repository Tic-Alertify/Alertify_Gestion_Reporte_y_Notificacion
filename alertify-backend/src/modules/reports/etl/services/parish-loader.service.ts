import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Parish } from '../../entities/parish.entity';
import { normalizeText } from '../utils/text-normalizer.util';

/**
 * Servicio para cargar y procesar datos de parroquias desde Excel
 * Normaliza datos EN MEMORIA para búsquedas rápidas (sin guardar columnas normalizadas)
 */
@Injectable()
export class ParishLoaderService {
  private readonly logger = new Logger(ParishLoaderService.name);
  
  // Caché en memoria: nombreNormalizado → Parish original
  private parishCache: Map<string, Parish> = new Map();

  constructor(
    @InjectRepository(Parish)
    private readonly parishRepo: Repository<Parish>,
  ) {}

  /**
   * Carga las parroquias desde Excel y las almacena en BD
   * Normalización se hace EN MEMORIA, no se almacena
   * @param fileBuffer Buffer del archivo Excel
   * @returns Resumen de carga
   */
  async loadParishesFromExcel(
    fileBuffer: Buffer,
  ): Promise<{ totalCargadas: number; totalActualizadas: number; errores: string[] }> {
    const startTime = Date.now();
    const summary = {
      totalCargadas: 0,
      totalActualizadas: 0,
      errores: [] as string[],
    };

    try {
      // Leer Excel
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      this.logger.log(`Cargando ${rows.length} parroquias desde Excel`);

      for (const row of rows) {
        try {
          const parish = await this.processParishRow(row);
          if (parish) {
            summary.totalCargadas++;
            // Store in cache using normalized name as key for fast lookups
            const nombreNormalized = normalizeText(parish.Nombre);
            this.parishCache.set(nombreNormalized, parish);
            this.logger.debug(
              `Parroquia en caché: "${parish.Nombre}" → "${nombreNormalized}"`,
            );
          }
        } catch (error) {
          const errorMsg = `Error procesando parroquia: ${error.message}`;
          this.logger.error(errorMsg);
          summary.errores.push(errorMsg);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Parroquias cargadas: ${summary.totalCargadas} en ${duration}ms (${this.parishCache.size} en caché)`,
      );

      return summary;
    } catch (error) {
      this.logger.error('Error fatal cargando parroquias', error);
      throw error;
    }
  }

  /**
   * Procesa una fila del Excel de parroquias
   * Estructura simplificada: Nombre, Provincia, Canton, Latitud, Longitud
   */
  private async processParishRow(row: any): Promise<Parish | null> {
    const nombreOriginal = row['NombreParroquia'] || row['Nombre'] || row['Parroquia'];
    const provincia = row['Provincia'];
    const canton = row['Cantón'] || row['Canton'];
    const latitud = parseFloat(row['Latitud']);
    const longitud = parseFloat(row['Longitud']);

    // Validar datos
    if (!nombreOriginal || !provincia || !canton) {
      this.logger.warn(
        `Fila incompleta: ${JSON.stringify(row)}`,
      );
      return null;
    }

    if (isNaN(latitud) || isNaN(longitud)) {
      this.logger.warn(
        `Coordenadas inválidas para ${nombreOriginal}`,
      );
      return null;
    }

    // Buscar si ya existe en BD
    const nombreNormalized = normalizeText(nombreOriginal);
    let parish = await this.parishRepo.findOne({
      where: { 
        Nombre: nombreOriginal,
      },
    });

    if (!parish) {
      // Crear nueva parroquia
      parish = this.parishRepo.create({
        Nombre: nombreOriginal,
        Provincia: provincia,
        Canton: canton,
        Latitud: latitud,
        Longitud: longitud,
      });
      await this.parishRepo.save(parish);
      this.logger.debug(
        `Parroquia creada: ${nombreOriginal}`,
      );
    }

    return parish;
  }

  /**
   * Busca una parroquia por nombre (normaliza en memoria)
   * Primero intenta caché, luego BD
   * @param nombreBuscar Nombre a buscar (se normaliza en memoria)
   * @returns Parroquia encontrada o null
   */
  async findParishByName(nombreBuscar: string): Promise<Parish | null> {
    const nombreNormalized = normalizeText(nombreBuscar);

    // Primero intenta caché (en memoria)
    if (this.parishCache.has(nombreNormalized)) {
      this.logger.debug(`Parroquia encontrada en caché: ${nombreBuscar}`);
      return this.parishCache.get(nombreNormalized) || null;
    }

    // Si no está en caché, buscar en BD
    // Hacer búsqueda de todos y comparar en memoria (sin usar columnas normalizadas)
    const allParishes = await this.parishRepo.find();
    
    for (const parish of allParishes) {
      const nombreParishNormalized = normalizeText(parish.Nombre);
      if (nombreParishNormalized === nombreNormalized) {
        // Agregar al caché para próxima vez
        this.parishCache.set(nombreNormalized, parish);
        this.logger.debug(
          `Parroquia encontrada en BD y cacheada: ${nombreBuscar}`,
        );
        return parish;
      }
    }

    this.logger.warn(`Parroquia no encontrada: ${nombreBuscar} (normalizado: ${nombreNormalized})`);
    return null;
  }

  /**
   * Limpia las cachés en memoria
   */
  clearCache(): void {
    this.parishCache.clear();
    this.logger.log('Caché de parroquias vaciado');
  }

  /**
   * Retorna estadísticas del caché
   */
  getCacheStats(): { totalParroquias: number; totalGroups: number } {
    return {
      totalParroquias: this.parishCache.size,
      totalGroups: 1,  // Simplificado: solo un grupo (no por provincia/canton)
    };
  }
}
