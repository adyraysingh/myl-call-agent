'use strict';
const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      logger.warn('DATABASE_URL not set - database features disabled');
      return null;
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
    pool.on('error', (err) => logger.error('Pool error', { error: err.message }));
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  if (!p) return { rows: [], rowCount: 0 };
  return p.query(text, params);
}

module.exports = { getPool, query };
