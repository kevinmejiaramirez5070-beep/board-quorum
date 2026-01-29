-- ============================================
-- MIGRACIÓN COMPLETA: Quórum + Sistema de Usuarios
-- BOARD QUORUM - ASOCOLCI
-- Fecha: 2025-12-XX
-- ============================================
-- EJECUTA ESTE SQL COMPLETO EN TU BASE DE DATOS MySQL
-- ============================================

-- ============================================
-- PARTE 1: REGLAS DE QUÓRUM
-- ============================================

-- 1. Agregar campo para tipo de miembro (principal, suplente, junta_vigilancia)
ALTER TABLE members 
ADD COLUMN member_type VARCHAR(50) DEFAULT 'principal' 
COMMENT 'Tipo: principal, suplente, junta_vigilancia';

-- 2. Agregar campo para relacionar suplente con principal
ALTER TABLE members 
ADD COLUMN principal_id INT NULL 
COMMENT 'ID del miembro principal si este es suplente';

-- 3. Agregar índices para búsquedas por tipo
CREATE INDEX idx_members_type ON members(member_type);
CREATE INDEX idx_members_principal ON members(principal_id);

-- 4. Agregar campo para indicar si está actuando como principal (para suplentes)
ALTER TABLE attendance 
ADD COLUMN acting_as_principal TINYINT(1) DEFAULT 0 
COMMENT 'Indica si un suplente está actuando como principal';

-- 5. Agregar campo para estado de la sesión (instalada o no)
ALTER TABLE meetings 
ADD COLUMN session_installed TINYINT(1) DEFAULT 0 
COMMENT 'Indica si la sesión ha sido formalmente instalada';

-- 6. Agregar campo para fecha/hora de instalación de sesión
ALTER TABLE meetings 
ADD COLUMN session_installed_at DATETIME NULL 
COMMENT 'Fecha y hora en que se instaló formalmente la sesión';

-- 7. Actualizar miembros existentes para que sean 'principal' por defecto
UPDATE members SET member_type = 'principal' WHERE member_type IS NULL OR member_type = '';

-- ============================================
-- PARTE 2: SISTEMA DE USUARIOS PARA MIEMBROS
-- ============================================

-- 8. Agregar campo para vincular miembro con usuario del sistema
ALTER TABLE members 
ADD COLUMN user_id INT NULL 
COMMENT 'ID del usuario del sistema asociado a este miembro';

-- 9. Agregar índice para búsquedas rápidas
CREATE INDEX idx_members_user ON members(user_id);

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================

-- VERIFICACIÓN (opcional):
-- SELECT 
--   'members' as tabla,
--   COUNT(*) as total,
--   SUM(CASE WHEN member_type = 'principal' THEN 1 ELSE 0 END) as principales,
--   SUM(CASE WHEN member_type = 'suplente' THEN 1 ELSE 0 END) as suplentes,
--   SUM(CASE WHEN member_type = 'junta_vigilancia' THEN 1 ELSE 0 END) as junta_vigilancia,
--   SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as con_cuenta_usuario
-- FROM members 
-- WHERE active = 1;






