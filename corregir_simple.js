const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'juntas_datos_postgresql.sql');
const outputFile = path.join(__dirname, 'juntas_datos_postgresql_corregido.sql');

console.log('📖 Leyendo archivo...');
let content = fs.readFileSync(inputFile, 'utf8');

console.log('🔧 Corrigiendo múltiples tuplas con ON CONFLICT...');

// Buscar el patrón específico: línea que termina con ON CONFLICT seguida de otra tupla
// Reemplazar: (valores) ON CONFLICT ...;\n(valores) ON CONFLICT ...;
// Por: (valores),\n(valores) ON CONFLICT ...;

const lines = content.split('\n');
const correctedLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
  
  // Si la línea actual termina con ON CONFLICT y la siguiente es otra tupla
  if (trimmed.endsWith('ON CONFLICT (id) DO NOTHING;') && nextLine.startsWith('(')) {
    // Cambiar ON CONFLICT por coma
    const corrected = line.replace(/\s+ON CONFLICT \(id\) DO NOTHING;\s*$/, ',');
    correctedLines.push(corrected);
  } else {
    correctedLines.push(line);
  }
}

content = correctedLines.join('\n');

console.log('💾 Guardando archivo corregido...');
fs.writeFileSync(outputFile, content, 'utf8');

console.log('✅ ¡Archivo corregido guardado!');
console.log('📄 Archivo: juntas_datos_postgresql_corregido.sql');
