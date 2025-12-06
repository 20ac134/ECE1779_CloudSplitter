// import express from 'express';
// import { body, validationResult } from 'express-validator';
// import { login, register } from '../auth.js';
// import { requireAuth } from '../middleware/requireAuth.js';
// import { query } from '../db.js';

// const router = express.Router();


// router.post('/register',
//   body('email').isEmail(),
//   body('password').isLength({ min: 6 }),
//   body('name').notEmpty(),
//   async (req,res)=>{
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
//     try {
//       const user = await register(req.body);
//       res.json(user);
//     } catch (e) {
//       res.status(400).json({ error: e.message });
//     }
//   }
// );

// router.post('/login', async (req,res)=>{
//   try {
//     const result = await login(req.body);
//     res.json(result);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// });

// router.get('/me', requireAuth, async (req,res)=>{
//   const rows = await query('SELECT id,email,name,created_at FROM users WHERE id=$1', [req.user.id]);
//   res.json(rows[0]);
// });

// router.get('/me', requireAuth, (req, res) => {
//   // 假设在 requireAuth 里已经把 user(id, name, email) 查出来挂到了 req.user 上
//   const { id, name, email } = req.user;
//   res.json({ id, name, email });
// });

// export default router;
import express from 'express';
import { body, validationResult } from 'express-validator';
import { login, register } from '../auth.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { query } from '../db.js';

const router = express.Router();

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

router.post('/login', async (req,res)=>{
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const rows = await query('SELECT id,email,name,created_at FROM users WHERE id=$1', [req.user.id]);
  res.json(rows[0]);
});

export default router;