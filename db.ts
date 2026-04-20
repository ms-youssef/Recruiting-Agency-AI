import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  user: 'kimo',
  host: 'localhost',
  database: 'recruitment_db',
  password: 'kimo_pass',
  port: 5433,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_leads (
        id TEXT PRIMARY KEY,
        company TEXT,
        title TEXT,
        industry TEXT,
        seniority TEXT,
        salary TEXT,
        location TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("PostgreSQL initialized.");
  } finally {
    client.release();
  }
}
