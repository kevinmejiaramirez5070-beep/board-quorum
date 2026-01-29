-- ============================================
-- CREAR USUARIOS DE ASOCOLCI
-- ============================================
-- Script para crear usuarios según modelo de roles
-- Cliente Piloto: ASOCOLCI
-- Fecha: 10 enero 2026
-- ============================================

-- Obtener el ID de ASOCOLCI
SET @client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%' LIMIT 1);

-- Si ASOCOLCI no existe, crear el cliente primero
-- (Ajusta estos valores según tu configuración)
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
-- Permisos: CRUD completo de miembros, crear reuniones, preparar votaciones
-- ============================================

-- Generar hash de contraseña (por defecto: 'Asocolci2026!')
-- NOTA: Debes usar bcrypt para generar el hash real. Este es un ejemplo.
-- Para generar el hash correcto, usa: node backend/generate-password-hash.js

INSERT INTO users (email, password, name, role, client_id, active, created_at)
SELECT 
  'nohora.paez@asocolci.com.co',
  '$2a$10$YourHashedPasswordHere', -- REEMPLAZAR con hash real de bcrypt
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
-- Permisos: Generar enlaces, ver dashboard, proyectar resultados, generar PDF/reportes
-- NO puede editar miembros
-- ============================================

INSERT INTO users (email, password, name, role, client_id, active, created_at)
SELECT 
  'monica.quesada@asocolci.com.co',
  '$2a$10$YourHashedPasswordHere', -- REEMPLAZAR con hash real de bcrypt
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
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Debes generar los hashes de contraseña usando bcrypt
-- 2. Ejecuta: node backend/generate-password-hash.js "tu_contraseña"
-- 3. Reemplaza '$2a$10$YourHashedPasswordHere' con el hash generado
-- 4. Las contraseñas sugeridas son:
--    - Nohora: 'Asocolci2026!'
--    - Mónica: 'Asocolci2026!'
-- 5. Cambiar contraseñas después del primer login
-- ============================================






