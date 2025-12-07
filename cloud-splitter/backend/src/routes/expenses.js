import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { query } from '../db.js';

const router = express.Router();
router.use(requireAuth);

// Unified createShares: Generate each person's share + owed_amount based on split
async function createShares(expenseId, groupId, payerId, split) {
  // 1) First calculate participants and their respective share_amount
  let participants = [];

  if (split.type === 'equal') {
    const members = await query(
      'SELECT user_id FROM group_members WHERE group_id=$1',
      [groupId]
    );
    const per = Number((split.amount / members.length).toFixed(2));
    participants = members.map((m) => ({
      user_id: m.user_id,
      share: per,
    }));
  } else if (split.type === 'partial') {
    const partials = split.shares; // [{user_id}, ...]
    const per = Number((split.amount / partials.length).toFixed(2));
    participants = partials.map((p) => ({
      user_id: p.user_id,
      share: per,
    }));
  } else if (split.type === 'percent') {
    participants = split.shares.map((p) => ({
      user_id: p.user_id,
      share: Number((split.amount * (p.percent / 100)).toFixed(2)),
    }));
  } else if (split.type === 'custom') {
    participants = split.shares.map((c) => ({
      user_id: c.user_id,
      share: Number(c.amount),
    }));
  }

  // 2) Calculate owed_amount for each participant and insert into database
  for (const p of participants) {
    const paid = p.user_id === payerId ? split.amount : 0; // How much this person actually paid in this expense
    const owedAmount = Number((paid - p.share).toFixed(2)); // Positive = credit; Negative = debt

    await query(
      `INSERT INTO expense_shares
         (expense_id, user_id, share_amount, owed_amount, is_settled)
       VALUES ($1,$2,$3,$4,false)`,
      [expenseId, p.user_id, p.share, owedAmount]
    );
  }
}

// Create an expense
router.post('/:groupId', async (req, res) => {
  const groupId = req.params.groupId;
  const { amount, description, category, date, split, payerId } = req.body;

  // If frontend provides payerId, use it; otherwise use current logged-in user
  const payer = payerId || req.user.id;

  // Ensure payer is a member of this group (prevent invalid inputs)
  const m = await query(
    'SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2',
    [groupId, payer]
  );
  if (m.length === 0) {
    return res
      .status(400)
      .json({ error: 'Payer is not a member of this group' });
  }

  const splitType = split?.type || 'equal';
  const effectiveSplit =
    split && split.type
      ? { ...split, amount }
      : { type: 'equal', amount };

  const rows = await query(
    `INSERT INTO expenses(group_id,payer_id,amount,description,category,date,split_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      groupId,
      payer,
      amount,
      description || '',
      category || 'general',
      date || new Date(),
      splitType,
    ]
  );
  const expense = rows[0];

  await createShares(expense.id, groupId, payer, effectiveSplit);

  req.io
    .to(`group:${groupId}`)
    .emit('expense_added', { groupId, expenseId: expense.id });
  res.json(expense);
});

// ⚠️ Note: detail route must be placed before /:groupId, otherwise it will be consumed by /:groupId
// Get details of each expense in a group (each participant's share / owed / is_settled)
router.get('/:groupId/detail', async (req, res) => {
  const groupId = req.params.groupId;

  const rows = await query(
    `SELECT
       e.id           AS expense_id,
       e.description  AS expense_description,
       e.amount       AS expense_amount,
       e.date         AS expense_date,
       e.payer_id,
       pu.name        AS payer_name,
       pu.email       AS payer_email,
       es.user_id,
       u.name         AS user_name,
       u.email        AS user_email,
       es.share_amount,
       es.owed_amount,
       es.is_settled
     FROM expenses e
     JOIN users pu           ON pu.id = e.payer_id
     JOIN expense_shares es  ON es.expense_id = e.id
     JOIN users u            ON u.id = es.user_id
     WHERE e.group_id = $1
     ORDER BY e.date DESC, e.id DESC, u.id`,
    [groupId]
  );

  res.json(rows);
});

// Get all expenses under a group (simple list)
router.get('/:groupId', async (req, res) => {
  const rows = await query(
    'SELECT * FROM expenses WHERE group_id=$1 ORDER BY date DESC',
    [req.params.groupId]
  );
  res.json(rows);
});

// summary: Summarize each person's unsettled net balance using owed_amount
router.get('/:groupId/summary', async (req,res)=>{
  const groupId = req.params.groupId;
  const balances = await query(
    `
    WITH unpaid AS (
      SELECT es.user_id,
             es.owed_amount
        FROM expense_shares es
        JOIN expenses e
          ON e.id = es.expense_id
       WHERE e.group_id = $1
         AND COALESCE(es.is_settled,false) = false
    )
    SELECT u.id   AS user_id,
           u.name,
           u.email,
           COALESCE(SUM(unpaid.owed_amount), 0) AS amount
      FROM users u
      JOIN group_members gm
        ON gm.user_id = u.id
       AND gm.group_id = $1
 LEFT JOIN unpaid
        ON unpaid.user_id = u.id
  GROUP BY u.id, u.name, u.email
  ORDER BY u.id
    `,
    [groupId]
  );
  res.json(balances);
});

// Mark "a user's share in this expense as settled"
router.post('/:groupId/:expenseId/settle', async (req, res) => {
  const { groupId, expenseId } = req.params;
  const { userId } = req.body; // The person being marked as settled (e.g., B)

  // 1) Find this expense
  const rows = await query(
    'SELECT * FROM expenses WHERE id=$1 AND group_id=$2',
    [expenseId, groupId]
  );
  const expense = rows[0];
  if (!expense)
    return res.status(404).json({ error: 'Expense not found' });

  // ⭐ Only the payer of this expense can mark others as "settled"
  if (expense.payer_id !== req.user.id) {
    return res
      .status(403)
      .json({ error: 'Only payer can mark settlement on this expense' });
  }

  // 2) Mark this user's share as settled
  await query(
    `UPDATE expense_shares
        SET is_settled = true,
            settled_at = NOW()
      WHERE expense_id = $1 AND user_id = $2`,
    [expenseId, userId]
  );

  // Notify frontend to refresh
  req.io
    .to(`group:${groupId}`)
    .emit('settlement_marked', { groupId, expenseId, userId });

  res.json({ ok: true });
});

// Update an expense: Only creator can modify, and no shares in this expense have been settled yet
router.put('/:groupId/:expenseId', async (req, res) => {
  const { groupId, expenseId } = req.params;
  const { amount, description, category, date, split } = req.body;

  // 1) Get this expense
  const rows = await query(
    'SELECT * FROM expenses WHERE id=$1 AND group_id=$2',
    [expenseId, groupId]
  );
  const expense = rows[0];
  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  // ⭐ Only the payer of this expense can modify it
  if (expense.payer_id !== req.user.id) {
    return res
      .status(403)
      .json({ error: 'Only payer can modify this expense' });
  }

  // 2) If anyone in this expense already has is_settled=true, prohibit modification
  const shares = await query(
    'SELECT * FROM expense_shares WHERE expense_id=$1',
    [expenseId]
  );
  if (shares.some((s) => s.is_settled)) {
    return res
      .status(400)
      .json({ error: 'Cannot edit: some shares already settled' });
  }

  // 3) Update the expenses table itself (amount / description / category / date)
  const newAmount = amount ?? expense.amount;
  const newDesc = description ?? expense.description;
  const newCategory = category ?? expense.category;
  const newDate = date ?? expense.date;

  const updatedRows = await query(
    `UPDATE expenses
        SET amount=$1,
            description=$2,
            category=$3,
            date=$4,
            split_type=$5
      WHERE id=$6
      RETURNING *`,
    [
      newAmount,
      newDesc,
      newCategory,
      newDate,
      split?.type || expense.split_type || 'equal',
      expenseId,
    ]
  );
  const updated = updatedRows[0];

  // 4) First delete the original shares of this expense, then recreate shares using the new split
  await query('DELETE FROM expense_shares WHERE expense_id=$1', [
    expenseId,
  ]);

  const effectiveSplit =
    split && split.type
      ? { ...split, amount: newAmount }
      : { type: updated.split_type || 'equal', amount: newAmount };

  await createShares(
    expenseId,
    groupId,
    expense.payer_id, // payer remains unchanged
    effectiveSplit
  );

  // Notify frontend to refresh
  req.io
    .to(`group:${groupId}`)
    .emit('expense_updated', { groupId, expenseId });

  res.json(updated);
});

// Delete an expense: Only creator (payer) can delete, and no one in this expense has been settled yet
router.delete('/:groupId/:expenseId', async (req, res) => {
  const { groupId, expenseId } = req.params;

  // 1) Find this expense
  const rows = await query(
    'SELECT * FROM expenses WHERE id=$1 AND group_id=$2',
    [expenseId, groupId]
  );
  const expense = rows[0];
  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  // 2) Only payer can delete
  if (expense.payer_id !== req.user.id) {
    return res
      .status(403)
      .json({ error: 'Only payer can delete this expense' });
  }

  // 3) If anyone in this expense already has is_settled=true, do not allow deletion
  const shares = await query(
    'SELECT is_settled FROM expense_shares WHERE expense_id=$1',
    [expenseId]
  );
  if (shares.some((s) => s.is_settled)) {
    return res
      .status(400)
      .json({ error: 'Cannot delete: some shares already settled' });
  }

  // 4) Delete this expense (expense_shares will be automatically deleted due to ON DELETE CASCADE)
  await query('DELETE FROM expenses WHERE id=$1', [expenseId]);

  // Notify frontend to refresh
  req.io
    .to(`group:${groupId}`)
    .emit('expense_deleted', { groupId, expenseId });

  res.json({ ok: true });
});

export default router;