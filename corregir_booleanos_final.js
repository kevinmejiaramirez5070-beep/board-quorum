/**
 * Script para corregir valores booleanos en INSERT statements
 * Versión mejorada que maneja strings con comas correctamente
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
  'attendance': ['acting_as_principal'],
  'contacts': ['privacy_accepted']
};

// Función para parsear una tupla de valores correctamente
function parseValuesTuple(tupleStr) {
  const values = [];
  let current = '';
  let inString = false;
  let stringChar = null;
  let depth = 0;
  
  for (let i = 0; i < tupleStr.length; i++) {
    const char = tupleStr[i];
    
    if ((char === "'" || char === '"') && (i === 0 || tupleStr[i-1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
      current += char;
    } else if (char === '(' && !inString) {
      depth++;
      current += char;
    } else if (char === ')' && !inString) {
      depth--;
      current += char;
    } else if (char === ',' && !inString && depth === 0) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    values.push(current.trim());
  }
  
  return values;
}

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
  
  // Encontrar todas las tuplas de valores (entre paréntesis)
  return insertStatement.replace(/\(([^)]*(?:\([^)]*\)[^)]*)*)\)/g, (match, valuesStr) => {
    // Si es la lista de columnas, no procesar
    if (match.includes('INSERT INTO')) return match;
    
    const values = parseValuesTuple(valuesStr);
    
    // Corregir cada valor según su posición
    const correctedValues = values.map((value, index) => {
      const columnName = columns[index];
      
      if (!columnName) return value;
      
      const trimmedValue = value.trim();
      
      // Si la columna DEBE ser booleana
      if (booleanCols.includes(columnName)) {
        // Convertir 1/0 a true/false si es necesario
        if (trimmedValue === '1') return 'true';
        if (trimmedValue === '0') return 'false';
        return value; // Ya es true/false o NULL
      } else {
        // Si la columna NO debe ser booleana, revertir true/false a 1/0
        if (trimmedValue === 'true') return '1';
        if (trimmedValue === 'false') return '0';
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
