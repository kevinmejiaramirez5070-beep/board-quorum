-- ============================================
-- VERIFICAR Y CREAR PRODUCTOS PARA ASOCOLCI
-- Este script verifica si existen productos y los crea si no existen
-- ============================================

-- Primero, verificar qué client_id tiene ASOCOLCI
-- (Ajusta el nombre si es diferente)
DO $$
DECLARE
  asocolci_client_id INTEGER;
  product_jd_id INTEGER;
  product_ag_id INTEGER;
BEGIN
  -- Obtener el client_id de ASOCOLCI
  SELECT id INTO asocolci_client_id 
  FROM clients 
  WHERE name = 'ASOCOLCI' OR subdomain = 'asocolci'
  LIMIT 1;
  
  -- Si no encuentra ASOCOLCI, usar el primer cliente
  IF asocolci_client_id IS NULL THEN
    SELECT id INTO asocolci_client_id 
    FROM clients 
    ORDER BY id ASC
    LIMIT 1;
  END IF;
  
  RAISE NOTICE 'Client ID encontrado: %', asocolci_client_id;
  
  -- Verificar si existe "Junta Directiva"
  SELECT id INTO product_jd_id 
  FROM products 
  WHERE client_id = asocolci_client_id 
    AND name = 'Junta Directiva'
  LIMIT 1;
  
  -- Si no existe, crearlo
  IF product_jd_id IS NULL THEN
    INSERT INTO products (
      client_id, 
      name, 
      description, 
      quorum_rule, 
      quorum_value, 
      voting_rule, 
      allow_substitutions,
      active
    )
    VALUES (
      asocolci_client_id,
      'Junta Directiva',
      'Junta Directiva de la organización',
      'fixed',
      '7/20',
      'dynamic',
      true,
      true
    )
    RETURNING id INTO product_jd_id;
    
    RAISE NOTICE 'Producto "Junta Directiva" creado con ID: %', product_jd_id;
  ELSE
    RAISE NOTICE 'Producto "Junta Directiva" ya existe con ID: %', product_jd_id;
  END IF;
  
  -- Verificar si existe "Asamblea General"
  SELECT id INTO product_ag_id 
  FROM products 
  WHERE client_id = asocolci_client_id 
    AND name = 'Asamblea General'
  LIMIT 1;
  
  -- Si no existe, crearlo
  IF product_ag_id IS NULL THEN
    INSERT INTO products (
      client_id, 
      name, 
      description, 
      quorum_rule, 
      quorum_value, 
      voting_rule, 
      allow_substitutions,
      active
    )
    VALUES (
      asocolci_client_id,
      'Asamblea General',
      'Asamblea General de la organización',
      'percentage',
      NULL,
      'family_unit',
      false,
      true
    )
    RETURNING id INTO product_ag_id;
    
    RAISE NOTICE 'Producto "Asamblea General" creado con ID: %', product_ag_id;
  ELSE
    RAISE NOTICE 'Producto "Asamblea General" ya existe con ID: %', product_ag_id;
  END IF;
  
  -- Actualizar reuniones existentes que tengan type = 'junta_directiva' pero product_id NULL
  UPDATE meetings 
  SET product_id = product_jd_id 
  WHERE client_id = asocolci_client_id 
    AND (type = 'junta_directiva' OR type = 'junta_directiva')
    AND product_id IS NULL;
  
  -- Actualizar reuniones existentes que tengan type = 'asamblea' pero product_id NULL
  UPDATE meetings 
  SET product_id = product_ag_id 
  WHERE client_id = asocolci_client_id 
    AND type = 'asamblea'
    AND product_id IS NULL;
  
  -- Actualizar miembros existentes que no tengan product_id
  -- Asignarlos a Junta Directiva por defecto
  UPDATE members 
  SET product_id = product_jd_id 
  WHERE client_id = asocolci_client_id 
    AND product_id IS NULL;
  
  RAISE NOTICE 'Migración completada para client_id: %', asocolci_client_id;
END $$;

-- Verificar resultados
SELECT 
  p.id,
  p.name,
  p.client_id,
  c.name as client_name,
  (SELECT COUNT(*) FROM meetings WHERE product_id = p.id) as total_meetings,
  (SELECT COUNT(*) FROM members WHERE product_id = p.id) as total_members
FROM products p
JOIN clients c ON p.client_id = c.id
WHERE p.active = true
ORDER BY p.client_id, p.name;
