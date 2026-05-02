const db = require('../config/database');

class Vote {
  static async findByVoting(votingId) {
    // BUG-PDF-CARGO fix: usar SOLO rol_organico (cargo orgánico real del miembro).
    // NO usar position/cargo_funcional — puede tener valores incorrectos.
    // JOIN por member_id (fuente de verdad directa).
    const [rows] = await db.execute(
      `SELECT v.*,
              COALESCE(m.name, v.voter_name, 'Invitado') AS member_name,
              COALESCE(
                NULLIF(TRIM(COALESCE(m.rol_organico, '')), ''),
                NULLIF(TRIM(COALESCE(m.member_type, '')), ''),
                '-'
              ) AS role
       FROM votes v
       LEFT JOIN members m ON v.member_id = m.id
       WHERE v.voting_id = ?
       ORDER BY v.created_at`,
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

  /**
   * Verifica si un miembro ya votó por número de documento
   */
  static async hasVotedByDocument(votingId, documentNumber, clientId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM votes v
       JOIN members m ON v.member_id = m.id
       WHERE v.voting_id = ? AND m.numero_documento = ? AND m.client_id = ?`,
      [votingId, documentNumber, clientId]
    );
    return rows[0].count > 0;
  }

  /**
   * VOT-JV-VOTO: verifica si ya votó algún miembro de la Junta de Vigilancia en esta votación
   */
  static async hasJVVoted(votingId, clientId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count
       FROM votes v
       JOIN members m ON v.member_id = m.id
       WHERE v.voting_id = ?
         AND m.client_id = ?
         AND (
           LOWER(TRIM(COALESCE(m.member_type,''))) = 'junta_vigilancia'
           OR UPPER(TRIM(COALESCE(m.tipo_participante,''))) = 'JUNTA_DE_VIGILANCIA'
         )`,
      [votingId, clientId]
    );
    return (parseInt(rows[0].count) || 0) > 0;
  }

  /**
   * VOT-SUPLENCIAS: verifica si el principal de este suplente ya votó
   * Busca por principal_id directo o por mismo rol_organico
   */
  static async hasPrincipalVoted(votingId, member) {
    if (!member) return false;
    // Solo por principal_id directo — sin fallback rol_organico (BOARD_QUORUM_FINAL_INTEGRAL)
    if (member.principal_id) {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM votes WHERE voting_id = ? AND member_id = ?',
        [votingId, member.principal_id]
      );
      if ((parseInt(rows[0].count) || 0) > 0) return true;
    }
    return false;
  }

  /**
   * Crea un voto verificando por cédula
   */
  static async createByDocument(data) {
    const { voting_id, member_id, option, comment } = data;
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const returningClause = isPostgreSQL ? ' RETURNING id' : '';
    
    const [result] = await db.execute(
      `INSERT INTO votes (voting_id, member_id, option, comment, created_at)
       VALUES (?, ?, ?, ?, NOW())${returningClause}`,
      [voting_id, member_id, option, comment || null]
    );
    
    if (isPostgreSQL) {
      return result?.[0]?.id;
    }
    return result.insertId;
  }
}

module.exports = Vote;

