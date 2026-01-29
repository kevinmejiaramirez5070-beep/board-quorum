-- ============================================
-- SQL FINAL - Solo lo que falta
-- ============================================
-- member_type y principal_id ya existen, así que los omitimos
-- ============================================

-- 3. Crear índices (si ya existen, omite el error)
CREATE INDEX idx_members_type ON members(member_type);
CREATE INDEX idx_members_principal ON members(principal_id);

-- 4. Agregar acting_as_principal a attendance
ALTER TABLE attendance 
ADD COLUMN acting_as_principal TINYINT(1) DEFAULT 0 
COMMENT 'Indica si un suplente está actuando como principal';

-- 5. Agregar session_installed a meetings
ALTER TABLE meetings 
ADD COLUMN session_installed TINYINT(1) DEFAULT 0 
COMMENT 'Indica si la sesión ha sido formalmente instalada';

-- 6. Agregar session_installed_at a meetings
ALTER TABLE meetings 
ADD COLUMN session_installed_at DATETIME NULL 
COMMENT 'Fecha y hora en que se instaló formalmente la sesión';

-- 7. Actualizar miembros existentes
UPDATE members SET member_type = 'principal' WHERE member_type IS NULL OR member_type = '';

-- 8. Agregar user_id a members (IMPORTANTE: Para cuentas de usuario)
ALTER TABLE members 
ADD COLUMN user_id INT NULL 
COMMENT 'ID del usuario del sistema asociado a este miembro';

-- 9. Crear índice para user_id
CREATE INDEX idx_members_user ON members(user_id);






