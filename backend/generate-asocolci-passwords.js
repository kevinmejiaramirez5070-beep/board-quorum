const bcrypt = require('bcryptjs');

// Contraseñas para usuarios de ASOCOLCI
const passwords = {
  nohora: 'Asocolci2026!',
  monica: 'Asocolci2026!'
};

console.log('========================================');
console.log('GENERANDO HASHES PARA USUARIOS ASOCOLCI');
console.log('========================================');
console.log('');

// Generar hash para Nohora (Admin-Asocolci)
const hashNohora = bcrypt.hashSync(passwords.nohora, 10);
console.log('1. NOHORA IDALI PÁEZ MENJURA (Admin-Asocolci)');
console.log('   Email: nohora.paez@asocolci.com.co');
console.log('   Contraseña:', passwords.nohora);
console.log('   Hash:', hashNohora);
console.log('');

// Generar hash para Mónica (Autorizado-Asocolci)
const hashMonica = bcrypt.hashSync(passwords.monica, 10);
console.log('2. MÓNICA LORENA QUESADA (Autorizado-Asocolci)');
console.log('   Email: monica.quesada@asocolci.com.co');
console.log('   Contraseña:', passwords.monica);
console.log('   Hash:', hashMonica);
console.log('');

console.log('========================================');
console.log('SQL PARA INSERTAR USUARIOS:');
console.log('========================================');
console.log('');

// Obtener client_id de ASOCOLCI
console.log('-- Obtener ID de ASOCOLCI');
console.log('SET @client_id = (SELECT id FROM clients WHERE subdomain = \'asocolci\' OR name LIKE \'%ASOCOLCI%\' LIMIT 1);');
console.log('');

console.log('-- Insertar Nohora (Admin-Asocolci)');
console.log(`INSERT INTO users (email, password, name, role, client_id, active, created_at)`);
console.log(`SELECT`);
console.log(`  'nohora.paez@asocolci.com.co',`);
console.log(`  '${hashNohora}',`);
console.log(`  'Nohora Idali Páez Menjura',`);
console.log(`  'admin',`);
console.log(`  @client_id,`);
console.log(`  1,`);
console.log(`  NOW()`);
console.log(`WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'nohora.paez@asocolci.com.co');`);
console.log('');

console.log('-- Insertar Mónica (Autorizado-Asocolci)');
console.log(`INSERT INTO users (email, password, name, role, client_id, active, created_at)`);
console.log(`SELECT`);
console.log(`  'monica.quesada@asocolci.com.co',`);
console.log(`  '${hashMonica}',`);
console.log(`  'Mónica Lorena Quesada',`);
console.log(`  'authorized',`);
console.log(`  @client_id,`);
console.log(`  1,`);
console.log(`  NOW()`);
console.log(`WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'monica.quesada@asocolci.com.co');`);
console.log('');

console.log('-- Verificar usuarios creados');
console.log('SELECT id, email, name, role, client_id, active FROM users WHERE client_id = @client_id ORDER BY role, name;');
console.log('');

console.log('========================================');
console.log('NOTA: Cambiar contraseñas después del primer login');
console.log('========================================');






