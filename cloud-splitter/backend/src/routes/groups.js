// import express from 'express';
// import { requireAuth } from '../middleware/requireAuth.js';
// import { query } from '../db.js';

// const router = express.Router();

// router.use(requireAuth);

// router.post('/', async (req,res)=>{
//   const { name, description, currency } = req.body;
//   const rows = await query(
//     'INSERT INTO groups(name, description, currency, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
//     [name, description || '', currency || 'USD', req.user.id]
//   );
//   const group = rows[0];
//   await query('INSERT INTO group_members(group_id,user_id,role) VALUES ($1,$2,$3)', [group.id, req.user.id, 'owner']);
//   res.json(group);
// });

// router.get('/', async (req,res)=>{
//   const rows = await query(
//     `SELECT g.* FROM groups g
//      JOIN group_members gm ON gm.group_id=g.id
//      WHERE gm.user_id=$1
//      ORDER BY g.created_at DESC`, [req.user.id]);
//   res.json(rows);
// });

// router.post('/:groupId/invite', async (req,res)=>{
//   const { email } = req.body;
//   const groupId = req.params.groupId;
//   const users = await query('SELECT id FROM users WHERE email=$1', [email]);
//   if (!users.length) return res.status(404).json({ error: 'User not found' });
//   const userId = users[0].id;
//   await query('INSERT INTO group_members(group_id,user_id,role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [groupId, userId, 'member']);
//   res.json({ ok: true });
// });

// router.get('/:groupId/members', async (req,res)=>{
//   const rows = await query(
//     `SELECT u.id, u.email, u.name, gm.role FROM users u
//      JOIN group_members gm ON gm.user_id=u.id
//      WHERE gm.group_id=$1`, [req.params.groupId]);
//   res.json(rows);
// });

// export default router;


import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { query } from '../db.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', async (req,res)=>{
  const { name, description, currency } = req.body;
  const rows = await query(
    'INSERT INTO groups(name, description, currency, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, description || '', currency || 'USD', req.user.id]
  );
  const group = rows[0];
  await query('INSERT INTO group_members(group_id,user_id,role) VALUES ($1,$2,$3)', [group.id, req.user.id, 'owner']);
  res.json(group);
});

router.get('/', async (req,res)=>{
  const rows = await query(
    `SELECT g.* FROM groups g
     JOIN group_members gm ON gm.group_id=g.id
     WHERE gm.user_id=$1
     ORDER BY g.created_at DESC`, [req.user.id]);
  res.json(rows);
});

// 新增：获取单个 group 的详细信息
router.get('/:groupId', async (req, res) => {
  const groupId = req.params.groupId;
  const rows = await query(
    `SELECT id, name, description, currency, created_by, is_finalized, created_at
       FROM groups
      WHERE id=$1`,
    [groupId]
  );
  const group = rows[0];
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group);
});

router.post('/:groupId/invite', async (req,res)=>{
  const { email } = req.body;
  const groupId = req.params.groupId;
  const users = await query('SELECT id FROM users WHERE email=$1', [email]);
  if (!users.length) return res.status(404).json({ error: 'User not found' });
  const userId = users[0].id;
  await query('INSERT INTO group_members(group_id,user_id,role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [groupId, userId, 'member']);
  res.json({ ok: true });
});

router.get('/:groupId/members', async (req,res)=>{
  const rows = await query(
    `SELECT u.id, u.email, u.name, gm.role FROM users u
     JOIN group_members gm ON gm.user_id=u.id
     WHERE gm.group_id=$1`, [req.params.groupId]);
  res.json(rows);
});

export default router;