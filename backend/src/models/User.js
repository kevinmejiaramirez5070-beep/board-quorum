const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND active = 1',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, email, name, role, client_id, created_at FROM users WHERE id = ? AND active = 1',
      [id]
    );
    return rows[0];
  }

  static async create(data) {
    const { email, password, name, role, client_id } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(
      `INSERT INTO users (email, password, name, role, client_id, active, created_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [email, hashedPassword, name, role || 'user', client_id]
    );
    return result.insertId;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async findAllByClient(clientId) {
    const [rows] = await db.execute(
      'SELECT id, email, name, role, created_at FROM users WHERE client_id = ? AND active = 1',
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

