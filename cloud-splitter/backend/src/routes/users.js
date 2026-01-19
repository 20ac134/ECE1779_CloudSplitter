import express from 'express';
import { body, validationResult } from 'express-validator';
import { login, register } from '../auth.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { query } from '../db.js';

const router = express.Router();

// User Registration
router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  async (req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const user = await register(req.body);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

// User Login
router.post('/login', async (req,res)=>{
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get Current User
router.get('/me', requireAuth, async (req, res) => {
  const rows = await query('SELECT id,email,name,created_at FROM users WHERE id=$1', [req.user.id]);
  res.json(rows[0]);
});

export default router;