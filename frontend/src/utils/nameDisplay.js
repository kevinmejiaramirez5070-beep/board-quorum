/**
 * Normaliza nombres para mostrar sin problemas de encoding (Comentario 03 / BUG-05).
 * Convierte a MAYÚSCULAS y quita tildes para evitar caracteres rotos en PDF y UI.
 */
export function normalizeNameForDisplay(name) {
  if (name == null || typeof name !== 'string') return '';
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ñ/g, 'N')
    .trim();
}
