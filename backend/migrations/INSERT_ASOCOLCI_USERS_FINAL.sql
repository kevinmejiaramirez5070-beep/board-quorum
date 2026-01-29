-- ============================================
-- CREAR USUARIOS DE ASOCOLCI - SCRIPT FINAL
-- ============================================
-- Cliente Piloto: ASOCOLCI
-- Fecha: 10 enero 2026
-- ============================================
-- Este script crea los usuarios según el modelo de roles:
-- 1. ADMIN-ASOCOLCI: Nohora Idali Páez Menjura (admin)
-- 2. AUTORIZADO-ASOCOLCI: Mónica Lorena Quesada (authorized)
-- ============================================

-- Obtener el ID de ASOCOLCI
SET @client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%' LIMIT 1);

-- Si ASOCOLCI no existe, crear el cliente primero
INSERT INTO clients (name, subdomain, logo, primary_color, secondary_color, language, active, created_at)
SELECT 'ASOCOLCI', 'asocolci', NULL, '#0072FF', '#00C6FF', 'es', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%');

-- Obtener el ID nuevamente después de posible creación
SET @client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%' LIMIT 1);

-- Verificar el ID obtenido
SELECT @client_id AS asocolci_client_id;

-- ============================================
-- 1. ADMIN-ASOCOLCI: Nohora Idali Páez Menjura
-- ============================================
-- CC: 52283818
-- Email: nohora.paez@asocolci.com.co
-- Contraseña: Asocolci2026!
-- Permisos: CRUD completo de miembros, crear reuniones, preparar votaciones
-- ============================================

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

-- ============================================
-- 2. AUTORIZADO-ASOCOLCI: Mónica Lorena Quesada
-- ============================================
-- Secretaría de JD
-- Email: monica.quesada@asocolci.com.co
-- Contraseña: Asocolci2026!
-- Permisos: Generar enlaces, ver dashboard, proyectar resultados, generar PDF/reportes
-- NO puede editar miembros
-- ============================================

INSERT INTO users (email, password, name, role, client_id, active, created_at)
SELECT
  'monica.quesada@asocolci.com.co',
  '$2a$10$IwPW6XMH8wzP3S9QsNOleu2x2WKd0bEUuaYckhDITBa/tBWrphym6',
  'Mónica Lorena Quesada',
  'authorized',
  @client_id,
  1,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'monica.quesada@asocolci.com.co');

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 
  id,
  email,
  name,
  role,
  client_id,
  active,
  created_at
FROM users 
WHERE client_id = @client_id
ORDER BY role, name;

-- ============================================
-- RESUMEN DE ROLES Y PERMISOS
-- ============================================
-- ADMIN (Nohora):
--   ✓ CRUD completo de miembros
--   ✓ Crear reuniones ANTES del evento
--   ✓ Preparar votaciones
--   ✓ Ver configuración completa
--
-- AUTHORIZED (Mónica):
--   ✓ Generar enlaces asistencia/votación
--   ✓ Ver dashboard quórum en tiempo real
--   ✓ Proyectar resultados
--   ✓ Generar PDF/reportes
--   ✓ Instalar sesión durante reunión
--   ✓ Activar votaciones durante reunión
--   ✗ NO puede editar miembros
--   ✗ NO puede crear/editar/eliminar reuniones
-- ============================================
-- NOTA: Cambiar contraseñas después del primer login
-- ============================================






