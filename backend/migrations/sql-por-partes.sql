-- ============================================
-- MIGRACIÓN POR PARTES - Ejecuta solo lo que falta
-- BOARD QUORUM - ASOCOLCI
-- ============================================
-- Si una columna ya existe, simplemente omite ese comando
-- ============================================

-- ============================================
-- VERIFICAR QUÉ COLUMNAS FALTAN (ejecuta esto primero)
-- ============================================
-- Copia y pega esto para ver qué columnas ya tienes:

SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'juntas' 
  AND TABLE_NAME = 'members' 
  AND COLUMN_NAME IN ('member_type', 'principal_id', 'user_id');

SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'juntas' 
  AND TABLE_NAME = 'attendance' 
  AND COLUMN_NAME = 'acting_as_principal';

SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'juntas' 
  AND TABLE_NAME = 'meetings' 
  AND COLUMN_NAME IN ('session_installed', 'session_installed_at');

-- ============================================
-- EJECUTA SOLO LOS COMANDOS QUE FALTAN
-- ============================================

-- Si member_type NO aparece en el resultado anterior, ejecuta esto:
-- ALTER TABLE members ADD COLUMN member_type VARCHAR(50) DEFAULT 'principal' COMMENT 'Tipo: principal, suplente, junta_vigilancia';

-- Si principal_id NO aparece, ejecuta esto:
-- ALTER TABLE members ADD COLUMN principal_id INT NULL COMMENT 'ID del miembro principal si este es suplente';

-- Si user_id NO aparece, ejecuta esto:
-- ALTER TABLE members ADD COLUMN user_id INT NULL COMMENT 'ID del usuario del sistema asociado a este miembro';

-- Si acting_as_principal NO aparece, ejecuta esto:
-- ALTER TABLE attendance ADD COLUMN acting_as_principal TINYINT(1) DEFAULT 0 COMMENT 'Indica si un suplente está actuando como principal';

-- Si session_installed NO aparece, ejecuta esto:
-- ALTER TABLE meetings ADD COLUMN session_installed TINYINT(1) DEFAULT 0 COMMENT 'Indica si la sesión ha sido formalmente instalada';

-- Si session_installed_at NO aparece, ejecuta esto:
-- ALTER TABLE meetings ADD COLUMN session_installed_at DATETIME NULL COMMENT 'Fecha y hora en que se instaló formalmente la sesión';

-- ============================================
-- CREAR ÍNDICES (ejecuta estos si no existen)
-- ============================================
-- Si da error de índice duplicado, simplemente omítelo

CREATE INDEX idx_members_type ON members(member_type);
CREATE INDEX idx_members_principal ON members(principal_id);
CREATE INDEX idx_members_user ON members(user_id);

-- ============================================
-- ACTUALIZAR DATOS EXISTENTES
-- ============================================
UPDATE members SET member_type = 'principal' WHERE member_type IS NULL OR member_type = '';






