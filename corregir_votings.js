const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'juntas_datos_postgresql.sql');
const outputFile = path.join(__dirname, 'juntas_datos_postgresql_corregido.sql');

console.log('📖 Leyendo archivo...');
let content = fs.readFileSync(inputFile, 'utf8');

console.log('🔧 Corrigiendo INSERT de votings...');

// Buscar el patrón donde hay dos tuplas de votings con ON CONFLICT cada una
// Patrón: (1, 7, ...) ON CONFLICT ...; (1, 7, ...) ON CONFLICT ...;
// Debe ser: (1, 7, ...), (1, 7, ...) ON CONFLICT ...;

// Primero, encontrar todas las líneas que terminan con ON CONFLICT para votings
const lines = content.split('\n');
const correctedLines = [];
let inVotingsInsert = false;
let votingsStartIndex = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Detectar inicio de INSERT votings
  if (trimmed.startsWith('INSERT INTO votings')) {
    inVotingsInsert = true;
    votingsStartIndex = correctedLines.length;
    correctedLines.push(line);
    continue;
  }
  
  // Si estamos en un INSERT de votings
  if (inVotingsInsert) {
    // Si la línea termina con ON CONFLICT, verificar si hay más tuplas después
    if (trimmed.endsWith('ON CONFLICT (id) DO NOTHING;')) {
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      
      // Si la siguiente línea es otra tupla de votings (empieza con paréntesis)
      if (nextLine.startsWith('(1, 7,')) {
        // Cambiar ); ON CONFLICT por ), para continuar el INSERT
        const corrected = line.replace(/\)\s+ON CONFLICT \(id\) DO NOTHING;\s*$/, '),');
        correctedLines.push(corrected);
        continue;
      } else {
        // Es el final del INSERT, mantener ON CONFLICT
        correctedLines.push(line);
        inVotingsInsert = false;
        votingsStartIndex = -1;
        continue;
      }
    }
    
    correctedLines.push(line);
  } else {
    correctedLines.push(line);
  }
}

content = correctedLines.join('\n');

console.log('💾 Guardando archivo corregido...');
fs.writeFileSync(outputFile, content, 'utf8');

console.log('✅ ¡Archivo corregido guardado en juntas_datos_postgresql_corregido.sql!');
