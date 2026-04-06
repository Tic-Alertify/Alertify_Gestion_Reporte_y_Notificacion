/**
 * Utilidades para normalización de texto
 * Convierte a minúsculas y elimina tildes para comparaciones
 */

/**
 * Normaliza texto: minúsculas + sin tildes
 * @param text Texto a normalizar
 * @returns Texto normalizado
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Elimina diacríticos
}

/**
 * Normaliza múltiples campos de un objeto
 * @param obj Objeto con campos a normalizar
 * @param fields Nombres de los campos a normalizar
 * @returns Objeto con campos normalizados
 */
export function normalizeObjectFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[],
): T {
  const normalized = { ...obj };
  
  for (const field of fields) {
    if (typeof normalized[field] === 'string') {
      normalized[field] = normalizeText(normalized[field] as string) as any;
    }
  }
  
  return normalized;
}

/**
 * Extrae nombres de parroquias normalizados del CSV
 * Soporta variantes: "Parroquia", "Parish", "NombreParroquia", etc.
 */
export function extractParishName(row: Record<string, any>): string | null {
  const possibleKeys = [
    'NombreParroquia',
    'nombreParroquia',
    'Parroquia',
    'parroquia',
    'Parish',
    'parish',
    'Cod_Parroquia',
    'cod_parroquia',
  ];

  for (const key of possibleKeys) {
    if (row[key]) {
      return normalizeText(row[key]);
    }
  }

  return null;
}

/**
 * Valida si dos nombres de parroquias coinciden (después de normalización)
 */
export function compareParishNames(name1: string, name2: string): boolean {
  return normalizeText(name1) === normalizeText(name2);
}
