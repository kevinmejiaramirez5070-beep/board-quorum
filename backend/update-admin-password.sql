-- Script para actualizar la contraseña del usuario admin
-- Contraseña: 1234566
-- Ejecutar este script en MySQL

USE juntas;

-- Actualizar o insertar el cliente demo si no existe
INSERT INTO clients (id, name, subdomain, primary_color, secondary_color, language) 
VALUES (1, 'BOARD QUORUM Demo', 'demo', '#0072FF', '#00C6FF', 'es')
ON DUPLICATE KEY UPDATE name=name;

-- Actualizar la contraseña del usuario admin
-- Hash bcrypt para la contraseña "1234566"
UPDATE users 
SET password = '$2a$10$t9TFCryLDNHjq.Lmnm2NpOawl1VzT7Uu5nV1BuuKN0R/tyRS2IMUi'
WHERE email = 'admin@boardquorum.com';

-- Si el usuario no existe, crearlo
INSERT INTO users (email, password, name, role, client_id) 
SELECT 
  'admin@boardquorum.com',
  '$2a$10$t9TFCryLDNHjq.Lmnm2NpOawl1VzT7Uu5nV1BuuKN0R/tyRS2IMUi',
  'Administrador',
  'admin',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@boardquorum.com'
);

