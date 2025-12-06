// // backend/src/routes/settlements.js
// import express from 'express';
// import { requireAuth } from '../middleware/requireAuth.js';
// import { query } from '../db.js';
// import { minimizeTransactions } from '../settlement.js';
// import { sendMail } from '../email.js';

// const router = express.Router();
// router.use(requireAuth);

// /**
//  * 工具函数：基于当前 group 的“未结清 owed_amount”，算每个用户的净余额
//  * 返回格式：[{ user_id, amount }, ...]，amount > 0 表示净收款，< 0 表示净付款
//  */
// async function getBalancesForGroup(groupId) {
//   const rows = await query(
//     `
//     WITH unpaid AS (
//       SELECT es.user_id,
//              es.owed_amount
//         FROM expense_shares es
//         JOIN expenses e
//           ON e.id = es.expense_id
//        WHERE e.group_id = $1
//          AND COALESCE(es.is_settled,false) = false
//     )
//     SELECT u.id AS user_id,
//            COALESCE(SUM(unpaid.owed_amount), 0) AS amount
//       FROM users u
//       JOIN group_members gm
//         ON gm.user_id = u.id
//        AND gm.group_id = $1
//  LEFT JOIN unpaid
//         ON unpaid.user_id = u.id
//   GROUP BY u.id
//   ORDER BY u.id
//     `,
//     [groupId]
//   );
//   return rows;
// }

// /**
//  * 工具函数：给某个 group 生成“最简转账方案”
//  * 复用 getBalancesForGroup + minimizeTransactions
//  */
// async function suggestSettlementsForGroup(groupId) {
//   const balances = await getBalancesForGroup(groupId);
//   // minimizeTransactions 接收 [{ user_id, amount }, ...]
//   const txs = minimizeTransactions(balances);
//   return txs;
// }

// /**
//  * 1) GET /:groupId/suggest
//  *    只算“最简转账方案”，不改数据库，也不发邮件
//  */
// router.get('/:groupId/suggest', async (req, res) => {
//   const groupId = req.params.groupId;

//   try {
//     const txs = await suggestSettlementsForGroup(groupId);
//     res.json(txs);
//   } catch (e) {
//     console.error('Error in /settlements/:groupId/suggest', e);
//     res.status(500).json({ error: 'Failed to compute settlements' });
//   }
// });

// /**
//  * 2) POST /:groupId/mark
//  *    一次性把某些 expense 的所有 share 标记为已结清（“整笔结清”）
//  *    注意：它不会改 owed_amount，只是让这些 share 不再参与 summary / 结算
//  */
// router.post('/:groupId/mark', async (req, res) => {
//   const { expense_ids } = req.body;
//   if (!Array.isArray(expense_ids)) {
//     return res.status(400).json({ error: 'expense_ids[] required' });
//   }

//   const groupId = req.params.groupId;

//   try {
//     await query(
//       'UPDATE expense_shares SET is_settled=true, settled_at=NOW() WHERE expense_id = ANY($1)',
//       [expense_ids]
//     );
//     req.io
//       .to(`group:${groupId}`)
//       .emit('settlement_marked', { groupId, expense_ids });
//     res.json({ ok: true });
//   } catch (e) {
//     console.error('Error in /settlements/:groupId/mark', e);
//     res.status(500).json({ error: 'Failed to mark settlements' });
//   }
// });

// /**
//  * 3) POST /:groupId/notify
//  *    一键：根据当前“未结清”的 owed_amount -> 算最简转账方案 -> 给所有成员发邮件
//  *    然后把这个 group 标记为 is_finalized=true（你选的方案 A：之后只读）
//  */
// router.post('/:groupId/notify', async (req, res) => {
//   const groupId = req.params.groupId;

//   try {
//     // ⭐ 先确认当前用户是这个 group 的创建者
//     const groupRows = await query(
//       'SELECT created_by, is_finalized FROM groups WHERE id=$1',
//       [groupId]
//     );
//     const group = groupRows[0];
//     if (!group) {
//       return res.status(404).json({ error: 'Group not found' });
//     }

//     if (group.created_by !== req.user.id) {
//       return res
//         .status(403)
//         .json({ error: 'Only group creator can finalize and send notifications' });
//     }

//     // 如果已经 finalized 了，就不再重复发送
//     if (group.is_finalized) {
//       return res.status(400).json({ error: 'Group already finalized' });
//     }

//     // 1) 算最简转账方案
//     const settlements = await suggestSettlementsForGroup(groupId);

//     // 2) 查成员信息
//     const members = await query(
//       `SELECT u.id, u.name, u.email
//          FROM users u
//          JOIN group_members gm ON gm.user_id = u.id
//         WHERE gm.group_id=$1`,
//       [groupId]
//     );
//     const byId = new Map(members.map((m) => [m.id, m]));

//     // 3) 给每个人发“个人视角”的账单结果
//     for (const m of members) {
//       const myTx = settlements.filter(
//         (s) => s.from_user_id === m.id || s.to_user_id === m.id
//       );

//       const lines = myTx.length
//         ? myTx.map((t) => {
//             const from = byId.get(t.from_user_id);
//             const to = byId.get(t.to_user_id);
//             const amount = Number(t.amount).toFixed(2);
//             if (t.from_user_id === m.id) {
//               return `你需要给 ${to.name} (${to.email}) 转 ${amount}`;
//             } else {
//               return `${from.name} (${from.email}) 应该给你转 ${amount}`;
//             }
//           })
//         : ['目前你与其他成员之间的账目已结清，无需转账。'];

//       const text =
//         `Group ${groupId} 结算结果：\n\n` + lines.join('\n');

//       await sendMail(
//         m.email,
//         `Group ${groupId} 结算通知`,
//         text
//       );
//     }

//     // 4) 标记这个 group 已经 finalized
//     await query(
//       'UPDATE groups SET is_finalized = true WHERE id=$1',
//       [groupId]
//     );

//     res.json({ ok: true, settlementsCount: settlements.length });
//   } catch (e) {
//     console.error('Error in /settlements/:groupId/notify', e);
//     res.status(500).json({ error: 'Failed to send notifications' });
//   }
// });

// export default router;
// backend/src/routes/settlements.js
import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { query } from '../db.js';
import { minimizeTransactions } from '../settlement.js';
import { sendMail } from '../email.js';

const router = express.Router();
router.use(requireAuth);

/**
 * Utility function: Calculate each user's net balance based on current group's "unsettled owed_amount"
 * Return format: [{ user_id, amount }, ...], amount > 0 means net receivable, < 0 means net payable
 */
async function getBalancesForGroup(groupId) {
  const rows = await query(
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
    SELECT u.id AS user_id,
           COALESCE(SUM(unpaid.owed_amount), 0) AS amount
      FROM users u
      JOIN group_members gm
        ON gm.user_id = u.id
       AND gm.group_id = $1
 LEFT JOIN unpaid
        ON unpaid.user_id = u.id
  GROUP BY u.id
  ORDER BY u.id
    `,
    [groupId]
  );
  return rows;
}

/**
 * Utility function: Generate "minimal transfer scheme" for a group
 * Reuse getBalancesForGroup + minimizeTransactions
 */
async function suggestSettlementsForGroup(groupId) {
  const balances = await getBalancesForGroup(groupId);
  // minimizeTransactions receives [{ user_id, amount }, ...]
  const txs = minimizeTransactions(balances);
  return txs;
}

/**
 * 1) GET /:groupId/suggest
 *    Only calculate "minimal transfer scheme", don't modify database, don't send emails
 */
router.get('/:groupId/suggest', async (req, res) => {
  const groupId = req.params.groupId;

  try {
    const txs = await suggestSettlementsForGroup(groupId);
    res.json(txs);
  } catch (e) {
    console.error('Error in /settlements/:groupId/suggest', e);
    res.status(500).json({ error: 'Failed to compute settlements' });
  }
});

/**
 * 2) POST /:groupId/mark
 *    Mark all shares of certain expenses as settled in one go ("bulk settlement")
 *    Note: It doesn't change owed_amount, just makes these shares no longer participate in summary / settlement
 */
router.post('/:groupId/mark', async (req, res) => {
  const { expense_ids } = req.body;
  if (!Array.isArray(expense_ids)) {
    return res.status(400).json({ error: 'expense_ids[] required' });
  }

  const groupId = req.params.groupId;

  try {
    await query(
      'UPDATE expense_shares SET is_settled=true, settled_at=NOW() WHERE expense_id = ANY($1)',
      [expense_ids]
    );
    req.io
      .to(`group:${groupId}`)
      .emit('settlement_marked', { groupId, expense_ids });
    res.json({ ok: true });
  } catch (e) {
    console.error('Error in /settlements/:groupId/mark', e);
    res.status(500).json({ error: 'Failed to mark settlements' });
  }
});

/**
 * 3) POST /:groupId/notify
 *    One-click: Based on current "unsettled" owed_amount -> calculate minimal transfer scheme -> send emails to all members
 *    Then mark this group as is_finalized=true (your chosen option A: read-only afterwards)
 */
router.post('/:groupId/notify', async (req, res) => {
  const groupId = req.params.groupId;

  try {
    // ⭐ First confirm current user is the creator of this group
    const groupRows = await query(
      'SELECT created_by, is_finalized FROM groups WHERE id=$1',
      [groupId]
    );
    const group = groupRows[0];
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.created_by !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'Only group creator can finalize and send notifications' });
    }

    // If already finalized, don't send again
    if (group.is_finalized) {
      return res.status(400).json({ error: 'Group already finalized' });
    }

    // 1) Calculate minimal transfer scheme
    const settlements = await suggestSettlementsForGroup(groupId);

    // 2) Get member information
    const members = await query(
      `SELECT u.id, u.name, u.email
         FROM users u
         JOIN group_members gm ON gm.user_id = u.id
        WHERE gm.group_id=$1`,
      [groupId]
    );
    const byId = new Map(members.map((m) => [m.id, m]));

    // 3) Send "personal perspective" billing results to each person
    for (const m of members) {
      const myTx = settlements.filter(
        (s) => s.from_user_id === m.id || s.to_user_id === m.id
      );

      const lines = myTx.length
        ? myTx.map((t) => {
            const from = byId.get(t.from_user_id);
            const to = byId.get(t.to_user_id);
            const amount = Number(t.amount).toFixed(2);
            if (t.from_user_id === m.id) {
              return `You need to transfer ${amount} to ${to.name} (${to.email})`;
            } else {
              return `${from.name} (${from.email}) should transfer ${amount} to you`;
            }
          })
        : ['Your accounts with other members are already settled, no transfer needed.'];

      const text =
        `Group ${groupId} settlement results:\n\n` + lines.join('\n');

      await sendMail(
        m.email,
        `Group ${groupId} Settlement Notification`,
        text
      );
    }

    // 4) Mark this group as finalized
    await query(
      'UPDATE groups SET is_finalized = true WHERE id=$1',
      [groupId]
    );

    res.json({ ok: true, settlementsCount: settlements.length });
  } catch (e) {
    console.error('Error in /settlements/:groupId/notify', e);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

export default router;