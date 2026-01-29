const db = require('../config/database');

class JoinRequest {
  static async create(data) {
    const { meeting_id, user_id, member_id = null } = data;
    const [result] = await db.execute(
      `INSERT INTO join_requests (meeting_id, user_id, member_id, status, requested_at)
       VALUES (?, ?, ?, 'pending', NOW())`,
      [meeting_id, user_id, member_id]
    );
    return result.insertId;
  }

  static async findByMeeting(meetingId, status = null) {
    let query = `
      SELECT 
        jr.*,
        u.name as user_name,
        u.email as user_email,
        m.name as member_name,
        m.role as member_role
      FROM join_requests jr
      LEFT JOIN users u ON jr.user_id = u.id
      LEFT JOIN members m ON jr.member_id = m.id
      WHERE jr.meeting_id = ?
    `;
    const params = [meetingId];
    
    if (status) {
      query += ' AND jr.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY jr.requested_at DESC';
    
    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async findByUserAndMeeting(userId, meetingId) {
    const [rows] = await db.execute(
      `SELECT * FROM join_requests 
       WHERE user_id = ? AND meeting_id = ?`,
      [userId, meetingId]
    );
    return rows[0];
  }

  static async updateStatus(requestId, status, respondedBy = null) {
    await db.execute(
      `UPDATE join_requests 
       SET status = ?, responded_at = NOW(), responded_by = ?
       WHERE id = ?`,
      [status, respondedBy, requestId]
    );
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT 
        jr.*,
        u.name as user_name,
        u.email as user_email,
        m.name as member_name,
        m.role as member_role
      FROM join_requests jr
      LEFT JOIN users u ON jr.user_id = u.id
      LEFT JOIN members m ON jr.member_id = m.id
      WHERE jr.id = ?`,
      [id]
    );
    return rows[0];
  }
}

module.exports = JoinRequest;






