// src/modules/reports/etl/utils/string-cleaner.util.ts
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD') // Descompone caracteres con tildes
    .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos
    .toUpperCase()
    .replace(/Ã±/g, 'N') // Corrección específica para el error de tu Excel
    .replace(/Ã‘/g, 'N')
    .trim();
}