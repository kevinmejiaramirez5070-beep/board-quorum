-- ============================================================
-- MÓDULO 2 (Asamblea) — Tablas de log de importación y snapshot
-- Board Quorum / ASOCOLCI
-- ============================================================
-- Estas tablas también se crean automáticamente al arrancar el
-- servidor (server.js → ensureAssemblyM2Tables). Este archivo
-- queda como referencia y para ejecución manual si se desea.
-- ============================================================

-- ---------- PostgreSQL (Supabase / Render) ----------
CREATE TABLE IF NOT EXISTS assembly_import_log (
  id            SERIAL PRIMARY KEY,
  product_id    INT NOT NULL,
  client_id     INT NOT NULL,
  operator_id   INT,
  filename      VARCHAR(255),
  total_rows    INT,
  rows_ok       INT,
  rows_error    INT,
  rows_skipped  INT,
  errors        JSONB,
  status        VARCHAR(20),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assembly_master_snapshot (
  id               SERIAL PRIMARY KEY,
  meeting_id       INT NOT NULL,
  product_id       INT NOT NULL,
  snapshot         JSONB NOT NULL,
  total_principals INT NOT NULL,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ---------- MySQL (local) — equivalente ----------
-- CREATE TABLE IF NOT EXISTS assembly_import_log (
--   id            INT AUTO_INCREMENT PRIMARY KEY,
--   product_id    INT NOT NULL,
--   client_id     INT NOT NULL,
--   operator_id   INT,
--   filename      VARCHAR(255),
--   total_rows    INT,
--   rows_ok       INT,
--   rows_error    INT,
--   rows_skipped  INT,
--   errors        JSON,
--   status        VARCHAR(20),
--   created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE TABLE IF NOT EXISTS assembly_master_snapshot (
--   id               INT AUTO_INCREMENT PRIMARY KEY,
--   meeting_id       INT NOT NULL,
--   product_id       INT NOT NULL,
--   snapshot         JSON NOT NULL,
--   total_principals INT NOT NULL,
--   created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
