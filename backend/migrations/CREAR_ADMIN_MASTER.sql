-- ============================================
-- CREAR/ACTUALIZAR USUARIO ADMIN MASTER
-- ============================================
-- Admin Master: Javier Castilla Robles
-- Acceso total multi-cliente para gestionar organizaciones
-- ============================================

-- Crear cliente por defecto si no existe (para el admin master)
INSERT INTO clients (id, name, subdomain, logo, primary_color, secondary_color, language, active, created_at)
SELECT 1, 'BOARD QUORUM', 'boardquorum', NULL, '#0072FF', '#00C6FF', 'es', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 1);

-- Actualizar o crear usuario Admin Master
-- Email: admin@boardquorum.com
-- Contraseña: AdminMaster2026!
-- Rol: admin_master

-- Primero, generar el hash de la contraseña usando: node backend/generate-password-hash.js "AdminMaster2026!"

-- Actualizar usuario existente a admin_master
UPDATE users 
SET 
  name = 'Javier Castilla Robles',
  role = 'admin_master',
  client_id = 1,
  updated_at = NOW()
WHERE email = 'admin@boardquorum.com';

-- Si no existe, crearlo
INSERT INTO users (email, password, name, role, client_id, active, created_at)
SELECT 
  'admin@boardquorum.com',
  '$2a$10$UGzL.r0UoYk.7bZ8GSFfrOB9YVLQHFSNXSkjihEzVl68PNSKAwTRW', -- Hash para "AdminMaster2026!"
  'Javier Castilla Robles',
  'admin_master',
  1,
  1,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@boardquorum.com');

-- Verificar usuario creado
SELECT 
  id,
  email,
  name,
  role,
  client_id,
  active,
  created_at
FROM users 
WHERE email = 'admin@boardquorum.com';

-- ============================================
-- CREDENCIALES ADMIN MASTER:
-- Email: admin@boardquorum.com
-- Contraseña: AdminMaster2026!
-- Rol: admin_master
-- ============================================
-- NOTA: Cambiar contraseña después del primer login
-- ============================================

