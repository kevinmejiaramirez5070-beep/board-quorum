/**
 * Script para corregir valores booleanos en INSERT statements
 * Solo convierte booleanos en las columnas correctas
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'juntas_datos_postgresql.sql');
const outputFile = path.join(__dirname, 'juntas_datos_postgresql_corregido.sql');

if (!fs.existsSync(inputFile)) {
  console.error('❌ No se encontró el archivo juntas_datos_postgresql.sql');
  process.exit(1);
}

console.log('📖 Leyendo archivo...');
let content = fs.readFileSync(inputFile, 'utf8');

console.log('🔄 Corrigiendo valores booleanos...');

// Definir las columnas que SÍ deben ser booleanas por tabla
const booleanColumns = {
  'clients': ['active'],
  'users': ['active'],
  'members': ['active', 'cuenta_quorum', 'puede_votar'],
  'meetings': ['session_installed'],
  'attendance': ['acting_as_principal']
};

// Función para corregir un INSERT statement
function corregirInsert(insertStatement) {
  // Detectar la tabla
  const tableMatch = insertStatement.match(/INSERT\s+INTO\s+(\w+)/i);
  if (!tableMatch) return insertStatement;
  
  const tableName = tableMatch[1].toLowerCase();
  const booleanCols = booleanColumns[tableName] || [];
  
  if (booleanCols.length === 0) {
    // Si no hay columnas booleanas, revertir todos los true/false a 1/0
    return insertStatement
      .replace(/\btrue\b/g, '1')
      .replace(/\bfalse\b/g, '0');
  }
  
  // Extraer la lista de columnas
  const columnsMatch = insertStatement.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i);
  if (!columnsMatch) return insertStatement;
  
  const columns = columnsMatch[1].split(',').map(c => c.trim().toLowerCase());
  
  // Procesar cada tupla de valores
  return insertStatement.replace(/\(([^)]+)\)/g, (match, values) => {
    const valuesList = values.split(',').map(v => v.trim());
    
    // Corregir cada valor según su posición
    const correctedValues = valuesList.map((value, index) => {
      const columnName = columns[index];
      
      if (!columnName) return value;
      
      // Si la columna DEBE ser booleana
      if (booleanCols.includes(columnName)) {
        // Convertir 1/0 a true/false si es necesario
        if (value === '1') return 'true';
        if (value === '0') return 'false';
        return value; // Ya es true/false o NULL
      } else {
        // Si la columna NO debe ser booleana, revertir true/false a 1/0
        if (value === 'true') return '1';
        if (value === 'false') return '0';
        return value;
      }
    });
    
    return '(' + correctedValues.join(', ') + ')';
  });
}

// Dividir el contenido en INSERT statements
const lines = content.split('\n');
let result = [];
let currentInsert = '';
let inInsert = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // Detectar inicio de INSERT
  if (trimmedLine.match(/^INSERT\s+INTO/i)) {
    if (currentInsert) {
      result.push(corregirInsert(currentInsert));
    }
    currentInsert = line;
    inInsert = true;
  } else if (inInsert) {
    currentInsert += '\n' + line;
    
    // Detectar fin de INSERT (termina con ;)
    if (trimmedLine.endsWith(';')) {
      result.push(corregirInsert(currentInsert));
      currentInsert = '';
      inInsert = false;
    }
  } else {
    result.push(line);
  }
}

// Agregar el último INSERT si existe
if (currentInsert) {
  result.push(corregirInsert(currentInsert));
}

content = result.join('\n');

console.log('💾 Guardando archivo corregido...');
fs.writeFileSync(outputFile, content, 'utf8');

console.log('✅ ¡Listo!');
console.log(`📄 Archivo creado: ${outputFile}`);
console.log('');
console.log('📝 PRÓXIMOS PASOS:');
console.log('1. Revisa el archivo juntas_datos_postgresql_corregido.sql');
console.log('2. En Supabase SQL Editor, borra todo el contenido anterior');
console.log('3. Copia y pega el contenido del archivo corregido');
console.log('4. Ejecuta el script (Run)');
