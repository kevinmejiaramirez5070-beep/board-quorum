-- ============================================
-- AGREGAR CAMPOS PARA VOTOS PÚBLICOS
-- ============================================

ALTER TABLE votes 
ADD COLUMN voter_name VARCHAR(255) NULL 
COMMENT 'Nombre del votante (para votos públicos)' 
AFTER member_id;

ALTER TABLE votes 
ADD COLUMN voter_email VARCHAR(255) NULL 
COMMENT 'Email del votante (para votos públicos)' 
AFTER voter_name;

-- ============================================
-- FIN
-- ============================================

