const db = require('../config/database');

/**
 * Módulo 3 — Transferencia de Representación (Poderes).
 * Un poder permite que un delegado (apoderado) represente el curso de un Principal
 * ausente cuando también su Suplente está ausente (Regla 2 / jerarquía Regla 8).
 * NO modifica la tabla members. NO implementa límite de representaciones (VF-03)
 * ni endpoint de revocación (VF-06).
 */
class AssemblyPowersService {
  static get isPostgreSQL() {
    return !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
  }

  static async _getMeeting(meetingId) {
    const [rows] = await db.execute(`SELECT id, status, type, product_id, client_id FROM meetings WHERE id = ? LIMIT 1`, [meetingId]);
    return rows[0] || null;
  }

  static async _getMember(memberId, productId) {
    const [rows] = await db.execute(`SELECT * FROM members WHERE id = ? AND product_id = ? LIMIT 1`, [memberId, productId]);
    return rows[0] || null;
  }

  /** Registra un poder (V-01, V-02, V-04, V-05, V-07). V-03 suspendida (VF-03). */
  static async registerPower(meetingId, poderdanteId, apoderadoId, operatorId, notas = null) {
    const isPG = this.isPostgreSQL;
    const meeting = await this._getMeeting(meetingId);
    if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
    if (['closed', 'completed', 'archived'].includes(meeting.status)) { const err = new Error('Sesión cerrada — poderes inmutables.'); err.status = 423; throw err; }

    // V-05
    if (Number(poderdanteId) === Number(apoderadoId)) { const err = new Error('Un delegado no puede otorgarse poder a sí mismo.'); err.status = 400; throw err; }

    const activeCond = isPG ? 'active = true' : 'active = 1';
    // V-01: poderdante es Principal activo
    const poderdante = await this._getMember(poderdanteId, meeting.product_id);
    if (!poderdante || poderdante.member_type !== 'principal' || !(poderdante.active === true || poderdante.active === 1)) {
      const err = new Error('El poderdante no es un Principal activo en este producto.'); err.status = 400; throw err;
    }
    // V-02: apoderado es delegado activo del mismo product
    const apoderado = await this._getMember(apoderadoId, meeting.product_id);
    if (!apoderado || !(apoderado.active === true || apoderado.active === 1)) {
      const err = new Error('El apoderado no es un delegado activo de esta Asamblea.'); err.status = 400; throw err;
    }

    // V-04: no existe poder activo/registered para el mismo curso (poderdante) en esta sesión
    const [dup] = await db.execute(
      `SELECT id FROM representation_powers WHERE meeting_id = ? AND poderdante_id = ? AND status IN ('registered','active') LIMIT 1`,
      [meetingId, poderdanteId]
    );
    if (dup.length) { const err = new Error('Ya existe un poder activo para este curso en esta sesión.'); err.status = 409; throw err; }

    const returning = isPG ? ' RETURNING id' : '';
    const curso = String(poderdante.rol_organico || '').toUpperCase().trim();
    const [rows] = await db.execute(
      `INSERT INTO representation_powers (meeting_id, product_id, poderdante_id, apoderado_id, curso, status, registered_by, registered_at, notas)
       VALUES (?, ?, ?, ?, ?, 'registered', ?, NOW(), ?)${returning}`,
      [meetingId, meeting.product_id, poderdanteId, apoderadoId, curso, operatorId, notas]
    );
    const powerId = isPG ? rows?.[0]?.id : rows?.insertId;

    await this._logPower(meetingId, 'PODER_REGISTRADO', apoderadoId, operatorId, `Poder curso ${curso}`);
    // Intentar activar de inmediato si las condiciones se cumplen
    await this.evaluatePowerOnAttendanceChange(meetingId);
    return { power_id: powerId, status: 'registered', curso };
  }

  /**
   * Evalúa todos los poderes de la sesión y ajusta su status según presencia real
   * (Regla 2). Idempotente. Devuelve conteos.
   */
  static async evaluatePowerOnAttendanceChange(meetingId) {
    const meeting = await this._getMeeting(meetingId);
    if (!meeting) return { activados: 0, suspendidos: 0 };
    const isPG = this.isPostgreSQL;
    const activeCond = isPG ? 'm.active = true' : 'm.active = 1';
    const pendingOk = isPG ? 'COALESCE(a.pending_approval, false) = false' : '(a.pending_approval IS NULL OR a.pending_approval = 0)';

    // Presentes y aprobados (member_id + curso + tipo)
    const [present] = await db.execute(
      `SELECT a.member_id, m.member_type, UPPER(TRIM(m.rol_organico)) AS curso
       FROM attendance a JOIN members m ON m.id = a.member_id
       WHERE a.meeting_id = ? AND a.status = 'present' AND m.product_id = ? AND ${activeCond} AND ${pendingOk}`,
      [meetingId, meeting.product_id]
    );
    const presentIds = new Set(present.map(p => Number(p.member_id)));
    const cursoTienePrincipalOSuplente = new Set(
      present.filter(p => p.member_type === 'principal' || p.member_type === 'suplente').map(p => p.curso)
    );

    const [powers] = await db.execute(
      `SELECT * FROM representation_powers WHERE meeting_id = ? AND status IN ('registered','active','suspended')`,
      [meetingId]
    );

    let activados = 0, suspendidos = 0;
    for (const pw of powers) {
      const curso = String(pw.curso || '').toUpperCase().trim();
      const apoderadoPresente = presentIds.has(Number(pw.apoderado_id));
      const cursoCubiertoDirecto = cursoTienePrincipalOSuplente.has(curso);
      // Condición para computar: apoderado presente Y curso sin principal/suplente presente
      const debeActivar = apoderadoPresente && !cursoCubiertoDirecto;

      if (debeActivar && pw.status !== 'active') {
        await db.execute(`UPDATE representation_powers SET status = 'active', activated_at = NOW() WHERE id = ?`, [pw.id]);
        await this._logPower(meetingId, 'PODER_ACTIVADO', pw.apoderado_id, null, `Poder curso ${curso}`);
        activados++;
      } else if (!debeActivar && pw.status === 'active') {
        await db.execute(`UPDATE representation_powers SET status = 'suspended', suspended_at = NOW() WHERE id = ?`, [pw.id]);
        await this._logPower(meetingId, 'PODER_SUSPENDIDO', pw.apoderado_id, null, `Poder curso ${curso}`);
        suspendidos++;
      }
    }
    return { activados, suspendidos };
  }

  static async getPowersByMeeting(meetingId) {
    const [rows] = await db.execute(
      `SELECT rp.id AS power_id, rp.curso, rp.status, rp.registered_at, rp.activated_at, rp.notas,
              pod.name AS poderdante_nombre, pod.numero_documento AS poderdante_doc,
              apo.name AS apoderado_nombre, apo.numero_documento AS apoderado_doc, apo.rol_organico AS apoderado_curso_propio
       FROM representation_powers rp
       LEFT JOIN members pod ON pod.id = rp.poderdante_id
       LEFT JOIN members apo ON apo.id = rp.apoderado_id
       WHERE rp.meeting_id = ?
       ORDER BY rp.registered_at DESC`,
      [meetingId]
    );
    return rows;
  }

  static async getApoderadoLoad(apoderadoId, meetingId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS n FROM representation_powers WHERE meeting_id = ? AND apoderado_id = ? AND status = 'active'`,
      [meetingId, apoderadoId]
    );
    const poderes_activos = Number(rows[0]?.n || 0);
    return { poderes_activos, total: poderes_activos, puede_recibir_mas: true /* VF-03 sin límite definido */ };
  }

  static async _logPower(meetingId, eventType, memberId, operatorId, detalle) {
    try {
      const AssemblyQuorumService = require('./assemblyQuorumService');
      const panel = await AssemblyQuorumService.getFullAssemblyPanel(meetingId);
      await AssemblyQuorumService.logQuorumEvent(
        meetingId, eventType, memberId || null, operatorId || null,
        {}, { cursos: panel.cursos_representados, estado: panel.estado }, detalle || ''
      );
    } catch (e) { console.warn('[powers] _logPower falló:', e.message); }
  }
}

module.exports = AssemblyPowersService;
