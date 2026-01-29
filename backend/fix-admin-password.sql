-- Script para corregir la contraseña del usuario admin
-- Ejecutar este script en phpMyAdmin o MySQL
-- Contraseña: 1234566

USE juntas;

-- Actualizar la contraseña del usuario admin
UPDATE users 
SET password = '$2a$10$t9TFCryLDNHjq.Lmnm2NpOawl1VzT7Uu5nV1BuuKN0R/tyRS2IMUi'
WHERE email = 'admin@boardquorum.com';

-- Verificar que se actualizó correctamente
SELECT id, email, name, role FROM users WHERE email = 'admin@boardquorum.com';

