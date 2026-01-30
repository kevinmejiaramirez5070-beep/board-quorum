-- ============================================
-- CORREGIR COLUMNA LOGO EN TABLA CLIENTS
-- ============================================
-- Cambiar el tipo de la columna logo de VARCHAR(500) a TEXT
-- para permitir imágenes base64 más largas
-- ============================================

ALTER TABLE clients 
ALTER COLUMN logo TYPE TEXT;

-- ============================================
-- Verificar el cambio
-- ============================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'clients' AND column_name = 'logo';
-- ============================================
