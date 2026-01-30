const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'juntas_datos_postgresql.sql');
const outputFile = path.join(__dirname, 'juntas_datos_postgresql_corregido.sql');

console.log('📖 Leyendo archivo...');
let content = fs.readFileSync(inputFile, 'utf8');

console.log('🔧 Corrigiendo múltiples tuplas en INSERT statements...');

// Patrón para encontrar INSERT statements con múltiples tuplas que tienen ON CONFLICT después de cada una
// Buscar: (valores) ON CONFLICT ...; (valores) ON CONFLICT ...;
// Reemplazar por: (valores), (valores) ON CONFLICT ...;

// Procesar línea por línea
const lines = content.split('\n');
const correctedLines = [];
let currentInsert = null;
let insertTable = null;
let insertValues = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Detectar inicio de INSERT
  const insertMatch = trimmed.match(/^INSERT INTO (\w+)/i);
  if (insertMatch) {
    // Si había un INSERT anterior, cerrarlo
    if (currentInsert && insertValues.length > 0) {
      // Agregar todas las tuplas separadas por comas
      correctedLines.push(...insertValues.slice(0, -1).map(v => v + ','));
      // La última tupla con ON CONFLICT
      const lastValue = insertValues[insertValues.length - 1];
      const pk = insertTable === 'votings' ? 'id' : 'id';
      correctedLines.push(lastValue.replace(/\)\s*;?\s*$/, `) ON CONFLICT (${pk}) DO NOTHING;`));
    }
    
    // Iniciar nuevo INSERT
    currentInsert = line;
    insertTable = insertMatch[1].toLowerCase();
    insertValues = [];
    correctedLines.push(line);
    continue;
  }
  
  // Si estamos dentro de un INSERT
  if (currentInsert) {
    // Si la línea es una tupla que termina con ON CONFLICT
    if (trimmed.match(/^\(.*\)\s+ON CONFLICT/i)) {
      // Extraer solo la tupla (sin ON CONFLICT)
      const tuple = trimmed.replace(/\s+ON CONFLICT.*$/i, '');
      insertValues.push(tuple);
      
      // Verificar si la siguiente línea es otra tupla
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      if (nextLine.startsWith('(') && !nextLine.match(/^INSERT INTO/i)) {
        // Hay más tuplas, no agregar esta línea todavía
        continue;
      } else {
        // Es la última tupla, agregar todas con ON CONFLICT al final
        if (insertValues.length > 0) {
          // Agregar todas las tuplas separadas por comas
          correctedLines.push(...insertValues.slice(0, -1).map(v => v + ','));
          // La última tupla con ON CONFLICT
          const lastValue = insertValues[insertValues.length - 1];
          const pk = insertTable === 'votings' ? 'id' : 'id';
          correctedLines.push(lastValue + ' ON CONFLICT (' + pk + ') DO NOTHING;');
          insertValues = [];
        }
        currentInsert = null;
        insertTable = null;
        continue;
      }
    } else if (trimmed.startsWith('(') && trimmed.endsWith('),')) {
      // Tupla con coma al final (hay más tuplas)
      insertValues.push(trimmed);
      correctedLines.push(line);
    } else if (trimmed.startsWith('(') && trimmed.endsWith(');')) {
      // Última tupla sin ON CONFLICT
      const tuple = trimmed.replace(/\);?\s*$/, '');
      insertValues.push(tuple);
      // Verificar siguiente línea
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      if (nextLine.startsWith('(') && !nextLine.match(/^INSERT INTO/i)) {
        // Hay más tuplas, cambiar ); por ),
        correctedLines.push(tuple + '),');
        continue;
      } else {
        // Es la última, agregar ON CONFLICT
        const pk = insertTable === 'votings' ? 'id' : 'id';
        if (insertValues.length > 0) {
          correctedLines.push(...insertValues.slice(0, -1).map(v => v + ','));
          correctedLines.push(insertValues[insertValues.length - 1] + ' ON CONFLICT (' + pk + ') DO NOTHING;');
          insertValues = [];
        }
        currentInsert = null;
        insertTable = null;
        continue;
      }
    } else {
      correctedLines.push(line);
    }
  } else {
    correctedLines.push(line);
  }
}

// Cerrar último INSERT si quedó abierto
if (currentInsert && insertValues.length > 0) {
  const pk = insertTable === 'votings' ? 'id' : 'id';
  correctedLines.push(...insertValues.slice(0, -1).map(v => v + ','));
  correctedLines.push(insertValues[insertValues.length - 1] + ' ON CONFLICT (' + pk + ') DO NOTHING;');
}

content = correctedLines.join('\n');

console.log('💾 Guardando archivo corregido...');
fs.writeFileSync(outputFile, content, 'utf8');

console.log('✅ ¡Archivo corregido guardado!');
console.log('📄 Archivo: juntas_datos_postgresql_corregido.sql');
