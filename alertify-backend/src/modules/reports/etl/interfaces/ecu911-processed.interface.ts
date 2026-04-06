// src/modules/reports/etl/interfaces/ecu911-processed.interface.ts

/**
 * Interfaz para una fila cruda del CSV
 */
export interface Ecu911RawRow {
  Fecha: string;
  Provincia: string;
  Cantón?: string;
  Canton?: string;
  Parroquia: string;  // Nombre de la parroquia para cruce
  Servicio: string;
  Subtipo: string;
  Latitud?: number;
  Longitud?: number;
}

/**
 * Interfaz para un registro procesado antes de insertarlo
 */
export interface Ecu911ProcessedRecord {
  idTipoIncidente: string;
  subtipo: string;
  servicio: string;
  nombreParroquia: string;  // Nombre de parroquia para buscar en BD
  fechaOcurrencia: Date;
  latitud?: number;
  longitud?: number;
}

/**
 * Interfaz para un registro enriquecido con datos de parroquia
 */
export interface Ecu911EnrichedRecord extends Ecu911ProcessedRecord {
  idParroquia: number;
  latitud: number;
  longitud: number;
}

/**
 * Interfaz para el reporte de procesamiento
 */
export interface Ecu911ProcessingSummary {
  totalRecibidos: number;
  totalFiltrados: number;
  totalConParroquia: number;
  totalInsertados: number;
  totalActualizados: number;
  erroresParroquia: string[];
  tiempoMs: number;
}
