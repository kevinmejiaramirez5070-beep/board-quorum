-- ============================================
-- SQL SEGURO - Actualización de Members y Meetings
-- BOARD QUORUM - ASOCOLCI
-- ============================================
-- Este SQL verifica si las columnas existen antes de crearlas
-- ============================================

SET @dbname = DATABASE();

-- 1. Agregar tipo_documento (solo si no existe)
SET @tablename = 'members';
SET @columnname = 'tipo_documento';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Columna tipo_documento ya existe en members" as mensaje;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(20) NULL COMMENT ''Tipo de documento: C.C., NIT, etc.'';')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Agregar numero_documento (solo si no existe)
SET @columnname = 'numero_documento';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Columna numero_documento ya existe en members" as mensaje;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NULL COMMENT ''Número de documento de identificación'';')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. Agregar rol_organico (solo si no existe)
SET @columnname = 'rol_organico';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Columna rol_organico ya existe en members" as mensaje;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) NULL COMMENT ''Rol orgánico: PRESIDENCIA, VICE PRESIDENCIA, SECRETARIA, TESORERIA, FISCALIA, VOCALES, JUNTA DE VIGILANCIA, CONTABILIDAD, REVISORIA'';')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 4. Agregar tipo_participante (solo si no existe)
SET @columnname = 'tipo_participante';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Columna tipo_participante ya existe en members" as mensaje;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NULL COMMENT ''Tipo participante: PRINCIPAL, SUPLENTE, JUNTA_DE_VIGILANCIA, NO_APLICA'';')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 5. Agregar rol_en_votacion (solo si no existe)
SET @columnname = 'rol_en_votacion';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Columna rol_en_votacion ya existe en members" as mensaje;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NULL COMMENT ''Rol en votación: PRINCIPAL, SUPLENTE_ACTUANDO, VIGILANCIA, NO_APLICA'';')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 6. Agregar cuenta_quorum (solo si no existe)
SET @columnname = 'cuenta_quorum';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Columna cuenta_quorum ya existe en members" as mensaje;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT 1 COMMENT ''Indica si el miembro cuenta para el quórum: 1=VERDADERO, 0=FALSO'';')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 7. Agregar puede_votar (solo si no existe)
SET @columnname = 'puede_votar';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Columna puede_votar ya existe en members" as mensaje;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT 1 COMMENT ''Indica si el miembro puede votar: 1=VERDADERO, 0=FALSO'';')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 8. Agregar google_meet_link a meetings (solo si no existe)
SET @tablename = 'meetings';
SET @columnname = 'google_meet_link';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Columna google_meet_link ya existe en meetings" as mensaje;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(500) NULL COMMENT ''Enlace de Google Meet para la reunión'';')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 9. Actualizar valores existentes - PRINCIPAL (solo si la columna existe)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = 'members')
      AND (COLUMN_NAME = 'tipo_participante')
  ) > 0,
  'UPDATE members SET tipo_participante = ''PRINCIPAL'' WHERE member_type = ''principal'' AND (tipo_participante IS NULL OR tipo_participante = '''');',
  'SELECT "Columna tipo_participante no existe, omitiendo actualización" as mensaje;'
));
PREPARE updateIfExists FROM @preparedStatement;
EXECUTE updateIfExists;
DEALLOCATE PREPARE updateIfExists;

-- 10. Actualizar valores existentes - SUPLENTE (solo si la columna existe)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = 'members')
      AND (COLUMN_NAME = 'tipo_participante')
  ) > 0,
  'UPDATE members SET tipo_participante = ''SUPLENTE'' WHERE member_type = ''suplente'' AND (tipo_participante IS NULL OR tipo_participante = '''');',
  'SELECT "Columna tipo_participante no existe, omitiendo actualización" as mensaje;'
));
PREPARE updateIfExists FROM @preparedStatement;
EXECUTE updateIfExists;
DEALLOCATE PREPARE updateIfExists;

-- 11. Actualizar valores existentes - JUNTA_DE_VIGILANCIA (solo si la columna existe)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = 'members')
      AND (COLUMN_NAME = 'tipo_participante')
  ) > 0,
  'UPDATE members SET tipo_participante = ''JUNTA_DE_VIGILANCIA'' WHERE member_type = ''junta_vigilancia'' AND (tipo_participante IS NULL OR tipo_participante = '''');',
  'SELECT "Columna tipo_participante no existe, omitiendo actualización" as mensaje;'
));
PREPARE updateIfExists FROM @preparedStatement;
EXECUTE updateIfExists;
DEALLOCATE PREPARE updateIfExists;

-- 12. Actualizar cuenta_quorum y puede_votar (solo si las columnas existen)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = 'members')
      AND (COLUMN_NAME IN ('cuenta_quorum', 'puede_votar', 'tipo_participante'))
    HAVING COUNT(*) = 3
  ) = 3,
  'UPDATE members SET cuenta_quorum = 1, puede_votar = 1 WHERE (cuenta_quorum IS NULL OR puede_votar IS NULL) AND tipo_participante IN (''PRINCIPAL'', ''JUNTA_DE_VIGILANCIA'');',
  'SELECT "Columnas necesarias no existen, omitiendo actualización" as mensaje;'
));
PREPARE updateIfExists FROM @preparedStatement;
EXECUTE updateIfExists;
DEALLOCATE PREPARE updateIfExists;

-- ============================================
-- FIN - Todas las verificaciones completadas
-- ============================================
SELECT "Actualización completada. Revisa los mensajes anteriores para ver qué se agregó." as resultado;


