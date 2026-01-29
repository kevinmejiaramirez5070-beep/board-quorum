-- ============================================
-- ACTUALIZAR INFORMACIÓN DEL CLIENTE ASOCOLCI
-- ============================================
-- Este script actualiza los colores y nombre del cliente ASOCOLCI
-- para que se muestren correctamente en la plataforma
-- ============================================

-- Actualizar información de ASOCOLCI
UPDATE clients 
SET 
  name = 'ASOCOLCI',
  subdomain = 'asocolci',
  primary_color = '#0072FF',
  secondary_color = '#00C6FF',
  language = 'es',
  updated_at = NOW()
WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%';

-- Si no existe, crearlo
INSERT INTO clients (name, subdomain, logo, primary_color, secondary_color, language, active, created_at)
SELECT 'ASOCOLCI', 'asocolci', NULL, '#0072FF', '#00C6FF', 'es', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%');

-- Verificar la información actualizada
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

-- ============================================
-- NOTA: Para agregar un logo:
-- 1. Subir la imagen del logo a frontend/public/
-- 2. Actualizar el campo logo con la ruta, por ejemplo:
--    UPDATE clients SET logo = '/asocolci-logo.png' WHERE subdomain = 'asocolci';
-- ============================================






