-- ============================================
-- CORREGIR SECUENCIA DE CLIENTS EN POSTGRESQL
-- ============================================
-- Este script corrige la secuencia de la tabla clients
-- para que no intente insertar IDs que ya existen
-- ============================================

-- Corregir la secuencia de clients
SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));

-- Verificar que la secuencia está correcta
SELECT currval('clients_id_seq') as current_value, 
       (SELECT MAX(id) FROM clients) as max_id;
