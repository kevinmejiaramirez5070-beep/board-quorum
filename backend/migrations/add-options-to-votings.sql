-- ============================================
-- AGREGAR CAMPO DE OPCIONES A VOTACIONES
-- ============================================

ALTER TABLE votings 
ADD COLUMN options TEXT NULL 
COMMENT 'Opciones de votación en formato JSON (para tipo multiple)' 
AFTER type;

-- ============================================
-- FIN
-- ============================================

