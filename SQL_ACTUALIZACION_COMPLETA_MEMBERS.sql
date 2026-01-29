-- ============================================
-- ACTUALIZACIÓN COMPLETA DE BASE DE DATOS
-- BOARD QUORUM - ASOCOLCI
-- ============================================
-- Este SQL agrega todos los campos necesarios según la estructura de datos
-- ============================================

-- PARTE 1: ACTUALIZAR TABLA MEMBERS CON CAMPOS COMPLETOS
-- ============================================

-- 1. Agregar campo tipo de documento (si no existe)
ALTER TABLE members 
ADD COLUMN tipo_documento VARCHAR(20) NULL 
COMMENT 'Tipo de documento: C.C., NIT, etc.';

-- 2. Agregar campo número de documento (si no existe)
ALTER TABLE members 
ADD COLUMN numero_documento VARCHAR(50) NULL 
COMMENT 'Número de documento de identificación';

-- 3. Agregar campo rol orgánico (si no existe)
ALTER TABLE members 
ADD COLUMN rol_organico VARCHAR(100) NULL 
COMMENT 'Rol orgánico: PRESIDENCIA, VICE PRESIDENCIA, SECRETARIA, TESORERIA, FISCALIA, VOCALES, JUNTA DE VIGILANCIA, CONTABILIDAD, REVISORIA';

-- 4. Agregar campo tipo participante (si no existe)
ALTER TABLE members 
ADD COLUMN tipo_participante VARCHAR(50) NULL 
COMMENT 'Tipo participante: PRINCIPAL, SUPLENTE, JUNTA_DE_VIGILANCIA, NO_APLICA';

-- 5. Agregar campo rol en votación (si no existe)
ALTER TABLE members 
ADD COLUMN rol_en_votacion VARCHAR(50) NULL 
COMMENT 'Rol en votación: PRINCIPAL, SUPLENTE_ACTUANDO, VIGILANCIA, NO_APLICA';

-- 6. Agregar campo cuenta quorum (si no existe)
ALTER TABLE members 
ADD COLUMN cuenta_quorum TINYINT(1) DEFAULT 1 
COMMENT 'Indica si el miembro cuenta para el quórum: 1=VERDADERO, 0=FALSO';

-- 7. Agregar campo puede votar (si no existe)
ALTER TABLE members 
ADD COLUMN puede_votar TINYINT(1) DEFAULT 1 
COMMENT 'Indica si el miembro puede votar: 1=VERDADERO, 0=FALSO';

-- PARTE 2: ACTUALIZAR TABLA MEETINGS CON GOOGLE MEET LINK
-- ============================================

-- 8. Agregar campo google_meet_link a meetings (si no existe)
ALTER TABLE meetings 
ADD COLUMN google_meet_link VARCHAR(500) NULL 
COMMENT 'Enlace de Google Meet para la reunión';

-- PARTE 3: ACTUALIZAR VALORES EXISTENTES
-- ============================================

-- 9. Actualizar tipo_participante según member_type existente
UPDATE members 
SET tipo_participante = 'PRINCIPAL' 
WHERE member_type = 'principal' AND (tipo_participante IS NULL OR tipo_participante = '');

UPDATE members 
SET tipo_participante = 'SUPLENTE' 
WHERE member_type = 'suplente' AND (tipo_participante IS NULL OR tipo_participante = '');

UPDATE members 
SET tipo_participante = 'JUNTA_DE_VIGILANCIA' 
WHERE member_type = 'junta_vigilancia' AND (tipo_participante IS NULL OR tipo_participante = '');

-- 10. Actualizar cuenta_quorum y puede_votar por defecto
UPDATE members 
SET cuenta_quorum = 1, puede_votar = 1 
WHERE (cuenta_quorum IS NULL OR puede_votar IS NULL) 
AND tipo_participante IN ('PRINCIPAL', 'JUNTA_DE_VIGILANCIA');

-- ============================================
-- FIN DE LA ACTUALIZACIÓN
-- ============================================


