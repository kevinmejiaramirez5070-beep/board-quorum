-- ============================================
-- ARREGLAR LOGIN ADMIN MASTER
-- ============================================
-- Este script asegura que el usuario admin@boardquorum.com
-- exista con la contraseña correcta y rol admin_master
-- ============================================

-- 1. Crear cliente BOARD QUORUM si no existe
INSERT INTO clients (id, name, subdomain, logo, primary_color, secondary_color, language, active, created_at)
SELECT 1, 'BOARD QUORUM', 'boardquorum', NULL, '#0072FF', '#00C6FF', 'es', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 1);

-- 2. Verificar si el usuario existe y qué contraseña tiene
SELECT 
  id,
  email,
  name,
  role,
  client_id,
  active
FROM users 
WHERE email = 'admin@boardquorum.com';

-- 3. Si el usuario existe, actualizarlo
UPDATE users 
SET 
  name = 'Javier Castilla Robles',
  role = 'admin_master',
  client_id = 1,
  password = '$2a$10$UGzL.r0UoYk.7bZ8GSFfrOB9YVLQHFSNXSkjihEzVl68PNSKAwTRW', -- AdminMaster2026!
  updated_at = NOW()
WHERE email = 'admin@boardquorum.com';

-- 4. Si no existe, crearlo
INSERT INTO users (email, password, name, role, client_id, active, created_at)
SELECT 
  'admin@boardquorum.com',
  '$2a$10$UGzL.r0UoYk.7bZ8GSFfrOB9YVLQHFSNXSkjihEzVl68PNSKAwTRW', -- AdminMaster2026!
  'Javier Castilla Robles',
  'admin_master',
  1,
  1,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@boardquorum.com');

-- 5. Verificar el resultado
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.client_id,
  u.active,
  c.name AS client_name
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.email = 'admin@boardquorum.com';

-- ============================================
-- CREDENCIALES:
-- Email: admin@boardquorum.com
-- Contraseña: AdminMaster2026!
-- ============================================






