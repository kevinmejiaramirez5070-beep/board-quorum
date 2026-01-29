const bcrypt = require('bcryptjs');

const password = '1234566';

// Generar hash
const hash = bcrypt.hashSync(password, 10);

console.log('========================================');
console.log('HASH GENERADO PARA LA CONTRASEÑA: 1234566');
console.log('========================================');
console.log('');
console.log('Hash bcrypt:', hash);
console.log('');
console.log('========================================');
console.log('SQL PARA ACTUALIZAR:');
console.log('========================================');
console.log('');
console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@boardquorum.com';`);
console.log('');
console.log('========================================');

