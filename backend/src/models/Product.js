const db = require('../config/database');

class Product {
  static async findAll(clientId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const [rows] = await db.execute(
      `SELECT * FROM products WHERE client_id = ? AND ${activeCondition} ORDER BY name`,
      [clientId]
    );
    return rows;
  }

  static async findById(id, clientId = null) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    
    if (clientId === null) {
      const [rows] = await db.execute(
        `SELECT * FROM products WHERE id = ? AND ${activeCondition}`,
        [id]
      );
      return rows[0];
    }
    
    const [rows] = await db.execute(
      `SELECT * FROM products WHERE id = ? AND client_id = ? AND ${activeCondition}`,
      [id, clientId]
    );
    return rows[0];
  }

  static async create(data) {
    const { 
      client_id, name, description, 
      quorum_rule = 'simple', quorum_value = null,
      voting_rule = 'simple_majority', allow_substitutions = true
    } = data;
    
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeValue = isPostgreSQL ? 'true' : '1';
    const allowSubsValue = isPostgreSQL ? (allow_substitutions ? 'true' : 'false') : (allow_substitutions ? 1 : 0);
    const returningClause = isPostgreSQL ? ' RETURNING id' : '';
    
    const [rows] = await db.execute(
      `INSERT INTO products (
        client_id, name, description, 
        quorum_rule, quorum_value, voting_rule, allow_substitutions,
        active, created_at
      )
       VALUES (?, ?, ?, ?, ?, ?, ${allowSubsValue}, ${activeValue}, NOW())${returningClause}`,
      [client_id, name, description, quorum_rule, quorum_value, voting_rule]
    );
    
    if (isPostgreSQL) {
      return rows?.[0]?.id;
    }
    return rows.insertId;
  }

  static async update(id, data) {
    const { 
      name, description, quorum_rule, quorum_value,
      voting_rule, allow_substitutions
    } = data;
    
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (quorum_rule !== undefined) {
      updateFields.push('quorum_rule = ?');
      updateValues.push(quorum_rule);
    }
    if (quorum_value !== undefined) {
      updateFields.push('quorum_value = ?');
      updateValues.push(quorum_value);
    }
    if (voting_rule !== undefined) {
      updateFields.push('voting_rule = ?');
      updateValues.push(voting_rule);
    }
    if (allow_substitutions !== undefined) {
      const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
      const allowSubsValue = isPostgreSQL ? (allow_substitutions ? 'true' : 'false') : (allow_substitutions ? 1 : 0);
      updateFields.push(`allow_substitutions = ${allowSubsValue}`);
    }
    
    if (updateFields.length === 0) {
      return;
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    await db.execute(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
  }

  static async delete(id, clientId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeValue = isPostgreSQL ? 'false' : '0';
    
    // Soft delete: marcar como inactivo
    await db.execute(
      `UPDATE products SET active = ${activeValue}, updated_at = NOW() WHERE id = ? AND client_id = ?`,
      [id, clientId]
    );
  }

  /**
   * Obtiene estadísticas de un producto
   */
  static async getStats(productId, clientId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    
    const [memberCountRows] = await db.execute(
      `SELECT COUNT(*) as count FROM members WHERE product_id = ? AND client_id = ? AND ${activeCondition}`,
      [productId, clientId]
    );
    
    const [meetingCountRows] = await db.execute(
      `SELECT COUNT(*) as count FROM meetings WHERE product_id = ? AND client_id = ?`,
      [productId, clientId]
    );
    
    const [activeMeetingRows] = await db.execute(
      `SELECT id, title, status FROM meetings 
       WHERE product_id = ? AND client_id = ? AND status = 'active' 
       ORDER BY date DESC LIMIT 1`,
      [productId, clientId]
    );
    
    return {
      memberCount: memberCountRows[0]?.count || 0,
      meetingCount: meetingCountRows[0]?.count || 0,
      activeMeeting: activeMeetingRows[0] || null
    };
  }
}

module.exports = Product;
