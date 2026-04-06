// src/modules/reports/etl/services/ecu911-filter.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ECU911_FILTERS, ECU911_CSV_COLUMNS } from '../config/ecu911-filter.config';
import { normalizeText } from '../utils/text-normalizer.util';
import type {
  Ecu911RawRow,
  Ecu911ProcessedRecord,
} from '../interfaces/ecu911-processed.interface';

/**
 * Servicio de filtrado y validación de registros ECU911
 * Centraliza la lógica de filtros para mayor mantenibilidad
 */
@Injectable()
export class Ecu911FilterService {
  private readonly logger = new Logger(Ecu911FilterService.name);

  /**
   * Valida y filtra un registro crudo
   * @param rawRow Fila cruda del CSV
   * @returns Registro procesado si pasa los filtros, null en caso contrario
   */
  filterAndProcess(rawRow: Ecu911RawRow): Ecu911ProcessedRecord | null {
    // 1. Normalizar claves (trimear espacios)
    const cleanRow = this.normalizeKeys(rawRow);

    // 2. Extraer valores normalizados
    const provincia = normalizeText(cleanRow.Provincia);
    const canton = normalizeText(
      cleanRow.Cantón || cleanRow.Canton || '',
    );
    const servicio = normalizeText(cleanRow.Servicio);
    const subtipo = cleanRow.Subtipo
      ? normalizeText(cleanRow.Subtipo)
      : '';

    // 3. Validar filtros
    if (!this.validateProvinceFilter(provincia)) {
      return null;
    }

    if (!this.validateCantonFilter(canton)) {
      return null;
    }

    if (!this.validateServiceFilter(servicio)) {
      return null;
    }

    if (!this.validateCrimeTypeFilter(subtipo)) {
      return null;
    }

    // 4. Validar y procesar fecha
    const fecha = this.parseDate(cleanRow.Fecha);
    if (!fecha) {
      this.logger.warn(
        `Fecha inválida: ${cleanRow.Fecha}`,
      );
      return null;
    }

    // 5. Validar que tengamos nombre de parroquia
    const parishName = cleanRow.Parroquia;
    if (!parishName) {
      this.logger.warn('Registro sin nombre de parroquia');
      return null;
    }

    // 6. Retornar registro procesado
    return {
      idTipoIncidente: cleanRow.Subtipo, // Subtipo original para mapeo posterior
      subtipo,
      servicio,
      nombreParroquia: parishName.trim(),  // Nombre original, se normaliza al buscar
      fechaOcurrencia: fecha,
      latitud: cleanRow.Latitud,
      longitud: cleanRow.Longitud,
    };
  }

  /**
   * Valida el filtro de provincia
   */
  private validateProvinceFilter(provincia: string): boolean {
    return provincia === normalizeText(ECU911_FILTERS.PROVINCIA.valor);
  }

  /**
   * Valida el filtro de cantón
   */
  private validateCantonFilter(canton: string): boolean {
    return canton === normalizeText(ECU911_FILTERS.CANTON.valor);
  }

  /**
   * Valida el filtro de servicio
   */
  private validateServiceFilter(servicio: string): boolean {
    return servicio === normalizeText(ECU911_FILTERS.SERVICIO.valor);
  }

  /**
   * Valida que el tipo de delito esté en la lista permitida
   */
  private validateCrimeTypeFilter(subtipo: string): boolean {
    return ECU911_FILTERS.SUBTIPO_DELITO.valores.some(
      tipo => subtipo.includes(normalizeText(tipo)),
    );
  }

  /**
   * Normaliza las claves de un objeto (trimea espacios)
   */
  private normalizeKeys(row: Ecu911RawRow): Ecu911RawRow {
    const normalized = {};
    Object.keys(row).forEach(key => {
      normalized[key.trim()] = row[key];
    });
    return normalized as Ecu911RawRow;
  }

  /**
   * Parsea una fecha en múltiples formatos
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const fecha = new Date(dateStr);
    if (isNaN(fecha.getTime())) {
      return null;
    }

    return fecha;
  }

  /**
   * Obtiene estadísticas de los filtros aplicados
   */
  getFilterStats(): Record<string, string | string[]> {
    return {
      provincia: ECU911_FILTERS.PROVINCIA.valor,
      canton: ECU911_FILTERS.CANTON.valor,
      servicio: ECU911_FILTERS.SERVICIO.valor,
      subtiposDelito: ECU911_FILTERS.SUBTIPO_DELITO.valores,
    };
  }
}
