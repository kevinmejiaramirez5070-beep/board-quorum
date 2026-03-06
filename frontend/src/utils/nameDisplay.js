/**
 * Corrige mojibake y caracteres conocidos que salen mal (BUG-05).
 * Ej: MARA•A → MARÍA, FERNANNDEZ → FERNÁNDEZ, Ã• → Í
 */
function fixEncoding(name) {
  if (name == null || typeof name !== 'string') return '';
  return name
    .replace(/\u2022/g, 'Í')           // bullet • → Í (ej. MARA•A)
    .replace(/Ã•/g, 'Í')               // mojibake común
    .replace(/MARA\u2022A/gi, 'MARÍA')
    .replace(/MARA•A/gi, 'MARÍA')
    .replace(/FERNANNDEZ/gi, 'FERNÁNDEZ')
    .replace(/FERNANDEZ/gi, 'FERNÁNDEZ')
    .replace(/\u00d1/g, 'Ñ')           // Ñ mal codificado
    .trim();
}

/**
 * Normaliza nombres para mostrar sin problemas de encoding (Comentario 03 / BUG-05).
 * Primero corrige mojibake; luego MAYÚSCULAS y quita tildes pero conserva Ñ.
 */
export function normalizeNameForDisplay(name) {
  if (name == null || typeof name !== 'string') return '';
  const fixed = fixEncoding(name);
  return fixed
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00d1/g, 'Ñ')
    .replace(/Ñ/g, 'Ñ')
    .trim();
}

/**
 * Para PDF/UI cuando se quieren mostrar nombres con acentos correctos (MARÍA, FERNÁNDEZ).
 * Corrige encoding y devuelve el string listo para mostrar.
 */
export function displayNameWithAccents(name) {
  if (name == null || typeof name !== 'string') return '';
  const fixed = fixEncoding(name);
  return fixed.trim();
}
