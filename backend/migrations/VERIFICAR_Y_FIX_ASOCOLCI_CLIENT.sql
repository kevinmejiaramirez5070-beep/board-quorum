-- ============================================
-- VERIFICAR Y ARREGLAR CLIENTE ASOCOLCI
-- ============================================
-- Este script verifica que ASOCOLCI tenga todos los datos
-- y que Nohora esté correctamente vinculada
-- ============================================

-- 1. Verificar cliente ASOCOLCI
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

-- 2. Verificar usuario de Nohora
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

-- 3. Asegurar que ASOCOLCI existe con todos los datos
INSERT INTO clients (name, subdomain, logo, primary_color, secondary_color, language, active, created_at)
SELECT 'ASOCOLCI', 'asocolci', NULL, '#0072FF', '#00C6FF', 'es', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%');

-- 4. Actualizar ASOCOLCI con todos los datos necesarios
UPDATE clients 
SET 
  name = 'ASOCOLCI',
  primary_color = '#0072FF',
  secondary_color = '#00C6FF',
  language = 'es',
  active = 1,
  updated_at = NOW()
WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%';

-- 5. Obtener el ID de ASOCOLCI
SET @client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%' LIMIT 1);

-- 6. Asegurar que Nohora esté vinculada a ASOCOLCI
UPDATE users 
SET 
  client_id = @client_id,
  updated_at = NOW()
WHERE email = 'nohora.paez@asocolci.com.co' 
  AND (client_id IS NULL OR client_id != @client_id);

-- 7. Verificación final
SELECT 
  u.id AS user_id,
  u.email,
  u.name AS user_name,
  u.role,
  u.client_id,
  u.active AS user_active,
  c.id AS client_id,
  c.name AS client_name,
  c.subdomain,
  c.primary_color,
  c.secondary_color,
  c.language,
  c.active AS client_active
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.email = 'nohora.paez@asocolci.com.co';

-- ============================================
-- Si el SELECT final muestra:
-- - client_id: debe ser el ID de ASOCOLCI
-- - client_name: debe ser "ASOCOLCI"
-- - primary_color: debe ser "#0072FF"
-- - secondary_color: debe ser "#00C6FF"
-- ============================================






