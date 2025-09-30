const { Pool } = require('pg');

let pool;

const initializePostgres = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('amazonaws.com') ? { rejectUnauthorized: false } : false,
      // Increase timeouts for large operations
      statement_timeout: 30000, // 30 seconds
      query_timeout: 30000, // 30 seconds
      connectionTimeoutMillis: 10000, // 10 seconds
      idleTimeoutMillis: 30000, // 30 seconds
      max: 20, // Maximum number of clients in the pool
    });

    // Handle pool errors
    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err);
    });

    // Test the connection
    pool.query('SELECT NOW()')
      .then(() => {
        console.log('🐘 PostgreSQL connected successfully');
      })
      .catch((err) => {
        console.error('❌ PostgreSQL connection failed:', err.message);
      });
  }
  return pool;
};

const getPool = () => {
  if (!pool) {
    return initializePostgres();
  }
  return pool;
};

const query = async (text, params, retries = 3) => {
  const pool = getPool();
  const start = Date.now();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      // Only log slow queries (>100ms) to reduce noise
      if (duration > 100) {
        console.log('Slow query detected', { text: text.substring(0, 100) + '...', duration, rows: res.rowCount });
      }
      return res;
    } catch (error) {
      console.error(`Database query error (attempt ${attempt}/${retries}):`, error.message);
      
      // If it's a connection error and we have retries left, wait and try again
      if (attempt < retries && (
        error.message.includes('Connection terminated') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ENOTFOUND')
      )) {
        console.log(`Retrying query in ${attempt * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
      
      throw error;
    }
  }
};

module.exports = {
  initializePostgres,
  getPool,
  query
};
