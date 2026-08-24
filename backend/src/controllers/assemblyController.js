const db = require('../config/database');
const AssemblyMembersService = require('../services/assemblyMembersService');

// Verifica si hay una sesión activa para el producto (maestro bloqueado, Regla 13 / Tarea 6)
async function hasActiveMeeting(productId) {
  try {
    const [rows] = await db.execute(
      `SELECT id FROM meetings WHERE product_id = ? AND status = 'active' LIMIT 1`,
      [productId]
    );
    return rows.length > 0;
  } catch (e) {
    return false;
  }
}

/**
 * POST /api/assembly/:productId/members/import
 * Carga el maestro de delegados desde un XLSX (multipart/form-data, campo "file").
 * Body opcional: mode = 'upsert' | 'insert_only' (default 'upsert').
 */
exports.importMembers = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (isNaN(productId)) return res.status(400).json({ message: 'product_id inválido' });
    if (!req.file) return res.status(400).json({ message: 'Archivo requerido (campo "file")' });

    // Bloqueo de maestro durante sesión activa (HTTP 423)
    if (await hasActiveMeeting(productId)) {
      return res.status(423).json({
        error: 'Sesión activa — maestro bloqueado.',
        detail: 'No es posible modificar el maestro de delegados durante una sesión en curso.'
      });
    }

    const clientId = req.user.client_id;
    const operatorId = req.user.id;
    const mode = req.body.mode === 'insert_only' ? 'insert_only' : 'upsert';

    // 1. Parsear
    const parsed = await AssemblyMembersService.parseImportBuffer(req.file.buffer);
    if (!parsed.length) {
      return res.status(400).json({ message: 'El archivo no contiene registros legibles' });
    }

    // 2. Validar lote
    const { validRows, invalidRows, blocking } = AssemblyMembersService.validateBatch(parsed);

    // Errores bloqueantes (V-05/V-06/V-09): no se carga nada
    if (blocking.length > 0) {
      await AssemblyMembersService.logImport({
        productId, clientId, operatorId, filename: req.file.originalname,
        total: parsed.length, ok: 0, errors: invalidRows.length, skipped: 0,
        errorDetail: [...invalidRows, ...blocking.map(b => ({ motivo: b }))], status: 'failed'
      });
      return res.status(422).json({
        message: 'Carga detenida por errores bloqueantes. No se cargó ningún registro.',
        blocking,
        invalidRows
      });
    }

    // 3. Cargar
    const loadResult = await AssemblyMembersService.loadMembers(validRows, productId, clientId, operatorId, mode);

    // 4. MD-07 §3 — Carga de REEMPLAZO: los Delegados activos de cargas anteriores
    // que ya no figuran en el archivo salen del maestro vigente (desactivación
    // lógica, nunca borrado). Solo aplica en modo upsert, que es el reemplazo.
    const replaceResult = mode === 'upsert'
      ? await AssemblyMembersService.deactivateAbsentMembers(productId, validRows)
      : { desactivados: 0, detalle: [] };

    // 5. Vincular suplentes ↔ principales
    const linkResult = await AssemblyMembersService.linkSuplentesPrincipales(productId);

    // 6. Log
    const allErrors = [...invalidRows, ...loadResult.errorDetail];
    const status = loadResult.errors > 0 || invalidRows.length > 0 ? 'partial' : 'success';
    const logId = await AssemblyMembersService.logImport({
      productId, clientId, operatorId, filename: req.file.originalname,
      total: parsed.length, ok: loadResult.ok, errors: loadResult.errors + invalidRows.length,
      skipped: loadResult.skipped, errorDetail: allErrors, status
    });

    // 7. Resumen final
    const summary = await AssemblyMembersService.getMasterSummary(productId);

    res.json({
      message: 'Carga procesada',
      log_id: logId,
      total: parsed.length,
      ok: loadResult.ok,
      skipped: loadResult.skipped,
      errors: loadResult.errors + invalidRows.length,
      invalidRows,
      reemplazo: replaceResult,
      link: linkResult,
      summary
    });
  } catch (error) {
    console.error('[assembly.importMembers] error:', error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/assembly/:productId/members */
exports.listMembers = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (isNaN(productId)) return res.status(400).json({ message: 'product_id inválido' });
    const members = await AssemblyMembersService.getMembersList(productId);
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/assembly/:productId/members/summary */
exports.getSummary = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (isNaN(productId)) return res.status(400).json({ message: 'product_id inválido' });
    const summary = await AssemblyMembersService.getMasterSummary(productId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/assembly/:productId/members/:id/deactivate
 * Desactivación lógica (active = false). Bloqueada si hay sesión activa.
 */
exports.deactivateMember = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(productId) || isNaN(memberId)) return res.status(400).json({ message: 'IDs inválidos' });

    if (await hasActiveMeeting(productId)) {
      return res.status(423).json({ error: 'Sesión activa — maestro bloqueado.' });
    }

    const isPG = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const falseVal = isPG ? 'false' : '0';
    await db.execute(
      `UPDATE members SET active = ${falseVal}, updated_at = NOW() WHERE id = ? AND product_id = ?`,
      [memberId, productId]
    );
    const summary = await AssemblyMembersService.getMasterSummary(productId);
    res.json({ message: 'Delegado desactivado', summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
