-- ============================================
-- PASO 1: VERIFICAR QUÉ EXISTE
-- ============================================
-- Ejecuta esto primero para ver qué columnas ya tienes
-- ============================================

SELECT 
    'attendance' as tabla,
    'acting_as_principal' as columna,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ YA EXISTE'
        ELSE '✗ FALTA - Ejecuta el ALTER TABLE de abajo'
    END as estado
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'juntas' 
  AND TABLE_NAME = 'attendance' 
  AND COLUMN_NAME = 'acting_as_principal'

UNION ALL

SELECT 
    'meetings' as tabla,
    'session_installed' as columna,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ YA EXISTE'
        ELSE '✗ FALTA - Ejecuta el ALTER TABLE de abajo'
    END as estado
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'juntas' 
  AND TABLE_NAME = 'meetings' 
  AND COLUMN_NAME = 'session_installed'

UNION ALL

SELECT 
    'meetings' as tabla,
    'session_installed_at' as columna,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ YA EXISTE'
        ELSE '✗ FALTA - Ejecuta el ALTER TABLE de abajo'
    END as estado
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'juntas' 
  AND TABLE_NAME = 'meetings' 
  AND COLUMN_NAME = 'session_installed_at'

UNION ALL

SELECT 
    'members' as tabla,
    'user_id' as columna,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ YA EXISTE'
        ELSE '✗ FALTA - Ejecuta el ALTER TABLE de abajo'
    END as estado
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'juntas' 
  AND TABLE_NAME = 'members' 
  AND COLUMN_NAME = 'user_id'

UNION ALL

SELECT 
    'members' as tabla,
    'idx_members_user' as columna,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ YA EXISTE'
        ELSE '✗ FALTA - Ejecuta el CREATE INDEX de abajo'
    END as estado
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'juntas' 
  AND TABLE_NAME = 'members' 
  AND INDEX_NAME = 'idx_members_user';

-- ============================================
-- PASO 2: EJECUTA SOLO LO QUE FALTA
-- ============================================
-- Basándote en el resultado anterior, ejecuta solo los comandos
-- que muestran "✗ FALTA"
-- ============================================

-- Si acting_as_principal muestra "✗ FALTA", ejecuta esto:
-- ALTER TABLE attendance 
-- ADD COLUMN acting_as_principal TINYINT(1) DEFAULT 0 
-- COMMENT 'Indica si un suplente está actuando como principal';

-- Si session_installed muestra "✗ FALTA", ejecuta esto:
-- ALTER TABLE meetings 
-- ADD COLUMN session_installed TINYINT(1) DEFAULT 0 
-- COMMENT 'Indica si la sesión ha sido formalmente instalada';

-- Si session_installed_at muestra "✗ FALTA", ejecuta esto:
-- ALTER TABLE meetings 
-- ADD COLUMN session_installed_at DATETIME NULL 
-- COMMENT 'Fecha y hora en que se instaló formalmente la sesión';

-- Si user_id muestra "✗ FALTA", ejecuta esto:
-- ALTER TABLE members 
-- ADD COLUMN user_id INT NULL 
-- COMMENT 'ID del usuario del sistema asociado a este miembro';

-- Si idx_members_user muestra "✗ FALTA", ejecuta esto:
-- CREATE INDEX idx_members_user ON members(user_id);

-- Actualizar miembros existentes (ejecuta esto siempre):
-- UPDATE members SET member_type = 'principal' WHERE member_type IS NULL OR member_type = '';






