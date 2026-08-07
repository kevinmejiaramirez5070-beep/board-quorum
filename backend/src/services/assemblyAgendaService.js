const db = require('../config/database');

/**
 * Módulo 6 — Orden del Día como objeto.
 * Estructura la sesión: cabecera (meeting_agenda) + puntos (agenda_items) + log (agenda_log).
 * No modifica quorumService.js. Las FK a elections/approval_votes son columnas INT
 * sin constraint (M4/M5 se construyen después de resolver VF-04).
 */

// Plantilla ordinaria ASOCOLCI (Regla 8). Punto 3 = procedural por defecto (VF-01/R-06).
const PLANTILLA_ORDINARIA = [
  { numero: 1, nombre: 'Verificación del quórum deliberatorio y decisorio', tipo: 'procedural' },
  { numero: 2, nombre: 'Lectura y aprobación del orden del día', tipo: 'votacion_documental' },
  { numero: 3, nombre: 'Elección del Presidente y Secretario(a) de la Asamblea', tipo: 'procedural' },
  { numero: 4, nombre: 'Aprobación del reglamento interno de la Asamblea', tipo: 'votacion_documental' },
  { numero: 5, nombre: 'Informe de la Comisión Verificadora del Acta anterior', tipo: 'votacion_documental' },
  { numero: 6, nombre: 'Designación de la Comisión Verificadora y Aprobadora del Acta', tipo: 'procedural' },
  { numero: 7, nombre: 'Informe de Gestión Junta Directiva', tipo: 'informativo' },
  { numero: 8, nombre: 'Informe Junta de Vigilancia', tipo: 'informativo' },
  { numero: 9, nombre: 'Informe Revisoría Fiscal', tipo: 'informativo' },
  { numero: 10, nombre: 'Presentación y aprobación de Estados Financieros', tipo: 'votacion_documental' },
  { numero: 11, nombre: 'Presentación y aprobación del Presupuesto', tipo: 'votacion_documental' },
  { numero: 12, nombre: 'Elección Junta Directiva', tipo: 'eleccion' },
  { numero: 13, nombre: 'Elección Junta de Vigilancia', tipo: 'eleccion' },
  { numero: 14, nombre: 'Elección Revisor Fiscal', tipo: 'eleccion' },
  { numero: 15, nombre: 'Proposiciones y varios', tipo: 'votacion_documental' },
];

const TIPOS_VALIDOS = ['informativo', 'votacion_documental', 'eleccion', 'procedural'];

class AssemblyAgendaService {
  static get isPostgreSQL() {
    return !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
  }

  static async logAgendaEvent(meetingId, eventType, agendaItemId = null, operatorId = null, statusAntes = null, statusDespues = null, detalle = '') {
    try {
      await db.execute(
        `INSERT INTO agenda_log (meeting_id, agenda_item_id, event_type, operator_id, status_antes, status_despues, detalle, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [meetingId, agendaItemId, eventType, operatorId, statusAntes, statusDespues, detalle || null]
      );
    } catch (e) { console.warn('[agenda] logAgendaEvent falló:', e.message); }
  }

  static async getAgendaHeader(meetingId) {
    const [rows] = await db.execute(`SELECT * FROM meeting_agenda WHERE meeting_id = ? LIMIT 1`, [meetingId]);
    return rows[0] || null;
  }

  static async getMeeting(meetingId) {
    const [rows] = await db.execute(`SELECT id, status, type, product_id, client_id FROM meetings WHERE id = ? LIMIT 1`, [meetingId]);
    return rows[0] || null;
  }

  /** Crea el Orden del Día en borrador (V-01: uno por meeting). */
  static async createAgenda(meetingId, tipoSesion = 'ordinaria', operatorId = null) {
    const existing = await this.getAgendaHeader(meetingId);
    if (existing) { const err = new Error('Esta sesión ya tiene un Orden del Día configurado.'); err.status = 409; throw err; }

    const returning = this.isPostgreSQL ? ' RETURNING id' : '';
    const [rows] = await db.execute(
      `INSERT INTO meeting_agenda (meeting_id, tipo_sesion, status, total_puntos, puntos_completados, created_at, updated_at)
       VALUES (?, ?, 'draft', 0, 0, NOW(), NOW())${returning}`,
      [meetingId, tipoSesion]
    );
    const agendaId = this.isPostgreSQL ? rows?.[0]?.id : rows?.insertId;
    await this.logAgendaEvent(meetingId, 'AGENDA_CREADA', null, operatorId);
    return { agenda_id: agendaId, meeting_id: Number(meetingId), tipo_sesion: tipoSesion, status: 'draft' };
  }

  /** Precarga los 15 puntos ordinarios (solo en draft). */
  static async loadOrdinaryAgendaTemplate(meetingId, operatorId = null) {
    let header = await this.getAgendaHeader(meetingId);
    if (!header) { await this.createAgenda(meetingId, 'ordinaria', operatorId); header = await this.getAgendaHeader(meetingId); }
    if (header.status !== 'draft') { const err = new Error('El Orden del Día no está en borrador.'); err.status = 409; throw err; }

    // Limpiar puntos previos en borrador para idempotencia
    await db.execute(`DELETE FROM agenda_items WHERE meeting_id = ?`, [meetingId]);

    for (const p of PLANTILLA_ORDINARIA) {
      await db.execute(
        `INSERT INTO agenda_items (meeting_id, numero, nombre, tipo, status, emergente, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pendiente', ${this.isPostgreSQL ? 'false' : 0}, NOW(), NOW())`,
        [meetingId, p.numero, p.nombre, p.tipo]
      );
    }
    await db.execute(`UPDATE meeting_agenda SET total_puntos = ?, puntos_completados = 0, updated_at = NOW() WHERE meeting_id = ?`,
      [PLANTILLA_ORDINARIA.length, meetingId]);
    return { puntos_creados: PLANTILLA_ORDINARIA.length };
  }

  static async addAgendaItem(meetingId, { numero, nombre, descripcion = null, tipo, emergente = false }, operatorId = null) {
    if (!TIPOS_VALIDOS.includes(tipo)) { const err = new Error('Tipo de punto inválido.'); err.status = 400; throw err; }
    const header = await this.getAgendaHeader(meetingId);
    if (!header) { const err = new Error('No existe Orden del Día para esta sesión.'); err.status = 404; throw err; }
    const meeting = await this.getMeeting(meetingId);

    if (emergente) {
      if (header.status !== 'published') { const err = new Error('Solo se pueden agregar puntos emergentes con la agenda publicada.'); err.status = 423; throw err; }
      if (!meeting || meeting.status === 'closed' || meeting.status === 'completed') { const err = new Error('No se pueden agregar puntos con la sesión cerrada.'); err.status = 423; throw err; }
    } else {
      if (header.status !== 'draft') { const err = new Error('Solo se pueden agregar puntos en borrador.'); err.status = 423; throw err; }
    }

    // V-09: numero único
    const [dup] = await db.execute(`SELECT id FROM agenda_items WHERE meeting_id = ? AND numero = ? LIMIT 1`, [meetingId, numero]);
    if (dup.length) { const err = new Error('Número de punto duplicado.'); err.status = 400; throw err; }

    const returning = this.isPostgreSQL ? ' RETURNING id' : '';
    const [rows] = await db.execute(
      `INSERT INTO agenda_items (meeting_id, numero, nombre, descripcion, tipo, status, emergente, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pendiente', ${emergente ? (this.isPostgreSQL ? 'true' : 1) : (this.isPostgreSQL ? 'false' : 0)}, NOW(), NOW())${returning}`,
      [meetingId, numero, nombre, descripcion, tipo]
    );
    const itemId = this.isPostgreSQL ? rows?.[0]?.id : rows?.insertId;
    await db.execute(`UPDATE meeting_agenda SET total_puntos = total_puntos + 1, updated_at = NOW() WHERE meeting_id = ?`, [meetingId]);
    if (emergente) await this.logAgendaEvent(meetingId, 'PUNTO_EMERGENTE_AGREGADO', itemId, operatorId);
    return { agenda_item_id: itemId, numero, nombre, tipo, emergente };
  }

  static async updateAgendaItem(meetingId, itemId, fields = {}, operatorId = null) {
    const item = await this._getItem(meetingId, itemId);
    if (['en_curso', 'completado'].includes(item.status)) { const err = new Error('Un punto en curso o completado no puede modificarse.'); err.status = 423; throw err; }
    const sets = [], params = [];
    for (const f of ['numero', 'nombre', 'descripcion', 'tipo']) {
      if (fields[f] !== undefined) {
        if (f === 'tipo' && !TIPOS_VALIDOS.includes(fields[f])) { const err = new Error('Tipo inválido.'); err.status = 400; throw err; }
        sets.push(`${f} = ?`); params.push(fields[f]);
      }
    }
    if (!sets.length) return item;
    params.push(meetingId, itemId);
    await db.execute(`UPDATE agenda_items SET ${sets.join(', ')}, updated_at = NOW() WHERE meeting_id = ? AND id = ?`, params);
    return await this._getItem(meetingId, itemId);
  }

  static async removeAgendaItem(meetingId, itemId) {
    const item = await this._getItem(meetingId, itemId);
    const header = await this.getAgendaHeader(meetingId);
    if (header?.status !== 'draft') { const err = new Error('Solo se pueden eliminar puntos en borrador.'); err.status = 423; throw err; }
    await db.execute(`DELETE FROM agenda_items WHERE meeting_id = ? AND id = ?`, [meetingId, itemId]);
    await db.execute(`UPDATE meeting_agenda SET total_puntos = GREATEST(total_puntos - 1, 0), updated_at = NOW() WHERE meeting_id = ?`, [meetingId]);
    return { removed: true };
  }

  static async publishAgenda(meetingId, operatorId = null) {
    const header = await this.getAgendaHeader(meetingId);
    if (!header) { const err = new Error('No existe Orden del Día.'); err.status = 404; throw err; }
    if (header.status !== 'draft') { const err = new Error('El Orden del Día ya fue publicado o cerrado.'); err.status = 409; throw err; }
    const [cnt] = await db.execute(`SELECT COUNT(*) AS n FROM agenda_items WHERE meeting_id = ?`, [meetingId]);
    if (Number(cnt[0]?.n || 0) === 0) { const err = new Error('Al menos un punto es requerido.'); err.status = 400; throw err; }
    await db.execute(`UPDATE meeting_agenda SET status = 'published', publicado_at = NOW(), publicado_por = ?, updated_at = NOW() WHERE meeting_id = ?`, [operatorId, meetingId]);
    await this.logAgendaEvent(meetingId, 'AGENDA_PUBLICADA', null, operatorId);
    return { status: 'published' };
  }

  static async startAgendaItem(meetingId, itemId, operatorId = null) {
    const meeting = await this.getMeeting(meetingId);
    if (!meeting || meeting.status !== 'active') { const err = new Error('Solo se pueden avanzar puntos en sesiones activas.'); err.status = 423; throw err; }
    const header = await this.getAgendaHeader(meetingId);
    if (header?.status !== 'published') { const err = new Error('El Orden del Día debe estar publicado.'); err.status = 423; throw err; }
    // V-02: no otro en curso
    const [enCurso] = await db.execute(`SELECT id FROM agenda_items WHERE meeting_id = ? AND status = 'en_curso' LIMIT 1`, [meetingId]);
    if (enCurso.length) { const err = new Error('Ya hay un punto en curso. Complétalo antes de avanzar.'); err.status = 409; throw err; }
    const item = await this._getItem(meetingId, itemId);
    if (item.status !== 'pendiente') { const err = new Error('El punto no está pendiente.'); err.status = 409; throw err; }
    await db.execute(`UPDATE agenda_items SET status = 'en_curso', iniciado_at = NOW(), iniciado_por = ?, updated_at = NOW() WHERE meeting_id = ? AND id = ?`, [operatorId, meetingId, itemId]);
    await this.logAgendaEvent(meetingId, 'PUNTO_INICIADO', itemId, operatorId, 'pendiente', 'en_curso');
    return { agenda_item_id: itemId, status: 'en_curso' };
  }

  /** Verifica si el objeto vinculado (votación/elección) está cerrado. Tolerante si M4/M5 no existen. */
  static async _linkedObjectClosed(item) {
    try {
      if (item.tipo === 'votacion_documental' && item.approval_vote_id) {
        const [r] = await db.execute(`SELECT status FROM approval_votes WHERE id = ? LIMIT 1`, [item.approval_vote_id]);
        if (r[0]) return ['closed', 'tied'].includes(r[0].status);
      }
      if (item.tipo === 'eleccion' && item.election_id) {
        const [r] = await db.execute(`SELECT status FROM elections WHERE id = ? LIMIT 1`, [item.election_id]);
        if (r[0]) return ['closed', 'tied'].includes(r[0].status);
      }
    } catch (e) { /* tabla M4/M5 no existe aún */ }
    // Si no hay objeto vinculado (M4/M5 aún no construidos), se permite cierre manual del punto.
    return null;
  }

  static async completeAgendaItem(meetingId, itemId, resultadoResumen = null, operatorId = null) {
    const item = await this._getItem(meetingId, itemId);
    if (item.status !== 'en_curso') { const err = new Error('El punto no está en curso.'); err.status = 409; throw err; }

    // V-05 / V-06: si hay objeto vinculado, debe estar cerrado.
    if ((item.tipo === 'votacion_documental' && item.approval_vote_id) || (item.tipo === 'eleccion' && item.election_id)) {
      const closed = await this._linkedObjectClosed(item);
      if (closed === false) {
        const msg = item.tipo === 'eleccion' ? 'Cierra la elección antes de completar este punto.' : 'Cierra la votación documental antes de completar este punto.';
        const err = new Error(msg); err.status = 409; throw err;
      }
    }
    await db.execute(
      `UPDATE agenda_items SET status = 'completado', completado_at = NOW(), completado_por = ?, resultado_resumen = ?, updated_at = NOW()
       WHERE meeting_id = ? AND id = ?`,
      [operatorId, resultadoResumen, meetingId, itemId]
    );
    await db.execute(`UPDATE meeting_agenda SET puntos_completados = puntos_completados + 1, updated_at = NOW() WHERE meeting_id = ?`, [meetingId]);
    await this.logAgendaEvent(meetingId, 'PUNTO_COMPLETADO', itemId, operatorId, 'en_curso', 'completado');
    return { agenda_item_id: itemId, status: 'completado' };
  }

  static async skipAgendaItem(meetingId, itemId, operatorId = null) {
    const item = await this._getItem(meetingId, itemId);
    if (item.status === 'omitido') { const err = new Error('El punto ya está omitido.'); err.status = 423; throw err; }
    if (['completado', 'en_curso'].includes(item.status)) { const err = new Error('No se puede omitir un punto en curso o completado.'); err.status = 423; throw err; }
    await db.execute(`UPDATE agenda_items SET status = 'omitido', updated_at = NOW() WHERE meeting_id = ? AND id = ?`, [meetingId, itemId]);
    await this.logAgendaEvent(meetingId, 'PUNTO_OMITIDO', itemId, operatorId, item.status, 'omitido');
    return { agenda_item_id: itemId, status: 'omitido' };
  }

  static async linkAgendaItemToVote(meetingId, itemId, approvalVoteId) {
    const item = await this._getItem(meetingId, itemId);
    if (item.tipo !== 'votacion_documental') { const err = new Error('El punto no es de tipo votación documental.'); err.status = 400; throw err; }
    if (!['pendiente', 'en_curso'].includes(item.status)) { const err = new Error('El punto no admite vinculación en su estado actual.'); err.status = 409; throw err; }
    await db.execute(`UPDATE agenda_items SET approval_vote_id = ?, updated_at = NOW() WHERE meeting_id = ? AND id = ?`, [approvalVoteId, meetingId, itemId]);
    return { agenda_item_id: itemId, approval_vote_id: approvalVoteId };
  }

  static async linkAgendaItemToElection(meetingId, itemId, electionId) {
    const item = await this._getItem(meetingId, itemId);
    if (item.tipo !== 'eleccion') { const err = new Error('El punto no es de tipo elección.'); err.status = 400; throw err; }
    if (!['pendiente', 'en_curso'].includes(item.status)) { const err = new Error('El punto no admite vinculación en su estado actual.'); err.status = 409; throw err; }
    await db.execute(`UPDATE agenda_items SET election_id = ?, updated_at = NOW() WHERE meeting_id = ? AND id = ?`, [electionId, meetingId, itemId]);
    return { agenda_item_id: itemId, election_id: electionId };
  }

  /** Cierre automático del punto vinculado (invocado por M4/M5 al cerrar su objeto). */
  static async completeItemByLinkedObject(kind, objectId, operatorId = null) {
    const col = kind === 'election' ? 'election_id' : 'approval_vote_id';
    const [rows] = await db.execute(`SELECT * FROM agenda_items WHERE ${col} = ? AND status = 'en_curso' LIMIT 1`, [objectId]);
    const item = rows[0];
    if (!item) return null;
    return this.completeAgendaItem(item.meeting_id, item.id, null, operatorId);
  }

  static async getAgendaWithProgress(meetingId) {
    const header = await this.getAgendaHeader(meetingId);
    if (!header) return null;
    const [items] = await db.execute(`SELECT * FROM agenda_items WHERE meeting_id = ? ORDER BY numero`, [meetingId]);
    const omitidos = items.filter(i => i.status === 'omitido').length;
    const completados = items.filter(i => i.status === 'completado').length;
    const denom = Math.max(0, items.length - omitidos);
    const porcentaje_avance = denom > 0 ? Math.round((completados / denom) * 100) : 0;
    const enCurso = items.find(i => i.status === 'en_curso') || null;
    return {
      agenda_id: header.id,
      meeting_id: Number(meetingId),
      tipo_sesion: header.tipo_sesion,
      status: header.status,
      total_puntos: items.length,
      puntos_completados: completados,
      puntos_omitidos: omitidos,
      porcentaje_avance,
      punto_en_curso: enCurso ? { agenda_item_id: enCurso.id, numero: enCurso.numero, nombre: enCurso.nombre, tipo: enCurso.tipo } : null,
      items: items.map(i => ({
        agenda_item_id: i.id, numero: i.numero, nombre: i.nombre, descripcion: i.descripcion,
        tipo: i.tipo, status: i.status, emergente: i.emergente === true || i.emergente === 1,
        approval_vote_id: i.approval_vote_id, election_id: i.election_id,
        resultado_resumen: i.resultado_resumen, iniciado_at: i.iniciado_at, completado_at: i.completado_at
      }))
    };
  }

  static async closeAgenda(meetingId, operatorId = null) {
    const header = await this.getAgendaHeader(meetingId);
    if (!header || header.status === 'closed') return { status: 'closed' };
    await db.execute(`UPDATE meeting_agenda SET status = 'closed', cerrado_at = NOW(), cerrado_por = ?, updated_at = NOW() WHERE meeting_id = ?`, [operatorId, meetingId]);
    await this.logAgendaEvent(meetingId, 'AGENDA_CERRADA', null, operatorId);
    return { status: 'closed' };
  }

  static async _getItem(meetingId, itemId) {
    const [rows] = await db.execute(`SELECT * FROM agenda_items WHERE meeting_id = ? AND id = ? LIMIT 1`, [meetingId, itemId]);
    if (!rows[0]) { const err = new Error('Punto no encontrado.'); err.status = 404; throw err; }
    return rows[0];
  }
}

module.exports = AssemblyAgendaService;
