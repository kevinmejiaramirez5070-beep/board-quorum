-- ============================================
-- CORREGIR ASOCOLCI - VINCULAR USUARIOS Y MIEMBROS
-- ============================================
-- Este script encuentra el cliente ASOCOLCI correcto
-- y vincula todos los usuarios y miembros a ese cliente
-- ============================================

-- 1. Encontrar el cliente ASOCOLCI correcto
-- (El que tiene más usuarios/miembros o el más reciente)
SET @asocolci_id = (
  SELECT c.id 
  FROM clients c
  WHERE (c.subdomain = 'asocolci' OR c.name LIKE '%ASOCOLCI%')
    AND c.active = 1
  ORDER BY c.created_at DESC
  LIMIT 1
);

-- Si no hay ninguno activo, buscar cualquier ASOCOLCI
SET @asocolci_id = COALESCE(
  @asocolci_id,
  (SELECT id FROM clients WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%' LIMIT 1)
);

-- Mostrar el ID encontrado
SELECT CONCAT('ID de ASOCOLCI encontrado: ', @asocolci_id) AS info;

-- 2. Ver información del cliente ASOCOLCI
SELECT '=== CLIENTE ASOCOLCI ENCONTRADO ===' AS info;
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
WHERE id = @asocolci_id;

-- 3. Actualizar TODOS los usuarios de ASOCOLCI para que apunten al cliente correcto
UPDATE users 
SET 
  client_id = @asocolci_id,
  updated_at = NOW()
WHERE email LIKE '%asocolci%'
   OR email = 'nohora.paez@asocolci.com.co'
   OR email = 'monica.quesada@asocolci.com.co'
   OR (client_id IS NOT NULL AND client_id IN (
     SELECT id FROM clients 
     WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%'
   ));

-- 4. Actualizar TODOS los miembros de ASOCOLCI para que apunten al cliente correcto
UPDATE members 
SET 
  client_id = @asocolci_id,
  updated_at = NOW()
WHERE client_id IN (
  SELECT id FROM clients 
  WHERE subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%'
)
AND client_id != @asocolci_id;

-- 5. Verificar usuarios actualizados
SELECT '=== USUARIOS ACTUALIZADOS ===' AS info;
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.client_id,
  c.name AS client_name,
  c.primary_color,
  c.secondary_color
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.client_id = @asocolci_id
ORDER BY u.role, u.name;

-- 6. Contar miembros actualizados
SELECT '=== MIEMBROS ACTUALIZADOS ===' AS info;
SELECT 
  COUNT(*) AS total_miembros,
  c.name AS client_name
FROM members m
LEFT JOIN clients c ON m.client_id = c.id
WHERE m.client_id = @asocolci_id;

-- 7. Si hay otros clientes ASOCOLCI duplicados, desactivarlos (NO ELIMINAR)
UPDATE clients 
SET 
  active = 0,
  updated_at = NOW()
WHERE (subdomain = 'asocolci' OR name LIKE '%ASOCOLCI%')
  AND id != @asocolci_id
  AND active = 1;

-- 8. VERIFICACIÓN FINAL
SELECT '=== VERIFICACIÓN FINAL ===' AS info;
SELECT 
  'Cliente ASOCOLCI:' AS tipo,
  id,
  name,
  subdomain,
  primary_color,
  secondary_color,
  active
FROM clients 
WHERE id = @asocolci_id
UNION ALL
SELECT 
  'Total usuarios:' AS tipo,
  COUNT(*) AS id,
  NULL AS name,
  NULL AS subdomain,
  NULL AS primary_color,
  NULL AS secondary_color,
  NULL AS active
FROM users 
WHERE client_id = @asocolci_id
UNION ALL
SELECT 
  'Total miembros:' AS tipo,
  COUNT(*) AS id,
  NULL AS name,
  NULL AS subdomain,
  NULL AS primary_color,
  NULL AS secondary_color,
  NULL AS active
FROM members 
WHERE client_id = @asocolci_id;






