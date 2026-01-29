const db = require('../config/database');

class Client {
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM clients WHERE active = 1');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM clients WHERE id = ? AND active = 1',
      [id]
    );
    return rows[0];
  }

  static async findBySubdomain(subdomain) {
    const [rows] = await db.execute(
      'SELECT * FROM clients WHERE subdomain = ? AND active = 1',
      [subdomain]
    );
    return rows[0];
  }

  static async create(data) {
    const { name, subdomain, logo, primary_color, secondary_color, language, client_id, secret } = data;
    const [result] = await db.execute(
      `INSERT INTO clients (name, subdomain, logo, primary_color, secondary_color, language, client_id, secret, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [name, subdomain, logo, primary_color, secondary_color, language || 'es', client_id || null, secret || null]
    );
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
    await db.execute(
      'UPDATE clients SET active = 0, updated_at = NOW() WHERE id = ?',
      [id]
    );
  }
}

module.exports = Client;

