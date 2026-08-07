const db = require('../config/database');

/**
 * Módulo 1 — Motor de Quórum de Asamblea.
 *
 * Unidad de cómputo: el CURSO (rol_organico), no la persona (Regla 1).
 * Un curso representado = hay un Principal presente y aprobado, o en su ausencia
 * un Suplente presente y aprobado que actúa como principal (Regla 2/3).
 *
 * Umbrales dinámicos desde el maestro vigente (Regla 5), NUNCA hardcodeados:
 *   quorum_m1 = FLOOR(total_principales / 2) + 1
 *   quorum_m2 = CEIL(total_principales * 0.20)
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
      `SELECT DISTINCT rol_organico FROM members
       WHERE product_id = ? AND member_type = 'principal' AND ${isPG ? 'active = true' : 'active = 1'}
         AND rol_organico IS NOT NULL AND rol_organico <> ''`,
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
         AND m.product_id = ? AND ${activeCond} AND ${pendingOk}`,
      [meetingId, productId]
    );

    // Indexar presentes por curso
    const principalByCurso = new Map();
    const suplenteByCurso = new Map();
    for (const p of present) {
      const curso = this._norm(p.rol_organico);
      if (p.member_type === 'principal') {
        if (!principalByCurso.has(curso)) principalByCurso.set(curso, p);
      } else if (p.member_type === 'suplente') {
        if (!suplenteByCurso.has(curso)) suplenteByCurso.set(curso, p);
      }
    }

    return cursos.map(curso => {
      const principal = principalByCurso.get(curso);
      const suplente = suplenteByCurso.get(curso);
      if (principal) {
        return {
          curso, representado: true,
          votante_id: principal.member_id, votante_nombre: principal.name,
          tipo_votante: 'principal', acting_as_principal: false
        };
      }
      if (suplente) {
        return {
          curso, representado: true,
          votante_id: suplente.member_id, votante_nombre: suplente.name,
          tipo_votante: 'suplente', acting_as_principal: true
        };
      }
      return { curso, representado: false, votante_id: null, votante_nombre: null, tipo_votante: null, acting_as_principal: false };
    });
  }

  /** Número de cursos representados. */
  static async getRepresentedCoursesCount(meetingId) {
    const status = await this.getCourseRepresentationStatus(meetingId);
    return status.filter(c => c.representado).length;
  }

  /** Total de principales activos del maestro (base de los umbrales). */
  static async getTotalPrincipals(productId) {
    const isPG = this.isPostgreSQL;
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS n FROM members
       WHERE product_id = ? AND member_type = 'principal' AND ${isPG ? 'active = true' : 'active = 1'}`,
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
    const quorum_m1 = total_principales > 0 ? Math.floor(total_principales / 2) + 1 : 0;
    const quorum_m2 = total_principales > 0 ? Math.ceil(total_principales * 0.20) : 0;
    const cursos_representados = await this.getRepresentedCoursesCount(meetingId);

    let momento = null;
    let estado = 'SIN_QUORUM';
    if (total_principales > 0 && cursos_representados >= quorum_m1) {
      momento = 1; estado = 'MOMENTO_1';
    } else if (total_principales > 0 && cursos_representados >= quorum_m2) {
      momento = 2; estado = 'MOMENTO_2';
    }

    return { momento, estado, cursos_representados, quorum_m1, quorum_m2, total_principales };
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

    const moment = await this.getQuorumMoment(meetingId, cid, pid);

    // Poderes activos (Módulo 3) — 0 si la tabla aún no existe
    let representaciones_por_poder = 0;
    try {
      const isPG = this.isPostgreSQL;
      const activeCond = isPG ? "status = 'active'" : "status = 'active'";
      const [pw] = await db.execute(
        `SELECT COUNT(*) AS n FROM assembly_powers WHERE meeting_id = ? AND ${activeCond}`,
        [meetingId]
      );
      representaciones_por_poder = Number(pw[0]?.n || 0);
    } catch (e) { /* tabla M3 aún no existe */ }

    const votantes_activos = status
      .filter(c => c.representado)
      .map(c => ({ member_id: c.votante_id, nombre: c.votante_nombre, curso: c.curso, tipo_votante: c.tipo_votante }));

    return {
      cursos_habilitados,
      cursos_representados,
      principales_presentes,
      suplentes_actuando,
      representaciones_por_poder,
      momento_quorum: moment.momento,
      estado: moment.estado,
      quorum_m1: moment.quorum_m1,
      quorum_m2: moment.quorum_m2,
      total_principales: moment.total_principales,
      votantes_activos,
      cursos: status,
      ultima_actualizacion: new Date().toISOString()
    };
  }
}

module.exports = AssemblyQuorumService;
