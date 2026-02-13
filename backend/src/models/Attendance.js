const db = require('../config/database');

class Attendance {
  static async findByMeeting(meetingId) {
    const [rows] = await db.execute(
      `SELECT a.*, m.name as member_name, m.role, m.email
       FROM attendance a
       JOIN members m ON a.member_id = m.id
       WHERE a.meeting_id = ?`,
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
   * Cuenta miembros presentes con derecho a voto
   * SOLO cuenta miembros con cuenta_quorum = true (validación interna)
   * Incluye principales, suplentes actuando como principales, y Junta de Vigilancia
   */
  static async countPresentWithVote(meetingId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const cuentaQuorumCondition = isPostgreSQL ? 'm.cuenta_quorum = true' : 'm.cuenta_quorum = 1';
    
    const [rows] = await db.execute(
      `SELECT COUNT(DISTINCT a.member_id) as count
       FROM attendance a
       JOIN members m ON a.member_id = m.id
       WHERE a.meeting_id = ? 
       AND a.status = 'present'
       AND ${cuentaQuorumCondition}
       AND (
         m.member_type = 'principal' 
         OR m.member_type = 'junta_vigilancia'
         OR (m.member_type = 'suplente' AND a.acting_as_principal = 1)
       )`,
      [meetingId]
    );
    return rows[0].count;
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

