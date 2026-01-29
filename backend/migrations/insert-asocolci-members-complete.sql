-- ============================================
-- INSERTAR 26 MIEMBROS DE ASOCOLCI
-- ============================================
-- Este SQL está listo para copiar y pegar en XAMPP
-- IMPORTANTE: Reemplaza los valores entre comillas con los datos reales de tu Excel
-- ============================================

-- Obtener el ID de ASOCOLCI
SET @client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci' LIMIT 1);

-- Si ASOCOLCI no existe, descomenta la siguiente línea y ajusta el ID:
-- SET @client_id = 1;

-- Verificar el ID obtenido
SELECT @client_id AS asocolci_client_id;

-- ============================================
-- INSERTAR LOS 26 MIEMBROS
-- ============================================
-- INSTRUCCIONES PARA REEMPLAZAR:
-- 1. 'C.C.' - Cambia si es NIT, Pasaporte, etc.
-- 2. '1234567890' - Reemplaza con el número de documento real
-- 3. 'NOMBRE COMPLETO' - Reemplaza con el nombre real del miembro
-- 4. Los demás campos ya están configurados según la estructura de tu Excel
-- ============================================

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
-- Miembro 1
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_1', 'REEMPLAZA_NOMBRE_1', NULL, 'PRESIDENCIA', 'PRESIDENTE', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 2
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_2', 'REEMPLAZA_NOMBRE_2', NULL, 'VICE PRESIDENCIA', 'VICEPRESIDENTE', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 3
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_3', 'REEMPLAZA_NOMBRE_3', NULL, 'SECRETARIA', 'SECRETARIO', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 4
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_4', 'REEMPLAZA_NOMBRE_4', NULL, 'SECRETARIA', 'SUPLENTE SECRETARIA', 'member', 'SUPLENTE', 'SUPLENTE_ACTUANDO', 1, 1, 1, NOW()),

-- Miembro 5
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_5', 'REEMPLAZA_NOMBRE_5', NULL, 'TESORERIA', 'TESORERO PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 6
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_6', 'REEMPLAZA_NOMBRE_6', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 7
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_7', 'REEMPLAZA_NOMBRE_7', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 8
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_8', 'REEMPLAZA_NOMBRE_8', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 9
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_9', 'REEMPLAZA_NOMBRE_9', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 10
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_10', 'REEMPLAZA_NOMBRE_10', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 11
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_11', 'REEMPLAZA_NOMBRE_11', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 12
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_12', 'REEMPLAZA_NOMBRE_12', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 13
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_13', 'REEMPLAZA_NOMBRE_13', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 14
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_14', 'REEMPLAZA_NOMBRE_14', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 15
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_15', 'REEMPLAZA_NOMBRE_15', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 16
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_16', 'REEMPLAZA_NOMBRE_16', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 17
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_17', 'REEMPLAZA_NOMBRE_17', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 18
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_18', 'REEMPLAZA_NOMBRE_18', NULL, 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 19
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_19', 'REEMPLAZA_NOMBRE_19', NULL, 'JUNTA DE VIGILANCIA', 'JUNTA DE VIGILANCIA', 'member', 'JUNTA_DE_VIGILANCIA', 'VIGILANCIA', 1, 1, 1, NOW()),

-- Miembro 20
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_20', 'REEMPLAZA_NOMBRE_20', NULL, 'JUNTA DE VIGILANCIA', 'JUNTA DE VIGILANCIA', 'member', 'JUNTA_DE_VIGILANCIA', 'VIGILANCIA', 1, 1, 1, NOW()),

-- Miembro 21
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_21', 'REEMPLAZA_NOMBRE_21', NULL, 'JUNTA DE VIGILANCIA', 'JUNTA DE VIGILANCIA', 'member', 'JUNTA_DE_VIGILANCIA', 'VIGILANCIA', 1, 1, 1, NOW()),

-- Miembro 22
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_22', 'REEMPLAZA_NOMBRE_22', NULL, 'CONTABILIDAD', 'CONTADORA', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 23
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_23', 'REEMPLAZA_NOMBRE_23', NULL, 'REVISORIA', 'REVISOR FISCAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 24
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_24', 'REEMPLAZA_NOMBRE_24', NULL, 'REVISORIA', 'REVISOR FISCAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 1, 1, 1, NOW()),

-- Miembro 25 (últimos dos con cuenta_quorum y puede_votar en FALSO según la imagen)
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_25', 'REEMPLAZA_NOMBRE_25', NULL, 'REVISORIA', 'REVISOR FISCAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 0, 0, 1, NOW()),

-- Miembro 26
(@client_id, 'C.C.', 'REEMPLAZA_NUM_DOC_26', 'REEMPLAZA_NOMBRE_26', NULL, 'REVISORIA', 'REVISOR FISCAL', 'member', 'PRINCIPAL', 'PRINCIPAL', 0, 0, 1, NOW());

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

