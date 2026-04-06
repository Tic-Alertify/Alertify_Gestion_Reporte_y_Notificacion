// src/modules/reports/etl/config/ecu911-filter.config.ts

/**
 * Configuración centralizada de filtros para ECU911
 * Facilita cambios sin tocar la lógica de negocio
 */
export const ECU911_FILTERS = {
  PROVINCIA: {
    valor: 'PICHINCHA',
    descripcion: 'Provincia de Pichincha',
  },
  CANTON: {
    valor: 'QUITO',
    descripcion: 'Cantón de Quito',
  },
  SERVICIO: {
    valor: 'SEGURIDAD CIUDADANA',
    descripcion: 'Servicio de Seguridad Ciudadana',
  },
  SUBTIPO_DELITO: {
    valores: ['ROBO', 'HURTO'],
    descripcion: 'Tipos de delitos a considerar',
  },
};

/**
 * Configuración de mapeo de columnas del CSV
 * Permite trabajar con diferentes formatos de CSV
 */
export const ECU911_CSV_COLUMNS = {
  FECHA: 'Fecha',
  PROVINCIA: 'Provincia',
  CANTON: 'Cantón',
  CANTON_ALT: 'Canton', // Variante sin tilde
  COD_PARROQUIA: 'Cod_Parroquia',
  SERVICIO: 'Servicio',
  SUBTIPO: 'Subtipo',
  LATITUD: 'Latitud',
  LONGITUD: 'Longitud',
};
