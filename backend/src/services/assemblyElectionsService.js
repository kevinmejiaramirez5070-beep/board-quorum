const db = require('../config/database');

/**
 * Módulo 4 — Procesos Electorales (voto NOMINAL, VF-04 confirmado).
 * Soporta elecciones unipersonales (mayoría simple, 1 ganador).
 * tipo_eleccion 'multicargo' (VF-07) y 'revisoria_fiscal' (VF-06) quedan con el
 * campo pero SIN lógica especial de asignación (pendiente definición).
 * Voto: candidato registrado, en blanco (candidate_id null) o nulo (contingencia).
 * Padrón congelado al abrir. No coexiste con otra elección/votación abierta.
 * Usa tabla election_votes (NO 'votes', que es de Junta Directiva). No toca quorumService.js.
 */
class AssemblyElectionsService {
  static get isPostgreSQL() {
    return !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
  }

  static async _getMeeting(meetingId) {
    const [rows] = await db.execute(`SELECT id, status, type, product_id, client_id FROM meetings WHERE id = ? LIMIT 1`, [meetingId]);
    return rows[0] || null;
  }
  static async _getElection(id) {
    const [rows] = await db.execute(`SELECT * FROM elections WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  static async createElection(meetingId, nombre, descripcion = null, puntoOrdenDia = null, tipoEleccion = 'unipersonal', operatorId = null) {
    const meeting = await this._getMeeting(meetingId);
    if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
    if (['closed', 'completed', 'archived'].includes(meeting.status)) { const err = new Error('La sesión está cerrada.'); err.status = 423; throw err; }
    if (!nombre || !nombre.trim()) { const err = new Error('El nombre de la elección es requerido.'); err.status = 400; throw err; }

    const returning = this.isPostgreSQL ? ' RETURNING id' : '';
    const [rows] = await db.execute(
      `INSERT INTO elections (meeting_id, product_id, nombre, descripcion, punto_orden_dia, tipo_eleccion, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', NOW())${returning}`,
      [meetingId, meeting.product_id, nombre.trim(), descripcion, puntoOrdenDia, tipoEleccion || 'unipersonal']
    );
    const id = this.isPostgreSQL ? rows?.[0]?.id : rows?.insertId;
    return { election_id: id, status: 'draft' };
  }

  static async addCandidate(electionId, nombre, descripcion = null) {
    const election = await this._getElection(electionId);
    if (!election) { const err = new Error('Elección no encontrada'); err.status = 404; throw err; }
    if (election.status !== 'draft') { const err = new Error('No se pueden modificar candidatos con la elección abierta.'); err.status = 423; throw err; }
    if (!nombre || !nombre.trim()) { const err = new Error('El nombre del candidato es requerido.'); err.status = 400; throw err; }

    const returning = this.isPostgreSQL ? ' RETURNING id' : '';
    const [rows] = await db.execute(
      `INSERT INTO election_candidates (election_id, nombre, descripcion, votos, created_at) VALUES (?, ?, ?, 0, NOW())${returning}`,
      [electionId, nombre.trim(), descripcion]
    );
    const id = this.isPostgreSQL ? rows?.[0]?.id : rows?.insertId;
    return { candidate_id: id, nombre: nombre.trim() };
  }

  static async openElection(meetingId, electionId, operatorId = null) {
    const meeting = await this._getMeeting(meetingId);
    if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
    if (meeting.status !== 'active') { const err = new Error('Solo se pueden abrir elecciones en sesiones activas.'); err.status = 403; throw err; }

    const election = await this._getElection(electionId);
    if (!election) { const err = new Error('Elección no encontrada'); err.status = 404; throw err; }
    if (election.status !== 'draft') { const err = new Error('La elección no está en borrador.'); err.status = 409; throw err; }

    // V-04: al menos un candidato
    const [cand] = await db.execute(`SELECT COUNT(*) AS n FROM election_candidates WHERE election_id = ?`, [electionId]);
    if (Number(cand[0]?.n || 0) === 0) { const err = new Error('Registre al menos un candidato antes de abrir la elección.'); err.status = 400; throw err; }

    // V-02: quórum
    const AssemblyQuorumService = require('./assemblyQuorumService');
    const moment = await AssemblyQuorumService.getQuorumMoment(meetingId, meeting.client_id, meeting.product_id);
    if (moment.estado === 'SIN_QUORUM') { const err = new Error('Sin quórum — no es posible abrir una elección.'); err.status = 423; throw err; }

    // V-03: no otra elección abierta / no votación documental abierta
    const [openElec] = await db.execute(`SELECT id FROM elections WHERE meeting_id = ? AND status = 'open' LIMIT 1`, [meetingId]);
    if (openElec.length) { const err = new Error('Ya existe una elección abierta en esta sesión.'); err.status = 409; throw err; }
    try {
      const [openDoc] = await db.execute(`SELECT id FROM approval_votes WHERE meeting_id = ? AND status = 'open' LIMIT 1`, [meetingId]);
      if (openDoc.length) { const err = new Error('Ya existe una votación o elección abierta en esta sesión.'); err.status = 409; throw err; }
    } catch (e) { /* tabla approval_votes puede no existir */ }

    // Congelar padrón
    const voters = await AssemblyQuorumService.getActiveVoters(meetingId);
    for (const v of voters) {
      const tipo = v.tipo_votante === 'apoderado' ? 'apoderado' : v.acting_as_principal ? 'suplente_actuando' : (v.tipo_votante || 'principal');
      await db.execute(
        `INSERT INTO election_voters (election_id, member_id, tipo_votante, vota_por_curso, power_id, ha_votado)
         VALUES (?, ?, ?, ?, ?, ${this.isPostgreSQL ? 'false' : 0})`,
        [electionId, v.member_id, tipo, v.curso || null, v.power_id || null]
      );
    }
    await db.execute(`UPDATE elections SET status = 'open', total_padron = ?, opened_at = NOW(), abierta_por = ? WHERE id = ?`, [voters.length, operatorId, electionId]);
    await AssemblyQuorumService.logQuorumEvent(meetingId, 'ELECCION_ABIERTA', null, operatorId, {}, { cursos: moment.cursos_representados, estado: moment.estado }, `Elección "${election.nombre}" padrón ${voters.length}`);
    return { election_id: electionId, total_padron: voters.length, status: 'open' };
  }

  /** Voto nominal. candidateId null = voto en blanco. votoNulo = contingencia papel. */
  static async castVote(meetingId, electionId, voterId, candidateId = null, operatorId = null, votoNulo = false, notaNulo = null) {
    const election = await this._getElection(electionId);
    if (!election) { const err = new Error('Elección no encontrada'); err.status = 404; throw err; }
    if (election.status !== 'open') { const err = new Error('La elección no está abierta.'); err.status = 423; throw err; }

    const [voterRows] = await db.execute(`SELECT * FROM election_voters WHERE election_id = ? AND member_id = ? LIMIT 1`, [electionId, voterId]);
    const voter = voterRows[0];
    if (!voter) { const err = new Error('Este delegado no está habilitado para votar en esta elección.'); err.status = 403; throw err; }
    if (voter.ha_votado === true || voter.ha_votado === 1) { const err = new Error('Este delegado ya emitió su voto.'); err.status = 409; throw err; }

    // V-07: candidato válido de esta elección (si no es blanco ni nulo)
    if (candidateId && !votoNulo) {
      const [c] = await db.execute(`SELECT id FROM election_candidates WHERE id = ? AND election_id = ? LIMIT 1`, [candidateId, electionId]);
      if (!c.length) { const err = new Error('Candidato no válido para esta elección.'); err.status = 400; throw err; }
    }

    const nuloVal = this.isPostgreSQL ? (votoNulo ? 'true' : 'false') : (votoNulo ? 1 : 0);
    await db.execute(
      `INSERT INTO election_votes (election_id, voter_id, candidate_id, voto_nulo, nota_nulo, emitido_at, registrado_por)
       VALUES (?, ?, ?, ${nuloVal}, ?, NOW(), ?)`,
      [electionId, voterId, votoNulo ? null : candidateId, notaNulo, operatorId]
    );
    await db.execute(`UPDATE election_voters SET ha_votado = ${this.isPostgreSQL ? 'true' : 1} WHERE id = ?`, [voter.id]);
    await db.execute(`UPDATE elections SET votos_emitidos = votos_emitidos + 1 WHERE id = ?`, [electionId]);
    if (candidateId && !votoNulo) {
      await db.execute(`UPDATE election_candidates SET votos = votos + 1 WHERE id = ?`, [candidateId]);
    }
    return { confirmado: true };
  }

  static async closeElection(meetingId, electionId, operatorId = null) {
    const election = await this._getElection(electionId);
    if (!election) { const err = new Error('Elección no encontrada'); err.status = 404; throw err; }
    if (election.status !== 'open') { const err = new Error('La elección no está abierta.'); err.status = 409; throw err; }

    const totalPadron = Number(election.total_padron || 0);
    const votosEmitidos = Number(election.votos_emitidos || 0);
    const abstenciones = Math.max(0, totalPadron - votosEmitidos);

    const [nulosRows] = await db.execute(`SELECT COUNT(*) AS n FROM election_votes WHERE election_id = ? AND ${this.isPostgreSQL ? 'voto_nulo = true' : 'voto_nulo = 1'}`, [electionId]);
    const votosNulos = Number(nulosRows[0]?.n || 0);
    const [blancoRows] = await db.execute(`SELECT COUNT(*) AS n FROM election_votes WHERE election_id = ? AND candidate_id IS NULL AND ${this.isPostgreSQL ? 'voto_nulo = false' : 'voto_nulo = 0'}`, [electionId]);
    const votosEnBlanco = Number(blancoRows[0]?.n || 0);
    const votosNominativos = Math.max(0, votosEmitidos - votosNulos - votosEnBlanco);

    const [cands] = await db.execute(`SELECT id, nombre, votos FROM election_candidates WHERE election_id = ? ORDER BY votos DESC, nombre`, [electionId]);
    const candidatos = cands.map(c => ({
      id: c.id, nombre: c.nombre, votos: Number(c.votos || 0),
      porcentaje: votosNominativos > 0 ? Math.round((Number(c.votos || 0) / votosNominativos) * 100) : 0
    }));

    const maxVotos = candidatos.length ? candidatos[0].votos : 0;
    const conMax = candidatos.filter(c => c.votos === maxVotos && maxVotos > 0);
    const empate = conMax.length > 1;
    const ganador = (!empate && conMax.length === 1) ? conMax[0] : null;
    const status = empate ? 'tied' : 'closed';

    const resultado = {
      total_padron: totalPadron, votos_emitidos: votosEmitidos, abstenciones,
      votos_nulos: votosNulos, votos_en_blanco: votosEnBlanco, votos_nominativos: votosNominativos,
      candidatos, ganador_id: ganador?.id || null, ganador_nombre: ganador?.nombre || null,
      empate, mayoria_aplicada: election.required_majority || 'simple'
    };

    await db.execute(`UPDATE elections SET status = ?, resultado = ?, closed_at = NOW(), cerrada_por = ? WHERE id = ?`,
      [status, JSON.stringify(resultado), operatorId, electionId]);

    // M6 — completar punto de agenda vinculado
    try {
      const AgendaService = require('./assemblyAgendaService');
      await AgendaService.completeItemByLinkedObject('election', electionId, operatorId);
    } catch (e) { /* opcional */ }
    try {
      const AssemblyQuorumService = require('./assemblyQuorumService');
      await AssemblyQuorumService.logQuorumEvent(meetingId, 'ELECCION_CERRADA', null, operatorId, {}, {}, `Elección "${election.nombre}": ${empate ? 'EMPATE' : ('ganó ' + (ganador?.nombre || 'N/A'))}`);
    } catch (e) { /* opcional */ }

    return resultado;
  }

  static async getElectionResults(electionId) {
    const election = await this._getElection(electionId);
    if (!election) return null;
    let resultado = election.resultado;
    if (typeof resultado === 'string') { try { resultado = JSON.parse(resultado); } catch (e) { resultado = null; } }
    // En tiempo real (open) recalcular candidatos actuales
    const [cands] = await db.execute(`SELECT id, nombre, votos FROM election_candidates WHERE election_id = ? ORDER BY votos DESC, nombre`, [electionId]);
    return {
      election_id: election.id, nombre: election.nombre, tipo_eleccion: election.tipo_eleccion,
      status: election.status, total_padron: Number(election.total_padron || 0), votos_emitidos: Number(election.votos_emitidos || 0),
      candidatos: cands.map(c => ({ id: c.id, nombre: c.nombre, votos: Number(c.votos || 0) })),
      resultado
    };
  }

  static async getElectionPadron(electionId) {
    const [rows] = await db.execute(
      `SELECT ev.member_id, m.name AS nombre, ev.tipo_votante, ev.vota_por_curso, ev.ha_votado
       FROM election_voters ev LEFT JOIN members m ON m.id = ev.member_id
       WHERE ev.election_id = ? ORDER BY ev.vota_por_curso`,
      [electionId]
    );
    return rows.map(r => ({ ...r, ha_votado: r.ha_votado === true || r.ha_votado === 1 }));
  }

  static async getElectionCandidates(electionId) {
    const [rows] = await db.execute(`SELECT id AS candidate_id, nombre, descripcion, votos FROM election_candidates WHERE election_id = ? ORDER BY nombre`, [electionId]);
    return rows;
  }

  static async getElectionsByMeeting(meetingId) {
    const [rows] = await db.execute(
      `SELECT id AS election_id, nombre, tipo_eleccion, punto_orden_dia, status,
              total_padron, votos_emitidos, opened_at, closed_at, resultado
       FROM elections WHERE meeting_id = ? ORDER BY created_at`,
      [meetingId]
    );
    return rows.map(r => {
      let resultado = r.resultado;
      if (typeof resultado === 'string') { try { resultado = JSON.parse(resultado); } catch (e) { resultado = null; } }
      return { ...r, resultado };
    });
  }
}

module.exports = AssemblyElectionsService;
