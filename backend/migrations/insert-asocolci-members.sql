-- ============================================
-- INSERTAR MIEMBROS DE ASOCOLCI
-- ============================================
-- Este script inserta todos los miembros de ASOCOLCI
-- IMPORTANTE: Reemplaza los valores con los datos reales de tu Excel
-- ============================================

-- Primero, obtener el ID de ASOCOLCI
SET @client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci' LIMIT 1);

-- Si no existe, usar el ID 1 (ajusta según tu caso)
-- SET @client_id = 1;

-- Verificar que el client_id existe
SELECT @client_id AS asocolci_client_id;

-- ============================================
-- INSERTAR MIEMBROS
-- ============================================
-- INSTRUCCIONES:
-- 1. Reemplaza 'C.C.' con el tipo de documento correcto (C.C., NIT, etc.)
-- 2. Reemplaza los números de documento con los reales
-- 3. Reemplaza 'NOMBRE COMPLETO X' con los nombres reales
-- 4. Ajusta los roles orgánicos según tu Excel
-- 5. Ajusta los cargos funcionales según tu Excel
-- 6. Ajusta tipo_participante: 'PRINCIPAL', 'SUPLENTE', 'JUNTA_DE_VIGILANCIA', 'NO_APLICA'
-- 7. Ajusta rol_en_votacion: 'PRINCIPAL', 'SUPLENTE_ACTUANDO', 'VIGILANCIA', 'NO_APLICA'
-- 8. cuenta_quorum: 1 = VERDADERO, 0 = FALSO
-- 9. puede_votar: 1 = VERDADERO, 0 = FALSO
-- 10. role: 'admin' o 'member' (generalmente 'member' para miembros regulares)

INSERT INTO members (
  client_id,
  tipo_documento,
  numero_documento,
  name,
  email,
  rol_organico,
  position,
  role,
  tipo_participante,
  rol_en_votacion,
  cuenta_quorum,
  puede_votar,
  active,
  created_at
) VALUES
-- Reemplaza estos valores con los datos reales de tu Excel:
(@client_id, 'C.C.', 'REEMPLAZA_CON_NUMERO_DOC', 'REEMPLAZA_CON_NOMBRE', NULL, 'PRESIDENCIA', 'PRESIDENTE', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),
(@client_id, 'C.C.', 'REEMPLAZA_CON_NUMERO_DOC', 'REEMPLAZA_CON_NOMBRE', NULL, 'VICE PRESIDENCIA', 'VICEPRESIDENTE', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),
(@client_id, 'C.C.', 'REEMPLAZA_CON_NUMERO_DOC', 'REEMPLAZA_CON_NOMBRE', NULL, 'SECRETARIA', 'SECRETARIO', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),
(@client_id, 'C.C.', 'REEMPLAZA_CON_NUMERO_DOC', 'REEMPLAZA_CON_NOMBRE', NULL, 'SECRETARIA', 'SUPLENTE SECRETARIA', 'member', 'SUPLENTE', 'SUPLENTE_ACTUANDO', 1, 1, 1, NOW()),
(@client_id, 'C.C.', 'REEMPLAZA_CON_NUMERO_DOC', 'REEMPLAZA_CON_NOMBRE', NULL, 'TESORERIA', 'TESORERO PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),
(@client_id, 'C.C.', 'REEMPLAZA_CON_NUMERO_DOC', 'REEMPLAZA_CON_NOMBRE', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),
(@client_id, 'C.C.', 'REEMPLAZA_CON_NUMERO_DOC', 'REEMPLAZA_CON_NOMBRE', NULL, 'JUNTA DE VIGILANCIA', 'JUNTA DE VIGILANCIA', 'member', 'JUNTA_DE_VIGILANCIA', 'VIGILANCIA', 1, 1, 1, NOW()),
(@client_id, 'C.C.', 'REEMPLAZA_CON_NUMERO_DOC', 'REEMPLAZA_CON_NOMBRE', NULL, 'CONTABILIDAD', 'CONTADORA', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),
(@client_id, 'C.C.', 'REEMPLAZA_CON_NUMERO_DOC', 'REEMPLAZA_CON_NOMBRE', NULL, 'REVISORIA', 'REVISOR FISCAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW());

-- ============================================
-- EJEMPLO CON DATOS REALES (ajusta según tu Excel):
-- ============================================
-- INSERT INTO members (
--   client_id, tipo_documento, numero_documento, name, email, 
--   rol_organico, position, role, tipo_participante, rol_en_votacion, 
--   cuenta_quorum, puede_votar, active, created_at
-- ) VALUES
-- (@client_id, 'C.C.', '1234567890', 'Juan Pérez García', NULL, 'PRESIDENCIA', 'PRESIDENTE', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),
-- (@client_id, 'C.C.', '9876543210', 'María López Rodríguez', NULL, 'VICE PRESIDENCIA', 'VICEPRESIDENTE', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW());
-- ... (continúa con todos los miembros)

-- ============================================
-- VERIFICAR INSERCIÓN
-- ============================================
SELECT COUNT(*) AS total_miembros_insertados 
FROM members 
WHERE client_id = @client_id;

-- Ver todos los miembros insertados en formato tabla
SELECT 
  id AS ID_MIEMBRO,
  tipo_documento AS TIPO_DOCUMENTO,
  numero_documento AS NUMERO_DOCUMENTO,
  name AS NOMBRE_COMPLETO,
  rol_organico AS ROL_ORGANICO,
  position AS CARGO_FUNCIONAL,
  tipo_participante AS TIPO_PARTICIPANTE,
  rol_en_votacion AS ROL_EN_VOTACION,
  CASE WHEN cuenta_quorum = 1 THEN 'VERDADERO' ELSE 'FALSO' END AS CUENTA_QUORUM,
  CASE WHEN puede_votar = 1 THEN 'VERDADERO' ELSE 'FALSO' END AS PUEDE_VOTAR
FROM members 
WHERE client_id = @client_id
ORDER BY id;

