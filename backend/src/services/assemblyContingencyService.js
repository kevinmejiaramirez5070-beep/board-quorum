const db = require('../config/database');

/**
 * MD-09 — Contingencia: Delegado no encontrado por número de identificación.
 *
 * Cuando alguien que afirma ser Delegado ingresa su cédula en el enlace público
 * y Board Quorum no la encuentra, puede solicitar validación manual. La solicitud
 * nace PENDIENTE y no produce ningún efecto sobre quórum, voto ni representación
 * hasta que un usuario operativo la apruebe.
 *
 * Dos reglas de fondo:
 *   - La persona NUNCA se autodeclara Principal o Suplente. Esa condición la
 *     asigna el operador al aprobar.
 *   - Si la persona ya existe en el maestro con un dato mal digitado, se corrige
 *     el registro existente en lugar de crear una segunda identidad (§9).
 */

const ROLES_VALIDOS = ['principal', 'suplente'];

class AssemblyContingencyService {
  static get isPostgreSQL() {
    return !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
  }

  static _norm(s) {
    return String(s ?? '').trim();
  }

  static _normCurso(s) {
    return this._norm(s).toUpperCase();
  }

  static _normDoc(s) {
    return String(s ?? '').replace(/\D/g, '');
  }

  static async _getMeeting(meetingId) {
    const [rows] = await db.execute(
      `SELECT id, client_id, product_id, type FROM meetings WHERE id = ? LIMIT 1`,
      [meetingId]
    );
    return rows[0] || null;
  }

  static async _getAttendance(attendanceId) {
    const [rows] = await db.execute(
      `SELECT * FROM attendance WHERE id = ? LIMIT 1`,
      [attendanceId]
    );
    return rows[0] || null;
  }

  /**
   * Solicitudes pendientes de una reunión, con posibles coincidencias en el maestro.
   *
   * Las coincidencias existen para el §9: antes de crear una identidad nueva, el
   * operador debería revisar si la persona ya está cargada con la cédula mal
   * digitada o con el nombre en otro formato.
   */
  static async listPending(meetingId) {
    const isPG = this.isPostgreSQL;
    const pendingCond = isPG ? 'a.pending_approval = true' : 'a.pending_approval = 1';
    const activeCond = isPG ? 'm.active = true' : 'm.active = 1';

    const [pend] = await db.execute(
      `SELECT a.id, a.meeting_id, a.manual_name, a.manual_document, a.manual_position,
              a.manual_curso, a.manual_motivo, a.registered_by, a.arrival_time, a.created_at
       FROM attendance a
       WHERE a.meeting_id = ? AND ${pendingCond} AND a.member_id IS NULL
       ORDER BY a.created_at, a.id`,
      [meetingId]
    );
    if (!pend.length) return [];

    const meeting = await this._getMeeting(meetingId);
    const productId = meeting?.product_id ?? null;

    let maestro = [];
    if (productId != null) {
      const [rows] = await db.execute(
        `SELECT m.id, m.name, m.numero_documento, m.secondary_document,
                m.rol_organico, m.member_type
         FROM members m
         WHERE m.product_id = ? AND ${activeCond}`,
        [productId]
      );
      maestro = rows;
    }

    // Primeros apellidos/nombres, para sugerir por parecido sin depender del orden
    const tokens = (s) => new Set(
      this._norm(s).toUpperCase().split(/\s+/).filter(t => t.length > 2)
    );

    return pend.map(p => {
      const doc = this._normDoc(p.manual_document);
      const curso = this._normCurso(p.manual_curso);
      const nomTokens = tokens(p.manual_name);

      const candidatos = maestro
        .map(m => {
          let score = 0;
          const motivos = [];
          const mDoc = this._normDoc(m.numero_documento);
          const mSec = this._normDoc(m.secondary_document);

          if (doc && (mDoc === doc || mSec === doc)) { score += 100; motivos.push('documento exacto'); }
          else if (doc && mDoc && (mDoc.endsWith(doc) || doc.endsWith(mDoc))) { score += 40; motivos.push('documento parecido'); }

          if (curso && this._normCurso(m.rol_organico) === curso) { score += 25; motivos.push('mismo curso'); }

          const comunes = [...tokens(m.name)].filter(t => nomTokens.has(t)).length;
          if (comunes >= 2) { score += 30; motivos.push('nombre coincide'); }
          else if (comunes === 1) { score += 12; motivos.push('nombre parecido'); }

          return { ...m, score, motivos };
        })
        .filter(c => c.score >= 25)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return {
        attendance_id: p.id,
        estado: 'PENDIENTE_DE_VALIDACION',
        numero_documento: p.manual_document,
        nombre: p.manual_name,
        curso: p.manual_curso,
        detalle_declarado: p.manual_position,
        motivo: p.manual_motivo,
        solicitado_at: p.created_at || p.arrival_time,
        // La solicitud pendiente no ocupa representación ni suma quórum (§5)
        cuenta_para_quorum: false,
        puede_votar: false,
        posibles_coincidencias: candidatos.map(c => ({
          member_id: c.id,
          name: c.name,
          numero_documento: c.numero_documento,
          rol_organico: c.rol_organico,
          member_type: c.member_type,
          motivos: c.motivos
        }))
      };
    });
  }

  /**
   * Aprueba una solicitud de contingencia.
   *
   * Dos caminos:
   *   a) member_id — la persona ya estaba en el maestro y el problema era el dato.
   *      Se corrige el registro existente y se enlaza la asistencia (§9).
   *   b) curso + rol — se incorpora al maestro como Delegado de ese curso.
   *
   * En ambos casos la asistencia queda enlazada a un miembro real, así que las
   * reglas normales de representación aplican solas: el motor cuenta una sola
   * representación por curso (MD-01).
   */
  static async approve(attendanceId, operator, { member_id = null, curso = null, rol = null, motivo = '' } = {}) {
    const att = await this._getAttendance(attendanceId);
    if (!att) {
      const e = new Error('Solicitud no encontrada'); e.code = 'NOT_FOUND'; throw e;
    }
    const yaResuelta = att.pending_approval === false || att.pending_approval === 0;
    if (yaResuelta) {
      const e = new Error('Esta solicitud ya fue resuelta.'); e.code = 'YA_RESUELTA'; throw e;
    }
    if (!this._norm(motivo)) {
      const e = new Error('Se requiere indicar el motivo u observación de la contingencia.');
      e.code = 'MOTIVO_REQUERIDO'; throw e;
    }

    const meeting = await this._getMeeting(att.meeting_id);
    if (!meeting) { const e = new Error('Reunión no encontrada'); e.code = 'NOT_FOUND'; throw e; }
    const productId = meeting.product_id;
    if (productId == null) {
      const e = new Error('La reunión no tiene un órgano asignado; no hay maestro donde validar al Delegado.');
      e.code = 'SIN_PRODUCTO'; throw e;
    }

    const isPG = this.isPostgreSQL;
    const activeVal = isPG ? 'true' : '1';
    const falseVal = isPG ? 'false' : '0';
    const docSolicitado = this._normDoc(att.manual_document);

    let memberId = member_id != null ? Number(member_id) : null;
    let rolFinal = null;
    let cursoFinal = null;
    let correccion = null;

    if (memberId != null) {
      // ── a) Corregir el registro existente, no duplicar la identidad (§9) ──
      const [rows] = await db.execute(
        `SELECT id, name, numero_documento, rol_organico, member_type, active
         FROM members WHERE id = ? AND product_id = ? LIMIT 1`,
        [memberId, productId]
      );
      const m = rows[0];
      if (!m) {
        const e = new Error('El Delegado indicado no pertenece al maestro de esta Asamblea.');
        e.code = 'MIEMBRO_INVALIDO'; throw e;
      }
      rolFinal = m.member_type;
      cursoFinal = m.rol_organico;

      const docActual = this._normDoc(m.numero_documento);
      if (docSolicitado && docActual !== docSolicitado) {
        await db.execute(
          `UPDATE members SET numero_documento = ?, active = ${activeVal}, updated_at = NOW() WHERE id = ?`,
          [docSolicitado, memberId]
        );
        correccion = {
          member_id: memberId,
          campo: 'numero_documento',
          antes: m.numero_documento,
          despues: docSolicitado
        };
      } else if (m.active === false || m.active === 0) {
        await db.execute(
          `UPDATE members SET active = ${activeVal}, updated_at = NOW() WHERE id = ?`,
          [memberId]
        );
        correccion = { member_id: memberId, campo: 'active', antes: false, despues: true };
      }
    } else {
      // ── b) Incorporar al maestro con el curso y rol que define el operador ──
      rolFinal = String(rol ?? '').toLowerCase().trim();
      cursoFinal = this._normCurso(curso || att.manual_curso);

      if (!ROLES_VALIDOS.includes(rolFinal)) {
        const e = new Error('Debe asignarse un rol válido: PRINCIPAL o SUPLENTE.');
        e.code = 'ROL_REQUERIDO'; throw e;
      }
      if (!cursoFinal) {
        const e = new Error('Debe indicarse el curso que representa el Delegado.');
        e.code = 'CURSO_REQUERIDO'; throw e;
      }
      if (!docSolicitado) {
        const e = new Error('La solicitud no tiene un número de identificación válido.');
        e.code = 'DOCUMENTO_INVALIDO'; throw e;
      }

      // Un curso no puede terminar con dos Principales (V-05). Si ya hay uno,
      // el operador debe corregir el registro existente en vez de crear otro.
      const [yaHay] = await db.execute(
        `SELECT id, name FROM members
         WHERE product_id = ? AND member_type = ? AND UPPER(TRIM(rol_organico)) = ?
           AND active = ${activeVal} LIMIT 1`,
        [productId, rolFinal, cursoFinal]
      );
      if (yaHay.length) {
        const e = new Error(
          `El curso ${cursoFinal} ya tiene un ${rolFinal.toUpperCase()} activo (${yaHay[0].name}). ` +
          'Si se trata de la misma persona, corrija ese registro en lugar de crear uno nuevo.'
        );
        e.code = 'CURSO_YA_OCUPADO'; throw e;
      }

      // ¿Existe ya con ese documento? Entonces se reutiliza y se ajusta.
      const [existente] = await db.execute(
        `SELECT id FROM members WHERE numero_documento = ? AND product_id = ? LIMIT 1`,
        [docSolicitado, productId]
      );

      const cuentaQuorum = rolFinal === 'principal';
      const cq = isPG ? (cuentaQuorum ? 'true' : 'false') : (cuentaQuorum ? 1 : 0);
      const tipoParticipante = rolFinal === 'suplente' ? 'SUPLENTE' : 'PRINCIPAL';

      if (existente.length) {
        memberId = existente[0].id;
        await db.execute(
          `UPDATE members SET name = ?, rol_organico = ?, member_type = ?, tipo_participante = ?,
                  cuenta_quorum = ${cq}, puede_votar = ${cq}, active = ${activeVal}, updated_at = NOW()
           WHERE id = ?`,
          [this._norm(att.manual_name), cursoFinal, rolFinal, tipoParticipante, memberId]
        );
        correccion = { member_id: memberId, campo: 'reactivado_y_ajustado', antes: null, despues: `${cursoFinal} / ${rolFinal}` };
      } else {
        const returning = isPG ? ' RETURNING id' : '';
        const [ins] = await db.execute(
          `INSERT INTO members (
             client_id, product_id, name, email, role, position,
             member_type, principal_id, tipo_documento, numero_documento,
             rol_organico, tipo_participante, cuenta_quorum, puede_votar, active, created_at
           ) VALUES (?, ?, ?, NULL, 'member', NULL, ?, NULL, 'CC', ?, ?, ?, ${cq}, ${cq}, ${activeVal}, NOW())${returning}`,
          [meeting.client_id, productId, this._norm(att.manual_name), rolFinal, docSolicitado, cursoFinal, tipoParticipante]
        );
        memberId = isPG ? ins?.[0]?.id : ins.insertId;
      }

      // El Suplente recién incorporado se engancha a su Principal si existe
      if (rolFinal === 'suplente') {
        const [prin] = await db.execute(
          `SELECT id FROM members
           WHERE product_id = ? AND member_type = 'principal'
             AND UPPER(TRIM(rol_organico)) = ? AND active = ${activeVal} LIMIT 1`,
          [productId, cursoFinal]
        );
        if (prin.length) {
          await db.execute(`UPDATE members SET principal_id = ?, updated_at = NOW() WHERE id = ?`, [prin[0].id, memberId]);
        }
      }
    }

    await db.execute(
      `UPDATE attendance
       SET member_id = ?, pending_approval = ${falseVal}, status = 'present',
           manual_curso = ?, manual_rol = ?, contingencia = ${activeVal},
           decision = 'aprobado', decision_motivo = ?, approved_by = ?, approved_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [memberId, cursoFinal, rolFinal, this._norm(motivo), operator?.id ?? null, attendanceId]
    );

    await this._log(att.meeting_id, 'CONTINGENCIA_APROBADA', memberId, operator,
      `Aprobada la solicitud #${attendanceId} de ${att.manual_name} (doc ${att.manual_document}). ` +
      `Curso ${cursoFinal}, rol ${rolFinal}. Motivo: ${this._norm(motivo)}.` +
      (correccion ? ` Corrección en maestro: ${correccion.campo} (${correccion.antes} -> ${correccion.despues}).` : '')
    );

    return {
      attendance_id: Number(attendanceId),
      decision: 'aprobado',
      member_id: memberId,
      curso: cursoFinal,
      rol: rolFinal,
      correccion_maestro: correccion,
      aprobado_por: operator?.name || operator?.email || null,
      motivo: this._norm(motivo)
    };
  }

  /** Rechaza la solicitud. La persona no adquiere condición de Delegado (§7). */
  static async reject(attendanceId, operator, { motivo = '' } = {}) {
    const att = await this._getAttendance(attendanceId);
    if (!att) { const e = new Error('Solicitud no encontrada'); e.code = 'NOT_FOUND'; throw e; }
    const yaResuelta = att.pending_approval === false || att.pending_approval === 0;
    if (yaResuelta) { const e = new Error('Esta solicitud ya fue resuelta.'); e.code = 'YA_RESUELTA'; throw e; }
    if (!this._norm(motivo)) {
      const e = new Error('Se requiere indicar el motivo del rechazo.');
      e.code = 'MOTIVO_REQUERIDO'; throw e;
    }

    const isPG = this.isPostgreSQL;
    await db.execute(
      `UPDATE attendance
       SET pending_approval = ${isPG ? 'false' : '0'}, status = 'rejected', member_id = NULL,
           contingencia = ${isPG ? 'true' : '1'},
           decision = 'rechazado', decision_motivo = ?, approved_by = ?, approved_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [this._norm(motivo), operator?.id ?? null, attendanceId]
    );

    await this._log(att.meeting_id, 'CONTINGENCIA_RECHAZADA', null, operator,
      `Rechazada la solicitud #${attendanceId} de ${att.manual_name} (doc ${att.manual_document}). ` +
      `Motivo: ${this._norm(motivo)}. No cuenta para quórum ni puede votar.`
    );

    return { attendance_id: Number(attendanceId), decision: 'rechazado', motivo: this._norm(motivo) };
  }

  static async _log(meetingId, eventType, memberId, operator, detalle) {
    try {
      const AssemblyQuorumService = require('./assemblyQuorumService');
      const panel = await AssemblyQuorumService.getFullAssemblyPanel(meetingId);
      await AssemblyQuorumService.logQuorumEvent(
        meetingId, eventType, memberId, operator?.id ?? null,
        {}, { cursos: panel.cursos_representados, estado: panel.estado },
        `${detalle} Ejecutado por ${operator?.name || operator?.email || 'usuario'} (${operator?.role || 's/rol'}).`
      );
    } catch (e) {
      console.warn('[assembly] log de contingencia falló:', e.message);
    }
  }
}

module.exports = AssemblyContingencyService;
