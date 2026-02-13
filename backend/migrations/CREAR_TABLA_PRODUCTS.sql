-- ============================================
-- CREAR TABLA PRODUCTS (PRODUCTOS/ÓRGANOS)
-- Arquitectura Multi-Producto
-- ============================================

-- Tabla de productos (órganos de gobierno)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quorum_rule VARCHAR(100) DEFAULT 'simple', -- 'simple', 'percentage', 'fixed'
  quorum_value VARCHAR(50) NULL, -- Ej: '7/20', '50%', '10'
  voting_rule VARCHAR(100) DEFAULT 'simple_majority', -- 'simple_majority', 'family_unit', 'dynamic'
  allow_substitutions BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  UNIQUE (client_id, name) -- No puede haber dos productos con el mismo nombre en un cliente
);

-- Trigger para updated_at en products
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX idx_products_client ON products(client_id);
CREATE INDEX idx_products_active ON products(active);

-- Comentarios para documentación
COMMENT ON TABLE products IS 'Productos/órganos de gobierno dentro de cada organización (ej: Junta Directiva, Asamblea General)';
COMMENT ON COLUMN products.quorum_rule IS 'Tipo de regla de quórum: simple, percentage, fixed';
COMMENT ON COLUMN products.quorum_value IS 'Valor del quórum según la regla (ej: 7/20, 50%, 10)';
COMMENT ON COLUMN products.voting_rule IS 'Regla de votación: simple_majority, family_unit, dynamic';
COMMENT ON COLUMN products.allow_substitutions IS 'Permite suplencias (Principal-Suplente)';
