-- ============================================
-- ACTUALIZACIÓN COMPLETA DE ESTRUCTURA DE MEMBERS
-- Según estructura requerida para ASOCOLCI
-- ============================================
-- Este SQL agrega todos los campos necesarios según la estructura de datos
-- ============================================

-- 1. Agregar campo tipo de documento
ALTER TABLE members 
ADD COLUMN tipo_documento VARCHAR(20) NULL 
COMMENT 'Tipo de documento: C.C., NIT, etc.';

-- 2. Agregar campo número de documento
ALTER TABLE members 
ADD COLUMN numero_documento VARCHAR(50) NULL 
COMMENT 'Número de documento de identificación';

-- 3. Agregar campo rol orgánico
ALTER TABLE members 
ADD COLUMN rol_organico VARCHAR(100) NULL 
COMMENT 'Rol orgánico: PRESIDENCIA, VICE PRESIDENCIA, SECRETARIA, TESORERIA, FISCALIA, VOCALES, JUNTA DE VIGILANCIA, CONTABILIDAD, REVISORIA';

-- 4. Agregar campo cargo funcional (ya existe como 'position', pero lo mantenemos)
-- El campo 'position' ya existe y se mantiene como cargo funcional

-- 5. Agregar campo tipo participante
ALTER TABLE members 
ADD COLUMN tipo_participante VARCHAR(50) NULL 
COMMENT 'Tipo participante: PRINCIPAL, SUPLENTE, JUNTA_DE_VIGILANCIA, NO_APLICA';

-- 6. Agregar campo rol en votación
ALTER TABLE members 
ADD COLUMN rol_en_votacion VARCHAR(50) NULL 
COMMENT 'Rol en votación: PRINCIPAL, SUPLENTE_ACTUANDO, VIGILANCIA, NO_APLICA';

-- 7. Agregar campo cuenta quorum (boolean)
ALTER TABLE members 
ADD COLUMN cuenta_quorum TINYINT(1) DEFAULT 1 
COMMENT 'Indica si el miembro cuenta para el quórum: 1=VERDADERO, 0=FALSO';

-- 8. Agregar campo puede votar (boolean)
ALTER TABLE members 
ADD COLUMN puede_votar TINYINT(1) DEFAULT 1 
COMMENT 'Indica si el miembro puede votar: 1=VERDADERO, 0=FALSO';

-- 9. Actualizar valores existentes
UPDATE members 
SET tipo_participante = 'PRINCIPAL' 
WHERE member_type = 'principal' AND tipo_participante IS NULL;

UPDATE members 
SET tipo_participante = 'SUPLENTE' 
WHERE member_type = 'suplente' AND tipo_participante IS NULL;

UPDATE members 
SET tipo_participante = 'JUNTA_DE_VIGILANCIA' 
WHERE member_type = 'junta_vigilancia' AND tipo_participante IS NULL;

-- 10. Actualizar cuenta_quorum y puede_votar según tipo
-- Por defecto, principales y junta de vigilancia cuentan para quórum y pueden votar
UPDATE members 
SET cuenta_quorum = 1, puede_votar = 1 
WHERE tipo_participante IN ('PRINCIPAL', 'JUNTA_DE_VIGILANCIA') 
AND (cuenta_quorum IS NULL OR puede_votar IS NULL);

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================


