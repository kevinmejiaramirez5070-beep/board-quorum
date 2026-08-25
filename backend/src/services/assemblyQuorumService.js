const db = require('../config/database');

/**
 * Módulo 1 — Motor de Quórum de Asamblea.
 *
 * Unidad de cómputo: el CURSO (rol_organico), no la persona (Regla 1).
 * Un curso representado = hay un Principal presente y aprobado, o en su ausencia
 * un Suplente presente y aprobado que actúa como principal (Regla 2/3).
 *
 * Umbrales dinámicos desde el maestro vigente (Regla 5), NUNCA hardcodeados:
 *   quorum_m1 = CEIL(total_principales / 2) + 1     (MD-06: "mitad más uno")
 *   quorum_m2 = CEIL(total_principales * 0.20)      (Momento Siguiente, 20 %)
 *
 * MD-06 fija los valores de control de la base validada de agosto 2026:
 *   N = 85  ->  quorum inicial 44,  Momento Siguiente 17
 * Para N impar, "la mitad más uno" se toma como el primer entero que supera
 * (N/2 + 1): 85/2 = 42,5; 42,5 + 1 = 43,5; se exige 44.
 *
 * Confirmado por el cliente el 2026-08-25: con 85 Principales, el número para
 * arrancar a las 6:00 p. m. es 44. Si no se alcanza, se aplica el Momento
 * Siguiente y el número pasa a 17 hasta las 7:00 p. m. El universo no cambia.
 * "Representación" = Principal presente, o Suplente actuando como Principal.
 *
 * NO modifica quorumService.js (Junta Directiva intacta).
 */
class AssemblyQuorumService {
  static get isPostgreSQL() {
    return !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
  }

  static _norm(s) {
    return String(s ?? '').toUpperCase().trim();
  }

  /**
   * MD-05 — Tipos de participante que asisten pero NO generan representación.
   *
   * Administración, Contabilidad y Revisoría Fiscal pueden estar presentes y quedar
   * registrados en la Asamblea, pero no crean posición de representación, no
   * aumentan el universo de elegibles, no cuentan para quórum y no votan por esa
   * condición. Se listan en varias grafías porque el maestro se carga desde XLSX.
   */
  static get NON_COMPUTABLE_TIPOS() {
    return [
      'ADMINISTRACION', 'ADMINISTRACIÓN',
      'CONTABILIDAD',
      'REVISORIA_FISCAL', 'REVISORIA FISCAL', 'REVISORÍA FISCAL', 'REVISORIA', 'REVISORÍA'
    ];
  }

  /** Fragmento SQL que excluye a los participantes no computables. */
  static _nonComputableSQL(alias = 'm') {
    const lista = this.NON_COMPUTABLE_TIPOS.map(t => `'${t}'`).join(', ');
    return `(${alias}.tipo_participante IS NULL OR UPPER(TRIM(${alias}.tipo_participante)) NOT IN (${lista}))`;
  }

  /** ¿Este participante queda fuera del cómputo por su tipo? (MD-05) */
  static isNonComputable(tipoParticipante) {
    return this.NON_COMPUTABLE_TIPOS.includes(this._norm(tipoParticipante));
  }

  /** Obtiene product_id y client_id de la reunión. */
  static async _getMeetingContext(meetingId) {
    const [rows] = await db.execute(
      `SELECT id, product_id, client_id, type, status FROM meetings WHERE id = ? LIMIT 1`,
      [meetingId]
    );
    return rows[0] || null;
  }

  /**
   * Estado de representación por curso.
   * Retorna [{ curso, representado, votante_id, votante_nombre, tipo_votante, acting_as_principal }]
   */
  static async getCourseRepresentationStatus(meetingId) {
    const ctx = await this._getMeetingContext(meetingId);
    if (!ctx) return [];
    const productId = ctx.product_id;
    const isPG = this.isPostgreSQL;
    const activeCond = isPG ? 'm.active = true' : 'm.active = 1';
    const pendingOk = isPG
      ? 'COALESCE(a.pending_approval, false) = false'
      : '(a.pending_approval IS NULL OR a.pending_approval = 0)';

    // Todos los cursos habilitados = cursos con al menos un principal activo en el maestro
    const [courseRows] = await db.execute(
      `SELECT DISTINCT rol_organico FROM members m
       WHERE m.product_id = ? AND m.member_type = 'principal' AND ${isPG ? 'm.active = true' : 'm.active = 1'}
         AND m.rol_organico IS NOT NULL AND m.rol_organico <> ''
         AND ${this._nonComputableSQL('m')}`,
      [productId]
    );
    const cursos = courseRows.map(r => this._norm(r.rol_organico));

    // Presentes y aprobados (con member_id del producto)
    const [present] = await db.execute(
      `SELECT a.member_id, a.acting_as_principal,
              m.name, m.member_type, m.rol_organico
       FROM attendance a
       JOIN members m ON m.id = a.member_id
       WHERE a.meeting_id = ? AND a.status = 'present'
         AND m.product_id = ? AND ${activeCond} AND ${pendingOk}
         AND ${this._nonComputableSQL('m')}`,
      [meetingId, productId]
    );

    // Indexar presentes por curso
    const principalByCurso = new Map();
    const suplenteByCurso = new Map();
    const presentIds = new Set(present.map(p => Number(p.member_id)));
    for (const p of present) {
      const curso = this._norm(p.rol_organico);
      if (p.member_type === 'principal') {
        if (!principalByCurso.has(curso)) principalByCurso.set(curso, p);
      } else if (p.member_type === 'suplente') {
        if (!suplenteByCurso.has(curso)) suplenteByCurso.set(curso, p);
      }
    }

    // M3 — poderes: por curso, si hay poder con apoderado presente (nivel 3 de la jerarquía)
    const powerByCurso = new Map();
    try {
      const [powers] = await db.execute(
        `SELECT rp.id AS power_id, UPPER(TRIM(rp.curso)) AS curso, rp.apoderado_id, apo.name AS apoderado_nombre
         FROM representation_powers rp LEFT JOIN members apo ON apo.id = rp.apoderado_id
         WHERE rp.meeting_id = ? AND rp.status IN ('registered','active','suspended')`,
        [meetingId]
      );
      for (const pw of powers) {
        const curso = this._norm(pw.curso);
        if (!powerByCurso.has(curso) && presentIds.has(Number(pw.apoderado_id))) powerByCurso.set(curso, pw);
      }
    } catch (e) { /* tabla de poderes aún no existe */ }

    return cursos.map(curso => {
      const principal = principalByCurso.get(curso);
      const suplente = suplenteByCurso.get(curso);
      const power = powerByCurso.get(curso);
      if (principal) {
        return {
          curso, representado: true,
          votante_id: principal.member_id, votante_nombre: principal.name,
          tipo_votante: 'principal', acting_as_principal: false, power_id: null, apoderado_id: null
        };
      }
      if (suplente) {
        return {
          curso, representado: true,
          votante_id: suplente.member_id, votante_nombre: suplente.name,
          tipo_votante: 'suplente', acting_as_principal: true, power_id: null, apoderado_id: null
        };
      }
      if (power) {
        return {
          curso, representado: true,
          votante_id: power.apoderado_id, votante_nombre: power.apoderado_nombre,
          tipo_votante: 'apoderado', acting_as_principal: false, power_id: power.power_id, apoderado_id: power.apoderado_id
        };
      }
      return { curso, representado: false, votante_id: null, votante_nombre: null, tipo_votante: null, acting_as_principal: false, power_id: null, apoderado_id: null };
    });
  }

  /** Número de cursos representados. */
  static async getRepresentedCoursesCount(meetingId) {
    const status = await this.getCourseRepresentationStatus(meetingId);
    return status.filter(c => c.representado).length;
  }

  /**
   * Diagnostica por qué el universo de elegibles sale en cero.
   * Sin esto el panel muestra "0" sin decir qué falta, y quien opera la Asamblea
   * no puede distinguir "nadie ha llegado" de "el maestro no está cargado".
   */
  static async getUniverseDiagnostic(meetingId) {
    const ctx = await this._getMeetingContext(meetingId);
    if (!ctx) return { ok: false, motivo: 'REUNION_NO_ENCONTRADA' };

    if (ctx.product_id == null) {
      return {
        ok: false,
        motivo: 'SIN_PRODUCTO',
        mensaje: 'La reunión no tiene un órgano (producto) asignado, así que no hay ' +
                 'maestro de Delegados del cual calcular el universo de elegibles. ' +
                 'Asigne el producto de Asamblea General a esta reunión.'
      };
    }

    const total = await this.getTotalPrincipals(ctx.product_id);
    if (total > 0) return { ok: true, motivo: null, product_id: ctx.product_id, total_principales: total };

    const isPG = this.isPostgreSQL;
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS n FROM members
       WHERE product_id = ? AND ${isPG ? 'active = true' : 'active = 1'}`,
      [ctx.product_id]
    );
    const cargados = Number(rows[0]?.n || 0);

    return {
      ok: false,
      product_id: ctx.product_id,
      motivo: cargados === 0 ? 'MAESTRO_VACIO' : 'SIN_PRINCIPALES',
      miembros_cargados: cargados,
      mensaje: cargados === 0
        ? 'El órgano asignado a esta reunión no tiene Delegados cargados. ' +
          'Importe el maestro de Delegados de la Asamblea (Módulo 2).'
        : `El órgano tiene ${cargados} registros activos, pero ninguno marcado como ` +
          'Delegado Principal. Revise la columna de tipo en el maestro importado: ' +
          'el universo de quórum se cuenta sobre Principales habilitados.'
    };
  }

  /** Total de principales activos del maestro (base de los umbrales). */
  static async getTotalPrincipals(productId) {
    if (productId == null) return 0;
    const isPG = this.isPostgreSQL;
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS n FROM members m
       WHERE m.product_id = ? AND m.member_type = 'principal' AND ${isPG ? 'm.active = true' : 'm.active = 1'}
         AND ${this._nonComputableSQL('m')}`,
      [productId]
    );
    return Number(rows[0]?.n || 0);
  }

  /**
   * Evalúa el momento de quórum.
   * { momento, estado, cursos_representados, quorum_m1, quorum_m2, total_principales }
   */
  static async getQuorumMoment(meetingId, clientId = null, productId = null) {
    const ctx = await this._getMeetingContext(meetingId);
    const pid = productId ?? ctx?.product_id;
    const total_principales = await this.getTotalPrincipals(pid);
    const quorum_m1 = total_principales > 0 ? Math.ceil(total_principales / 2) + 1 : 0;
    const quorum_m2 = total_principales > 0 ? Math.ceil(total_principales * 0.20) : 0;
    const cursos_representados = await this.getRepresentedCoursesCount(meetingId);

    // MD-02: el régimen del 20 % NO se activa solo. Requiere que un usuario
    // operativo haya aplicado expresamente el Momento Siguiente. Mientras eso no
    // ocurra, la Asamblea se evalúa siempre contra el quórum inicial.
    let momentoSiguiente = null;
    try {
      const MomentService = require('./assemblyMomentService');
      momentoSiguiente = await MomentService.getMomentState(meetingId);
    } catch (e) { /* tabla MD-02 aún no disponible */ }
    const enMomentoSiguiente = !!momentoSiguiente?.aplicado;

    const requerido = enMomentoSiguiente ? quorum_m2 : quorum_m1;
    let momento = null;
    let estado = 'SIN_QUORUM';
    if (total_principales > 0 && cursos_representados >= requerido) {
      momento = enMomentoSiguiente ? 2 : 1;
      estado = enMomentoSiguiente ? 'MOMENTO_2' : 'MOMENTO_1';
    }

    return {
      momento, estado, cursos_representados,
      quorum_m1, quorum_m2, total_principales,
      quorum_requerido: requerido,
      en_momento_siguiente: enMomentoSiguiente,
      momento_siguiente: momentoSiguiente
    };
  }

  /** Lista de votantes activos: un votante por curso representado (padrón base M3/M4/M5). */
  static async getActiveVoters(meetingId) {
    const status = await this.getCourseRepresentationStatus(meetingId);
    return status
      .filter(c => c.representado)
      .map(c => ({
        member_id: c.votante_id,
        nombre: c.votante_nombre,
        curso: c.curso,
        tipo_votante: c.tipo_votante,
        acting_as_principal: c.acting_as_principal
      }));
  }

  /** Escribe un evento en quorum_log (trazabilidad, Regla 9). No lanza en caso de error. */
  static async logQuorumEvent(meetingId, eventType, memberId = null, operatorId = null, antes = {}, despues = {}, detalle = '') {
    try {
      await db.execute(
        `INSERT INTO quorum_log
           (meeting_id, event_type, member_id, operator_id, cursos_antes, cursos_despues, estado_antes, estado_despues, detalle, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          meetingId, eventType, memberId, operatorId,
          antes?.cursos ?? null, despues?.cursos ?? null,
          antes?.estado ?? null, despues?.estado ?? null, detalle || null
        ]
      );
    } catch (e) {
      console.warn('[assembly] logQuorumEvent falló:', e.message);
    }
  }

  /** Objeto completo para el panel de control de la Asamblea. */
  static async getFullAssemblyPanel(meetingId, clientId = null, productId = null) {
    const ctx = await this._getMeetingContext(meetingId);
    const pid = productId ?? ctx?.product_id;
    const cid = clientId ?? ctx?.client_id;

    const status = await this.getCourseRepresentationStatus(meetingId);
    const cursos_habilitados = status.length;
    const cursos_representados = status.filter(c => c.representado).length;
    const principales_presentes = status.filter(c => c.representado && c.tipo_votante === 'principal').length;
    const suplentes_actuando = status.filter(c => c.representado && c.tipo_votante === 'suplente').length;
    // M3 — cursos representados por poder (apoderado presente)
    const representaciones_por_poder = status.filter(c => c.representado && c.tipo_votante === 'apoderado').length;

    const moment = await this.getQuorumMoment(meetingId, cid, pid);

    const votantes_activos = status
      .filter(c => c.representado)
      .map(c => ({ member_id: c.votante_id, nombre: c.votante_nombre, curso: c.curso, tipo_votante: c.tipo_votante }));

    // M6 — estado de la agenda (si existe)
    let agenda_status = null;
    try {
      const AgendaService = require('./assemblyAgendaService');
      const agenda = await AgendaService.getAgendaWithProgress(meetingId);
      if (agenda) {
        agenda_status = {
          status: agenda.status,
          total_puntos: agenda.total_puntos,
          puntos_completados: agenda.puntos_completados,
          porcentaje_avance: agenda.porcentaje_avance,
          punto_en_curso: agenda.punto_en_curso
        };
      }
    } catch (e) { /* agenda aún no creada */ }

    // M5 — votación documental abierta
    let votacion_documental_activa = null;
    try {
      const ApprovalService = require('./assemblyApprovalService');
      const list = await ApprovalService.getApprovalVotesByMeeting(meetingId);
      const open = list.find(v => v.status === 'open');
      if (open) {
        const emitidos = Number(open.votos_a_favor || 0) + Number(open.votos_en_contra || 0) + Number(open.abstenciones || 0);
        votacion_documental_activa = {
          approval_vote_id: open.approval_vote_id, nombre: open.nombre, punto_orden_dia: open.punto_orden_dia,
          votos_a_favor: open.votos_a_favor, votos_en_contra: open.votos_en_contra, abstenciones: open.abstenciones,
          total_padron: open.total_padron,
          progreso: open.total_padron > 0 ? Math.round((emitidos / open.total_padron) * 100) : 0
        };
      }
    } catch (e) { /* tabla M5 aún no existe */ }

    // M4 — elección abierta
    let eleccion_activa = null;
    try {
      const ElectionsService = require('./assemblyElectionsService');
      const list = await ElectionsService.getElectionsByMeeting(meetingId);
      const open = list.find(e => e.status === 'open');
      if (open) {
        eleccion_activa = {
          election_id: open.election_id, nombre: open.nombre,
          votos_emitidos: open.votos_emitidos, total_padron: open.total_padron,
          progreso: open.total_padron > 0 ? Math.round((Number(open.votos_emitidos || 0) / open.total_padron) * 100) : 0
        };
      }
    } catch (e) { /* tabla M4 aún no existe */ }

    // M7 — roles de sesión activos
    let roles_activos = null;
    try {
      const RolesService = require('./assemblyRolesService');
      const roles = await RolesService.getSessionRoles(meetingId);
      roles_activos = {
        presidente: roles.presidente_asamblea?.person_name || null,
        secretario: roles.secretario_asamblea?.person_name || null,
        comision_verificadora: roles.comision_verificadora.map(m => m.person_name),
        comision_aprobadora: roles.comision_aprobadora.map(m => m.person_name)
      };
    } catch (e) { /* tabla roles aún no existe */ }

    const diagnostico = cursos_habilitados === 0 ? await this.getUniverseDiagnostic(meetingId) : null;

    return {
      diagnostico_universo: diagnostico,
      agenda_status,
      roles_activos,
      votacion_documental_activa,
      eleccion_activa,
      cursos_habilitados,
      cursos_representados,
      principales_presentes,
      suplentes_actuando,
      representaciones_por_poder,
      momento_quorum: moment.momento,
      estado: moment.estado,
      quorum_m1: moment.quorum_m1,
      quorum_m2: moment.quorum_m2,
      quorum_requerido: moment.quorum_requerido,
      en_momento_siguiente: moment.en_momento_siguiente,
      momento_siguiente: moment.momento_siguiente,
      total_principales: moment.total_principales,
      votantes_activos,
      cursos: status,
      ultima_actualizacion: new Date().toISOString()
    };
  }
}

module.exports = AssemblyQuorumService;
