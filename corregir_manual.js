const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'juntas_datos_postgresql.sql');
const outputFile = path.join(__dirname, 'juntas_datos_postgresql_corregido.sql');

console.log('📖 Leyendo archivo...');
let content = fs.readFileSync(inputFile, 'utf8');

console.log('🔧 Corrigiendo manualmente...');

// Buscar y reemplazar el patrón específico de votings
// Si hay dos tuplas con ON CONFLICT cada una, corregirlas

// Patrón: línea que termina con ON CONFLICT seguida de otra tupla con ON CONFLICT
const lines = content.split('\n');
const correctedLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
  
  // Detectar si esta línea termina con ON CONFLICT y la siguiente es otra tupla
  if (trimmed.includes('ON CONFLICT (id) DO NOTHING;') && 
      nextLine.startsWith('(1, 7,') && 
      nextLine.includes('ON CONFLICT')) {
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
