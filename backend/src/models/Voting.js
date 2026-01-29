const db = require('../config/database');

class Voting {
  static async findByMeeting(meetingId) {
    const [rows] = await db.execute(
      `SELECT * FROM votings WHERE meeting_id = ? ORDER BY created_at DESC`,
      [meetingId]
    );
    // Parsear opciones JSON si existen
    return rows.map(row => {
      if (row.options) {
        try {
          row.options = JSON.parse(row.options);
        } catch (e) {
          row.options = null;
        }
      }
      return row;
    });
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM votings WHERE id = ?', [id]);
    if (rows[0] && rows[0].options) {
      try {
        rows[0].options = JSON.parse(rows[0].options);
      } catch (e) {
        rows[0].options = null;
      }
    }
    return rows[0];
  }

  static async create(data) {
    const { meeting_id, title, description, type, status, options } = data;
    
    // Validar campos requeridos
    if (!meeting_id || !title) {
      throw new Error('meeting_id y title son requeridos');
    }
    
    // Si hay opciones múltiples, guardarlas como JSON
    const optionsJson = options && Array.isArray(options) && options.length > 0 
      ? JSON.stringify(options) 
      : null;
    
    try {
      // Intentar insertar con la columna options si existe
      const [result] = await db.execute(
        `INSERT INTO votings (meeting_id, title, description, type, status, options, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [meeting_id, title, description || null, type || 'simple', status || 'pending', optionsJson]
      );
      return result.insertId;
    } catch (error) {
      // Si falla porque la columna options no existe, intentar sin ella
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage && error.sqlMessage.includes('options')) {
        console.warn('Column "options" does not exist, creating voting without it');
        const [result] = await db.execute(
          `INSERT INTO votings (meeting_id, title, description, type, status, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [meeting_id, title, description || null, type || 'simple', status || 'pending']
        );
        return result.insertId;
      }
      throw error;
    }
  }

  static async updateStatus(id, status) {
    await db.execute(
      'UPDATE votings SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
  }

  static async getResults(votingId) {
    const [rows] = await db.execute(
      `SELECT v.option, COUNT(*) as votes
       FROM votes v
       WHERE v.voting_id = ?
       GROUP BY v.option
       ORDER BY votes DESC`,
      [votingId]
    );
    return rows;
  }
}

module.exports = Voting;

