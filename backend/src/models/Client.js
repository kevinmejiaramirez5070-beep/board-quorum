const db = require('../config/database');

class Client {
  static async findAll() {
    // PostgreSQL usa booleanos, MySQL usa 1/0
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const [rows] = await db.execute(`SELECT * FROM clients WHERE ${activeCondition}`);
    return rows;
  }

  static async findById(id) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const [rows] = await db.execute(
      `SELECT * FROM clients WHERE id = ? AND ${activeCondition}`,
      [id]
    );
    return rows[0];
  }

  static async findBySubdomain(subdomain) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const [rows] = await db.execute(
      `SELECT * FROM clients WHERE subdomain = ? AND ${activeCondition}`,
      [subdomain]
    );
    return rows[0];
  }

  static async create(data) {
    const { name, subdomain, logo, primary_color, secondary_color, language, client_id, secret } = data;
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeValue = isPostgreSQL ? 'true' : '1';
    const returningClause = isPostgreSQL ? ' RETURNING id' : '';
    const [result] = await db.execute(
      `INSERT INTO clients (name, subdomain, logo, primary_color, secondary_color, language, client_id, secret, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${activeValue}, NOW())${returningClause}`,
      [name, subdomain, logo, primary_color, secondary_color, language || 'es', client_id || null, secret || null]
    );
    // PostgreSQL devuelve el ID en result.rows[0].id, MySQL en result.insertId
    if (isPostgreSQL) {
      return result.rows?.[0]?.id;
    }
    return result.insertId;
  }

  static async update(id, data) {
    const { name, logo, primary_color, secondary_color, language, client_id, secret } = data;
    await db.execute(
      `UPDATE clients SET name = ?, logo = ?, primary_color = ?, secondary_color = ?, language = ?, client_id = ?, secret = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, logo, primary_color, secondary_color, language, client_id || null, secret || null, id]
    );
  }

  static async delete(id) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeValue = isPostgreSQL ? 'false' : '0';
    await db.execute(
      `UPDATE clients SET active = ${activeValue}, updated_at = NOW() WHERE id = ?`,
      [id]
    );
  }
}

module.exports = Client;

