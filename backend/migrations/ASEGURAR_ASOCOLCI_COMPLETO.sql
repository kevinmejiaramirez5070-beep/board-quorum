-- ============================================
-- ASEGURAR QUE ASOCOLCI TENGA TODA LA INFORMACIÓN
-- ============================================
-- Este script asegura que el cliente ASOCOLCI exista
-- con todos los datos necesarios (nombre, colores, etc.)
-- ============================================

-- Crear o actualizar el cliente ASOCOLCI
INSERT INTO clients (name, subdomain, logo, primary_color, secondary_color, language, active, created_at)
VALUES ('ASOCOLCI', 'asocolci', NULL, '#0072FF', '#00C6FF', 'es', 1, NOW())
ON DUPLICATE KEY UPDATE
  name = 'ASOCOLCI',
  primary_color = '#0072FF',
  secondary_color = '#00C6FF',
  language = 'es',
  updated_at = NOW();

-- Si la tabla no tiene UNIQUE en subdomain, usar este método alternativo:
-- Primero verificar si existe
SET @client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%' LIMIT 1);

-- Si no existe, crearlo
INSERT INTO clients (name, subdomain, logo, primary_color, secondary_color, language, active, created_at)
SELECT 'ASOCOLCI', 'asocolci', NULL, '#0072FF', '#00C6FF', 'es', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%');

-- Si existe, actualizarlo
UPDATE clients 
SET 
  name = 'ASOCOLCI',
  primary_color = '#0072FF',
  secondary_color = '#00C6FF',
  language = 'es',
  updated_at = NOW()
WHERE (subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%')
  AND (primary_color IS NULL OR secondary_color IS NULL OR name != 'ASOCOLCI');

-- Obtener el ID final
SET @client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%' LIMIT 1);

-- Verificar la información
SELECT 
  id,
  name,
  subdomain,
  logo,
  primary_color,
  secondary_color,
  language,
  active,
  created_at,
  updated_at
FROM clients 
WHERE id = @client_id;

-- Verificar usuarios asociados
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.client_id,
  c.name AS client_name
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.client_id = @client_id
ORDER BY u.role, u.name;






