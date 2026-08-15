const db = require('../config/database');

/**
 * Módulo 5 — Votaciones de Aprobación Documental (voto NOMINAL, VF-04 confirmado).
 * Opciones: A_FAVOR / EN_CONTRA / ABSTENCION. Las abstenciones NO cuentan en la mayoría.
 * Padrón congelado al abrir. No coexiste con otra votación/elección abierta.
 * NO usa quorumService.js. NO comparte tablas con M4 (elecciones).
 */
const VOTOS_VALIDOS = ['A_FAVOR', 'EN_CONTRA', 'ABSTENCION'];

class AssemblyApprovalService {
  static get isPostgreSQL() {
    return !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
  }

  static async _getMeeting(meetingId) {
    const [rows] = await db.execute(`SELECT id, status, type, product_id, client_id FROM meetings WHERE id = ? LIMIT 1`, [meetingId]);
    return rows[0] || null;
  }

  static async _getVote(approvalVoteId) {
    const [rows] = await db.execute(`SELECT * FROM approval_votes WHERE id = ? LIMIT 1`, [approvalVoteId]);
    return rows[0] || null;
  }

  static async createApprovalVote(meetingId, nombre, descripcion = null, puntoOrdenDia = null, operatorId = null) {
    const meeting = await this._getMeeting(meetingId);
    if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
    if (['closed', 'completed', 'archived'].includes(meeting.status)) { const err = new Error('La sesión está cerrada.'); err.status = 423; throw err; }
    if (!nombre || !nombre.trim()) { const err = new Error('El nombre de la votación es requerido.'); err.status = 400; throw err; }

    const returning = this.isPostgreSQL ? ' RETURNING id' : '';
    const [rows] = await db.execute(
      `INSERT INTO approval_votes (meeting_id, product_id, nombre, descripcion, punto_orden_dia, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'draft', NOW())${returning}`,
      [meetingId, meeting.product_id, nombre.trim(), descripcion, puntoOrdenDia]
    );
    const id = this.isPostgreSQL ? rows?.[0]?.id : rows?.insertId;
    return { approval_vote_id: id, status: 'draft' };
  }

  /** Abre la votación: valida quórum + no coexistencia, congela padrón. */
  static async openApprovalVote(meetingId, approvalVoteId, operatorId = null) {
    const meeting = await this._getMeeting(meetingId);
    if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
    if (meeting.status !== 'active') { const err = new Error('Solo se pueden abrir votaciones en sesiones activas.'); err.status = 403; throw err; }

    const vote = await this._getVote(approvalVoteId);
    if (!vote) { const err = new Error('Votación no encontrada'); err.status = 404; throw err; }
    if (vote.status !== 'draft') { const err = new Error('La votación no está en borrador.'); err.status = 409; throw err; }

    // V-02: quórum válido
    const AssemblyQuorumService = require('./assemblyQuorumService');
    const moment = await AssemblyQuorumService.getQuorumMoment(meetingId, meeting.client_id, meeting.product_id);
    if (moment.estado === 'SIN_QUORUM') { const err = new Error('Sin quórum — no es posible abrir una votación documental.'); err.status = 423; throw err; }

    // V-03: no otra votación documental abierta
    const [openDoc] = await db.execute(`SELECT id FROM approval_votes WHERE meeting_id = ? AND status = 'open' LIMIT 1`, [meetingId]);
    if (openDoc.length) { const err = new Error('Ya existe una votación o elección abierta en esta sesión.'); err.status = 409; throw err; }
    // V-10: no elección abierta
    try {
      const [openElec] = await db.execute(`SELECT id FROM elections WHERE meeting_id = ? AND status = 'open' LIMIT 1`, [meetingId]);
      if (openElec.length) { const err = new Error('Ya existe una votación o elección abierta en esta sesión.'); err.status = 409; throw err; }
    } catch (e) { /* tabla elections puede no existir aún */ }

    // Congelar padrón desde votantes activos (incluye suplentes actuando y apoderados)
    const voters = await AssemblyQuorumService.getActiveVoters(meetingId);
    for (const v of voters) {
      const tipo = v.tipo_votante === 'apoderado' ? 'apoderado' : v.acting_as_principal ? 'suplente_actuando' : (v.tipo_votante || 'principal');
      await db.execute(
        `INSERT INTO approval_voters (approval_vote_id, member_id, tipo_votante, vota_por_curso, power_id, ha_votado)
         VALUES (?, ?, ?, ?, ?, ${this.isPostgreSQL ? 'false' : 0})`,
        [approvalVoteId, v.member_id, tipo, v.curso || null, v.power_id || null]
      );
    }
    await db.execute(
      `UPDATE approval_votes SET status = 'open', total_padron = ?, opened_at = NOW(), abierta_por = ? WHERE id = ?`,
      [voters.length, operatorId, approvalVoteId]
    );
    await AssemblyQuorumService.logQuorumEvent(meetingId, 'VOTACION_DOC_ABIERTA', null, operatorId, {}, { cursos: moment.cursos_representados, estado: moment.estado }, `Votación "${vote.nombre}" padrón ${voters.length}`);
    return { approval_vote_id: approvalVoteId, total_padron: voters.length, status: 'open' };
  }

  /** Registra un voto individual (nominal). Transacción lógica. */
  static async castApprovalVote(meetingId, approvalVoteId, voterId, votoTipo, operatorId = null) {
    if (!VOTOS_VALIDOS.includes(votoTipo)) { const err = new Error('Tipo de voto no válido.'); err.status = 400; throw err; }
    const vote = await this._getVote(approvalVoteId);
    if (!vote) { const err = new Error('Votación no encontrada'); err.status = 404; throw err; }
    if (vote.status !== 'open') { const err = new Error('La votación no está abierta.'); err.status = 423; throw err; }

    const [voterRows] = await db.execute(`SELECT * FROM approval_voters WHERE approval_vote_id = ? AND member_id = ? LIMIT 1`, [approvalVoteId, voterId]);
    const voter = voterRows[0];
    if (!voter) { const err = new Error('Este delegado no está habilitado para votar en esta votación.'); err.status = 403; throw err; }
    const yaVoto = voter.ha_votado === true || voter.ha_votado === 1;
    if (yaVoto) { const err = new Error('Este delegado ya emitió su voto en esta votación.'); err.status = 409; throw err; }

    // Registrar voto nominal
    await db.execute(
      `INSERT INTO approval_vote_records (approval_vote_id, voter_id, voto_tipo, emitido_at, registrado_por)
       VALUES (?, ?, ?, NOW(), ?)`,
      [approvalVoteId, voterId, votoTipo, operatorId]
    );
    await db.execute(`UPDATE approval_voters SET ha_votado = ${this.isPostgreSQL ? 'true' : 1} WHERE id = ?`, [voter.id]);
    const col = votoTipo === 'A_FAVOR' ? 'votos_a_favor' : votoTipo === 'EN_CONTRA' ? 'votos_en_contra' : 'abstenciones';
    await db.execute(`UPDATE approval_votes SET ${col} = ${col} + 1 WHERE id = ?`, [approvalVoteId]);
    return { confirmado: true };
  }

  static async closeApprovalVote(meetingId, approvalVoteId, operatorId = null) {
    const vote = await this._getVote(approvalVoteId);
    if (!vote) { const err = new Error('Votación no encontrada'); err.status = 404; throw err; }
    if (vote.status !== 'open') { const err = new Error('La votación no está abierta.'); err.status = 409; throw err; }

    const aFavor = Number(vote.votos_a_favor || 0);
    const enContra = Number(vote.votos_en_contra || 0);
    const abstenciones = Number(vote.abstenciones || 0);
    const totalPadron = Number(vote.total_padron || 0);
    const votosComputables = aFavor + enContra;
    const noParticipo = Math.max(0, totalPadron - (aFavor + enContra + abstenciones));

    let decision, status;
    if (aFavor === enContra) { decision = 'EMPATE'; status = 'tied'; }
    else if (aFavor > enContra) { decision = 'APROBADO'; status = 'closed'; }
    else { decision = 'RECHAZADO'; status = 'closed'; }

    const resultado = {
      total_padron: totalPadron, votos_computables: votosComputables,
      votos_a_favor: aFavor, votos_en_contra: enContra, abstenciones, no_participo: noParticipo,
      decision, porcentaje_favor: votosComputables > 0 ? Math.round((aFavor / votosComputables) * 100) : null,
      mayoria_aplicada: vote.required_majority || 'simple'
    };

    await db.execute(
      `UPDATE approval_votes SET status = ?, resultado = ?, decision = ?, no_participo = ?, closed_at = NOW(), cerrada_por = ? WHERE id = ?`,
      [status, JSON.stringify(resultado), decision, noParticipo, operatorId, approvalVoteId]
    );

    // M6 — completar automáticamente el punto de agenda vinculado (si está en curso)
    try {
      const AgendaService = require('./assemblyAgendaService');
      await AgendaService.completeItemByLinkedObject('approval_vote', approvalVoteId, operatorId);
    } catch (e) { /* agenda opcional */ }

    try {
      const AssemblyQuorumService = require('./assemblyQuorumService');
      await AssemblyQuorumService.logQuorumEvent(meetingId, 'VOTACION_DOC_CERRADA', null, operatorId, {}, {}, `Votación "${vote.nombre}": ${decision} (${aFavor} vs ${enContra})`);
    } catch (e) { /* log opcional */ }

    return resultado;
  }

  static async getApprovalVoteResults(approvalVoteId) {
    const vote = await this._getVote(approvalVoteId);
    if (!vote) return null;
    let resultado = vote.resultado;
    if (typeof resultado === 'string') { try { resultado = JSON.parse(resultado); } catch (e) { resultado = null; } }
    const aFavor = Number(vote.votos_a_favor || 0), enContra = Number(vote.votos_en_contra || 0);
    return {
      approval_vote_id: vote.id, nombre: vote.nombre, punto_orden_dia: vote.punto_orden_dia,
      status: vote.status, decision: vote.decision,
      total_padron: Number(vote.total_padron || 0), votos_computables: aFavor + enContra,
      votos_a_favor: aFavor, votos_en_contra: enContra, abstenciones: Number(vote.abstenciones || 0),
      no_participo: Number(vote.no_participo || 0),
      porcentaje_favor: (aFavor + enContra) > 0 ? Math.round((aFavor / (aFavor + enContra)) * 100) : null,
      mayoria_aplicada: vote.required_majority || 'simple',
      resultado
    };
  }

  static async getApprovalVotePadron(approvalVoteId) {
    const [rows] = await db.execute(
      `SELECT av.member_id, m.name AS nombre, av.tipo_votante, av.vota_por_curso, av.ha_votado
       FROM approval_voters av LEFT JOIN members m ON m.id = av.member_id
       WHERE av.approval_vote_id = ? ORDER BY av.vota_por_curso`,
      [approvalVoteId]
    );
    return rows.map(r => ({ ...r, ha_votado: r.ha_votado === true || r.ha_votado === 1 }));
  }

  static async getApprovalVotesByMeeting(meetingId) {
    const [rows] = await db.execute(
      `SELECT id AS approval_vote_id, nombre, punto_orden_dia, status, decision,
              total_padron, votos_a_favor, votos_en_contra, abstenciones, opened_at, closed_at
       FROM approval_votes WHERE meeting_id = ? ORDER BY created_at`,
      [meetingId]
    );
    return rows;
  }
}

module.exports = AssemblyApprovalService;
