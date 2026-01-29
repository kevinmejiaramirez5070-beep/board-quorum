-- ============================================
-- AGREGAR CAMPO GOOGLE MEET A REUNIONES
-- ============================================

ALTER TABLE meetings 
ADD COLUMN google_meet_link VARCHAR(500) NULL 
COMMENT 'Enlace de Google Meet para la reunión' 
AFTER location;

-- ============================================
-- FIN
-- ============================================


