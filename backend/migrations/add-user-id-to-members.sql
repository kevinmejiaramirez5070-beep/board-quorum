-- Migración: Vincular miembros con usuarios del sistema
-- Fecha: 2025-12-XX
-- Descripción: Agrega campo user_id para vincular miembros con usuarios que pueden iniciar sesión

-- Agregar campo para vincular miembro con usuario
ALTER TABLE members 
ADD COLUMN user_id INT NULL 
COMMENT 'ID del usuario del sistema asociado a este miembro';

-- Agregar índice para búsquedas rápidas
CREATE INDEX idx_members_user ON members(user_id);

-- Agregar foreign key (opcional, puede causar problemas si hay datos existentes)
-- ALTER TABLE members 
-- ADD CONSTRAINT fk_member_user 
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;






