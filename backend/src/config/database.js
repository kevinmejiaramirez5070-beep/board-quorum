require('dotenv').config();

// Detectar si usamos PostgreSQL (Supabase, Render) o MySQL (local)
const usePostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql' || process.env.SUPABASE_DB_URL;

let pool;

if (usePostgreSQL) {
  // PostgreSQL para Render
  const { Pool } = require('pg');
  
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;
  
  pool = new Pool({
    connectionString: connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 60000,
  });

  // Test connection
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('✅ PostgreSQL database connected successfully');
    })
    .catch(err => {
      console.error('❌ PostgreSQL connection error:', err);
    });

  // Wrapper para compatibilidad con MySQL (db.execute)
  const originalQuery = pool.query.bind(pool);
  pool.execute = async (query, params) => {
    // Convertir ? placeholders a $1, $2, etc. para PostgreSQL
    let paramIndex = 1;
    const pgQuery = query.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await originalQuery(pgQuery, params);
    // Retornar en formato compatible con MySQL [rows, fields]
    return [result.rows, result.fields];
  };
} else {
  // MySQL para desarrollo local
  const mysql = require('mysql2/promise');
  
  pool = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'juntas',
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  // Test connection
  pool.getConnection()
    .then(connection => {
      console.log('✅ MySQL database connected successfully');
      connection.release();
    })
    .catch(err => {
      console.error('❌ MySQL connection error:', err);
    });
}

module.exports = pool;

