const db = require('../config/database');

class Meeting {
  static async findAll(clientId) {
    const [rows] = await db.execute(
      `SELECT * FROM meetings WHERE client_id = ? ORDER BY date DESC`,
      [clientId]
    );
    return rows;
  }

  static async findById(id, clientId = null) {
    // Si clientId es null, permite acceso público (sin validar cliente)
    if (clientId === null) {
      const [rows] = await db.execute(
        'SELECT * FROM meetings WHERE id = ?',
        [id]
      );
      return rows[0];
    }
    const [rows] = await db.execute(
      'SELECT * FROM meetings WHERE id = ? AND client_id = ?',
      [id, clientId]
    );
    return rows[0];
  }

  static async create(data) {
    const { client_id, title, description, date, location, type, status, google_meet_link = null } = data;
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const returningClause = isPostgreSQL ? ' RETURNING id' : '';
    
    console.log('Meeting.create - isPostgreSQL:', isPostgreSQL);
    console.log('Meeting.create - data:', { client_id, title, date, location, type, status });
    
    try {
      const [rows, fields] = await db.execute(
        `INSERT INTO meetings (client_id, title, description, date, location, type, status, google_meet_link, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())${returningClause}`,
        [client_id, title, description, date, location, type, status || 'scheduled', google_meet_link]
      );
      
      console.log('Meeting.create - rows:', rows);
      console.log('Meeting.create - rows type:', typeof rows);
      console.log('Meeting.create - rows is array:', Array.isArray(rows));
      if (rows && rows.length > 0) {
        console.log('Meeting.create - rows[0]:', rows[0]);
      }
      
      // PostgreSQL: el wrapper devuelve [rows, fields], y rows[0].id contiene el ID
      // MySQL: el wrapper devuelve [result, fields], y result.insertId contiene el ID
      if (isPostgreSQL) {
        const id = rows?.[0]?.id;
        console.log('Meeting.create - PostgreSQL ID:', id);
        return id;
      }
      const id = rows?.insertId;
      console.log('Meeting.create - MySQL ID:', id);
      return id;
    } catch (error) {
      console.error('❌ Error in Meeting.create:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  static async update(id, data) {
    const { title, description, date, location, status, google_meet_link, type } = data;
    const updateFields = [];
    const updateValues = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (date !== undefined) {
      updateFields.push('date = ?');
      updateValues.push(date);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (google_meet_link !== undefined) {
      updateFields.push('google_meet_link = ?');
      updateValues.push(google_meet_link);
    }
    
    if (updateFields.length === 0) {
      return; // No hay campos para actualizar
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    await db.execute(
      `UPDATE meetings SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
  }

  static async updateStatus(id, status) {
    await db.execute(
      'UPDATE meetings SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
  }

  static async delete(id, clientId) {
    try {
      // Primero verificar que la reunión existe y pertenece al cliente
      const meeting = await this.findById(id, clientId);
      if (!meeting) {
        throw new Error('Meeting not found or you do not have permission to delete it');
      }
      
      // Eliminar la reunión (las foreign keys con CASCADE eliminarán los registros relacionados)
      await db.execute(
        'DELETE FROM meetings WHERE id = ? AND client_id = ?',
        [id, clientId]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error in Meeting.delete:', error);
      throw error;
    }
  }

  /**
   * Instala formalmente la sesión de la reunión
   * @param {number} id - ID de la reunión
   * @param {number} clientId - ID del cliente
   */
  static async installSession(id, clientId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const sessionInstalledValue = isPostgreSQL ? 'true' : '1';
    
    // Primero verificar que la reunión existe y pertenece al cliente
    const meeting = await this.findById(id, clientId);
    if (!meeting) {
      throw new Error('Meeting not found or you do not have permission');
    }
    
    // Luego actualizar
    await db.execute(
      `UPDATE meetings 
       SET session_installed = ${sessionInstalledValue}, 
           session_installed_at = NOW(), 
           updated_at = NOW() 
       WHERE id = ? AND client_id = ?`,
      [id, clientId]
    );
    
    return { success: true };
  }

  /**
   * Verifica si la sesión está instalada
   * @param {number} id - ID de la reunión
   * @param {number} clientId - ID del cliente
   * @returns {Promise<boolean>}
   */
  static async isSessionInstalled(id, clientId) {
    const meeting = await this.findById(id, clientId);
    return meeting ? (meeting.session_installed === 1 || meeting.session_installed === true) : false;
  }
}

module.exports = Meeting;

