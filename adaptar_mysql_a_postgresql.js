/**
 * Script para adaptar datos exportados de MySQL a PostgreSQL
 * 
 * USO:
 * 1. Exporta tus datos de MySQL como juntas_datos.sql
 * 2. Ejecuta: node adaptar_mysql_a_postgresql.js
 * 3. Se creará juntas_datos_postgresql.sql listo para Supabase
 */

const fs = require('fs');
const path = require('path');

// Leer el archivo SQL de MySQL
// Buscar el archivo con diferentes nombres posibles
let inputFile = path.join(__dirname, 'juntas_datos.sql');
if (!fs.existsSync(inputFile)) {
  // Intentar con doble extensión (algunos navegadores agregan .sql automáticamente)
  inputFile = path.join(__dirname, 'juntas_datos.sql.sql');
}

const outputFile = path.join(__dirname, 'juntas_datos_postgresql.sql');

if (!fs.existsSync(inputFile)) {
  console.error('❌ No se encontró el archivo juntas_datos.sql');
  console.log('📝 Por favor, exporta primero tus datos de MySQL y guárdalos como juntas_datos.sql en esta carpeta');
  console.log(`📂 Buscando en: ${__dirname}`);
  process.exit(1);
}

console.log(`✅ Archivo encontrado: ${inputFile}`);

console.log('📖 Leyendo archivo MySQL...');
let content = fs.readFileSync(inputFile, 'utf8');

console.log('🔄 Adaptando para PostgreSQL...');

// 1. Eliminar backticks (`) - CRÍTICO para PostgreSQL
// Reemplazar backticks alrededor de nombres de tablas y columnas
content = content.replace(/`([^`]+)`/g, '$1'); // Eliminar backticks pero mantener el contenido
content = content.replace(/`/g, ''); // Eliminar cualquier backtick restante

// 2. Reemplazar INSERT IGNORE por INSERT ... ON CONFLICT DO NOTHING
content = content.replace(/INSERT\s+IGNORE\s+INTO\s+(\w+)/gi, 'INSERT INTO $1');

// 3. Convertir valores booleanos: 0 -> false, 1 -> true
// Solo en columnas booleanas conocidas (active, session_installed, acting_as_principal)
// Buscar patrones específicos en INSERT statements
content = content.replace(/(active|session_installed|acting_as_principal)\s*,\s*([01])\s*([,)])/gi, (match, col, value, after) => {
  return col + ', ' + (value === '1' ? 'true' : 'false') + after;
});

// 4. Agregar ON CONFLICT DO NOTHING a los INSERT
// Primero, eliminar todos los ON CONFLICT existentes para evitar duplicados
content = content.replace(/\s+ON\s+CONFLICT\s+\([^)]+\)\s+DO\s+NOTHING\s*;/gi, '');

// Identificar tablas con PRIMARY KEY
const tablesWithPK = {
  'clients': 'id',
  'users': 'id',
  'members': 'id',
  'meetings': 'id',
  'attendance': 'id',
  'votings': 'id',
  'votes': 'id',
  'join_requests': 'id'
};

// Procesar línea por línea para identificar el final de cada INSERT completo
const lines = content.split('\n');
const processedLines = [];
let inInsert = false;
let insertTable = null;
let insertPK = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // Detectar inicio de INSERT
  const insertMatch = trimmedLine.match(/^INSERT\s+INTO\s+(\w+)/i);
  if (insertMatch) {
    insertTable = insertMatch[1].toLowerCase();
    insertPK = tablesWithPK[insertTable] || 'id';
    inInsert = true;
    processedLines.push(line);
    continue;
  }
  
  // Si estamos dentro de un INSERT
  if (inInsert) {
    // Si la línea termina con ); verificar si hay más tuplas
    if (trimmedLine.endsWith(');')) {
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      // Si la siguiente línea comienza con (, cambiar ); por ), para continuar el INSERT
      if (nextLine.startsWith('(')) {
        processedLines.push(line.replace(/\)\s*;\s*$/, '),'));
        continue;
      }
      // Si la siguiente línea no comienza con ( o INSERT INTO, este es el final
      if (!nextLine.startsWith('(') && !nextLine.match(/^INSERT\s+INTO/i)) {
        // Reemplazar ); con ON CONFLICT
        processedLines.push(line.replace(/\)\s*;\s*$/, `) ON CONFLICT (${insertPK}) DO NOTHING;`));
        inInsert = false;
        insertTable = null;
        insertPK = null;
        continue;
      }
    }
    
    // Si la línea termina con ), significa que hay más tuplas
    if (trimmedLine.endsWith('),')) {
      processedLines.push(line);
      continue;
    }
    
    processedLines.push(line);
  } else {
    processedLines.push(line);
  }
}

// Cerrar el último INSERT si quedó abierto
if (inInsert && insertPK) {
  for (let j = processedLines.length - 1; j >= 0; j--) {
    const lastLine = processedLines[j].trim();
    if (lastLine.endsWith(');')) {
      processedLines[j] = processedLines[j].replace(/\)\s*;\s*$/, `) ON CONFLICT (${insertPK}) DO NOTHING;`);
      break;
    }
  }
}

content = processedLines.join('\n');

// 5. Ajustar fechas NULL
content = content.replace(/('0000-00-00 00:00:00'|'0000-00-00')/g, 'NULL');

// 6. Ajustar valores NULL en booleanos
content = content.replace(/,\s*NULL\s*,/g, ', NULL,');

// 7. Eliminar comandos específicos de MySQL que PostgreSQL no reconoce
content = content.replace(/SET\s+SQL_MODE\s*=.*?;/gi, '');
content = content.replace(/START\s+TRANSACTION\s*;/gi, '');
content = content.replace(/SET\s+time_zone\s*=.*?;/gi, '');
content = content.replace(/COMMIT\s*;/gi, ''); // PostgreSQL maneja transacciones diferente
content = content.replace(/SET\s+@OLD_CHARACTER_SET_CLIENT\s*=.*?;/gi, '');
content = content.replace(/SET\s+@OLD_CHARACTER_SET_RESULTS\s*=.*?;/gi, '');
content = content.replace(/SET\s+@OLD_COLLATION_CONNECTION\s*=.*?;/gi, '');
content = content.replace(/SET\s+NAMES\s+.*?;/gi, '');

// 8. Eliminar comentarios de MySQL si existen
content = content.replace(/-- MySQL dump.*?--/gs, '');
content = content.replace(/\/\*!.*?\*\//g, '');
content = content.replace(/-- phpMyAdmin.*?--/gs, '');
content = content.replace(/\/\*!40101.*?\*\//g, ''); // Eliminar comentarios condicionales de MySQL
content = content.replace(/\/\*!40101/g, ''); // Eliminar inicio de comentarios condicionales

// 9. Eliminar líneas que solo contienen comentarios de phpMyAdmin
content = content.replace(/^--.*phpMyAdmin.*$/gm, '');
content = content.replace(/^--.*version.*$/gm, '');
content = content.replace(/^--.*Servidor.*$/gm, '');
content = content.replace(/^--.*Tiempo.*$/gm, '');
content = content.replace(/^--.*Versión.*$/gm, '');
content = content.replace(/^--.*Base de datos.*$/gm, '');
content = content.replace(/^--.*Volcado.*$/gm, '');

// 10. Eliminar líneas que empiezan con "version" (no SQL válido)
content = content.replace(/^version\s+.*$/gim, '');
content = content.replace(/^\s*version\s+.*$/gim, ''); // Con espacios al inicio

// 11. Eliminar líneas que solo contienen URLs o comentarios vacíos
content = content.replace(/^--\s*https?:\/\/.*$/gm, '');
content = content.replace(/^--\s*$/gm, '');

// 12. Eliminar líneas vacías con solo punto y coma
content = content.replace(/^\s*;\s*$/gm, '');

// 13. Eliminar múltiples líneas vacías consecutivas (máximo 2)
content = content.replace(/\n{3,}/g, '\n\n');

// 14. Eliminar líneas vacías al inicio del archivo
content = content.replace(/^\s*\n+/g, '');

// 10. Asegurar que los INSERT terminen correctamente
content = content.replace(/;\s*$/gm, ';');

console.log('💾 Guardando archivo adaptado...');
fs.writeFileSync(outputFile, content, 'utf8');

console.log('✅ ¡Listo!');
console.log(`📄 Archivo creado: ${outputFile}`);
console.log('');
console.log('📝 PRÓXIMOS PASOS:');
console.log('1. Revisa el archivo juntas_datos_postgresql.sql');
console.log('2. Ve a Supabase → SQL Editor');
console.log('3. Copia y pega el contenido del archivo');
console.log('4. Haz clic en "Run"');
console.log('');
console.log('⚠️  Si hay errores, revisa manualmente los INSERT statements');
