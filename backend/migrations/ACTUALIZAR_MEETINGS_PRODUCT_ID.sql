-- ============================================
-- ACTUALIZAR TABLA MEETINGS PARA USAR PRODUCT_ID
-- Reemplazar type por product_id
-- ============================================

-- Agregar columna product_id (nullable inicialmente para migración)
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS product_id INTEGER NULL;

-- Crear foreign key
ALTER TABLE meetings 
ADD CONSTRAINT fk_meetings_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_meetings_product ON meetings(product_id);

-- Migrar datos existentes: crear productos por defecto basados en type
-- Esto crea productos para cada cliente que tenga reuniones con diferentes types
DO $$
DECLARE
  client_record RECORD;
  product_record RECORD;
  meeting_record RECORD;
BEGIN
  -- Para cada cliente que tenga reuniones
  FOR client_record IN SELECT DISTINCT client_id FROM meetings LOOP
    -- Crear productos por defecto basados en los types existentes
    FOR meeting_record IN 
      SELECT DISTINCT type FROM meetings WHERE client_id = client_record.client_id AND type IS NOT NULL
    LOOP
      -- Verificar si el producto ya existe
      SELECT id INTO product_record 
      FROM products 
      WHERE client_id = client_record.client_id 
        AND name = CASE 
          WHEN meeting_record.type = 'junta_directiva' THEN 'Junta Directiva'
          WHEN meeting_record.type = 'asamblea' THEN 'Asamblea General'
          WHEN meeting_record.type = 'comite' THEN 'Comité'
          WHEN meeting_record.type = 'consejo' THEN 'Consejo'
          ELSE INITCAP(meeting_record.type)
        END;
      
      -- Si no existe, crearlo
      IF product_record IS NULL THEN
        INSERT INTO products (client_id, name, description, quorum_rule, quorum_value, voting_rule, allow_substitutions)
        VALUES (
          client_record.client_id,
          CASE 
            WHEN meeting_record.type = 'junta_directiva' THEN 'Junta Directiva'
            WHEN meeting_record.type = 'asamblea' THEN 'Asamblea General'
            WHEN meeting_record.type = 'comite' THEN 'Comité'
            WHEN meeting_record.type = 'consejo' THEN 'Consejo'
            ELSE INITCAP(meeting_record.type)
          END,
          CASE 
            WHEN meeting_record.type = 'junta_directiva' THEN 'Junta Directiva de la organización'
            WHEN meeting_record.type = 'asamblea' THEN 'Asamblea General de la organización'
            ELSE NULL
          END,
          CASE 
            WHEN meeting_record.type = 'junta_directiva' THEN 'fixed'
            WHEN meeting_record.type = 'asamblea' THEN 'percentage'
            ELSE 'simple'
          END,
          CASE 
            WHEN meeting_record.type = 'junta_directiva' THEN '7/20'
            ELSE NULL
          END,
          CASE 
            WHEN meeting_record.type = 'junta_directiva' THEN 'dynamic'
            WHEN meeting_record.type = 'asamblea' THEN 'family_unit'
            ELSE 'simple_majority'
          END,
          CASE 
            WHEN meeting_record.type = 'asamblea' THEN false
            ELSE true
          END
        )
        RETURNING id INTO product_record;
      END IF;
      
      -- Actualizar reuniones con el product_id correspondiente
      UPDATE meetings 
      SET product_id = product_record.id 
      WHERE client_id = client_record.client_id 
        AND type = meeting_record.type
        AND product_id IS NULL;
    END LOOP;
  END LOOP;
END $$;

-- Hacer product_id NOT NULL después de la migración
-- ALTER TABLE meetings ALTER COLUMN product_id SET NOT NULL;

-- Mantener type por ahora para compatibilidad, pero será deprecado
-- Se puede eliminar después de verificar que todo funciona
