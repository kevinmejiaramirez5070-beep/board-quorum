const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE email = ? AND ${activeCondition}`,
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const [rows] = await db.execute(
      `SELECT id, email, name, role, client_id, created_at FROM users WHERE id = ? AND ${activeCondition}`,
      [id]
    );
    return rows[0];
  }

  static async create(data) {
    const { email, password, name, role, client_id } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeValue = isPostgreSQL ? 'true' : '1';
    const returningClause = isPostgreSQL ? ' RETURNING id' : '';
    const [result] = await db.execute(
      `INSERT INTO users (email, password, name, role, client_id, active, created_at)
       VALUES (?, ?, ?, ?, ?, ${activeValue}, NOW())${returningClause}`,
      [email, hashedPassword, name, role || 'user', client_id]
    );
    // PostgreSQL devuelve el ID en result.rows[0].id, MySQL en result.insertId
    if (isPostgreSQL) {
      return result.rows?.[0]?.id;
    }
    return result.insertId;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async findAllByClient(clientId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const [rows] = await db.execute(
      `SELECT id, email, name, role, created_at FROM users WHERE client_id = ? AND ${activeCondition}`,
      [clientId]
    );
    return rows;
  }

  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
  }

  static async updateEmail(userId, newEmail) {
    await db.execute(
      'UPDATE users SET email = ? WHERE id = ?',
      [newEmail, userId]
    );
  }

  static async getPasswordHash(userId) {
    const [rows] = await db.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    return rows[0]?.password;
  }
}

module.exports = User;

