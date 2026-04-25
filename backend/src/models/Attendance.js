const db = require('../config/database');

const REASON_LABELS = {
  PRINCIPAL_CUENTA:                    'Cuenta — principal presente',
  SUPLENTE_ACTUANDO_PRINCIPAL_AUSENTE: 'Cuenta — suplente actuando (principal ausente)',
  JV_VOTO_INSTITUCIONAL:               'No suma individualmente — voto institucional JV (+1 total)',
  SUPLENTE_PRINCIPAL_PRESENTE_ID:      'No cuenta — principal presente (ID directo)',
  SUPLENTE_PRINCIPAL_PRESENTE_ROL:     'No cuenta — principal presente (mismo rol orgánico)',
  SUPLENTE_PRINCIPAL_PRESENTE_CARGO:   'No cuenta — principal presente (cargo coincidente)',
  SIN_DERECHO_QUORUM:                  'No cuenta — sin derecho a quórum (cuenta_quorum=false)',
  PENDIENTE_APROBACION:                'No cuenta — asistencia pendiente de aprobación',
  MANUAL_NO_MIEMBRO:                   'No cuenta — registro manual sin miembro asociado',
};

class Attendance {
  static async findByMeeting(meetingId) {
    const [rows] = await db.execute(
      `SELECT a.*,
         COALESCE(m.name, a.manual_name) AS member_name,
         COALESCE(m.rol_organico, m.position, m.role, a.manual_position, '') AS role,
         m.email
       FROM attendance a
       LEFT JOIN members m ON a.member_id = m.id
       WHERE a.meeting_id = ?
       ORDER BY a.arrival_time, a.id`,
      [meetingId]
    );
    return rows;
  }

  static async create(data) {
    const { 
      meeting_id, member_id, status, arrival_time, acting_as_principal = 0,
      pending_approval = false, manual_name = null, manual_position = null, manual_document = null
    } = data;
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const pendingValue = isPostgreSQL ? (pending_approval ? 'true' : 'false') : (pending_approval ? 1 : 0);
    const returningClause = isPostgreSQL ? ' RETURNING id' : '';
    
    // Si member_id es null, es un registro manual
    const memberIdValue = member_id !== null && member_id !== undefined ? member_id : null;
    
    const [result] = await db.execute(
      `INSERT INTO attendance (meeting_id, member_id, status, arrival_time, acting_as_principal, 
        pending_approval, manual_name, manual_position, manual_document, created_at)
       VALUES (?, ?, ?, ?, ?, ${pendingValue}, ?, ?, ?, NOW())${returningClause}`,
      [meeting_id, memberIdValue, status, arrival_time, acting_as_principal, 
       manual_name, manual_position, manual_document]
    );
    
    if (isPostgreSQL) {
      return result?.[0]?.id;
    }
    return result.insertId;
  }

  static async update(id, data) {
    const { status, arrival_time, acting_as_principal } = data;
    const updateFields = [];
    const updateValues = [];
    
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (arrival_time !== undefined) {
      updateFields.push('arrival_time = ?');
      updateValues.push(arrival_time);
    }
    if (acting_as_principal !== undefined) {
      updateFields.push('acting_as_principal = ?');
      updateValues.push(acting_as_principal);
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    await db.execute(
      `UPDATE attendance SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
  }

  /**
   * Cuenta votos computables para quórum (reglas ASOCOLCI).
   *
   * Reglas:
   *  1. JV (junta_vigilancia): suma exactamente 1 si hay al menos 1 presente.
   *  2. Suplente: suma 1 SOLO si su principal específico NO está presente.
   *     Detección de suplente: member_type='suplente' | tipo_participante='SUPLENTE' | 'SUPLENTE' en position.
   *     Detección del principal: SOLO por principal_id (vínculo directo del par).
   *     Sin fallbacks por rol_organico ni por position — roles genéricos como "VOCALES"
   *     cruzarían pares distintos y generarían falsos negativos.
   *  3. Principal: suma 1.
   *  Solo se cuentan miembros con cuenta_quorum=true y sin pending_approval.
   */
  static async countPresentWithVote(meetingId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const cuentaQuorumCond = isPostgreSQL ? 'm.cuenta_quorum = true' : 'm.cuenta_quorum = 1';
    const pendingOkCond = isPostgreSQL
      ? 'COALESCE(a.pending_approval, false) = false'
      : '(a.pending_approval IS NULL OR a.pending_approval = 0)';

    const [rows] = await db.execute(
      `SELECT a.member_id,
              m.member_type,
              m.tipo_participante,
              m.principal_id,
              m.rol_organico,
              m.position
       FROM attendance a
       JOIN members m ON a.member_id = m.id
       WHERE a.meeting_id = ?
         AND a.status = 'present'
         AND a.member_id IS NOT NULL
         AND ${cuentaQuorumCond}
         AND ${pendingOkCond}`,
      [meetingId]
    );

    if (!rows || rows.length === 0) return 0;

    const norm = (s) => String(s || '').toUpperCase().trim();

    const isJvRow = (r) => {
      const mt = String(r.member_type || '').toLowerCase().trim();
      const tp = norm(r.tipo_participante);
      return mt === 'junta_vigilancia' || tp === 'JUNTA_DE_VIGILANCIA';
    };

    const isSuplenteRow = (r) => {
      const mt = String(r.member_type || '').toLowerCase().trim();
      const tp = norm(r.tipo_participante);
      const pos = norm(r.position);
      // Detección por member_type, tipo_participante, o por la palabra SUPLENTE en position
      return mt === 'suplente' || tp === 'SUPLENTE' || /\bSUPLENTE\b/.test(pos);
    };

    const presentIds = new Set(rows.map(r => Number(r.member_id)));

    let votes = 0;
    let jvPresent = false;

    for (const row of rows) {
      if (isJvRow(row)) {
        jvPresent = true;
        continue;
      }

      if (isSuplenteRow(row)) {
        // Regla: el suplente solo NO cuenta si su principal específico está presente.
        // Detección SOLO por principal_id (vínculo directo del par).
        // NO se usan fallbacks por rol_organico ni por position, porque roles genéricos
        // como "VOCALES" causarían falsos positivos al cruzar pares distintos.
        if (row.principal_id && presentIds.has(Number(row.principal_id))) {
          // Principal presente → suplente no suma
          continue;
        }
        // Principal ausente (o sin vínculo definido) → suplente suma
        votes++;
      } else {
        // Principal u otro tipo con cuenta_quorum: suma 1
        votes++;
      }
    }

    if (jvPresent) votes += 1;
    return votes;
  }

  /**
   * Detalle de quórum — devuelve cada asistente con su estado computable y el motivo.
   * Usa exactamente las mismas reglas que countPresentWithVote para coherencia total.
   */
  static async getQuorumBreakdown(meetingId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const cuentaQuorumCond = isPostgreSQL ? 'm.cuenta_quorum = true' : 'm.cuenta_quorum = 1';
    const pendingOkCond = isPostgreSQL
      ? 'COALESCE(a.pending_approval, false) = false'
      : '(a.pending_approval IS NULL OR a.pending_approval = 0)';

    // Todos los presentes (incluyendo los que NO cuentan) para el reporte completo
    const [allPresent] = await db.execute(
      `SELECT a.id as attendance_id, a.member_id, a.pending_approval,
              COALESCE(m.name, a.manual_name) AS name,
              COALESCE(m.rol_organico, m.position, m.role, a.manual_position) AS display_role,
              m.cuenta_quorum, m.member_type, m.tipo_participante,
              m.principal_id, m.rol_organico, m.position
       FROM attendance a
       LEFT JOIN members m ON a.member_id = m.id
       WHERE a.meeting_id = ? AND a.status = 'present'
       ORDER BY a.arrival_time, a.id`,
      [meetingId]
    );

    const norm = (s) => String(s || '').toUpperCase().trim();
    const isPending = (r) => {
      if (isPostgreSQL) return r.pending_approval === true || r.pending_approval === 't';
      return r.pending_approval === 1 || r.pending_approval === true;
    };

    const isJvRow = (r) => {
      const mt = String(r.member_type || '').toLowerCase().trim();
      const tp = norm(r.tipo_participante);
      return mt === 'junta_vigilancia' || tp === 'JUNTA_DE_VIGILANCIA';
    };

    const isSuplenteRow = (r) => {
      const mt = String(r.member_type || '').toLowerCase().trim();
      const tp = norm(r.tipo_participante);
      const pos = norm(r.position);
      return mt === 'suplente' || tp === 'SUPLENTE' || /\bSUPLENTE\b/.test(pos);
    };

    // Solo los que TIENEN member_id, cuenta_quorum=true, y no están pendientes
    const eligible = allPresent.filter(r => {
      if (!r.member_id) return false;
      const cq = r.cuenta_quorum;
      const cqOk = cq === true || cq === 1 || cq === '1' || cq === 't';
      return cqOk && !isPending(r);
    });

    const presentIds = new Set(eligible.map(r => Number(r.member_id)));

    const breakdown = [];
    let votes = 0;
    let jvPresent = false;
    const jvMembers = [];

    for (const row of allPresent) {
      // Sin member_id → manual / invitado
      if (!row.member_id) {
        breakdown.push({ ...row, counts: false, reason: 'MANUAL_NO_MIEMBRO' });
        continue;
      }
      // Pendiente de aprobación
      if (isPending(row)) {
        breakdown.push({ ...row, counts: false, reason: 'PENDIENTE_APROBACION' });
        continue;
      }
      // Sin cuenta_quorum
      const cq = row.cuenta_quorum;
      const cqOk = cq === true || cq === 1 || cq === '1' || cq === 't';
      if (!cqOk) {
        breakdown.push({ ...row, counts: false, reason: 'SIN_DERECHO_QUORUM' });
        continue;
      }

      if (isJvRow(row)) {
        jvPresent = true;
        jvMembers.push(row.name);
        breakdown.push({ ...row, counts: false, reason: 'JV_VOTO_INSTITUCIONAL' });
        continue;
      }

      if (isSuplenteRow(row)) {
        // Solo usar principal_id — sin fallbacks por rol_organico ni posición
        if (row.principal_id && presentIds.has(Number(row.principal_id))) {
          breakdown.push({ ...row, counts: false, reason: 'SUPLENTE_PRINCIPAL_PRESENTE_ID' });
          continue;
        }
        // Principal ausente (o sin vínculo) → el suplente cuenta
        votes++;
        breakdown.push({ ...row, counts: true, reason: 'SUPLENTE_ACTUANDO_PRINCIPAL_AUSENTE' });
      } else {
        // Principal u otro tipo elegible
        votes++;
        breakdown.push({ ...row, counts: true, reason: 'PRINCIPAL_CUENTA' });
      }
    }

    if (jvPresent) votes += 1;

    return {
      total_present: allPresent.length,
      computable_votes: votes,
      jv_institutional_vote: jvPresent ? 1 : 0,
      jv_members: jvMembers,
      breakdown: breakdown.map(r => ({
        name: r.name,
        role: r.display_role,
        member_type: r.member_type || r.tipo_participante || 'PRINCIPAL',
        counts: r.counts,
        reason: r.reason,
        reason_label: REASON_LABELS[r.reason] || r.reason
      }))
    };
  }

  static async countByStatus(meetingId, status) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM attendance WHERE meeting_id = ? AND status = ?',
      [meetingId, status]
    );
    return rows[0].count;
  }

  static async countTotal(meetingId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM attendance WHERE meeting_id = ?',
      [meetingId]
    );
    return rows[0].count;
  }

  /**
   * Busca asistencia por miembro y reunión
   */
  static async findByMemberAndMeeting(meetingId, memberId) {
    const [rows] = await db.execute(
      'SELECT * FROM attendance WHERE meeting_id = ? AND member_id = ?',
      [meetingId, memberId]
    );
    return rows[0] || null;
  }

  /**
   * Comprueba si ya existe un registro de asistencia para este número de documento en la reunión.
   * Evita registro duplicado (Comentario 02 / BUG-03).
   */
  static async findByDocumentAndMeeting(meetingId, documentNumber) {
    if (!documentNumber) return null;
    const doc = String(documentNumber).trim();
    const [rows] = await db.execute(
      `SELECT a.* FROM attendance a
       LEFT JOIN members m ON a.member_id = m.id
       WHERE a.meeting_id = ?
         AND (m.numero_documento = ? OR a.manual_document = ?)
       LIMIT 1`,
      [meetingId, doc, doc]
    );
    return rows[0] || null;
  }

  /**
   * Busca asistencias pendientes de aprobación
   */
  static async findPendingApproval(meetingId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const pendingCondition = isPostgreSQL ? 'pending_approval = true' : 'pending_approval = 1';
    const [rows] = await db.execute(
      `SELECT a.*, m.name as member_name, m.email, m.position
       FROM attendance a
       LEFT JOIN members m ON a.member_id = m.id
       WHERE a.meeting_id = ? AND ${pendingCondition}`,
      [meetingId]
    );
    return rows;
  }

  /**
   * Aprueba una asistencia pendiente
   */
  static async approveAttendance(attendanceId) {
    // Regla de validación:
    // - Si es INVITADO o PERSONAL ADMIN: solo quitar pending_approval (NUNCA asignar member_id).
    // - Si es PENDIENTE DE VALIDAR de un miembro del órgano: intentar asignar member_id por manual_document
    //   para que SÍ cuente en quórum (si el documento existe en members).
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const pendingValue = isPostgreSQL ? 'false' : '0';

    const invitedCond = isPostgreSQL
      ? "a.manual_position ILIKE '%INVITADO%'"
      : "LOWER(a.manual_position) LIKE '%invitado%'";
    const personalAdminCond = isPostgreSQL
      ? "a.manual_position ILIKE '%PERSONAL ADMIN%'"
      : "LOWER(a.manual_position) LIKE '%personal admin%'";

    const sql = `
      UPDATE attendance a
      SET
        pending_approval = ${pendingValue},
        status = 'present',
        member_id = CASE
          WHEN ${invitedCond} THEN NULL
          WHEN ${personalAdminCond} THEN NULL
          ELSE (
            SELECT m.id
            FROM members m
            JOIN meetings meet ON meet.id = a.meeting_id
            WHERE m.client_id = meet.client_id
              AND m.numero_documento = a.manual_document
            LIMIT 1
          )
        END,
        updated_at = NOW()
      WHERE a.id = ?
    `;

    await db.execute(sql, [attendanceId]);
  }

  /**
   * Rechaza una asistencia pendiente (no cuenta en quórum).
   * Dejamos status = 'rejected' para que el contador de quórum (status='present') no la tome.
   */
  static async rejectAttendance(attendanceId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const pendingValue = isPostgreSQL ? 'false' : '0';
    await db.execute(
      `UPDATE attendance
       SET pending_approval = ${pendingValue},
           status = 'rejected',
           member_id = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [attendanceId]
    );
  }
}

module.exports = Attendance;

