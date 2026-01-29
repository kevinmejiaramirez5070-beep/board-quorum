-- ============================================
-- ACTUALIZACIÓN DE ESTRUCTURA DE MEMBERS
-- Según estructura requerida para ASOCOLCI
-- ============================================

-- 1. Agregar campo tipo de documento
ALTER TABLE members 
ADD COLUMN tipo_documento VARCHAR(20) NULL 
COMMENT 'Tipo de documento: C.C., NIT, etc.' 
AFTER id;

-- 2. Agregar campo número de documento
ALTER TABLE members 
ADD COLUMN numero_documento VARCHAR(50) NULL 
COMMENT 'Número de documento de identificación' 
AFTER tipo_documento;

-- 3. Agregar campo rol orgánico
ALTER TABLE members 
ADD COLUMN rol_organico VARCHAR(100) NULL 
COMMENT 'Rol orgánico: PRESIDENCIA, VICE PRESIDENCIA, SECRETARIA, etc.' 
AFTER name;

-- 4. Agregar campo cargo funcional (ya existe como 'position', pero lo mantenemos y agregamos este)
-- El campo 'position' ya existe, pero agregamos rol_organico para diferenciar

-- 5. Agregar campo tipo participante (ya existe como 'member_type', pero lo mejoramos)
-- member_type ya existe con valores: 'principal', 'suplente', 'junta_vigilancia'
-- Agregamos un campo adicional para mayor claridad
ALTER TABLE members 
ADD COLUMN tipo_participante VARCHAR(50) NULL 
COMMENT 'Tipo participante: PRINCIPAL, SUPLENTE, JUNTA_DE_VIGILANCIA, NO_APLICA' 
AFTER member_type;

-- 6. Agregar campo rol en votación
ALTER TABLE members 
ADD COLUMN rol_en_votacion VARCHAR(50) NULL 
COMMENT 'Rol en votación: PRINCIPAL, SUPLENTE_ACTUANDO, VIGILANCIA, NO_APLICA' 
AFTER tipo_participante;

-- 7. Agregar campo cuenta quorum (boolean)
ALTER TABLE members 
ADD COLUMN cuenta_quorum TINYINT(1) DEFAULT 1 
COMMENT 'Indica si el miembro cuenta para el quórum: 1=VERDADERO, 0=FALSO' 
AFTER rol_en_votacion;

-- 8. Agregar campo puede votar (boolean)
ALTER TABLE members 
ADD COLUMN puede_votar TINYINT(1) DEFAULT 1 
COMMENT 'Indica si el miembro puede votar: 1=VERDADERO, 0=FALSO' 
AFTER cuenta_quorum;

-- 9. Actualizar valores existentes
-- Si member_type es 'principal', tipo_participante = 'PRINCIPAL'
UPDATE members SET tipo_participante = 'PRINCIPAL' WHERE member_type = 'principal' AND tipo_participante IS NULL;
UPDATE members SET tipo_participante = 'SUPLENTE' WHERE member_type = 'suplente' AND tipo_participante IS NULL;
UPDATE members SET tipo_participante = 'JUNTA_DE_VIGILANCIA' WHERE member_type = 'junta_vigilancia' AND tipo_participante IS NULL;

-- 10. Establecer valores por defecto para cuenta_quorum y puede_votar
UPDATE members SET cuenta_quorum = 1 WHERE cuenta_quorum IS NULL;
UPDATE members SET puede_votar = 1 WHERE puede_votar IS NULL;

-- 11. Crear índices para búsquedas rápidas
CREATE INDEX idx_members_documento ON members(numero_documento);
CREATE INDEX idx_members_rol_organico ON members(rol_organico);
CREATE INDEX idx_members_cuenta_quorum ON members(cuenta_quorum);
CREATE INDEX idx_members_puede_votar ON members(puede_votar);

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================


