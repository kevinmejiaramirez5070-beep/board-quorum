-- ============================================
-- MOVER USUARIOS Y ELIMINAR ASOCOLCI DUPLICADO
-- ============================================
-- Cliente CORRECTO: ID 1 (asocolci)
-- Cliente DUPLICADO: ID 7 (asocolcij) - ELIMINAR
-- ============================================

-- 1. Ver usuarios en cada cliente antes de mover
SELECT '=== USUARIOS EN CLIENTE ID 1 (CORRECTO) ===' AS info;
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.client_id
FROM users u
WHERE u.client_id = 1;

SELECT '=== USUARIOS EN CLIENTE ID 7 (DUPLICADO) ===' AS info;
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.client_id
FROM users u
WHERE u.client_id = 7;

-- 2. Ver miembros en cada cliente
SELECT '=== MIEMBROS EN CLIENTE ID 1 ===' AS info;
SELECT COUNT(*) AS total_miembros FROM members WHERE client_id = 1;

SELECT '=== MIEMBROS EN CLIENTE ID 7 ===' AS info;
SELECT COUNT(*) AS total_miembros FROM members WHERE client_id = 7;

-- 3. MOVER todos los usuarios del cliente 7 al cliente 1
UPDATE users 
SET 
  client_id = 1,
  updated_at = NOW()
WHERE client_id = 7;

-- 4. MOVER todos los miembros del cliente 7 al cliente 1
UPDATE members 
SET 
  client_id = 1,
  updated_at = NOW()
WHERE client_id = 7;

-- 5. Asegurar que Nohora y Mónica estén en el cliente correcto (ID 1)
UPDATE users 
SET 
  client_id = 1,
  updated_at = NOW()
WHERE email IN ('nohora.paez@asocolci.com.co', 'monica.quesada@asocolci.com.co')
  AND client_id != 1;

-- 6. Asegurar que Nohora tenga el rol correcto (admin)
UPDATE users 
SET 
  name = 'Nohora Idali Páez Menjura',
  role = 'admin',
  client_id = 1,
  password = '$2a$10$tO/Zsy12ipRPbT6OjtgSv.XFuxTJmaCO.NjftJ.zyYAQokb2c8jZi',
  updated_at = NOW()
WHERE email = 'nohora.paez@asocolci.com.co';

-- 7. Asegurar que Mónica tenga el rol correcto (authorized)
UPDATE users 
SET 
  name = 'Mónica Lorena Quesada',
  role = 'authorized',
  client_id = 1,
  password = '$2a$10$IwPW6XMH8wzP3S9QsNOleu2x2WKd0bEUuaYckhDITBa/tBWrphym6',
  updated_at = NOW()
WHERE email = 'monica.quesada@asocolci.com.co';

-- 8. Verificar usuarios movidos
SELECT '=== USUARIOS EN CLIENTE ID 1 (DESPUÉS DE MOVER) ===' AS info;
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.client_id,
  c.name AS client_name
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.client_id = 1
ORDER BY u.role, u.name;

-- 9. Verificar que no queden usuarios en el cliente 7
SELECT '=== VERIFICAR QUE NO QUEDEN USUARIOS EN CLIENTE 7 ===' AS info;
SELECT COUNT(*) AS usuarios_restantes FROM users WHERE client_id = 7;
SELECT COUNT(*) AS miembros_restantes FROM members WHERE client_id = 7;

-- 10. ELIMINAR el cliente duplicado (ID 7)
-- Primero desactivarlo
UPDATE clients 
SET 
  active = 0,
  updated_at = NOW()
WHERE id = 7;

-- Luego eliminarlo físicamente (si no hay referencias)
DELETE FROM clients 
WHERE id = 7 
  AND NOT EXISTS (SELECT 1 FROM users WHERE client_id = 7)
  AND NOT EXISTS (SELECT 1 FROM members WHERE client_id = 7);

-- 11. VERIFICACIÓN FINAL
SELECT '=== VERIFICACIÓN FINAL ===' AS info;

SELECT 'Cliente ASOCOLCI correcto:' AS tipo, id, name, subdomain, primary_color, secondary_color, active
FROM clients 
WHERE id = 1

UNION ALL

SELECT 'Total usuarios en ASOCOLCI:' AS tipo, COUNT(*) AS id, NULL AS name, NULL AS subdomain, NULL AS primary_color, NULL AS secondary_color, NULL AS active
FROM users 
WHERE client_id = 1

UNION ALL

SELECT 'Total miembros en ASOCOLCI:' AS tipo, COUNT(*) AS id, NULL AS name, NULL AS subdomain, NULL AS primary_color, NULL AS secondary_color, NULL AS active
FROM members 
WHERE client_id = 1

UNION ALL

SELECT 'Cliente duplicado eliminado:' AS tipo, 
  CASE WHEN EXISTS (SELECT 1 FROM clients WHERE id = 7) THEN 7 ELSE 0 END AS id,
  CASE WHEN EXISTS (SELECT 1 FROM clients WHERE id = 7) THEN 'AÚN EXISTE' ELSE 'ELIMINADO' END AS name,
  NULL AS subdomain,
  NULL AS primary_color,
  NULL AS secondary_color,
  NULL AS active;

-- ============================================
-- RESULTADO ESPERADO:
-- - Cliente ID 1: ASOCOLCI (activo)
-- - Todos los usuarios y miembros en cliente ID 1
-- - Cliente ID 7: Eliminado o desactivado
-- - Nohora: admin en cliente ID 1
-- - Mónica: authorized en cliente ID 1
-- ============================================






