const db = require('../config/database');

class Client {
  /** Solo clientes activos (para login / listado público) */
  static async findAll() {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? '(active = true OR active = 1)' : 'active = 1';
    try {
      const [rows] = await db.execute(`SELECT * FROM clients WHERE ${activeCondition}`);
      return Array.isArray(rows) ? rows : [];
    } catch (err) {
      console.warn('Client.findAll failed:', err.message);
      return [];
    }
  }

  /** Todos los clientes (para panel admin: ver activos e inactivos) */
  static async findAllForAdmin() {
    try {
      const [rows] = await db.execute('SELECT * FROM clients ORDER BY name');
      return Array.isArray(rows) ? rows : [];
    } catch (err) {
      console.warn('Client.findAllForAdmin failed:', err.message);
      return [];
    }
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

    // Ficha de onboarding. Todos opcionales: una organización creada solo con
    // nombre y subdominio sigue siendo válida.
    const FICHA = [
      'nit', 'razon_social', 'nombre_corto', 'naturaleza_juridica',
      'tipo_organizacion', 'tipo_organizacion_otro', 'ciudad', 'pais',
      'organos_requeridos', 'organos_requeridos_otro',
      'contacto_nombre', 'contacto_cargo', 'contacto_email', 'contacto_telefono'
    ];
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
      // Asegurar que no especificamos el ID (dejamos que PostgreSQL lo genere automáticamente)
      // Solo se incluyen las columnas de la ficha que traigan valor, para no
      // fallar si alguna todavía no existe en una base sin migrar.
      const fichaCols = [];
      const fichaVals = [];
      for (const col of FICHA) {
        if (data[col] === undefined || data[col] === null || data[col] === '') continue;
        fichaCols.push(col);
        fichaVals.push(col === 'organos_requeridos' ? JSON.stringify(data[col]) : data[col]);
      }
      const extraCols = fichaCols.length ? ', ' + fichaCols.join(', ') : '';
      const extraPlaceholders = fichaCols.length ? ', ' + fichaCols.map(() => '?').join(', ') : '';

      const [rows, fields] = await db.execute(
        `INSERT INTO clients (name, subdomain, logo, primary_color, secondary_color, language, ${paypalIdColumn}, ${paypalSecretColumn}${extraCols}, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?${extraPlaceholders}, ${activeValue}, NOW())${returningClause}`,
        [name, subdomain, logo, primary_color, secondary_color, language || 'es', paypalIdValue, paypalSecretValue, ...fichaVals]
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
    
    // Ficha de onboarding: solo se tocan los campos que vengan en la petición,
    // para que una edición parcial no borre lo ya diligenciado.
    const FICHA = [
      'nit', 'razon_social', 'nombre_corto', 'naturaleza_juridica',
      'tipo_organizacion', 'tipo_organizacion_otro', 'ciudad', 'pais',
      'organos_requeridos', 'organos_requeridos_otro',
      'contacto_nombre', 'contacto_cargo', 'contacto_email', 'contacto_telefono'
    ];
    const fichaSets = [];
    const fichaVals = [];
    for (const col of FICHA) {
      if (data[col] === undefined) continue;
      fichaSets.push(`${col} = ?`);
      fichaVals.push(col === 'organos_requeridos' ? JSON.stringify(data[col] || []) : (data[col] || null));
    }
    const extraSet = fichaSets.length ? ', ' + fichaSets.join(', ') : '';

    await db.execute(
      `UPDATE clients SET name = ?, logo = ?, primary_color = ?, secondary_color = ?, language = ?, ${paypalIdColumn} = ?, ${paypalSecretColumn} = ?${extraSet}, updated_at = NOW()
       WHERE id = ?`,
      [name, logo, primary_color, secondary_color, language, paypalIdValue, paypalSecretValue, ...fichaVals, id]
    );
  }

  static async delete(id) {
    // SEG-01: soft delete (papelera). La organización se marca como inactiva
    // para que no aparezca en el login público, pero quede en el panel como "Eliminado".
    await db.execute(
      `UPDATE clients SET active = ${false}, updated_at = NOW() WHERE id = ?`,
      [id]
    );
  }

  /** Activar o desactivar cliente (toggle para admin) */
  static async setActive(id, active) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';

    // Restaurar solo dentro de 30 días (SEG-01)
    if (active) {
      // ¿Está en papelera y dentro de los 30 días?
      const condition = isPostgreSQL
        ? 'active = false AND updated_at >= NOW() - INTERVAL \'30 days\''
        : 'active = 0 AND updated_at >= NOW() - INTERVAL 30 DAY';

      const [rows] = await db.execute(
        `SELECT id FROM clients WHERE id = ? AND ${condition} LIMIT 1`,
        [id]
      );

      if (!rows || rows.length === 0) {
        throw new Error('Solo puedes restaurar una organización dentro de los últimos 30 días');
      }
    }

    const value = active ? (isPostgreSQL ? 'true' : '1') : (isPostgreSQL ? 'false' : '0');
    await db.execute(
      `UPDATE clients SET active = ${value}, updated_at = NOW() WHERE id = ?`,
      [id]
    );
  }
}

module.exports = Client;

