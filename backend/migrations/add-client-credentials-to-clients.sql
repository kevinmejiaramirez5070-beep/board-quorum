-- ============================================
-- AGREGAR CAMPOS DE CREDENCIALES PAYPAL A CLIENTS
-- ============================================
-- Este script agrega los campos paypal_client_id y paypal_secret
-- para almacenar credenciales de PayPal por organización
-- ============================================

-- Agregar campos de PayPal a la tabla clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS paypal_client_id VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS paypal_secret VARCHAR(500) NULL;

-- Si la sintaxis IF NOT EXISTS no funciona, usar esta alternativa:
-- ALTER TABLE clients ADD COLUMN paypal_client_id VARCHAR(500) NULL;
-- ALTER TABLE clients ADD COLUMN paypal_secret VARCHAR(500) NULL;

-- Actualizar la organización premioclick con las credenciales de PayPal
UPDATE clients 
SET 
  paypal_client_id = 'ATJJeol8A8C6AHCJvr-vnCgtrfwG054CQiX0Ai_K9xqKKdEauL29xAzEpGGWVaVQL6MDH6qOnYHNeOLT',
  paypal_secret = 'EGi10pUVAUHoamn3quBQTXqNdX3MGmoMZnm1Z8BE_SMZmYqHHBR47yMhBbvjNAhx0Gk1QFQDv5E5xF1x',
  updated_at = NOW()
WHERE name = 'premioclick' OR subdomain = 'premioclick';

-- Verificar la actualización
SELECT 
  id,
  name,
  subdomain,
  paypal_client_id,
  paypal_secret,
  updated_at
FROM clients 
WHERE name = 'premioclick' OR subdomain = 'premioclick';
