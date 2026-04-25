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
});

