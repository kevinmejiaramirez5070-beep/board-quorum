-- ============================================
-- SQL SEGURO - Verifica antes de agregar
-- ============================================
-- Este SQL verifica si las columnas/índices existen antes de crearlos
-- ============================================

-- Función para agregar columna solo si no existe
SET @dbname = DATABASE();

-- 1. Agregar acting_as_principal a attendance (solo si no existe)
SET @tablename = 'attendance';
SET @columnname = 'acting_as_principal';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Columna acting_as_principal ya existe en attendance" as mensaje;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT 0 COMMENT ''Indica si un suplente está actuando como principal'';')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Agregar session_installed a meetings (solo si no existe)
SET @tablename = 'meetings';
SET @columnname = 'session_installed';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Columna session_installed ya existe en meetings" as mensaje;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT 0 COMMENT ''Indica si la sesión ha sido formalmente instalada'';')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. Agregar session_installed_at a meetings (solo si no existe)
SET @columnname = 'session_installed_at';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Columna session_installed_at ya existe en meetings" as mensaje;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DATETIME NULL COMMENT ''Fecha y hora en que se instaló formalmente la sesión'';')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 4. Agregar user_id a members (solo si no existe)
SET @tablename = 'members';
SET @columnname = 'user_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Columna user_id ya existe en members" as mensaje;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT NULL COMMENT ''ID del usuario del sistema asociado a este miembro'';')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 5. Actualizar miembros existentes (solo si la columna member_type existe)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = 'members')
      AND (COLUMN_NAME = 'member_type')
  ) > 0,
  'UPDATE members SET member_type = ''principal'' WHERE member_type IS NULL OR member_type = '''';',
  'SELECT "Columna member_type no existe, omitiendo actualización" as mensaje;'
));
PREPARE updateIfExists FROM @preparedStatement;
EXECUTE updateIfExists;
DEALLOCATE PREPARE updateIfExists;

-- 6. Crear índice idx_members_user (solo si no existe)
SET @indexname = 'idx_members_user';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = 'members')
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT "Índice idx_members_user ya existe" as mensaje;',
  CONCAT('CREATE INDEX ', @indexname, ' ON members(user_id);')
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

-- ============================================
-- FIN - Todas las verificaciones completadas
-- ============================================
SELECT "Migración completada. Revisa los mensajes anteriores para ver qué se agregó." as resultado;






