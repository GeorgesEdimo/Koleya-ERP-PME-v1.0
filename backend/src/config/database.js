const { Pool } = require('pg')

const isProd = process.env.NODE_ENV === 'production'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'koleya',
  user: process.env.DB_USER || 'koleya',
  password: process.env.DB_PASSWORD || 'koleya',
  // 30 connexions : suffisant pour ~100 utilisateurs simultanés (requêtes courtes)
  max: parseInt(process.env.DB_POOL_MAX || '30', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // En production, exigé si la base est distante
  ssl: isProd && process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
})

pool.on('error', (err) => {
  console.error('Erreur de connexion PostgreSQL:', err.message)
})

const query = async (text, params) => {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  if (process.env.NODE_ENV !== 'production') {
    console.log('Query:', { text: text.substring(0, 80), duration: `${duration}ms`, rows: res.rowCount })
  }
  return res
}

// Exécuter plusieurs requêtes dans une transaction (atomicité → pas d'état partiel sous charge)
async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// Fermeture propre (graceful shutdown)
function closePool() {
  return pool.end()
}

module.exports = { pool, query, withTransaction, closePool }