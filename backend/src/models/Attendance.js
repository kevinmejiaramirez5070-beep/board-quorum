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
   * Cuenta miembros presentes que suman al quórum (BUG-04, BUG-02B).
   * - Principales: cuentan 1 cada uno si están presentes y cuenta_quorum.
   * - Suplentes: solo cuentan si tienen principal_id y el principal NO está presente.
   * - Junta de Vigilancia: máximo 1 voto institucional (no 3 individuales).
   */
  static async countPresentWithVote(meetingId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const cuentaQuorumCondition = isPostgreSQL ? 'm.cuenta_quorum = true' : 'm.cuenta_quorum = 1';
    const leastFn = isPostgreSQL ? 'LEAST' : 'LEAST';

    const sql = `
      SELECT
        (SELECT COUNT(*) FROM (
          SELECT 1
          FROM attendance a
          JOIN members m ON a.member_id = m.id
          WHERE a.meeting_id = ?
            AND a.status = 'present'
            AND a.member_id IS NOT NULL
            AND ${cuentaQuorumCondition}
            AND (
              (m.member_type = 'principal' OR m.tipo_participante = 'PRINCIPAL')
              OR ((m.member_type = 'suplente' OR m.tipo_participante = 'SUPLENTE') AND m.principal_id IS NOT NULL AND m.principal_id NOT IN (
                SELECT member_id FROM attendance
                WHERE meeting_id = ? AND status = 'present' AND member_id IS NOT NULL
              ))
            )
        ) sub1)
        +
        (SELECT ${leastFn}(1, COUNT(*)) FROM attendance a
         JOIN members m ON a.member_id = m.id
         WHERE a.meeting_id = ?
           AND a.status = 'present'
           AND a.member_id IS NOT NULL
           AND ${cuentaQuorumCondition}
           AND (m.member_type = 'junta_vigilancia' OR m.tipo_participante = 'JUNTA_DE_VIGILANCIA')) AS count
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
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const pendingValue = isPostgreSQL ? 'false' : '0';
    await db.execute(
      `UPDATE attendance SET pending_approval = ${pendingValue}, updated_at = NOW() WHERE id = ?`,
      [attendanceId]
    );
  }
}

module.exports = Attendance;

