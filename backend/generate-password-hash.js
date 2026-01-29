const bcrypt = require('bcryptjs');

const password = '1234566';
const hash = bcrypt.hashSync(password, 10);

console.log('Contraseña:', password);
console.log('Hash bcrypt:', hash);
console.log('\n--- SQL para insertar usuario admin ---');
console.log(`INSERT INTO users (email, password, name, role, client_id) 
VALUES (
  'admin@boardquorum.com', 
  '${hash}',
  'Administrador',
  'admin',
  (SELECT id FROM clients WHERE subdomain = 'demo' LIMIT 1)
);`);

