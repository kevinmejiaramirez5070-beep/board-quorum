-- ============================================
-- ARREGLAR ASOCOLCI COMPLETO
-- ============================================
-- Este script asegura que ASOCOLCI tenga todos los datos
-- y que Nohora pueda ver la información de ASOCOLCI
-- ============================================

-- 1. Verificar estado actual
SELECT '=== ESTADO ACTUAL ===' AS info;

SELECT 'Clientes ASOCOLCI:' AS info;
SELECT 
  id,
  name,
  subdomain,
  logo,
  primary_color,
  secondary_color,
  language,
  active
FROM clients 
WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%';

SELECT 'Usuario Nohora:' AS info;
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
WHERE u.email = 'nohora.paez@asocolci.com.co';

-- 2. Crear o actualizar cliente ASOCOLCI
INSERT INTO clients (name, subdomain, logo, primary_color, secondary_color, language, active, created_at)
SELECT 'ASOCOLCI', 'asocolci', NULL, '#0072FF', '#00C6FF', 'es', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%');

-- 3. Actualizar ASOCOLCI con todos los datos (FORZAR ACTUALIZACIÓN)
UPDATE clients 
SET 
  name = 'ASOCOLCI',
  primary_color = '#0072FF',
  secondary_color = '#00C6FF',
  language = 'es',
  active = 1,
  updated_at = NOW()
WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%';

-- 4. Obtener el ID de ASOCOLCI
SET @client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%' LIMIT 1);

SELECT CONCAT('ID de ASOCOLCI: ', @client_id) AS info;

-- 5. Asegurar que Nohora esté vinculada a ASOCOLCI
UPDATE users 
SET 
  name = 'Nohora Idali Páez Menjura',
  role = 'admin',
  client_id = @client_id,
  password = '$2a$10$tO/Zsy12ipRPbT6OjtgSv.XFuxTJmaCO.NjftJ.zyYAQokb2c8jZi',
  active = 1,
  updated_at = NOW()
WHERE email = 'nohora.paez@asocolci.com.co';

-- 6. Si Nohora no existe, crearla
INSERT INTO users (email, password, name, role, client_id, active, created_at)
SELECT 
  'nohora.paez@asocolci.com.co',
  '$2a$10$tO/Zsy12ipRPbT6OjtgSv.XFuxTJmaCO.NjftJ.zyYAQokb2c8jZi',
  'Nohora Idali Páez Menjura',
  'admin',
  @client_id,
  1,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'nohora.paez@asocolci.com.co');

-- 7. VERIFICACIÓN FINAL
SELECT '=== VERIFICACIÓN FINAL ===' AS info;

SELECT 
  u.id AS user_id,
  u.email,
  u.name AS user_name,
  u.role,
  u.client_id,
  u.active AS user_active,
  c.id AS client_id_check,
  c.name AS client_name,
  c.subdomain,
  c.primary_color,
  c.secondary_color,
  c.language,
  c.active AS client_active,
  CASE 
    WHEN c.name = 'ASOCOLCI' AND c.primary_color = '#0072FF' AND c.secondary_color = '#00C6FF' THEN '✅ CORRECTO'
    ELSE '❌ ERROR - Revisar datos'
  END AS estado
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.email = 'nohora.paez@asocolci.com.co';

-- ============================================
-- RESULTADO ESPERADO:
-- - user_id: ID del usuario
-- - email: nohora.paez@asocolci.com.co
-- - user_name: Nohora Idali Páez Menjura
-- - role: admin
-- - client_id: Debe coincidir con client_id_check
-- - client_name: ASOCOLCI
-- - primary_color: #0072FF
-- - secondary_color: #00C6FF
-- - estado: ✅ CORRECTO
-- ============================================






