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
    const { name, subdomain, logo, primary_color, secondary_color, language, client_id, secret, paypal_client_id, paypal_secret } = data;
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeValue = isPostgreSQL ? 'true' : '1';
    const returningClause = isPostgreSQL ? ' RETURNING id' : '';
    
    // En PostgreSQL usamos paypal_client_id y paypal_secret, en MySQL usamos client_id y secret
    const paypalIdColumn = isPostgreSQL ? 'paypal_client_id' : 'client_id';
    const paypalSecretColumn = isPostgreSQL ? 'paypal_secret' : 'secret';
    const paypalIdValue = isPostgreSQL ? (paypal_client_id || null) : (client_id || null);
    const paypalSecretValue = isPostgreSQL ? (paypal_secret || null) : (secret || null);
    
    console.log('Client.create - isPostgreSQL:', isPostgreSQL);
    console.log('Client.create - data:', { name, subdomain, primary_color, secondary_color, language });
    
    try {
      const [rows, fields] = await db.execute(
        `INSERT INTO clients (name, subdomain, logo, primary_color, secondary_color, language, ${paypalIdColumn}, ${paypalSecretColumn}, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${activeValue}, NOW())${returningClause}`,
        [name, subdomain, logo, primary_color, secondary_color, language || 'es', paypalIdValue, paypalSecretValue]
      );
      
      console.log('Client.create - rows:', rows);
      console.log('Client.create - rows type:', typeof rows);
      console.log('Client.create - rows is array:', Array.isArray(rows));
      if (rows && rows.length > 0) {
        console.log('Client.create - rows[0]:', rows[0]);
      }
      
      // PostgreSQL: el wrapper devuelve [rows, fields], y rows[0].id contiene el ID
      // MySQL: el wrapper devuelve [result, fields], y result.insertId contiene el ID
      if (isPostgreSQL) {
        const id = rows?.[0]?.id;
        console.log('Client.create - PostgreSQL ID:', id);
        return id;
      }
      const id = rows?.insertId;
      console.log('Client.create - MySQL ID:', id);
      return id;
    } catch (error) {
      console.error('❌ Error in Client.create:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  static async update(id, data) {
    const { name, logo, primary_color, secondary_color, language, client_id, secret, paypal_client_id, paypal_secret } = data;
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    
    // En PostgreSQL usamos paypal_client_id y paypal_secret, en MySQL usamos client_id y secret
    const paypalIdColumn = isPostgreSQL ? 'paypal_client_id' : 'client_id';
    const paypalSecretColumn = isPostgreSQL ? 'paypal_secret' : 'secret';
    const paypalIdValue = isPostgreSQL ? (paypal_client_id || null) : (client_id || null);
    const paypalSecretValue = isPostgreSQL ? (paypal_secret || null) : (secret || null);
    
    await db.execute(
      `UPDATE clients SET name = ?, logo = ?, primary_color = ?, secondary_color = ?, language = ?, ${paypalIdColumn} = ?, ${paypalSecretColumn} = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, logo, primary_color, secondary_color, language, paypalIdValue, paypalSecretValue, id]
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

