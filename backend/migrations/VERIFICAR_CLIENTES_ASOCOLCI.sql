-- ============================================
-- VERIFICAR TODOS LOS CLIENTES ASOCOLCI
-- ============================================
-- Este script verifica si hay múltiples clientes ASOCOLCI
-- y cuál es el correcto
-- ============================================

-- 1. Ver TODOS los clientes (activos e inactivos)
SELECT '=== TODOS LOS CLIENTES ===' AS info;
SELECT 
  id,
  name,
  subdomain,
  logo,
  primary_color,
  secondary_color,
  language,
  active,
  created_at
FROM clients 
ORDER BY id;

-- 2. Ver TODOS los clientes que se llaman ASOCOLCI o tienen subdomain asocolci
SELECT '=== CLIENTES ASOCOLCI (todos) ===' AS info;
SELECT 
  id,
  name,
  subdomain,
  logo,
  primary_color,
  secondary_color,
  language,
  active,
  created_at
FROM clients 
WHERE subdomain = 'asocolci' 
   OR name LIKE '%ASOCOLCI%'
   OR name LIKE '%asocolci%'
ORDER BY id;

-- 3. Ver TODOS los usuarios y sus clientes
SELECT '=== TODOS LOS USUARIOS Y SUS CLIENTES ===' AS info;
SELECT 
  u.id AS user_id,
  u.email,
  u.name AS user_name,
  u.role,
  u.client_id,
  u.active AS user_active,
  c.id AS client_id_real,
  c.name AS client_name,
  c.subdomain,
  c.primary_color,
  c.secondary_color,
  c.active AS client_active
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
ORDER BY u.client_id, u.email;

-- 4. Ver usuarios que deberían estar en ASOCOLCI
SELECT '=== USUARIOS QUE DEBERÍAN ESTAR EN ASOCOLCI ===' AS info;
SELECT 
  u.id AS user_id,
  u.email,
  u.name AS user_name,
  u.role,
  u.client_id,
  c.name AS client_name,
  c.primary_color,
  c.secondary_color
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.email LIKE '%asocolci%'
   OR u.email = 'nohora.paez@asocolci.com.co'
   OR u.email = 'monica.quesada@asocolci.com.co'
ORDER BY u.email;

-- 5. Ver miembros y sus clientes
SELECT '=== MIEMBROS Y SUS CLIENTES ===' AS info;
SELECT 
  m.id AS member_id,
  m.name AS member_name,
  m.client_id,
  c.name AS client_name,
  c.primary_color,
  c.secondary_color
FROM members m
LEFT JOIN clients c ON m.client_id = c.id
ORDER BY m.client_id, m.name
LIMIT 20;

-- 6. Contar cuántos clientes ASOCOLCI hay
SELECT '=== RESUMEN ===' AS info;
SELECT 
  COUNT(*) AS total_clientes_asocolci,
  GROUP_CONCAT(id) AS ids_clientes,
  GROUP_CONCAT(name) AS nombres_clientes
FROM clients 
WHERE subdomain = 'asocolci' 
   OR name LIKE '%ASOCOLCI%'
   OR name LIKE '%asocolci%';






