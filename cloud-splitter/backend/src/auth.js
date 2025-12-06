import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;

export async function register({ email, password, name }) {
  const existing = await query('SELECT id FROM users WHERE email=$1', [email]);
  if (existing.length) throw new Error('Email already in use');
  const hash = await bcrypt.hash(password, 10);
  const rows = await query(
    'INSERT INTO users(email, password_hash, name) VALUES ($1,$2,$3) RETURNING id,email,name,created_at',
    [email, hash, name]
  );
  return rows[0];
}

export async function login({ email, password }) {
  const users = await query('SELECT id,email,password_hash,name FROM users WHERE email=$1', [email]);
  if (!users.length) throw new Error('Invalid credentials');
  const user = users[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error('Invalid credentials');
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
