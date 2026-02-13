-- ============================================
-- AGREGAR CAMPOS PARA SISTEMA SEGURO DE ASISTENCIA
-- BOARD QUORUM - Sistema de verificación por cédula
-- ============================================
-- Este script agrega campos para registro manual pendiente de aprobación
-- ============================================

-- Para PostgreSQL (Supabase)
DO $$ 
BEGIN
  -- Permitir que member_id sea NULL (para registros manuales)
  ALTER TABLE attendance ALTER COLUMN member_id DROP NOT NULL;

  -- Agregar campo pending_approval
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'pending_approval'
  ) THEN
    ALTER TABLE attendance ADD COLUMN pending_approval BOOLEAN DEFAULT false;
  END IF;

  -- Agregar campo manual_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'manual_name'
  ) THEN
    ALTER TABLE attendance ADD COLUMN manual_name VARCHAR(255) NULL;
  END IF;

  -- Agregar campo manual_position
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'manual_position'
  ) THEN
    ALTER TABLE attendance ADD COLUMN manual_position VARCHAR(255) NULL;
  END IF;

  -- Agregar campo manual_document
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'manual_document'
  ) THEN
    ALTER TABLE attendance ADD COLUMN manual_document VARCHAR(50) NULL;
  END IF;
END $$;

-- Para MySQL (compatibilidad)
-- Ejecutar solo si estás usando MySQL
/*
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS pending_approval TINYINT(1) DEFAULT 0 
COMMENT 'Indica si el registro está pendiente de aprobación del administrador';

ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS manual_name VARCHAR(255) NULL 
COMMENT 'Nombre completo para registro manual';

ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS manual_position VARCHAR(255) NULL 
COMMENT 'Cargo para registro manual';

ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS manual_document VARCHAR(50) NULL 
COMMENT 'Número de documento para registro manual';
*/
