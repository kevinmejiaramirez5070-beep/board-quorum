-- ============================================================================
-- ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI
-- Solicitudes de Fondo MD-01 a MD-05 (TEST ASAMBLEA NRO. 1)
-- ============================================================================
-- Estas estructuras también se crean automáticamente al arrancar el servidor
-- (server.js -> ensureAssemblyM2Tables). Este archivo queda como referencia y
-- para ejecución manual sobre Supabase / PostgreSQL.
--
-- No modifica ninguna estructura usada por Junta Directiva.
-- ============================================================================


-- ── MD-02 · Momento Siguiente ───────────────────────────────────────────────
-- Activación visible, controlada y auditable del régimen del 20 %.
--
-- Reglas grabadas aquí:
--   * elegibles                = universo de posiciones de representación (NO cambia)
--   * quorum_inicial           = FLOOR(elegibles / 2) + 1
--   * quorum_momento_siguiente = CEIL(elegibles * 0.20)
--   * hora_limite              = hora_oficial + 1 hora  (NO se cuenta desde el clic)
--
-- Se conserva quién ejecutó materialmente la acción, cuándo, y con qué cifras,
-- para que la actuación pueda reconstruirse objetivamente y salir en el PDF.

CREATE TABLE IF NOT EXISTS assembly_moment_events (
  id                       SERIAL PRIMARY KEY,
  meeting_id               INT NOT NULL,
  operator_id              INT,
  operator_name            VARCHAR(255),
  operator_role            VARCHAR(50),
  applied_at               TIMESTAMP,
  hora_oficial             TIMESTAMP,
  hora_limite              TIMESTAMP,
  elegibles                INT,
  quorum_inicial           INT,
  presentes_al_aplicar     INT,
  quorum_momento_siguiente INT,
  alcanzado                BOOLEAN DEFAULT false,
  alcanzado_at             TIMESTAMP NULL,
  presentes_al_alcanzar    INT,
  cerrado_sin_quorum       BOOLEAN DEFAULT false,
  cerrado_at               TIMESTAMP NULL,
  created_at               TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assembly_moment_meeting
  ON assembly_moment_events (meeting_id);


-- ── MD-05 §11 · Trazabilidad del registro manual de contingencia ────────────
-- El registro manual es una contingencia, no una vía para convertir en Delegado
-- a quien no lo es. Debe quedar el motivo y el usuario operativo que lo hizo.

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS manual_motivo TEXT NULL;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS registered_by INT NULL;


-- ============================================================================
-- MD-03 · Usuarios operativos de Asamblea  (EJECUTAR MANUALMENTE)
-- ============================================================================
-- Estructura esperada: máximo cuatro cuentas nominativas e individuales.
--
--   1. Administrador Maestro     admin@boardquorum.com   (YA EXISTE — reutilizar)
--   2. Administración / Op. 1    Nohora Páez             (YA EXISTE — reutilizar)
--   3. Administración / Op. 2    por definir             <-- crear
--   4. Revisoría Fiscal          por definir             <-- crear
--
-- Los tres perfiles operativos comparten los mismos permisos dentro de Asamblea,
-- por eso los tres se crean con role = 'admin' (acceso completo DENTRO del
-- cliente, sin administración global de la plataforma, que sigue siendo
-- exclusiva de admin_master).
--
-- ANTES DE EJECUTAR:
--   1) Reemplazar los correos y nombres reales.
--   2) Generar el hash bcrypt de cada contraseña con:
--        node backend/generate-password-hash.js
--      Nunca guardar contraseñas en texto plano.
--   3) Confirmar el client_id de ASOCOLCI:
--        SELECT id, name FROM clients WHERE name ILIKE '%asocolci%';
--
-- No usar cuentas compartidas: la trazabilidad individual es un requisito.

-- Verificar primero qué usuarios existen ya para este cliente:
-- SELECT id, email, name, role, active FROM users WHERE client_id = 1 ORDER BY id;

-- Usuario 3 — Administración / Operación 2
-- INSERT INTO users (email, password, name, role, client_id, active)
-- VALUES ('REEMPLAZAR@asocolci.com', 'REEMPLAZAR_HASH_BCRYPT', 'REEMPLAZAR Nombre', 'admin', 1, true)
-- ON CONFLICT (email) DO NOTHING;

-- Usuario 4 — Revisoría Fiscal
-- INSERT INTO users (email, password, name, role, client_id, active)
-- VALUES ('REEMPLAZAR@revisoria.com', 'REEMPLAZAR_HASH_BCRYPT', 'REEMPLAZAR Revisoría Fiscal', 'admin', 1, true)
-- ON CONFLICT (email) DO NOTHING;


-- ============================================================================
-- MD-01 / MD-05 · Verificación del universo de elegibles
-- ============================================================================
-- Reemplazar :product_id por el product_id de "Asamblea General".
-- Confirmarlo con:
--   SELECT id, name FROM products WHERE client_id = 1;

-- Universo de quórum = SOLO Delegados Principales habilitados.
-- Con la muestra del TEST ASAMBLEA NRO 1 debe devolver 20 (no 42).
-- SELECT COUNT(*) AS elegibles
-- FROM members
-- WHERE product_id = :product_id
--   AND member_type = 'principal'
--   AND active = true
--   AND (tipo_participante IS NULL OR UPPER(TRIM(tipo_participante)) NOT IN
--        ('ADMINISTRACION','ADMINISTRACIÓN','CONTABILIDAD',
--         'REVISORIA_FISCAL','REVISORIA FISCAL','REVISORÍA FISCAL','REVISORIA','REVISORÍA'));

-- Desglose por tipo, para ver de dónde salía el 42:
-- SELECT member_type, tipo_participante, COUNT(*) AS n
-- FROM members
-- WHERE product_id = :product_id AND active = true
-- GROUP BY member_type, tipo_participante
-- ORDER BY member_type, tipo_participante;

-- Cursos sin Principal, o con Principal duplicado (deben revisarse en el maestro):
-- SELECT rol_organico,
--        COUNT(*) FILTER (WHERE member_type = 'principal') AS principales,
--        COUNT(*) FILTER (WHERE member_type = 'suplente')  AS suplentes
-- FROM members
-- WHERE product_id = :product_id AND active = true
-- GROUP BY rol_organico
-- HAVING COUNT(*) FILTER (WHERE member_type = 'principal') <> 1
-- ORDER BY rol_organico;
