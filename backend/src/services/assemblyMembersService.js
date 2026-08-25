const db = require('../config/database');

/**
 * Módulo 2 — Carga y Validación de Delegados (Asamblea).
 *
 * Reglas clave (ver BQ_MODULO_02_DE_08):
 *  - numero_documento: solo dígitos (normalizado). Es la clave de identidad.
 *  - Un curso (rol_organico) tiene exactamente 1 Principal y hasta 1 Suplente.
 *  - Todo Suplente activo debe vincularse a un Principal del mismo curso (principal_id).
 *  - principal → cuenta_quorum=true, puede_votar=true
 *    suplente  → cuenta_quorum=false, puede_votar=false
 *  - Nunca elimina físicamente: desactivación lógica con active=false.
 *  - Toda operación filtra por product_id (aísla Asamblea de Junta Directiva).
 */
class AssemblyMembersService {
  static get isPostgreSQL() {
    return !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
  }

  // ── Normalización de cédula: TRIM + solo dígitos (Regla 6) ──────────────
  static normalizeDocument(raw) {
    if (raw === null || raw === undefined) return '';
    return String(raw).trim().replace(/\D/g, '');
  }

  static _norm(s) {
    return String(s ?? '').trim();
  }

  // Detecta el member_type a partir del texto de la columna "tipo"
  static _detectMemberType(rawType) {
    const t = String(rawType ?? '').toUpperCase().trim();
    if (/SUPLENTE/.test(t)) return 'suplente';
    if (/VIGILANCIA/.test(t)) return 'junta_vigilancia';
    // Por defecto principal (incluye "PRINCIPAL", vacío, etc.)
    return 'principal';
  }

  /**
   * Parsea el archivo fuente (XLSX) y retorna array de objetos normalizados.
   * Detecta las columnas por palabra clave en el encabezado, para tolerar
   * variaciones del maestro (NOMBRE, CÉDULA/DOCUMENTO, TIPO, CURSO/ROL).
   */
  static async parseImportFile(filePath) {
    const xlsx = require('xlsx');
    return this._parseWorkbook(xlsx.readFile(filePath));
  }

  /** Igual que parseImportFile pero desde un buffer en memoria (multer memoryStorage). */
  static async parseImportBuffer(buffer) {
    const xlsx = require('xlsx');
    return this._parseWorkbook(xlsx.read(buffer, { type: 'buffer' }));
  }

  static _parseWorkbook(workbook) {
    const xlsx = require('xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false });

    if (!rows.length) return [];

    // Mapear encabezados reales a campos canónicos
    const headers = Object.keys(rows[0]);
    const find = (regexes) =>
      headers.find(h => regexes.some(rx => rx.test(h.toUpperCase().trim())));

    // El maestro de ASOCOLCI trae MADRE y PADRE en la MISMA fila (una fila por curso/delegación).
    // Detectamos ambas columnas; el delegado de la fila es el progenitor que tenga cédula
    // (se prefiere la madre; si no tiene, se usa el padre). Se conserva el otro como contacto secundario.
    const colDocMadre = find([/CC.*MADRE/, /C[EÉ]DULA.*MADRE/, /DOC.*MADRE/]);
    const colNameMadre = find([/(APELLIDO|NOMBRE).*MADRE/]);
    const colDocPadre = find([/CC.*PADRE/, /C[EÉ]DULA.*PADRE/, /DOC.*PADRE/]);
    const colNamePadre = find([/(APELLIDO|NOMBRE).*PADRE/]);
    const dualParent = colDocMadre && colDocPadre;

    // Formato genérico (una fila = un delegado, columna única de documento/nombre)
    const colNombre = find([/^NOMBRE/, /DELEGAD/, /APELLIDOS_NOMBRES$/]);
    const colDoc = find([/^DOCUMENTO/, /^C[EÉ]DULA/, /^CEDULA/, /IDENTIFIC/, /N[UÚ]MERO.*DOC/]);
    const colTipoDoc = find([/TIPO.*DOCUMENTO/, /TIPO.*ID/]);
    const colTipo = find([/TIPO.*PARTICIP/, /^ROL$/, /^TIPO$/, /PRINCIPAL.*SUPLENTE/, /CALIDAD/]);
    const colCurso = find([/CURSO/, /GRADO/, /ROL.*ORG/, /GRUPO/]);
    const colEmail = find([/CORREO/, /EMAIL/, /MAIL/]);

    return rows.map((r, idx) => {
      let name = '';
      let numero_documento = '';
      let secondary_name = null;
      let secondary_document = null;

      if (dualParent) {
        const docMadre = this.normalizeDocument(r[colDocMadre]);
        const nameMadre = colNameMadre ? this._norm(r[colNameMadre]) : '';
        const docPadre = this.normalizeDocument(r[colDocPadre]);
        const namePadre = colNamePadre ? this._norm(r[colNamePadre]) : '';
        // Preferir el progenitor con cédula (madre primero)
        if (docMadre) {
          name = nameMadre; numero_documento = docMadre;
          if (docPadre) { secondary_name = namePadre; secondary_document = docPadre; }
        } else if (docPadre) {
          name = namePadre; numero_documento = docPadre;
        } else {
          name = nameMadre || namePadre; numero_documento = '';
        }
      } else {
        name = colNombre ? this._norm(r[colNombre]) : '';
        numero_documento = colDoc ? this.normalizeDocument(r[colDoc]) : '';
      }

      return {
        _row: idx + 2, // fila real en el excel (1 = encabezado)
        name,
        numero_documento,
        secondary_name,
        secondary_document,
        tipo_documento: colTipoDoc ? (this._norm(r[colTipoDoc]) || 'CC') : 'CC',
        member_type: this._detectMemberType(colTipo ? r[colTipo] : ''),
        rol_organico: colCurso ? this._norm(r[colCurso]).toUpperCase() : '',
        email: colEmail ? (this._norm(r[colEmail]) || null) : null,
        _rawTipo: colTipo ? this._norm(r[colTipo]) : ''
      };
    });
  }

  /**
   * Valida un registro individual — retorna { valid, errors: [] }.
   * Aplica V-01, V-03, V-04.
   */
  static validateRow(row, index) {
    const errors = [];
    if (!row.numero_documento || !/^\d+$/.test(row.numero_documento)) {
      errors.push('Documento vacío o no numérico tras normalización (V-01)');
    }
    if (!['principal', 'suplente', 'junta_vigilancia'].includes(row.member_type)) {
      errors.push(`member_type inválido: ${row.member_type} (V-03)`);
    }
    if (!row.name) {
      errors.push('Nombre vacío');
    }
    if (!row.rol_organico) {
      errors.push('Curso (rol_organico) vacío (V-04)');
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Valida el lote completo — detecta duplicados y conflictos de curso.
   * Aplica V-02, V-05, V-06, V-09.
   * Retorna { validRows, invalidRows, blocking: [] }.
   */
  static validateBatch(rows) {
    const validRows = [];
    const invalidRows = [];
    const blocking = [];

    // Validación por fila
    for (let i = 0; i < rows.length; i++) {
      const check = this.validateRow(rows[i], i);
      if (check.valid) validRows.push(rows[i]);
      else invalidRows.push({ row: rows[i]._row, numero_documento: rows[i].numero_documento, motivo: check.errors.join('; ') });
    }

    // V-02: duplicados por numero_documento dentro del archivo
    const seenDoc = new Map();
    for (const r of validRows) {
      if (seenDoc.has(r.numero_documento)) {
        r._duplicateInFile = true;
      } else {
        seenDoc.set(r.numero_documento, r);
      }
    }

    // V-05 / V-06: máximo 1 principal y 1 suplente por curso
    const principalPorCurso = new Map();
    const suplentePorCurso = new Map();
    // V-09: una persona no puede ser principal en dos cursos
    const cursosPorDocPrincipal = new Map();

    for (const r of validRows) {
      if (r._duplicateInFile) continue;
      if (r.member_type === 'principal') {
        principalPorCurso.set(r.rol_organico, (principalPorCurso.get(r.rol_organico) || 0) + 1);
        if (!cursosPorDocPrincipal.has(r.numero_documento)) cursosPorDocPrincipal.set(r.numero_documento, new Set());
        cursosPorDocPrincipal.get(r.numero_documento).add(r.rol_organico);
      } else if (r.member_type === 'suplente') {
        suplentePorCurso.set(r.rol_organico, (suplentePorCurso.get(r.rol_organico) || 0) + 1);
      }
    }

    for (const [curso, n] of principalPorCurso) {
      if (n > 1) blocking.push(`V-05: ${n} Principales en el curso "${curso}" (máximo 1)`);
    }
    for (const [curso, n] of suplentePorCurso) {
      if (n > 1) blocking.push(`V-06: ${n} Suplentes en el curso "${curso}" (máximo 1)`);
    }
    for (const [doc, cursos] of cursosPorDocPrincipal) {
      if (cursos.size > 1) blocking.push(`V-09: documento ${doc} es Principal en varios cursos: ${[...cursos].join(', ')}`);
    }

    return { validRows, invalidRows, blocking };
  }

  /**
   * Inserta o actualiza (upsert) registros válidos en la tabla members.
   * mode: 'insert_only' | 'upsert'. Nunca elimina físicamente.
   * Detecta existentes por numero_documento + product_id (Regla 12 idempotencia).
   */
  static async loadMembers(rows, productId, clientId, operatorId, mode = 'upsert') {
    const isPG = this.isPostgreSQL;
    const activeVal = isPG ? 'true' : '1';
    const returning = isPG ? ' RETURNING id' : '';

    // ¿Existen las columnas del segundo progenitor? (se agregan por auto-migración)
    let hasSecondary = false;
    try {
      await db.execute(`SELECT secondary_document FROM members LIMIT 1`);
      hasSecondary = true;
    } catch (e) { hasSecondary = false; }

    let ok = 0, skipped = 0, errors = 0;
    const errorDetail = [];

    for (const r of rows) {
      if (r._duplicateInFile) { skipped++; continue; }
      try {
        const cuentaQuorum = r.member_type === 'principal';
        const cq = isPG ? (cuentaQuorum ? 'true' : 'false') : (cuentaQuorum ? 1 : 0);
        const pv = cq; // puede_votar = cuenta_quorum por defecto (Regla 8)
        const tipoParticipante = r.member_type === 'suplente' ? 'SUPLENTE'
          : r.member_type === 'junta_vigilancia' ? 'JUNTA_DE_VIGILANCIA' : 'PRINCIPAL';
        const secDoc = r.secondary_document || null;
        const secName = r.secondary_name || null;

        // ¿Existe ya? (numero_documento + product_id)
        const [existing] = await db.execute(
          `SELECT id FROM members WHERE numero_documento = ? AND product_id = ? LIMIT 1`,
          [r.numero_documento, productId]
        );

        if (existing && existing.length > 0) {
          if (mode === 'insert_only') { skipped++; continue; }
          // upsert → actualizar campos base (no toca principal_id aquí; se recalcula en link)
          const secSet = hasSecondary ? ', secondary_document = ?, secondary_name = ?' : '';
          const params = hasSecondary
            ? [r.name, r.email, r.tipo_documento, r.rol_organico, r.member_type, tipoParticipante, secDoc, secName, existing[0].id]
            : [r.name, r.email, r.tipo_documento, r.rol_organico, r.member_type, tipoParticipante, existing[0].id];
          await db.execute(
            `UPDATE members SET
               name = ?, email = ?, tipo_documento = ?, rol_organico = ?,
               member_type = ?, tipo_participante = ?${secSet},
               cuenta_quorum = ${cq}, puede_votar = ${pv},
               active = ${activeVal}, updated_at = NOW()
             WHERE id = ?`,
            params
          );
          ok++;
        } else {
          const secCols = hasSecondary ? ', secondary_document, secondary_name' : '';
          const secVals = hasSecondary ? ', ?, ?' : '';
          const params = hasSecondary
            ? [clientId, productId, r.name, r.email, r.member_type, r.tipo_documento, r.numero_documento, r.rol_organico, tipoParticipante, secDoc, secName]
            : [clientId, productId, r.name, r.email, r.member_type, r.tipo_documento, r.numero_documento, r.rol_organico, tipoParticipante];
          await db.execute(
            `INSERT INTO members (
               client_id, product_id, name, email, role, position,
               member_type, principal_id, tipo_documento, numero_documento,
               rol_organico, tipo_participante${secCols}, cuenta_quorum, puede_votar, active, created_at
             ) VALUES (?, ?, ?, ?, 'member', NULL, ?, NULL, ?, ?, ?, ?${secVals}, ${cq}, ${pv}, ${activeVal}, NOW())${returning}`,
            params
          );
          ok++;
        }
      } catch (e) {
        errors++;
        errorDetail.push({ row: r._row, numero_documento: r.numero_documento, motivo: e.message });
      }
    }

    return { ok, skipped, errors, errorDetail };
  }

  /**
   * MD-07 §3 — La carga del maestro es un REEMPLAZO, no una acumulación.
   *
   * Después de cargar la base validada, los Delegados que quedaron activos de
   * cargas anteriores y que ya no aparecen en el archivo deben salir del maestro
   * vigente. Se desactivan (active = false); nunca se borran, para conservar la
   * trazabilidad histórica. Los históricos así no afectan conteos, universo de
   * elegibles, quórum, votaciones ni representación por curso.
   *
   * Devuelve el detalle de lo retirado para poder mostrarlo en el reporte de carga.
   */
  static async deactivateAbsentMembers(productId, rows) {
    const isPG = this.isPostgreSQL;
    const activeCond = isPG ? 'active = true' : 'active = 1';
    const falseVal = isPG ? 'false' : '0';

    // Documentos que la nueva base convierte en registro vigente.
    //
    // Se toma SOLO el documento principal de cada fila. El segundo progenitor no
    // crea un registro propio: viaja en secondary_document de la fila que sí queda.
    // Si se aceptara aquí, un registro viejo con la cédula del padre sobreviviría
    // como Principal duplicado del mismo curso (MD-08 §3: PREJARDÍN A, OCTAVO E).
    const enArchivo = new Set();
    for (const r of rows) {
      if (r.numero_documento) enArchivo.add(String(r.numero_documento));
    }

    const [activos] = await db.execute(
      `SELECT id, numero_documento, name, member_type, rol_organico
       FROM members WHERE product_id = ? AND ${activeCond}`,
      [productId]
    );

    const sobrantes = activos.filter(m => !enArchivo.has(String(m.numero_documento ?? '')));
    for (const m of sobrantes) {
      await db.execute(
        `UPDATE members SET active = ${falseVal}, updated_at = NOW() WHERE id = ?`,
        [m.id]
      );
    }

    return {
      desactivados: sobrantes.length,
      detalle: sobrantes.map(m => ({
        id: m.id,
        numero_documento: m.numero_documento,
        name: m.name,
        member_type: m.member_type,
        rol_organico: m.rol_organico,
        motivo: 'No figura en la base cargada (carga de reemplazo)'
      }))
    };
  }

  /**
   * Vincula principal_id entre Suplentes y sus Principales por mismo rol_organico.
   *
   * MD-07 §6 — Un Suplente cuyo curso no tiene Principal en la base vigente
   * CONSERVA su condición de Suplente y permanece activo en el maestro. No se
   * desactiva y, sobre todo, no se convierte en Principal. Queda con
   * principal_id = NULL y se reporta como "sin vínculo".
   *
   * Esto no afecta el quórum: el universo se cuenta sobre Principales
   * habilitados (MD-01), así que un curso sin Principal simplemente no forma
   * parte del universo y su Suplente nunca representa.
   */
  static async linkSuplentesPrincipales(productId) {
    const isPG = this.isPostgreSQL;
    const activeCond = isPG ? 'active = true' : 'active = 1';

    // Principales activos del producto, indexados por curso
    const [principals] = await db.execute(
      `SELECT id, rol_organico FROM members
       WHERE product_id = ? AND member_type = 'principal' AND ${activeCond}`,
      [productId]
    );
    const principalByCurso = new Map();
    for (const p of principals) principalByCurso.set(this._norm(p.rol_organico).toUpperCase(), p.id);

    const [suplentes] = await db.execute(
      `SELECT id, rol_organico FROM members
       WHERE product_id = ? AND member_type = 'suplente' AND ${activeCond}`,
      [productId]
    );

    let linked = 0, broken = 0;
    const sinVinculo = [];
    for (const s of suplentes) {
      const principalId = principalByCurso.get(this._norm(s.rol_organico).toUpperCase());
      if (principalId) {
        await db.execute(`UPDATE members SET principal_id = ?, updated_at = NOW() WHERE id = ?`, [principalId, s.id]);
        linked++;
      } else {
        // Sin Principal en su curso: sigue siendo Suplente y sigue activo.
        await db.execute(`UPDATE members SET principal_id = NULL, updated_at = NOW() WHERE id = ?`, [s.id]);
        broken++;
        sinVinculo.push({ id: s.id, rol_organico: s.rol_organico });
      }
    }
    return { linked, broken, sin_vinculo: sinVinculo };
  }

  /**
   * Resumen del estado del maestro para el producto dado.
   *
   * MD-07 §6: un Suplente cuyo curso no tiene Principal en la base vigente es
   * una situación legítima del maestro, no un error de carga. Se informa como
   * `suplentes_sin_principal` pero NO impide que el maestro quede listo: esos
   * cursos simplemente no forman parte del universo de quórum.
   */
  static async getMasterSummary(productId) {
    const isPG = this.isPostgreSQL;
    const activeCond = isPG ? 'active = true' : 'active = 1';

    const [tpRows] = await db.execute(
      `SELECT COUNT(*) AS n FROM members WHERE product_id = ? AND member_type = 'principal' AND ${activeCond}`,
      [productId]
    );
    const [tsRows] = await db.execute(
      `SELECT COUNT(*) AS n FROM members WHERE product_id = ? AND member_type = 'suplente' AND ${activeCond}`,
      [productId]
    );
    const [cpRows] = await db.execute(
      `SELECT COUNT(DISTINCT rol_organico) AS n FROM members WHERE product_id = ? AND member_type = 'principal' AND ${activeCond}`,
      [productId]
    );
    const [csRows] = await db.execute(
      `SELECT COUNT(DISTINCT rol_organico) AS n FROM members WHERE product_id = ? AND member_type = 'suplente' AND ${activeCond}`,
      [productId]
    );
    // Suplentes activos cuyo curso no tiene Principal en la base vigente
    const [vrRows] = await db.execute(
      `SELECT COUNT(*) AS n FROM members
       WHERE product_id = ? AND member_type = 'suplente' AND ${activeCond} AND principal_id IS NULL`,
      [productId]
    );

    const total_principals = Number(tpRows[0]?.n || 0);
    const total_suplentes = Number(tsRows[0]?.n || 0);
    const cursos_con_principal = Number(cpRows[0]?.n || 0);
    const cursos_con_suplente = Number(csRows[0]?.n || 0);
    const suplentes_sin_principal = Number(vrRows[0]?.n || 0);
    const sin_suplente = Math.max(0, cursos_con_principal - cursos_con_suplente);

    // Última carga
    let ultima_carga = null;
    try {
      const [ul] = await db.execute(
        `SELECT created_at FROM assembly_import_log WHERE product_id = ? ORDER BY created_at DESC LIMIT 1`,
        [productId]
      );
      ultima_carga = ul[0]?.created_at || null;
    } catch (e) { /* tabla puede no existir aún */ }

    return {
      product_id: Number(productId),
      total_principals,
      total_suplentes,
      cursos_con_principal,
      cursos_con_suplente,
      // Universo de quórum: solo Principales habilitados (MD-01 / MD-06)
      universo_quorum: total_principals,
      quorum_inicial: total_principals > 0 ? Math.ceil(total_principals / 2) + 1 : 0,
      quorum_momento_siguiente: total_principals > 0 ? Math.ceil(total_principals * 0.20) : 0,
      suplentes_sin_principal,
      // Se mantiene el nombre anterior por compatibilidad con la UI ya desplegada
      vinculos_rotos: suplentes_sin_principal,
      sin_suplente,
      maestro_listo: total_principals > 0,
      ultima_carga
    };
  }

  /** Lista completa de delegados del producto con estado de vínculo. */
  static async getMembersList(productId) {
    const [rows] = await db.execute(
      `SELECT m.id, m.name, m.numero_documento, m.tipo_documento, m.rol_organico,
              m.member_type, m.tipo_participante, m.principal_id,
              m.cuenta_quorum, m.puede_votar, m.active,
              p.name AS principal_name
       FROM members m
       LEFT JOIN members p ON p.id = m.principal_id
       WHERE m.product_id = ?
       ORDER BY m.rol_organico, m.member_type DESC, m.name`,
      [productId]
    );
    return rows;
  }

  /**
   * Genera snapshot inmutable del maestro al abrir sesión (Regla 14).
   * Guarda el array completo de members activos + total_principals.
   */
  static async snapshotMaster(meetingId, productId) {
    const isPG = this.isPostgreSQL;
    const activeCond = isPG ? 'active = true' : 'active = 1';
    const [members] = await db.execute(
      `SELECT * FROM members WHERE product_id = ? AND ${activeCond}`,
      [productId]
    );
    const total_principals = members.filter(m => m.member_type === 'principal').length;

    await db.execute(
      `INSERT INTO assembly_master_snapshot (meeting_id, product_id, snapshot, total_principals, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [meetingId, productId, JSON.stringify(members), total_principals]
    );
    return { total_principals, count: members.length };
  }

  /** Registra el resultado de una carga en assembly_import_log. */
  static async logImport({ productId, clientId, operatorId, filename, total, ok, errors, skipped, errorDetail, status }) {
    try {
      const [rows] = await db.execute(
        `INSERT INTO assembly_import_log
           (product_id, client_id, operator_id, filename, total_rows, rows_ok, rows_error, rows_skipped, errors, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())${this.isPostgreSQL ? ' RETURNING id' : ''}`,
        [productId, clientId, operatorId || null, filename || null, total, ok, errors, skipped, JSON.stringify(errorDetail || []), status]
      );
      return this.isPostgreSQL ? rows?.[0]?.id : rows?.insertId;
    } catch (e) {
      console.warn('[assembly] logImport falló:', e.message);
      return null;
    }
  }
}

module.exports = AssemblyMembersService;
