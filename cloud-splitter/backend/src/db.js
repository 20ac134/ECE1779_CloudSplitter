import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

export async function query(q, params) {
  const res = await pool.query(q, params);
  return res.rows;
}
