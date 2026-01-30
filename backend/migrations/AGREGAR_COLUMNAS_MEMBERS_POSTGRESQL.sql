-- ============================================
-- AGREGAR COLUMNAS FALTANTES A TABLA MEMBERS
-- Para PostgreSQL (Supabase)
-- ============================================
-- Este script agrega las columnas que faltan en la tabla members
-- para que coincida con los datos que se están importando
-- ============================================

-- 1. Agregar campo tipo de documento
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(20) NULL;

COMMENT ON COLUMN members.tipo_documento IS 'Tipo de documento: C.C., NIT, etc.';

-- 2. Agregar campo número de documento
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(50) NULL;

COMMENT ON COLUMN members.numero_documento IS 'Número de documento de identificación';

-- 3. Agregar campo rol orgánico
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS rol_organico VARCHAR(100) NULL;

COMMENT ON COLUMN members.rol_organico IS 'Rol orgánico: PRESIDENCIA, VICE PRESIDENCIA, SECRETARIA, TESORERIA, FISCALIA, VOCALES, JUNTA DE VIGILANCIA, CONTABILIDAD, REVISORIA';

-- 4. Agregar campo tipo participante
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS tipo_participante VARCHAR(50) NULL;

COMMENT ON COLUMN members.tipo_participante IS 'Tipo participante: PRINCIPAL, SUPLENTE, JUNTA_DE_VIGILANCIA, NO_APLICA';

-- 5. Agregar campo rol en votación
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS rol_en_votacion VARCHAR(50) NULL;

COMMENT ON COLUMN members.rol_en_votacion IS 'Rol en votación: PRINCIPAL, SUPLENTE_ACTUANDO, VIGILANCIA, NO_APLICA';

-- 6. Agregar campo cuenta quorum (boolean)
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS cuenta_quorum BOOLEAN DEFAULT true;

COMMENT ON COLUMN members.cuenta_quorum IS 'Indica si el miembro cuenta para el quórum: true=VERDADERO, false=FALSO';

-- 7. Agregar campo puede votar (boolean)
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS puede_votar BOOLEAN DEFAULT true;

COMMENT ON COLUMN members.puede_votar IS 'Indica si el miembro puede votar: true=VERDADERO, false=FALSO';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
