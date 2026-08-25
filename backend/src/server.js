const express = require('express');
const cors = require('cors');
const db = require('./config/database');
require('dotenv').config();

const app = express();

// ── Migración automática: roles que NUNCA cuentan para quórum en JD ──────────
// CONTABILIDAD y REVISORIA son asesores/observadores — 1 miembro = 1 voto solo aplica
// a los cargos electivos. Corrije datos históricos mal ingresados al arrancar el server.
async function fixNonVotingRoles() {
  try {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const falseVal = isPostgreSQL ? 'false' : '0';
    const [result] = await db.execute(
      `UPDATE members
          SET cuenta_quorum = ${falseVal}, puede_votar = ${falseVal}
        WHERE UPPER(TRIM(COALESCE(rol_organico, ''))) IN ('CONTABILIDAD', 'REVISORIA')
          AND (cuenta_quorum != ${falseVal} OR puede_votar != ${falseVal})`
    );
    const affected = isPostgreSQL ? (result?.rowCount ?? 0) : (result?.affectedRows ?? 0);
    if (affected > 0) {
      console.log(`✅ [migration] Corregidos ${affected} miembro(s) con rol CONTABILIDAD/REVISORIA → cuenta_quorum=false, puede_votar=false`);
    }
  } catch (err) {
    console.error('⚠️  [migration] fixNonVotingRoles falló (no crítico):', err.message);
  }
}

// Migración: agregar columna cargo_funcional si no existe
async function addCargoFuncionalColumn() {
  try {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    if (isPostgreSQL) {
      await db.execute(`ALTER TABLE members ADD COLUMN IF NOT EXISTS cargo_funcional VARCHAR(100) NULL`);
    } else {
      // MySQL: verificar si ya existe antes de añadir
      const [cols] = await db.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'members' AND COLUMN_NAME = 'cargo_funcional'`
      );
      if (cols.length === 0) {
        await db.execute(`ALTER TABLE members ADD COLUMN cargo_funcional VARCHAR(100) NULL`);
        console.log('✅ [migration] Columna cargo_funcional agregada a members');
      }
    }
  } catch (err) {
    console.error('⚠️  [migration] addCargoFuncionalColumn falló (no crítico):', err.message);
  }
}

// Migración: resetear secuencias de PostgreSQL si están desincronizadas
// Ocurre cuando se insertan filas via SQL directo sin usar el SERIAL/SEQUENCE
async function fixPostgresSequences() {
  try {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    if (!isPostgreSQL) return;
    const tables = ['members', 'organizations', 'meetings', 'votings', 'votes', 'attendance'];
    for (const table of tables) {
      try {
        await db.execute(
          `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1))`
        );
      } catch (e) {
        // tabla o columna no existe, ignorar
      }
    }
    console.log('✅ [migration] Secuencias PostgreSQL sincronizadas');
  } catch (err) {
    console.error('⚠️  [migration] fixPostgresSequences falló (no crítico):', err.message);
  }
}

// Migración: crear tablas del Módulo 2 (Asamblea) si no existen
// assembly_import_log (log de cargas) y assembly_master_snapshot (congelamiento histórico)
async function ensureAssemblyM2Tables() {
  try {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const idType = isPostgreSQL ? 'SERIAL PRIMARY KEY' : 'INT AUTO_INCREMENT PRIMARY KEY';
    const jsonType = isPostgreSQL ? 'JSONB' : 'JSON';
    const tsDefault = isPostgreSQL ? 'TIMESTAMP DEFAULT NOW()' : 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
    const boolType = isPostgreSQL ? 'BOOLEAN' : 'TINYINT(1)';
    const falseVal = isPostgreSQL ? 'false' : '0';

    await db.execute(
      `CREATE TABLE IF NOT EXISTS assembly_import_log (
        id ${idType},
        product_id INT NOT NULL,
        client_id INT NOT NULL,
        operator_id INT,
        filename VARCHAR(255),
        total_rows INT,
        rows_ok INT,
        rows_error INT,
        rows_skipped INT,
        errors ${jsonType},
        status VARCHAR(20),
        created_at ${tsDefault}
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS assembly_master_snapshot (
        id ${idType},
        meeting_id INT NOT NULL,
        product_id INT NOT NULL,
        snapshot ${jsonType} NOT NULL,
        total_principals INT NOT NULL,
        created_at ${tsDefault}
      )`
    );

    // M1 — Trazabilidad de quórum de asamblea (Regla 9)
    await db.execute(
      `CREATE TABLE IF NOT EXISTS quorum_log (
        id ${idType},
        meeting_id INT NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        member_id INT,
        operator_id INT,
        cursos_antes INT,
        cursos_despues INT,
        estado_antes VARCHAR(20),
        estado_despues VARCHAR(20),
        detalle TEXT,
        created_at ${tsDefault}
      )`
    );

    // M6 — Orden del Día (cabecera, puntos y trazabilidad)
    await db.execute(
      `CREATE TABLE IF NOT EXISTS meeting_agenda (
        id ${idType},
        meeting_id INT NOT NULL,
        tipo_sesion VARCHAR(20) NOT NULL DEFAULT 'ordinaria',
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        total_puntos INT NOT NULL DEFAULT 0,
        puntos_completados INT NOT NULL DEFAULT 0,
        publicado_at TIMESTAMP NULL,
        publicado_por INT,
        cerrado_at TIMESTAMP NULL,
        cerrado_por INT,
        created_at ${tsDefault},
        updated_at ${tsDefault}
      )`
    );
    await db.execute(
      `CREATE TABLE IF NOT EXISTS agenda_items (
        id ${idType},
        meeting_id INT NOT NULL,
        numero INT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        tipo VARCHAR(30) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pendiente',
        approval_vote_id INT,
        election_id INT,
        emergente ${isPostgreSQL ? 'BOOLEAN NOT NULL DEFAULT false' : 'TINYINT(1) NOT NULL DEFAULT 0'},
        resultado_resumen TEXT,
        iniciado_at TIMESTAMP NULL,
        completado_at TIMESTAMP NULL,
        iniciado_por INT,
        completado_por INT,
        notas TEXT,
        created_at ${tsDefault},
        updated_at ${tsDefault}
      )`
    );
    await db.execute(
      `CREATE TABLE IF NOT EXISTS agenda_log (
        id ${idType},
        meeting_id INT NOT NULL,
        agenda_item_id INT,
        event_type VARCHAR(50) NOT NULL,
        operator_id INT,
        status_antes VARCHAR(20),
        status_despues VARCHAR(20),
        detalle TEXT,
        created_at ${tsDefault}
      )`
    );

    // M8 — Acta y Expediente (PDF en BD: pdf_base64 + hash SHA-256, VF-03 confirmado)
    await db.execute(
      `CREATE TABLE IF NOT EXISTS actas (
        id ${idType},
        meeting_id INT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        version_borrador INT NOT NULL DEFAULT 0,
        tipo_sesion VARCHAR(20) NOT NULL DEFAULT 'ordinaria',
        numero_sesion VARCHAR(50),
        lugar VARCHAR(255),
        modalidad VARCHAR(30) DEFAULT 'presencial',
        hora_inicio TIMESTAMP NULL,
        hora_cierre TIMESTAMP NULL,
        contenido_json ${jsonType},
        pdf_base64 TEXT,
        pdf_hash VARCHAR(128),
        generada_por INT,
        generada_at TIMESTAMP NULL,
        cerrada_por INT,
        cerrada_at TIMESTAMP NULL,
        notas_internas TEXT,
        created_at ${tsDefault},
        updated_at ${tsDefault}
      )`
    );
    await db.execute(
      `CREATE TABLE IF NOT EXISTS acta_narratives (
        id ${idType},
        meeting_id INT NOT NULL,
        agenda_item_id INT NOT NULL,
        narrative_text TEXT,
        ingresado_por INT,
        ingresado_at ${tsDefault},
        actualizado_at ${tsDefault}
      )`
    );
    await db.execute(
      `CREATE TABLE IF NOT EXISTS acta_log (
        id ${idType},
        meeting_id INT NOT NULL,
        acta_id INT,
        event_type VARCHAR(50) NOT NULL,
        operator_id INT,
        version INT,
        detalle TEXT,
        created_at ${tsDefault}
      )`
    );

    // M4 — Procesos Electorales (voto nominal). NOTA: se usa election_votes
    // (NO 'votes', que ya existe para Junta Directiva) para no romper JD.
    await db.execute(
      `CREATE TABLE IF NOT EXISTS elections (
        id ${idType},
        meeting_id INT NOT NULL,
        product_id INT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        punto_orden_dia INT,
        tipo_eleccion VARCHAR(30) NOT NULL DEFAULT 'unipersonal',
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        required_majority VARCHAR(20) NOT NULL DEFAULT 'simple',
        total_padron INT,
        votos_emitidos INT DEFAULT 0,
        abierta_por INT,
        cerrada_por INT,
        opened_at TIMESTAMP NULL,
        closed_at TIMESTAMP NULL,
        resultado ${jsonType},
        notas TEXT,
        created_at ${tsDefault}
      )`
    );
    await db.execute(
      `CREATE TABLE IF NOT EXISTS election_candidates (
        id ${idType},
        election_id INT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        votos INT DEFAULT 0,
        created_at ${tsDefault}
      )`
    );
    await db.execute(
      `CREATE TABLE IF NOT EXISTS election_voters (
        id ${idType},
        election_id INT NOT NULL,
        member_id INT NOT NULL,
        tipo_votante VARCHAR(30) NOT NULL,
        vota_por_curso VARCHAR(100),
        power_id INT,
        ha_votado ${isPostgreSQL ? 'BOOLEAN DEFAULT false' : 'TINYINT(1) DEFAULT 0'}
      )`
    );
    await db.execute(
      `CREATE TABLE IF NOT EXISTS election_votes (
        id ${idType},
        election_id INT NOT NULL,
        voter_id INT NOT NULL,
        candidate_id INT,
        voto_nulo ${isPostgreSQL ? 'BOOLEAN DEFAULT false' : 'TINYINT(1) DEFAULT 0'},
        nota_nulo TEXT,
        emitido_at ${tsDefault},
        registrado_por INT
      )`
    );

    // M5 — Votaciones de Aprobación Documental (voto nominal)
    await db.execute(
      `CREATE TABLE IF NOT EXISTS approval_votes (
        id ${idType},
        meeting_id INT NOT NULL,
        product_id INT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        punto_orden_dia INT,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        required_majority VARCHAR(20) NOT NULL DEFAULT 'simple',
        total_padron INT,
        votos_a_favor INT DEFAULT 0,
        votos_en_contra INT DEFAULT 0,
        abstenciones INT DEFAULT 0,
        no_participo INT DEFAULT 0,
        abierta_por INT,
        cerrada_por INT,
        opened_at TIMESTAMP NULL,
        closed_at TIMESTAMP NULL,
        resultado ${jsonType},
        decision VARCHAR(20),
        notas TEXT,
        created_at ${tsDefault}
      )`
    );
    await db.execute(
      `CREATE TABLE IF NOT EXISTS approval_voters (
        id ${idType},
        approval_vote_id INT NOT NULL,
        member_id INT NOT NULL,
        tipo_votante VARCHAR(30) NOT NULL,
        vota_por_curso VARCHAR(100),
        power_id INT,
        ha_votado ${isPostgreSQL ? 'BOOLEAN DEFAULT false' : 'TINYINT(1) DEFAULT 0'}
      )`
    );
    await db.execute(
      `CREATE TABLE IF NOT EXISTS approval_vote_records (
        id ${idType},
        approval_vote_id INT NOT NULL,
        voter_id INT NOT NULL,
        voto_tipo VARCHAR(15) NOT NULL,
        emitido_at ${tsDefault},
        registrado_por INT
      )`
    );

    // M3 — Poderes / Transferencia de Representación
    await db.execute(
      `CREATE TABLE IF NOT EXISTS representation_powers (
        id ${idType},
        meeting_id INT NOT NULL,
        product_id INT NOT NULL,
        poderdante_id INT NOT NULL,
        apoderado_id INT NOT NULL,
        curso VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'registered',
        registered_by INT,
        registered_at ${tsDefault},
        activated_at TIMESTAMP NULL,
        suspended_at TIMESTAMP NULL,
        revoked_at TIMESTAMP NULL,
        revoked_by INT,
        referencia_documental VARCHAR(255),
        notas TEXT
      )`
    );

    // M7 — Roles de Asamblea (autoridad de sesión) + trazabilidad
    await db.execute(
      `CREATE TABLE IF NOT EXISTS session_roles (
        id ${idType},
        meeting_id INT NOT NULL,
        role_type VARCHAR(50) NOT NULL,
        user_id INT,
        person_name VARCHAR(255),
        person_type VARCHAR(20) NOT NULL DEFAULT 'interno',
        agenda_item_id INT,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        assigned_at ${tsDefault},
        assigned_by INT,
        revoked_at TIMESTAMP NULL,
        revoked_by INT,
        notas TEXT,
        created_at ${tsDefault},
        updated_at ${tsDefault}
      )`
    );
    await db.execute(
      `CREATE TABLE IF NOT EXISTS roles_log (
        id ${idType},
        meeting_id INT NOT NULL,
        session_role_id INT,
        event_type VARCHAR(50) NOT NULL,
        role_type VARCHAR(50),
        operator_id INT,
        person_id INT,
        person_name VARCHAR(255),
        detalle TEXT,
        created_at ${tsDefault}
      )`
    );

    // MD-02 — Momento Siguiente: activación, control y trazabilidad
    await db.execute(
      `CREATE TABLE IF NOT EXISTS assembly_moment_events (
        id ${idType},
        meeting_id INT NOT NULL,
        operator_id INT,
        operator_name VARCHAR(255),
        operator_role VARCHAR(50),
        applied_at TIMESTAMP,
        hora_oficial TIMESTAMP,
        hora_limite TIMESTAMP,
        elegibles INT,
        quorum_inicial INT,
        presentes_al_aplicar INT,
        quorum_momento_siguiente INT,
        alcanzado ${boolType} DEFAULT ${falseVal},
        alcanzado_at TIMESTAMP NULL,
        presentes_al_alcanzar INT,
        cerrado_sin_quorum ${boolType} DEFAULT ${falseVal},
        cerrado_at TIMESTAMP NULL,
        created_at ${tsDefault}
      )`
    );

    // Columnas para el segundo progenitor (maestro ASOCOLCI trae madre y padre por fila).
    // El delegado primario va en numero_documento/name; el otro se guarda aquí para que
    // en asistencia se pueda validar con cualquiera de las dos cédulas.
    // MD-05 §11 y MD-09 — trazabilidad de la contingencia de Delegado no
    // encontrado: qué declaró la persona, quién decidió, cuándo y por qué.
    const colsAttendance = [
      ['manual_motivo', 'TEXT NULL'],
      ['registered_by', 'INT NULL'],
      ['manual_curso', 'VARCHAR(120) NULL'],
      ['manual_rol', 'VARCHAR(20) NULL'],
      ['contingencia', `${boolType} DEFAULT ${falseVal}`],
      ['decision', 'VARCHAR(20) NULL'],
      ['decision_motivo', 'TEXT NULL'],
      ['approved_by', 'INT NULL'],
      ['approved_at', 'TIMESTAMP NULL']
    ];
    for (const [col, tipo] of colsAttendance) {
      if (isPostgreSQL) {
        await db.execute(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS ${col} ${tipo}`);
      } else {
        const [existe] = await db.execute(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND COLUMN_NAME = ?`,
          [col]
        );
        if (existe.length === 0) {
          await db.execute(`ALTER TABLE attendance ADD COLUMN ${col} ${tipo}`);
        }
      }
    }

    if (isPostgreSQL) {
      await db.execute(`ALTER TABLE members ADD COLUMN IF NOT EXISTS secondary_document VARCHAR(50) NULL`);
      await db.execute(`ALTER TABLE members ADD COLUMN IF NOT EXISTS secondary_name VARCHAR(255) NULL`);
    } else {
      const [c1] = await db.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'members' AND COLUMN_NAME = 'secondary_document'`
      );
      if (c1.length === 0) {
        await db.execute(`ALTER TABLE members ADD COLUMN secondary_document VARCHAR(50) NULL`);
        await db.execute(`ALTER TABLE members ADD COLUMN secondary_name VARCHAR(255) NULL`);
      }
    }
    console.log('✅ [migration] Tablas Asamblea verificadas (assembly_import_log, assembly_master_snapshot, quorum_log, assembly_moment_events, secondary_*)');
  } catch (err) {
    console.error('⚠️  [migration] ensureAssemblyM2Tables falló (no crítico):', err.message);
  }
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://violet-nights-dance.loca.lt',
      'https://superinfinitely-unresentful-cannon.ngrok-free.dev',
      'https://minute-adipex-ata-demands.trycloudflare.com',
      // Dominios de producción
      'https://datacastilla.com',
      'https://www.datacastilla.com',
      'https://board-quorum.vercel.app',
      'https://www.board-quorum.vercel.app',
      process.env.CORS_ORIGIN // Permite configurar desde .env
    ].filter(Boolean); // Elimina valores undefined/null
    
    // Permitir cualquier URL de Cloudflare Tunnel y Vercel
    const isCloudflareTunnel = origin?.includes('.trycloudflare.com');
    const isVercel = origin?.includes('.vercel.app');
    const isAllowedOrigin = !origin || allowedOrigins.indexOf(origin) !== -1 || isVercel;
    
    if (isAllowedOrigin || isCloudflareTunnel || isVercel) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// Aumentar el límite del body parser para permitir imágenes base64 grandes (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/meetings', require('./routes/meetings'));
  app.use('/api/attendance', require('./routes/attendance'));
  app.use('/api/votings', require('./routes/votings'));
  app.use('/api/votes', require('./routes/votes'));
  app.use('/api/members', require('./routes/members'));
  app.use('/api/clients', require('./routes/clients'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/contact', require('./routes/contact'));
  app.use('/api/assembly', require('./routes/assembly'));
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BOARD QUORUM API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 BOARD QUORUM API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  await fixNonVotingRoles();
  await addCargoFuncionalColumn();
  await fixPostgresSequences();
  await ensureAssemblyM2Tables();
});

