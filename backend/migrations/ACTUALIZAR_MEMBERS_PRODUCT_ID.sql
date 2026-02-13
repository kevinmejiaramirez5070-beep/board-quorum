-- ============================================
-- ACTUALIZAR TABLA MEMBERS PARA USAR PRODUCT_ID
-- Los miembros ahora pertenecen a un producto específico
-- ============================================

-- Agregar columna product_id (nullable inicialmente para migración)
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS product_id INTEGER NULL;

-- Crear foreign key
ALTER TABLE members 
ADD CONSTRAINT fk_members_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_members_product ON members(product_id);

-- Migrar datos existentes: asignar miembros al primer producto de su cliente
-- Por defecto, asignar a "Junta Directiva" si existe, o al primer producto
DO $$
DECLARE
  client_record RECORD;
  default_product_id INTEGER;
BEGIN
  -- Para cada cliente que tenga miembros
  FOR client_record IN SELECT DISTINCT client_id FROM members LOOP
    -- Buscar "Junta Directiva" primero, si no existe, tomar el primer producto
    SELECT id INTO default_product_id 
    FROM products 
    WHERE client_id = client_record.client_id 
      AND name = 'Junta Directiva'
    LIMIT 1;
    
    -- Si no existe Junta Directiva, tomar el primer producto del cliente
    IF default_product_id IS NULL THEN
      SELECT id INTO default_product_id 
      FROM products 
      WHERE client_id = client_record.client_id 
      ORDER BY id ASC
      LIMIT 1;
    END IF;
    
    -- Si hay un producto, asignar todos los miembros a ese producto
    IF default_product_id IS NOT NULL THEN
      UPDATE members 
      SET product_id = default_product_id 
      WHERE client_id = client_record.client_id 
        AND product_id IS NULL;
    END IF;
  END LOOP;
END $$;

-- NOTA: Después de la migración, product_id debería ser NOT NULL
-- pero lo dejamos nullable por ahora para permitir flexibilidad
-- Se puede hacer NOT NULL después de verificar que todos los miembros tienen producto
