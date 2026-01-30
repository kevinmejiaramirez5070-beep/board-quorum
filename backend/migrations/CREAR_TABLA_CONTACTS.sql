-- ============================================
-- CREAR TABLA CONTACTS
-- ============================================
-- Esta tabla almacena los contactos del formulario de contacto
-- ============================================

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  phone VARCHAR(50),
  message TEXT,
  privacy_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
