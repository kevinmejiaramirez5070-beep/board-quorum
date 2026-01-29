-- Migración: Agregar campos para soportar principal/suplente y Junta de Vigilancia
-- Fecha: 2025-12-XX
-- Descripción: Agrega campos para manejar roles de principal/suplente y Junta de Vigilancia

-- Agregar campo para tipo de miembro (principal, suplente, junta_vigilancia)
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS member_type VARCHAR(50) DEFAULT 'principal' 
COMMENT 'Tipo: principal, suplente, junta_vigilancia';

-- Agregar campo para relacionar suplente con principal
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS principal_id INT NULL 
COMMENT 'ID del miembro principal si este es suplente';

-- Agregar índice para búsquedas por tipo
CREATE INDEX IF NOT EXISTS idx_members_type ON members(member_type);
CREATE INDEX IF NOT EXISTS idx_members_principal ON members(principal_id);

-- Agregar campo para indicar si está actuando como principal (para suplentes)
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS acting_as_principal TINYINT(1) DEFAULT 0 
COMMENT 'Indica si un suplente está actuando como principal';

-- Agregar campo para estado de la sesión (instalada o no)
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS session_installed TINYINT(1) DEFAULT 0 
COMMENT 'Indica si la sesión ha sido formalmente instalada';

-- Agregar campo para fecha/hora de instalación de sesión
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS session_installed_at DATETIME NULL 
COMMENT 'Fecha y hora en que se instaló formalmente la sesión';






