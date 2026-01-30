const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'juntas_datos_postgresql.sql');
const outputFile = path.join(__dirname, 'juntas_datos_postgresql_corregido.sql');

console.log('📖 Leyendo archivo...');
let content = fs.readFileSync(inputFile, 'utf8');

console.log('🔧 Corrigiendo archivo línea por línea...');

const lines = content.split('\n');
const correctedLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
  
  // Si la línea actual termina con ON CONFLICT y la siguiente línea es otra tupla (empieza con paréntesis)
  // pero NO es un nuevo INSERT INTO
  if (trimmed.endsWith('ON CONFLICT (id) DO NOTHING;') && 
      nextLine.startsWith('(') && 
      !nextLine.match(/^INSERT INTO/i)) {
    // Cambiar ON CONFLICT por coma para continuar el INSERT
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
