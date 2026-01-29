const db = require('../config/database');

class Member {
  static async findAll(clientId) {
    const [rows] = await db.execute(
      'SELECT * FROM members WHERE client_id = ? AND active = 1 ORDER BY name',
      [clientId]
    );
    return rows;
  }

  static async findById(id, clientId) {
    const [rows] = await db.execute(
      'SELECT * FROM members WHERE id = ? AND client_id = ? AND active = 1',
      [id, clientId]
    );
    return rows[0];
  }

  static async create(data) {
    const { 
      client_id, name, email, role, position, 
      member_type = 'principal', principal_id = null, user_id = null,
      tipo_documento = null, numero_documento = null, rol_organico = null,
      tipo_participante = null, rol_en_votacion = null,
      cuenta_quorum = 1, puede_votar = 1
    } = data;
    const [result] = await db.execute(
      `INSERT INTO members (
        client_id, name, email, role, position, 
        member_type, principal_id, user_id,
        tipo_documento, numero_documento, rol_organico,
        tipo_participante, rol_en_votacion,
        cuenta_quorum, puede_votar,
        active, created_at
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        client_id, name, email, role, position, 
        member_type, principal_id, user_id,
        tipo_documento, numero_documento, rol_organico,
        tipo_participante, rol_en_votacion,
        cuenta_quorum, puede_votar
      ]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const { 
      name, email, role, position, member_type, principal_id, user_id,
      tipo_documento, numero_documento, rol_organico,
      tipo_participante, rol_en_votacion,
      cuenta_quorum, puede_votar
    } = data;
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(position);
    }
    if (member_type !== undefined) {
      updateFields.push('member_type = ?');
      updateValues.push(member_type);
    }
    if (principal_id !== undefined) {
      updateFields.push('principal_id = ?');
      updateValues.push(principal_id);
    }
    if (user_id !== undefined) {
      updateFields.push('user_id = ?');
      updateValues.push(user_id);
    }
    if (tipo_documento !== undefined) {
      updateFields.push('tipo_documento = ?');
      updateValues.push(tipo_documento);
    }
    if (numero_documento !== undefined) {
      updateFields.push('numero_documento = ?');
      updateValues.push(numero_documento);
    }
    if (rol_organico !== undefined) {
      updateFields.push('rol_organico = ?');
      updateValues.push(rol_organico);
    }
    if (tipo_participante !== undefined) {
      updateFields.push('tipo_participante = ?');
      updateValues.push(tipo_participante);
    }
    if (rol_en_votacion !== undefined) {
      updateFields.push('rol_en_votacion = ?');
      updateValues.push(rol_en_votacion);
    }
    if (cuenta_quorum !== undefined) {
      updateFields.push('cuenta_quorum = ?');
      updateValues.push(cuenta_quorum);
    }
    if (puede_votar !== undefined) {
      updateFields.push('puede_votar = ?');
      updateValues.push(puede_votar);
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    await db.execute(
      `UPDATE members SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
  }

  /**
   * Busca un miembro por user_id
   */
  static async findByUserId(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM members WHERE user_id = ? AND active = 1',
      [userId]
    );
    return rows[0];
  }

  /**
   * Obtiene miembros con derecho a voto (principales, suplentes actuando, JV)
   */
  static async findWithVoteRight(clientId) {
    const [rows] = await db.execute(
      `SELECT * FROM members 
       WHERE client_id = ? 
       AND active = 1 
       AND (member_type = 'principal' OR member_type = 'junta_vigilancia')
       ORDER BY name`,
      [clientId]
    );
    return rows;
  }

  /**
   * Cuenta total de miembros con derecho a voto
   */
  static async countWithVoteRight(clientId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM members 
       WHERE client_id = ? 
       AND active = 1 
       AND (member_type = 'principal' OR member_type = 'junta_vigilancia')`,
      [clientId]
    );
    return rows[0].count;
  }

  static async delete(id) {
    await db.execute(
      'UPDATE members SET active = 0, updated_at = NOW() WHERE id = ?',
      [id]
    );
  }
}

module.exports = Member;

