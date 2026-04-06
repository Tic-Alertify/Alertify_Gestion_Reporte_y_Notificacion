/**
 * Interfaz para datos de parroquias cargadas desde Excel
 */
export interface ParishRawRow {
  'NombreParroquia'?: string;
  'Nombre'?: string;
  'Parroquia'?: string;
  'Provincia': string;
  'Cantón'?: string;
  'Canton'?: string;
  'Latitud': number | string;
  'Longitud': number | string;
  [key: string]: any;
}

/**
 * Resumen de carga de parroquias
 */
export interface ParishLoadingSummary {
  totalCargadas: number;
  totalActualizadas: number;
  errores: string[];
  tiempoMs: number;
}

/**
 * Interface para registros ECU911 enriquecidos con datos de parroquia
 */
export interface Ecu911EnrichedRecord {
  idTipoIncidente: number;
  subtipo: string;
  servicio: string;
  nombreParroquia: string;
  latitud: number;
  longitud: number;
  fechaOcurrencia: Date;
  provinciaNormalizada: string;
  cantonNormalizado: string;
}
