const db = require('../config/database');

class Vote {
  static async findByVoting(votingId) {
    const [rows] = await db.execute(
      `SELECT v.*, m.name as member_name, m.role
       FROM votes v
       JOIN members m ON v.member_id = m.id
       WHERE v.voting_id = ?`,
      [votingId]
    );
    return rows;
  }

  static async create(data) {
    const { voting_id, member_id, option, comment } = data;
    const [result] = await db.execute(
      `INSERT INTO votes (voting_id, member_id, option, comment, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [voting_id, member_id, option, comment]
    );
    return result.insertId;
  }

  static async createPublic(data) {
    const { voting_id, name, email, option, comment } = data;
    // Para votos públicos, member_id puede ser NULL y guardamos name y email
    const [result] = await db.execute(
      `INSERT INTO votes (voting_id, member_id, option, comment, voter_name, voter_email, created_at)
       VALUES (?, NULL, ?, ?, ?, ?, NOW())`,
      [voting_id, option, comment || null, name, email || null]
    );
    return result.insertId;
  }

  static async hasVoted(votingId, memberId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM votes WHERE voting_id = ? AND member_id = ?',
      [votingId, memberId]
    );
    return rows[0].count > 0;
  }

  static async hasVotedPublic(votingId, email) {
    if (!email) return false;
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM votes WHERE voting_id = ? AND voter_email = ?',
      [votingId, email]
    );
    return rows[0].count > 0;
  }
}

module.exports = Vote;

