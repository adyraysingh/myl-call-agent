'use strict';
require('dotenv').config();
const { Pool } = require('pg');

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set - skipping migration');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    console.log('Running migrations...');

    await pool.query(`CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY, zoho_id VARCHAR(255) UNIQUE,
      first_name VARCHAR(255), last_name VARCHAR(255),
      phone VARCHAR(50), email VARCHAR(255), company VARCHAR(255),
      status VARCHAR(50) DEFAULT 'new', score INTEGER DEFAULT 0,
      call_count INTEGER DEFAULT 0, last_called_at TIMESTAMP,
      onboarded_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY, lead_id INTEGER REFERENCES leads(id),
      call_id VARCHAR(255), duration INTEGER DEFAULT 0,
      outcome TEXT, transcript TEXT, status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS call_schedule (
      id SERIAL PRIMARY KEY, lead_id INTEGER REFERENCES leads(id),
      scheduled_at TIMESTAMP, attempt_number INTEGER DEFAULT 1,
      status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW()
    )`);

    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
