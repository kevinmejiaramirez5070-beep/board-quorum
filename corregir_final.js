const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'juntas_datos_postgresql.sql');
const outputFile = path.join(__dirname, 'juntas_datos_postgresql_corregido.sql');

console.log('📖 Leyendo archivo...');
let content = fs.readFileSync(inputFile, 'utf8');

console.log('🔧 Corrigiendo múltiples tuplas con ON CONFLICT...');

// Buscar el patrón donde hay dos tuplas de votings con ON CONFLICT cada una
// Patrón: (1, 7, ...) ON CONFLICT ...;\n(1, 7, ...) ON CONFLICT ...;
// Reemplazar por: (1, 7, ...),\n(1, 7, ...) ON CONFLICT ...;

// Usar regex para encontrar el patrón
const pattern = /\(1,\s*7,\s*'te parecio buena la reunion\?',\s*'',\s*'simple',\s*NULL,\s*'pending',\s*'2026-01-10 05:16:51',\s*'2026-01-10 05:16:51'\)\s+ON CONFLICT \(id\) DO NOTHING;\s*\n\s*\(1,\s*7,\s*'te parecio buena la reunion\?',\s*'',\s*'simple',\s*NULL,\s*'pending',\s*'2026-01-10 05:16:51',\s*'2026-01-10 05:16:51'\)\s+ON CONFLICT \(id\) DO NOTHING;/g;

const replacement = `(1, 7, 'te parecio buena la reunion?', '', 'simple', NULL, 'pending', '2026-01-10 05:16:51', '2026-01-10 05:16:51'),
(1, 7, 'te parecio buena la reunion?', '', 'simple', NULL, 'pending', '2026-01-10 05:16:51', '2026-01-10 05:16:51') ON CONFLICT (id) DO NOTHING;`;

content = content.replace(pattern, replacement);

// También corregir cualquier otro caso donde haya múltiples tuplas con ON CONFLICT
// Buscar: (valores) ON CONFLICT ...;\n(valores) ON CONFLICT ...;
// Reemplazar por: (valores),\n(valores) ON CONFLICT ...;

// Patrón más genérico para cualquier INSERT con múltiples tuplas
const genericPattern = /(\([^)]+\))\s+ON CONFLICT \(id\) DO NOTHING;\s*\n\s*(\([^)]+\))\s+ON CONFLICT \(id\) DO NOTHING;/g;

content = content.replace(genericPattern, (match, tuple1, tuple2) => {
  return tuple1 + ',\n' + tuple2 + ' ON CONFLICT (id) DO NOTHING;';
});

console.log('💾 Guardando archivo corregido...');
fs.writeFileSync(outputFile, content, 'utf8');

console.log('✅ ¡Archivo corregido guardado!');
console.log('📄 Archivo: juntas_datos_postgresql_corregido.sql');
