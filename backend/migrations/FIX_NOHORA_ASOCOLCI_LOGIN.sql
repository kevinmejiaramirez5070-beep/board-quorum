-- ============================================
-- ARREGLAR LOGIN DE NOHORA (ADMIN ASOCOLCI)
-- ============================================
-- Este script asegura que Nohora pueda iniciar sesión
-- como Admin de ASOCOLCI (cliente piloto)
-- ============================================

-- 1. Asegurar que el cliente ASOCOLCI existe con toda su información
INSERT INTO clients (name, subdomain, logo, primary_color, secondary_color, language, active, created_at)
SELECT 'ASOCOLCI', 'asocolci', NULL, '#0072FF', '#00C6FF', 'es', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%');

-- 2. Obtener el ID de ASOCOLCI
SET @client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%' LIMIT 1);

-- 3. Actualizar información del cliente ASOCOLCI si ya existe
UPDATE clients 
SET 
  name = 'ASOCOLCI',
  primary_color = '#0072FF',
  secondary_color = '#00C6FF',
  language = 'es',
  updated_at = NOW()
WHERE (subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%')
  AND (primary_color IS NULL OR secondary_color IS NULL OR name != 'ASOCOLCI');

-- 4. Obtener el ID nuevamente después de actualización
SET @client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%' LIMIT 1);

-- Verificar el ID obtenido
SELECT @client_id AS asocolci_client_id;

-- 5. Verificar si el usuario de Nohora existe
SELECT 
  id,
  email,
  name,
  role,
  client_id,
  active
FROM users 
WHERE email = 'nohora.paez@asocolci.com.co';

-- 6. ACTUALIZAR usuario de Nohora (si existe)
UPDATE users 
SET 
  name = 'Nohora Idali Páez Menjura',
  role = 'admin',
  client_id = @client_id,
  password = '$2a$10$tO/Zsy12ipRPbT6OjtgSv.XFuxTJmaCO.NjftJ.zyYAQokb2c8jZi', -- Asocolci2026!
  active = 1,
  updated_at = NOW()
WHERE email = 'nohora.paez@asocolci.com.co';

-- 7. Si no existe, crearlo
INSERT INTO users (email, password, name, role, client_id, active, created_at)
SELECT 
  'nohora.paez@asocolci.com.co',
  '$2a$10$tO/Zsy12ipRPbT6OjtgSv.XFuxTJmaCO.NjftJ.zyYAQokb2c8jZi', -- Asocolci2026!
  'Nohora Idali Páez Menjura',
  'admin',
  @client_id,
  1,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'nohora.paez@asocolci.com.co');

-- 8. Verificar el resultado final
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.client_id,
  u.active,
  c.name AS client_name,
  c.primary_color,
  c.secondary_color
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.email = 'nohora.paez@asocolci.com.co';

-- ============================================
-- CREDENCIALES PARA NOHORA:
-- ============================================
-- Email: nohora.paez@asocolci.com.co
-- Contraseña: Asocolci2026!
-- Rol: admin
-- Cliente: ASOCOLCI
-- ============================================
-- Después de ejecutar este script, Nohora podrá iniciar sesión
-- y verá los colores y nombre de ASOCOLCI en la plataforma
-- ============================================






