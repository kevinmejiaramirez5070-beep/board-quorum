const db = require('../config/database');

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
   * Cuenta miembros presentes que suman al quórum (BUG-04, BUG-JV).
   * - Principales: 1 cada uno (cuenta_quorum, no pendiente de aprobación).
   * - Suplentes: cuentan solo si el principal del cargo NO está presente.
   *   - Si tiene principal_id: el principal con ese id no debe estar en asistencia presente.
   *   - Si principal_id es NULL (datos históricos): no debe haber ningún principal presente
   *     con el mismo rol_organico (mismo órgano/cargo).
   * - JV: máximo 1 voto institucional (LEAST(1, COUNT)).
   */
  static async countPresentWithVote(meetingId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const cuentaQuorumCondition = isPostgreSQL ? 'm.cuenta_quorum = true' : 'm.cuenta_quorum = 1';
    const pendingOkA = isPostgreSQL
      ? '(COALESCE(a.pending_approval, false) = false)'
      : '(a.pending_approval IS NULL OR a.pending_approval = 0)';
    const pendingOkA2 = isPostgreSQL
      ? '(COALESCE(a2.pending_approval, false) = false)'
      : '(a2.pending_approval IS NULL OR a2.pending_approval = 0)';
    const pendingOkSub = isPostgreSQL
      ? '(COALESCE(pending_approval, false) = false)'
      : '(pending_approval IS NULL OR pending_approval = 0)';

    const isPrincipal = `(LOWER(TRIM(COALESCE(m.member_type, ''))) = 'principal' OR UPPER(TRIM(COALESCE(m.tipo_participante, ''))) = 'PRINCIPAL')`;
    const isSuplente = `(LOWER(TRIM(COALESCE(m.member_type, ''))) = 'suplente' OR UPPER(TRIM(COALESCE(m.tipo_participante, ''))) = 'SUPLENTE')`;
    const isJv = `(LOWER(TRIM(COALESCE(m.member_type, ''))) = 'junta_vigilancia' OR UPPER(TRIM(COALESCE(m.tipo_participante, ''))) = 'JUNTA_DE_VIGILANCIA')`;
    const principalPred = `(LOWER(TRIM(COALESCE(mp.member_type, ''))) = 'principal' OR UPPER(TRIM(COALESCE(mp.tipo_participante, ''))) = 'PRINCIPAL')`;

    const sql = `
      SELECT
        (SELECT COUNT(*) FROM (
          SELECT 1
          FROM attendance a
          JOIN members m ON a.member_id = m.id
          WHERE a.meeting_id = ?
            AND ${pendingOkA}
            AND a.status = 'present'
            AND a.member_id IS NOT NULL
            AND ${cuentaQuorumCondition}
            AND NOT (${isJv})
            AND (
              ${isPrincipal}
              OR (
                ${isSuplente}
                AND (
                  (
                    m.principal_id IS NOT NULL
                    AND m.principal_id NOT IN (
                      SELECT member_id FROM attendance
                      WHERE meeting_id = ?
                        AND status = 'present'
                        AND member_id IS NOT NULL
                        AND ${pendingOkSub}
                    )
                  )
                  OR (
                    m.principal_id IS NULL
                    AND TRIM(COALESCE(m.rol_organico, '')) <> ''
                    AND NOT EXISTS (
                      SELECT 1
                      FROM attendance a2
                      JOIN members mp ON mp.id = a2.member_id
                      WHERE a2.meeting_id = a.meeting_id
                        AND ${pendingOkA2}
                        AND a2.status = 'present'
                        AND a2.member_id IS NOT NULL
                        AND ${principalPred}
                        AND UPPER(TRIM(COALESCE(mp.rol_organico, ''))) = UPPER(TRIM(COALESCE(m.rol_organico, '')))
                    )
                  )
                )
              )
            )
        ) sub1)
        +
        (SELECT LEAST(1, COUNT(*)) FROM attendance a
         JOIN members m ON a.member_id = m.id
         WHERE a.meeting_id = ?
           AND ${pendingOkA}
           AND a.status = 'present'
           AND a.member_id IS NOT NULL
           AND ${cuentaQuorumCondition}
           AND ${isJv}) AS count
    `;
    const [rows] = await db.execute(sql, [meetingId, meetingId, meetingId]);
    const count = rows[0]?.count ?? 0;
    return typeof count === 'string' ? parseInt(count, 10) : count;
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

