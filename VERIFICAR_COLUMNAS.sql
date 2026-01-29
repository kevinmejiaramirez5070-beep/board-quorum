-- ============================================
-- VERIFICAR QUÉ COLUMNAS FALTAN
-- Ejecuta esto primero para ver qué ya tienes
-- ============================================

-- Verificar columnas en members
SELECT 
    'members' as tabla,
    COLUMN_NAME as columna,
    CASE 
        WHEN COLUMN_NAME IN ('member_type', 'principal_id', 'user_id') THEN '✓ Existe'
        ELSE '✗ No existe'
    END as estado
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'juntas' 
  AND TABLE_NAME = 'members' 
  AND COLUMN_NAME IN ('member_type', 'principal_id', 'user_id');

-- Verificar columnas en attendance
SELECT 
    'attendance' as tabla,
    COLUMN_NAME as columna,
    CASE 
        WHEN COLUMN_NAME = 'acting_as_principal' THEN '✓ Existe'
        ELSE '✗ No existe'
    END as estado
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'juntas' 
  AND TABLE_NAME = 'attendance' 
  AND COLUMN_NAME = 'acting_as_principal';

-- Verificar columnas en meetings
SELECT 
    'meetings' as tabla,
    COLUMN_NAME as columna,
    CASE 
        WHEN COLUMN_NAME IN ('session_installed', 'session_installed_at') THEN '✓ Existe'
        ELSE '✗ No existe'
    END as estado
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'juntas' 
  AND TABLE_NAME = 'meetings' 
  AND COLUMN_NAME IN ('session_installed', 'session_installed_at');






