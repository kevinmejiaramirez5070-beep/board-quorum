/*
  RESTAURAR ASOCOLCI COMPLETO - Supabase (PostgreSQL)
  Copiar y pegar en SQL Editor. Crea: cliente, admin master, usuarios ASOCOLCI, productos y miembros.
  Contraseña por defecto para todos: Asocolci2026!  (admin master: AdminMaster2026!)
*/

-- ========== 1. CLIENTES (organizaciones) ==========
INSERT INTO clients (id, name, subdomain, logo, primary_color, secondary_color, language, active, created_at, updated_at)
VALUES 
  (1, 'BOARD QUORUM', 'boardquorum', NULL, '#0072FF', '#00C6FF', 'es', true, NOW(), NOW()),
  (2, 'ASOCOLCI', 'asocolci', NULL, '#0072FF', '#00C6FF', 'es', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subdomain = EXCLUDED.subdomain,
  active = EXCLUDED.active,
  updated_at = NOW();

SELECT setval(pg_get_serial_sequence('clients', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM clients), 1), 2));

-- ========== 2. USUARIOS ==========
-- Admin Master (acceso a todas las organizaciones)
INSERT INTO users (email, password, name, role, client_id, active, created_at, updated_at)
VALUES (
  'admin@boardquorum.com',
  '$2a$10$UGzL.r0UoYk.7bZ8GSFfrOB9YVLQHFSNXSkjihEzVl68PNSKAwTRW',
  'Javier Castilla Robles',
  'admin_master',
  1,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  client_id = EXCLUDED.client_id,
  active = true,
  updated_at = NOW();

-- Admin ASOCOLCI: Nohora Idali Páez Menjura
INSERT INTO users (email, password, name, role, client_id, active, created_at, updated_at)
VALUES (
  'nohora.paez@asocolci.com.co',
  '$2a$10$tO/Zsy12ipRPbT6OjtgSv.XFuxTJmaCO.NjftJ.zyYAQokb2c8jZi',
  'Nohora Idali Páez Menjura',
  'admin',
  2,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  client_id = 2,
  active = true,
  updated_at = NOW();

-- Autorizado ASOCOLCI: Mónica Lorena Quesada
INSERT INTO users (email, password, name, role, client_id, active, created_at, updated_at)
VALUES (
  'monica.quesada@asocolci.com.co',
  '$2a$10$IwPW6XMH8wzP3S9QsNOleu2x2WKd0bEUuaYckhDITBa/tBWrphym6',
  'Mónica Lorena Quesada',
  'authorized',
  2,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  client_id = 2,
  active = true,
  updated_at = NOW();

-- ========== 3. PRODUCTOS (órganos) para ASOCOLCI ==========
INSERT INTO products (client_id, name, description, quorum_rule, quorum_value, voting_rule, allow_substitutions, active, created_at, updated_at)
VALUES 
  (2, 'Junta Directiva', 'Junta Directiva de la organización', 'fixed', '7/20', 'dynamic', true, true, NOW(), NOW()),
  (2, 'Asamblea General', 'Asamblea General de la organización', 'simple', NULL, 'simple_majority', true, true, NOW(), NOW())
ON CONFLICT (client_id, name) DO NOTHING;

-- ========== 4. MIEMBROS (20 elegibles Junta Directiva) ==========
INSERT INTO members (client_id, product_id, tipo_documento, numero_documento, name, rol_organico, position, role, member_type, tipo_participante, rol_en_votacion, cuenta_quorum, puede_votar, active, created_at, updated_at)
SELECT 
  (SELECT id FROM clients WHERE subdomain = 'asocolci' LIMIT 1),
  (SELECT id FROM products WHERE client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci') AND name = 'Junta Directiva' LIMIT 1),
  'C.C.', doc, nom, rol, pos, 'member', mtype, tpart, rvot, cq, pv, true, NOW(), NOW()
FROM (VALUES
  ('52283801', 'PRESIDENTE JD', 'PRESIDENCIA', 'PRESIDENTE', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283802', 'VICEPRESIDENTE JD', 'VICE PRESIDENCIA', 'VICEPRESIDENTE', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283803', 'SECRETARIO JD', 'SECRETARIA', 'SECRETARIO', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283804', 'SUPLENTE SECRETARIA', 'SECRETARIA', 'SUPLENTE SECRETARIA', 'suplente', 'SUPLENTE', 'SUPLENTE_ACTUANDO', true, true),
  ('52558596', 'YAMILE BUSTOS SIERRA', 'TESORERIA', 'Tesorero Suplente', 'suplente', 'SUPLENTE', 'SUPLENTE_ACTUANDO', true, true),
  ('52283806', 'EILEN MILENA PIEDRAHITA', 'TESORERIA', 'Tesorero', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283807', 'VOCAL 1', 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283808', 'VOCAL 2', 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283809', 'VOCAL 3', 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283810', 'VOCAL 4', 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283811', 'VOCAL 5', 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283812', 'VOCAL 6', 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283813', 'VOCAL 7', 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283814', 'VOCAL 8', 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283815', 'VOCAL 9', 'VOCALES NRO.1', 'VOCAL PRINCIPAL', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283816', 'ARBEY CARDENAS', 'JUNTA DE VIGILANCIA', 'JUNTA DE VIGILANCIA', 'junta_vigilancia', 'JUNTA_DE_VIGILANCIA', 'VIGILANCIA', true, true),
  ('52283817', 'ELVIS GIOVANNI TUTA MENDIETA', 'JUNTA DE VIGILANCIA', 'JUNTA DE VIGILANCIA', 'junta_vigilancia', 'JUNTA_DE_VIGILANCIA', 'VIGILANCIA', true, true),
  ('52283818', 'NINY DAYANA LOPEZ', 'JUNTA DE VIGILANCIA', 'JUNTA DE VIGILANCIA', 'junta_vigilancia', 'JUNTA_DE_VIGILANCIA', 'VIGILANCIA', true, true),
  ('73150888', 'JAVIER CASTILLA ROBLES', 'REVISORIA', 'REVISOR FISCAL', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true),
  ('52283820', 'CONTADORA JD', 'CONTABILIDAD', 'CONTADORA', 'principal', 'PRINCIPAL', 'PRINCIPAL', true, true)
) AS t(doc, nom, rol, pos, mtype, tpart, rvot, cq, pv)
WHERE NOT EXISTS (SELECT 1 FROM members m WHERE m.client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci') AND m.numero_documento = t.doc);

-- ========== VERIFICACIÓN ==========
SELECT 'CLIENTES' AS tabla, COUNT(*) AS total FROM clients
UNION ALL
SELECT 'USUARIOS', COUNT(*) FROM users
UNION ALL
SELECT 'PRODUCTOS', COUNT(*) FROM products
UNION ALL
SELECT 'MIEMBROS', COUNT(*) FROM members;

/*
  CREDENCIALES:
  - Admin Master: admin@boardquorum.com / AdminMaster2026!
  - Admin ASOCOLCI: nohora.paez@asocolci.com.co / Asocolci2026!
  - Autorizado ASOCOLCI: monica.quesada@asocolci.com.co / Asocolci2026!

  Después del primer login, cambiar contraseñas.
  Los miembros con nombre "VOCAL 1", "PRESIDENTE JD", etc. se pueden editar en Miembros
  para poner nombres y documentos reales.
*/
