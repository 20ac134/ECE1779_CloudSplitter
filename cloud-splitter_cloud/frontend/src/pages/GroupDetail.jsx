// // import { useEffect, useState } from 'react';
// // import { useParams } from 'react-router-dom';
// // import { api } from '../api.js';
// // import { socket } from '../socket.js';

// // export default function GroupDetail() {
// //   const { id } = useParams(); // groupId

// //   const [members, setMembers] = useState([]);
// //   const [expenses, setExpenses] = useState([]);
// //   const [summary, setSummary] = useState([]);
// //   const [details, setDetails] = useState([]); // 每笔费用的明细

// //   const [amount, setAmount] = useState(100);
// //   const [desc, setDesc] = useState('Dinner');

// //   // 邀请
// //   const [inviteEmail, setInviteEmail] = useState('');

// //   // 分摊模式相关
// //   const [mode, setMode] = useState('equal'); // 'equal' | 'partial' | 'percent' | 'custom'
// //   const [selected, setSelected] = useState([]); // 选中的 user_id
// //   const [percents, setPercents] = useState({}); // { user_id: percent }
// //   const [customs, setCustoms] = useState({}); // { user_id: amount }
// //   const [currentUser, setCurrentUser] = useState(null);


// //   // 选择付款人
// //   const [payerId, setPayerId] = useState('');

// //   // 结算阶段：false = 还在记账阶段；true = 已发送结算邮件，进入结算阶段
// //   const [canSettle, setCanSettle] = useState(false);

// //   // 编辑相关
// //   const [editingId, setEditingId] = useState(null); // 正在编辑的 expense_id
// //   const [editAmount, setEditAmount] = useState('');
// //   const [editDesc, setEditDesc] = useState('');

// //   async function refresh() {
// //     const [m, e, s, d] = await Promise.all([
// //       api(`/groups/${id}/members`),
// //       api(`/expenses/${id}`),
// //       api(`/expenses/${id}/summary`),
// //       api(`/expenses/${id}/detail`),
// //     ]);
// //     setMembers(m);
// //     setExpenses(e);
// //     setSummary(s);
// //     setDetails(d);

// //     // 如果还没选付款人，默认选第一个成员（只是前端默认值）
// //     if (!payerId && m.length > 0) {
// //       setPayerId(m[0].id);
// //     }
// //   }

// //   useEffect(() => {
// //     refresh();

// //     socket.emit('join_group', id);

// //     const onAdd = (evt) => {
// //       if (String(evt.groupId) === String(id)) refresh();
// //     };

// //     const onSettle = (evt) => {
// //       if (String(evt.groupId) === String(id)) refresh();
// //     };

// //     const onUpdate = (evt) => {
// //       if (String(evt.groupId) === String(id)) refresh();
// //     };

// //     socket.on('expense_added', onAdd);
// //     socket.on('settlement_marked', onSettle);
// //     socket.on('expense_updated', onUpdate);

// //     return () => {
// //       socket.off('expense_added', onAdd);
// //       socket.off('settlement_marked', onSettle);
// //       socket.off('expense_updated', onUpdate);
// //     };
// //   }, [id]);


// //   // 选中/取消参与成员
// //   function toggleUser(uid) {
// //     setSelected((prev) =>
// //       prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
// //     );
// //   }

// //   // 添加账单（支持 equal / partial / percent / custom）
// //   async function submitExpense() {
// //     if (canSettle) {
// //       alert('当前已进入结算阶段，不能再添加新账单。');
// //       return;
// //     }

// //     if (!payerId) {
// //       alert('请选择付款人');
// //       return;
// //     }

// //     const payload = {
// //       amount: Number(amount),
// //       description: desc,
// //       payerId, // 关键：把付款人发给后端
// //       split: { type: mode },
// //     };

// //     if (mode === 'partial') {
// //       if (selected.length === 0) {
// //         alert('请选择参与分摊的成员');
// //         return;
// //       }
// //       payload.split.shares = selected.map((uid) => ({ user_id: uid }));
// //     } else if (mode === 'percent') {
// //       const shares = selected.map((uid) => ({
// //         user_id: uid,
// //         percent: Number(percents[uid] || 0),
// //       }));
// //       const totalPercent = shares.reduce(
// //         (sum, s) => sum + (isNaN(s.percent) ? 0 : s.percent),
// //         0
// //       );
// //       if (shares.length === 0) {
// //         alert('请选择参与分摊的成员');
// //         return;
// //       }
// //       if (totalPercent !== 100) {
// //         alert(`百分比之和需要等于 100，目前是 ${totalPercent}`);
// //         return;
// //       }
// //       payload.split.shares = shares;
// //     } else if (mode === 'custom') {
// //       const shares = selected.map((uid) => ({
// //         user_id: uid,
// //         amount: Number(customs[uid] || 0),
// //       }));
// //       const totalAmount = shares.reduce(
// //         (sum, s) => sum + (isNaN(s.amount) ? 0 : s.amount),
// //         0
// //       );
// //       if (shares.length === 0) {
// //         alert('请选择参与分摊的成员');
// //         return;
// //       }
// //       if (Math.abs(totalAmount - Number(amount)) > 0.01) {
// //         alert(`自定义金额之和 (${totalAmount}) 必须等于总金额 (${amount})`);
// //         return;
// //       }
// //       payload.split.shares = shares;
// //     }
// //     // equal 不需要 shares，后端会按 group 全员平分

// //     await api(`/expenses/${id}`, {
// //       method: 'POST',
// //       body: JSON.stringify(payload),
// //     });

// //     // 重置
// //     setAmount(0);
// //     setDesc('');
// //     setSelected([]);
// //     setPercents({});
// //     setCustoms({});
// //     setMode('equal');

// //     await refresh();
// //   }

// //   // 预览结算方案（不改数据库，只是弹窗）
// //   async function suggest() {
// //     try {
// //       const txs = await api(`/settlements/${id}/suggest`);
// //       alert(
// //         txs.length
// //           ? txs
// //               .map(
// //                 (t) =>
// //                   `User ${t.from_user_id} → ${t.to_user_id}: $${Number(
// //                     t.amount
// //                   ).toFixed(2)}`
// //               )
// //               .join('\n')
// //           : 'No settlements needed.'
// //       );
// //     } catch (e) {
// //       alert('获取结算方案失败：' + (e.message || '未知错误'));
// //     }
// //   }

// //   // trip / 周期结束：一键发送结算邮件，并进入“结算阶段”
// //   async function finalizeAndNotify() {
// //     if (canSettle) {
// //       alert('已经发送过结算邮件，当前处于结算阶段。');
// //       return;
// //     }

// //     // 简单的“所有人同意”确认：把成员和余额列出来，让你确认
// //     const balancesText =
// //       summary.length > 0
// //         ? summary
// //             .map(
// //               (s) =>
// //                 `${s.name}: ${Number(s.amount).toFixed(2)}`
// //             )
// //             .join('\n')
// //         : '(暂无余额数据)';

// //     const msg =
// //       '请确认你已经和所有成员对过账，并且确认以下余额无误，然后再发送结算邮件：\n\n' +
// //       balancesText +
// //       '\n\n确认要发送结算邮件吗？';

// //     if (!window.confirm(msg)) {
// //       return;
// //     }

// //     try {
// //       const result = await api(`/settlements/${id}/notify`, {
// //         method: 'POST',
// //       });
// //       alert(
// //         `已触发结算通知（当前建议交易条数：${
// //           result.settlementsCount ?? 0
// //         }）。在开发环境下，你可以在 Mailhog 或 API 日志中查看邮件内容。`
// //       );
// //       // 进入结算阶段：不再允许添加 / 编辑，只能标记结清
// //       setCanSettle(true);
// //     } catch (e) {
// //       alert('发送结算通知失败：' + (e.message || '未知错误'));
// //     }
// //   }

// //   async function invite() {
// //     if (!inviteEmail) {
// //       alert('请输入要邀请的用户邮箱');
// //       return;
// //     }
// //     try {
// //       await api(`/groups/${id}/invite`, {
// //         method: 'POST',
// //         body: JSON.stringify({ email: inviteEmail }),
// //       });
// //       setInviteEmail('');
// //       await refresh();
// //       alert('邀请成功（该邮箱需要已经在系统里注册过账号）');
// //     } catch (e) {
// //       alert('邀请失败：' + (e.message || '未知错误'));
// //     }
// //   }

// //   // 标记某一笔账中某个成员“已结算”
// //   async function markSettled(expenseId, userId) {
// //     if (!canSettle) {
// //       alert('请先发送结算邮件，进入结算阶段后再标记已结算。');
// //       return;
// //     }
// //     try {
// //       await api(`/expenses/${id}/${expenseId}/settle`, {
// //         method: 'POST',
// //         body: JSON.stringify({ userId }),
// //       });
// //       await refresh();
// //     } catch (e) {
// //       alert('标记结算失败：' + (e.message || '未知错误'));
// //     }
// //   }

// //   // 开始编辑某一笔账单（金额 + 描述）
// //   function startEditExpense(exp) {
// //     setEditingId(exp.expense_id);
// //     setEditAmount(exp.amount);
// //     setEditDesc(exp.description);
// //   }

// //   async function saveEditExpense(expenseId) {
// //     try {
// //       await api(`/expenses/${id}/${expenseId}`, {
// //         method: 'PUT',
// //         body: JSON.stringify({
// //           amount: Number(editAmount),
// //           description: editDesc,
// //         }),
// //       });
// //       setEditingId(null);
// //       await refresh();
// //     } catch (e) {
// //       alert('保存修改失败：' + (e.message || '未知错误'));
// //     }
// //   }

// //   // 把 detail 按 expense_id 分组，方便渲染
// //   const detailByExpense = details.reduce((acc, row) => {
// //     const expId = row.expense_id;
// //     if (!acc[expId]) {
// //       acc[expId] = {
// //         expense_id: expId,
// //         description: row.expense_description,
// //         amount: row.expense_amount,
// //         date: row.expense_date,
// //         payer_id: row.payer_id,
// //         payer_name: row.payer_name,
// //         payer_email: row.payer_email,
// //         shares: [],
// //       };
// //     }
// //     acc[expId].shares.push(row);
// //     return acc;
// //   }, {});

// //   const detailList = Object.values(detailByExpense);

// //   return (
// //     <div>
// //       {/* DEBUG 条，确认前端是最新版本 */}
// //       <div
// //         style={{
// //           background: 'red',
// //           color: 'white',
// //           padding: 8,
// //           marginBottom: 8,
// //         }}
// //       >
// //         DEBUG INVITE VERSION
// //       </div>

// //       <h3>Expense Group #{id}</h3>

// //       {/* 成员 + 邀请 */}
// //       <section>
// //         <h4>Members</h4>
// //         <ul>
// //           {members.map((m) => (
// //             <li key={m.id}>
// //               {m.name} ({m.email})
// //             </li>
// //           ))}
// //         </ul>

// //         <div style={{ marginTop: 8 }}>
// //           <h5>Invite Member</h5>
// //           <input
// //             placeholder="Email"
// //             value={inviteEmail}
// //             onChange={(e) => setInviteEmail(e.target.value)}
// //           />
// //           <button onClick={invite} style={{ marginLeft: 8 }}>
// //             Invite
// //           </button>
// //         </div>
// //       </section>

// //       {/* 添加账单：只有在未进入结算阶段时显示 */}
// //       {!canSettle && (
// //         <section>
// //           <h4>Add Expense</h4>

// //           {/* 金额 + 描述 */}
// //           <div
// //             style={{
// //               display: 'flex',
// //               gap: 8,
// //               alignItems: 'center',
// //               flexWrap: 'wrap',
// //             }}
// //           >
// //             <input
// //               type="number"
// //               value={amount}
// //               onChange={(e) => setAmount(e.target.value)}
// //               placeholder="Amount"
// //             />
// //             <input
// //               value={desc}
// //               onChange={(e) => setDesc(e.target.value)}
// //               placeholder="Description"
// //             />
// //           </div>

// //           {/* 选择付款人 */}
// //           <div style={{ marginTop: 8 }}>
// //             <label>
// //               Payer:&nbsp;
// //               <select
// //                 value={payerId}
// //                 onChange={(e) => setPayerId(e.target.value)}
// //               >
// //                 {members.map((m) => (
// //                   <option key={m.id} value={m.id}>
// //                     {m.name} ({m.email})
// //                   </option>
// //                 ))}
// //               </select>
// //             </label>
// //           </div>

// //           {/* 分摊模式 */}
// //           <div style={{ marginTop: 8 }}>
// //             <label>
// //               <input
// //                 type="radio"
// //                 name="mode"
// //                 value="equal"
// //                 checked={mode === 'equal'}
// //                 onChange={() => setMode('equal')}
// //               />{' '}
// //               Equal (全员平分)
// //             </label>{' '}
// //             <label>
// //               <input
// //                 type="radio"
// //                 name="mode"
// //                 value="partial"
// //                 checked={mode === 'partial'}
// //                 onChange={() => setMode('partial')}
// //               />{' '}
// //               Partial (部分参与)
// //             </label>{' '}
// //             <label>
// //               <input
// //                 type="radio"
// //                 name="mode"
// //                 value="percent"
// //                 checked={mode === 'percent'}
// //                 onChange={() => setMode('percent')}
// //               />{' '}
// //               Percent (百分比分摊)
// //             </label>{' '}
// //             <label>
// //               <input
// //                 type="radio"
// //                 name="mode"
// //                 value="custom"
// //                 checked={mode === 'custom'}
// //                 onChange={() => setMode('custom')}
// //               />{' '}
// //               Custom (自定义金额)
// //             </label>
// //           </div>

// //           {mode !== 'equal' && (
// //             <div style={{ marginTop: 8 }}>
// //               <div>选择成员：</div>
// //               <ul>
// //                 {members.map((m) => (
// //                   <li key={m.id}>
// //                     <label>
// //                       <input
// //                         type="checkbox"
// //                         checked={selected.includes(m.id)}
// //                         onChange={() => toggleUser(m.id)}
// //                       />
// //                       {m.name} ({m.email})
// //                     </label>
// //                     {mode === 'percent' && selected.includes(m.id) && (
// //                       <input
// //                         type="number"
// //                         style={{ marginLeft: 8, width: 80 }}
// //                         placeholder="%"
// //                         value={percents[m.id] || ''}
// //                         onChange={(e) =>
// //                           setPercents({
// //                             ...percents,
// //                             [m.id]: e.target.value,
// //                           })
// //                         }
// //                       />
// //                     )}
// //                     {mode === 'custom' && selected.includes(m.id) && (
// //                       <input
// //                         type="number"
// //                         style={{ marginLeft: 8, width: 100 }}
// //                         placeholder="Amount"
// //                         value={customs[m.id] || ''}
// //                         onChange={(e) =>
// //                           setCustoms({
// //                             ...customs,
// //                             [m.id]: e.target.value,
// //                           })
// //                         }
// //                       />
// //                     )}
// //                   </li>
// //                 ))}
// //               </ul>
// //               {mode === 'percent' && (
// //                 <small>提示：所有输入的百分比之和应为 100。</small>
// //               )}
// //             </div>
// //           )}

// //           <button onClick={submitExpense} style={{ marginTop: 8 }}>
// //             Add Expense
// //           </button>
// //         </section>
// //       )}

// //       {/* 汇总余额 */}
// //       <section>
// //         <h4>Balances</h4>
// //         <ul>
// //           {summary.map((s) => (
// //             <li key={s.user_id}>
// //               {s.name}: ${Number(s.amount).toFixed(2)}
// //             </li>
// //           ))}
// //         </ul>

// //         <div style={{ marginTop: 8 }}>
// //           <button onClick={suggest}>
// //             预览结算方案（仅当前页面提示）
// //           </button>
// //           <button
// //             style={{ marginLeft: 8 }}
// //             onClick={finalizeAndNotify}
// //           >
// //             所有账单已添加完毕，发送结算邮件
// //           </button>
// //         </div>
// //         {canSettle && (
// //           <div style={{ marginTop: 4, color: '#d9534f' }}>
// //             当前已进入结算阶段：不能再新增或编辑账单，只能逐笔标记是否已结清。
// //           </div>
// //         )}
// //       </section>

// //       {/* 每一笔费用明细 + 结算按钮 + 编辑按钮 */}
// //       <section>
// //         <h4>Expense Details</h4>
// //         {detailList.map((exp) => {
// //           const allUnsettled = exp.shares.every((s) => !s.is_settled);
// //           // 先简单：未结算阶段 + 这笔没人结清 -> 就能 Edit
// //           const canEdit = !canSettle && allUnsettled;

// //           return (
// //             <div
// //               key={exp.expense_id}
// //               style={{
// //                 border: '1px solid #ccc',
// //                 padding: 8,
// //                 marginBottom: 8,
// //               }}
// //             >
// //               {editingId === exp.expense_id ? (
// //                 <>
// //                   <div>
// //                     <strong>Editing Expense #{exp.expense_id}</strong>
// //                   </div>
// //                   <div style={{ marginTop: 4 }}>
// //                     <input
// //                       type="number"
// //                       value={editAmount}
// //                       onChange={(e) => setEditAmount(e.target.value)}
// //                     />
// //                     <input
// //                       style={{ marginLeft: 8 }}
// //                       value={editDesc}
// //                       onChange={(e) => setEditDesc(e.target.value)}
// //                     />
// //                     <button
// //                       style={{ marginLeft: 8 }}
// //                       onClick={() => saveEditExpense(exp.expense_id)}
// //                     >
// //                       Save
// //                     </button>
// //                     <button
// //                       style={{ marginLeft: 4 }}
// //                       onClick={() => setEditingId(null)}
// //                     >
// //                       Cancel
// //                     </button>
// //                   </div>
// //                 </>
// //               ) : (
// //                 <>
// //                   <div>
// //                     <strong>
// //                       #{exp.expense_id} ${exp.amount} – {exp.description}
// //                     </strong>{' '}
// //                     on {exp.date}
// //                   </div>
// //                   <div style={{ fontSize: 12, color: '#555' }}>
// //                     Payer: {exp.payer_name} ({exp.payer_email})
// //                   </div>
// //                   {canEdit && (
// //                     <button
// //                       style={{ marginTop: 4 }}
// //                       onClick={() => startEditExpense(exp)}
// //                     >
// //                       Edit
// //                     </button>
// //                   )}
// //                 </>
// //               )}

// //               <ul style={{ marginTop: 8 }}>
// //                 {exp.shares.map((s) => (
// //                   <li key={s.user_id}>
// //                     {s.user_name} ({s.user_email}) – 应付 $
// //                     {Number(s.share_amount).toFixed(2)}，本笔净额{' '}
// //                     {Number(s.owed_amount).toFixed(2)}{' '}
// //                     {s.is_settled ? '✅ 已结清' : '❌ 未结清'}
// //                     {/* 只有在结算阶段才允许点“标记已结算” */}
// //                     {canSettle && !s.is_settled && (
// //                       <button
// //                         style={{ marginLeft: 8 }}
// //                         onClick={() =>
// //                           markSettled(exp.expense_id, s.user_id)
// //                         }
// //                       >
// //                         标记已结算
// //                       </button>
// //                     )}
// //                   </li>
// //                 ))}
// //               </ul>
// //             </div>
// //           );
// //         })}
// //       </section>

// //       {/* 原来的简单列表保留（方便快速扫一眼） */}
// //       <section>
// //         <h4>Recent Expenses (Raw)</h4>
// //         <ul>
// //           {expenses.map((e) => (
// //             <li key={e.id}>
// //               ${e.amount} – {e.description} ({e.category}) on {e.date}
// //             </li>
// //           ))}
// //         </ul>
// //       </section>
// //     </div>
// //   );
// // }
// import { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import { api } from '../api.js';
// import { socket } from '../socket.js';

// export default function GroupDetail() {
//   const { id } = useParams(); // groupId

//   const [currentUser, setCurrentUser] = useState(null);
//   const [group, setGroup] = useState(null);

//   const [members, setMembers] = useState([]);
//   const [expenses, setExpenses] = useState([]);
//   const [summary, setSummary] = useState([]);
//   const [details, setDetails] = useState([]); // 每笔费用的明细

//   // 添加账单相关
//   const [amount, setAmount] = useState(100);
//   const [desc, setDesc] = useState('Dinner');
//   const [payerId, setPayerId] = useState('');

//   const [mode, setMode] = useState('equal'); // 'equal' | 'partial' | 'percent' | 'custom'
//   const [selected, setSelected] = useState([]); // 选中的 user_id
//   const [percents, setPercents] = useState({}); // { user_id: percent }
//   const [customs, setCustoms] = useState({}); // { user_id: amount }

//   // 编辑相关
//   const [editingId, setEditingId] = useState(null); // 正在编辑的 expense_id
//   const [editAmount, setEditAmount] = useState('');
//   const [editDesc, setEditDesc] = useState('');

//   // 派生状态
//   const isFinalized = group?.is_finalized;
//   const isOwner =
//     group && currentUser && group.created_by === currentUser.id;

//   // 获取当前用户
//   useEffect(() => {
//     api('/users/me')
//       .then(setCurrentUser)
//       .catch(() => {
//         // 如果失败(未登录等)，这里暂时忽略，也可以跳回登录页
//       });
//   }, []);

//   async function refresh() {
//     const [g, m, e, s, d] = await Promise.all([
//       api(`/groups/${id}`),
//       api(`/groups/${id}/members`),
//       api(`/expenses/${id}`),
//       api(`/expenses/${id}/summary`),
//       api(`/expenses/${id}/detail`),
//     ]);
//     setGroup(g);
//     setMembers(m);
//     setExpenses(e);
//     setSummary(s);
//     setDetails(d);

//     // 如果还没选付款人，默认选第一个成员
//     if (!payerId && m.length > 0) {
//       setPayerId(m[0].id);
//     }
//   }

//   useEffect(() => {
//     refresh();

//     socket.emit('join_group', id);

//     const onAdd = (evt) => {
//       if (String(evt.groupId) === String(id)) refresh();
//     };
//     const onSettle = (evt) => {
//       if (String(evt.groupId) === String(id)) refresh();
//     };
//     const onUpdate = (evt) => {
//       if (String(evt.groupId) === String(id)) refresh();
//     };

//     socket.on('expense_added', onAdd);
//     socket.on('settlement_marked', onSettle);
//     socket.on('expense_updated', onUpdate);

//     return () => {
//       socket.off('expense_added', onAdd);
//       socket.off('settlement_marked', onSettle);
//       socket.off('expense_updated', onUpdate);
//     };
//   }, [id]);

//   // 选中/取消参与成员
//   function toggleUser(uid) {
//     setSelected((prev) =>
//       prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
//     );
//   }

//   // 添加账单（支持 equal / partial / percent / custom）
//   async function submitExpense() {
//     if (isFinalized) {
//       alert('本 Trip 已经 Finalized，不能再添加新账单。');
//       return;
//     }

//     if (!payerId) {
//       alert('请选择付款人');
//       return;
//     }

//     const payload = {
//       amount: Number(amount),
//       description: desc,
//       payerId, // 告诉后端谁是付款人
//       split: { type: mode },
//     };

//     if (mode === 'partial') {
//       if (selected.length === 0) {
//         alert('请选择参与分摊的成员');
//         return;
//       }
//       payload.split.shares = selected.map((uid) => ({ user_id: uid }));
//     } else if (mode === 'percent') {
//       const shares = selected.map((uid) => ({
//         user_id: uid,
//         percent: Number(percents[uid] || 0),
//       }));
//       const totalPercent = shares.reduce(
//         (sum, s) => sum + (isNaN(s.percent) ? 0 : s.percent),
//         0
//       );
//       if (shares.length === 0) {
//         alert('请选择参与分摊的成员');
//         return;
//       }
//       if (totalPercent !== 100) {
//         alert(`百分比之和需要等于 100，目前是 ${totalPercent}`);
//         return;
//       }
//       payload.split.shares = shares;
//     } else if (mode === 'custom') {
//       const shares = selected.map((uid) => ({
//         user_id: uid,
//         amount: Number(customs[uid] || 0),
//       }));
//       const totalAmount = shares.reduce(
//         (sum, s) => sum + (isNaN(s.amount) ? 0 : s.amount),
//         0
//       );
//       if (shares.length === 0) {
//         alert('请选择参与分摊的成员');
//         return;
//       }
//       if (Math.abs(totalAmount - Number(amount)) > 0.01) {
//         alert(`自定义金额之和 (${totalAmount}) 必须等于总金额 (${amount})`);
//         return;
//       }
//       payload.split.shares = shares;
//     }
//     // equal 不需要 shares，后端会按 group 全员平分

//     await api(`/expenses/${id}`, {
//       method: 'POST',
//       body: JSON.stringify(payload),
//     });

//     // 重置
//     setAmount(0);
//     setDesc('');
//     setSelected([]);
//     setPercents({});
//     setCustoms({});
//     setMode('equal');

//     await refresh();
//   }

//   // 预览结算方案（不改数据库，只是弹窗）
//   async function suggest() {
//     try {
//       const txs = await api(`/settlements/${id}/suggest`);
//       alert(
//         txs.length
//           ? txs
//               .map(
//                 (t) =>
//                   `User ${t.from_user_id} → ${t.to_user_id}: $${Number(
//                     t.amount
//                   ).toFixed(2)}`
//               )
//               .join('\n')
//           : 'No settlements needed.'
//       );
//     } catch (e) {
//       alert('获取结算方案失败：' + (e.message || '未知错误'));
//     }
//   }

//   // Finalize & 发送结算邮件（只有创建者可以）
//   async function finalizeAndNotify() {
//     if (!isOwner) {
//       alert('只有该 Trip 的创建者可以发送结算邮件。');
//       return;
//     }
//     if (isFinalized) {
//       alert('本 Trip 已经 Finalized，不能重复发送。');
//       return;
//     }

//     const balancesText =
//       summary.length > 0
//         ? summary
//             .map(
//               (s) =>
//                 `${s.name}: ${Number(s.amount).toFixed(2)}`
//             )
//             .join('\n')
//         : '(暂无余额数据)';

//     const msg =
//       '请确认你已经和所有成员对过账，并且确认以下余额无误，然后再发送结算邮件：\n\n' +
//       balancesText +
//       '\n\n确认要发送结算邮件吗？';

//     if (!window.confirm(msg)) {
//       return;
//     }

//     try {
//       const result = await api(`/settlements/${id}/notify`, {
//         method: 'POST',
//       });
//       alert(
//         `已触发结算通知（当前建议交易条数：${
//           result.settlementsCount ?? 0
//         }）。在开发环境下，你可以在 Mailhog 或 API 日志中查看邮件内容。`
//       );
//       await refresh(); // 会拿到 is_finalized = true
//     } catch (e) {
//       alert('发送结算通知失败：' + (e.message || '未知错误'));
//     }
//   }

//   async function invite() {
//     if (isFinalized) {
//       alert('本 Trip 已经 Finalized，不能再邀请新成员。');
//       return;
//     }

//     if (!inviteEmail) {
//       alert('请输入要邀请的用户邮箱');
//       return;
//     }
//     try {
//       await api(`/groups/${id}/invite`, {
//         method: 'POST',
//         body: JSON.stringify({ email: inviteEmail }),
//       });
//       setInviteEmail('');
//       await refresh();
//       alert('邀请成功（该邮箱需要已经在系统里注册过账号）');
//     } catch (e) {
//       alert('邀请失败：' + (e.message || '未知错误'));
//     }
//   }

//   // 邀请用邮箱
//   const [inviteEmail, setInviteEmail] = useState('');

//   // 开始编辑某一笔账单（金额 + 描述）
//   function startEditExpense(exp) {
//     setEditingId(exp.expense_id);
//     setEditAmount(exp.amount);
//     setEditDesc(exp.description);
//   }

//   async function saveEditExpense(expenseId) {
//     try {
//       await api(`/expenses/${id}/${expenseId}`, {
//         method: 'PUT',
//         body: JSON.stringify({
//           amount: Number(editAmount),
//           description: editDesc,
//         }),
//       });
//       setEditingId(null);
//       await refresh();
//     } catch (e) {
//       alert('保存修改失败：' + (e.message || '未知错误'));
//     }
//   }

//   // 把 detail 按 expense_id 分组，方便渲染
//   const detailByExpense = details.reduce((acc, row) => {
//     const expId = row.expense_id;
//     if (!acc[expId]) {
//       acc[expId] = {
//         expense_id: expId,
//         description: row.expense_description,
//         amount: row.expense_amount,
//         date: row.expense_date,
//         payer_id: row.payer_id,
//         payer_name: row.payer_name,
//         payer_email: row.payer_email,
//         shares: [],
//       };
//     }
//     acc[expId].shares.push(row);
//     return acc;
//   }, {});

//   const detailList = Object.values(detailByExpense);

//   return (
//     <div>
//       {/* DEBUG 条，确认前端是最新版本 */}
//       <div
//         style={{
//           background: 'red',
//           color: 'white',
//           padding: 8,
//           marginBottom: 8,
//         }}
//       >
//         DEBUG INVITE VERSION
//       </div>

//       {/* 顶部：左 group 名称，右当前用户 */}
//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'baseline',
//           marginBottom: 8,
//         }}
//       >
//         <div>
//           <h3>
//             {group ? group.name : `Expense Group #${id}`}
//           </h3>
//           {group && group.description && (
//             <div style={{ fontSize: 12, color: '#666' }}>
//               {group.description}
//             </div>
//           )}
//         </div>
//         <div style={{ fontSize: 14, color: '#555' }}>
//           {currentUser ? `当前用户：${currentUser.name}` : ''}
//         </div>
//       </div>

//       {/* 成员 + 邀请 */}
//       <section>
//         <h4>Members</h4>
//         <ul>
//           {members.map((m) => (
//             <li key={m.id}>
//               {m.name} ({m.email}) {m.role === 'owner' ? ' 👑' : ''}
//             </li>
//           ))}
//         </ul>

//         <div style={{ marginTop: 8 }}>
//           <h5>Invite Member</h5>
//           <input
//             placeholder="Email"
//             value={inviteEmail}
//             onChange={(e) => setInviteEmail(e.target.value)}
//             disabled={isFinalized}
//           />
//           <button
//             onClick={invite}
//             style={{ marginLeft: 8 }}
//             disabled={isFinalized}
//           >
//             Invite
//           </button>
//           {isFinalized && (
//             <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
//               Trip 已 Finalized，无法再邀请新成员。
//             </div>
//           )}
//         </div>
//       </section>

//       {/* 添加账单：只有在未 Finalized 时显示 */}
//       {!isFinalized && (
//         <section>
//           <h4>Add Expense</h4>

//           {/* 金额 + 描述 */}
//           <div
//             style={{
//               display: 'flex',
//               gap: 8,
//               alignItems: 'center',
//               flexWrap: 'wrap',
//             }}
//           >
//             <input
//               type="number"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               placeholder="Amount"
//             />
//             <input
//               value={desc}
//               onChange={(e) => setDesc(e.target.value)}
//               placeholder="Description"
//             />
//           </div>

//           {/* 选择付款人 */}
//           <div style={{ marginTop: 8 }}>
//             <label>
//               Payer:&nbsp;
//               <select
//                 value={payerId}
//                 onChange={(e) => setPayerId(e.target.value)}
//               >
//                 {members.map((m) => (
//                   <option key={m.id} value={m.id}>
//                     {m.name} ({m.email})
//                   </option>
//                 ))}
//               </select>
//             </label>
//           </div>

//           {/* 分摊模式 */}
//           <div style={{ marginTop: 8 }}>
//             <label>
//               <input
//                 type="radio"
//                 name="mode"
//                 value="equal"
//                 checked={mode === 'equal'}
//                 onChange={() => setMode('equal')}
//               />{' '}
//               Equal (全员平分)
//             </label>{' '}
//             <label>
//               <input
//                 type="radio"
//                 name="mode"
//                 value="partial"
//                 checked={mode === 'partial'}
//                 onChange={() => setMode('partial')}
//               />{' '}
//               Partial (部分参与)
//             </label>{' '}
//             <label>
//               <input
//                 type="radio"
//                 name="mode"
//                 value="percent"
//                 checked={mode === 'percent'}
//                 onChange={() => setMode('percent')}
//               />{' '}
//               Percent (百分比分摊)
//             </label>{' '}
//             <label>
//               <input
//                 type="radio"
//                 name="mode"
//                 value="custom"
//                 checked={mode === 'custom'}
//                 onChange={() => setMode('custom')}
//               />{' '}
//               Custom (自定义金额)
//             </label>
//           </div>

//           {mode !== 'equal' && (
//             <div style={{ marginTop: 8 }}>
//               <div>选择成员：</div>
//               <ul>
//                 {members.map((m) => (
//                   <li key={m.id}>
//                     <label>
//                       <input
//                         type="checkbox"
//                         checked={selected.includes(m.id)}
//                         onChange={() => toggleUser(m.id)}
//                       />
//                       {m.name} ({m.email})
//                     </label>
//                     {mode === 'percent' && selected.includes(m.id) && (
//                       <input
//                         type="number"
//                         style={{ marginLeft: 8, width: 80 }}
//                         placeholder="%"
//                         value={percents[m.id] || ''}
//                         onChange={(e) =>
//                           setPercents({
//                             ...percents,
//                             [m.id]: e.target.value,
//                           })
//                         }
//                       />
//                     )}
//                     {mode === 'custom' && selected.includes(m.id) && (
//                       <input
//                         type="number"
//                         style={{ marginLeft: 8, width: 100 }}
//                         placeholder="Amount"
//                         value={customs[m.id] || ''}
//                         onChange={(e) =>
//                           setCustoms({
//                             ...customs,
//                             [m.id]: e.target.value,
//                           })
//                         }
//                       />
//                     )}
//                   </li>
//                 ))}
//               </ul>
//               {mode === 'percent' && (
//                 <small>提示：所有输入的百分比之和应为 100。</small>
//               )}
//             </div>
//           )}

//           <button onClick={submitExpense} style={{ marginTop: 8 }}>
//             Add Expense
//           </button>
//         </section>
//       )}

//       {/* 汇总余额 */}
//       <section>
//         <h4>Balances</h4>
//         <ul>
//           {summary.map((s) => (
//             <li key={s.user_id}>
//               {s.name}: ${Number(s.amount).toFixed(2)}
//             </li>
//           ))}
//         </ul>

//         <div style={{ marginTop: 8 }}>
//           <button onClick={suggest}>
//             预览结算方案（仅当前页面提示）
//           </button>
//           <button
//             style={{ marginLeft: 8 }}
//             onClick={finalizeAndNotify}
//             disabled={!isOwner || isFinalized}
//           >
//             所有账单已添加完毕，发送结算邮件
//           </button>
//         </div>

//         {!isOwner && (
//           <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
//             只有该 Trip 的创建者可以发送结算邮件。
//           </div>
//         )}
//         {isFinalized && (
//           <div style={{ marginTop: 4, fontSize: 12, color: '#d9534f' }}>
//             本 Trip 已 Finalized，账单已锁定为只读。
//           </div>
//         )}
//       </section>

//       {/* 每一笔费用明细 + 编辑按钮（只在未 finalized 且 payer 是当前用户时显示） */}
//       <section>
//         <h4>Expense Details</h4>
//         {detailList.map((exp) => {
//           const allUnsettled = exp.shares.every((s) => !s.is_settled);
//           const canEdit =
//             !isFinalized &&
//             currentUser &&
//             exp.payer_id === currentUser.id &&
//             allUnsettled;

//           return (
//             <div
//               key={exp.expense_id}
//               style={{
//                 border: '1px solid #ccc',
//                 padding: 8,
//                 marginBottom: 8,
//               }}
//             >
//               {editingId === exp.expense_id ? (
//                 <>
//                   <div>
//                     <strong>Editing Expense #{exp.expense_id}</strong>
//                   </div>
//                   <div style={{ marginTop: 4 }}>
//                     <input
//                       type="number"
//                       value={editAmount}
//                       onChange={(e) => setEditAmount(e.target.value)}
//                     />
//                     <input
//                       style={{ marginLeft: 8 }}
//                       value={editDesc}
//                       onChange={(e) => setEditDesc(e.target.value)}
//                     />
//                     <button
//                       style={{ marginLeft: 8 }}
//                       onClick={() => saveEditExpense(exp.expense_id)}
//                     >
//                       Save
//                     </button>
//                     <button
//                       style={{ marginLeft: 4 }}
//                       onClick={() => setEditingId(null)}
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </>
//               ) : (
//                 <>
//                   <div>
//                     <strong>
//                       #{exp.expense_id} ${exp.amount} – {exp.description}
//                     </strong>{' '}
//                     on {exp.date}
//                   </div>
//                   <div style={{ fontSize: 12, color: '#555' }}>
//                     Payer: {exp.payer_name} ({exp.payer_email})
//                   </div>
//                   {canEdit && (
//                     <button
//                       style={{ marginTop: 4 }}
//                       onClick={() => startEditExpense(exp)}
//                     >
//                       Edit
//                     </button>
//                   )}
//                 </>
//               )}

//               <ul style={{ marginTop: 8 }}>
//                 {exp.shares.map((s) => (
//                   <li key={s.user_id}>
//                     {s.user_name} ({s.user_email}) – 应付 $
//                     {Number(s.share_amount).toFixed(2)}，本笔净额{' '}
//                     {Number(s.owed_amount).toFixed(2)}
//                     {/* A 方案：Finalize 后完全只读，不再显示“标记已结算”按钮 */}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           );
//         })}
//       </section>

//       {/* 简单 Raw 列表保留（方便调试） */}
//       <section>
//         <h4>Recent Expenses (Raw)</h4>
//         <ul>
//           {expenses.map((e) => (
//             <li key={e.id}>
//               ${e.amount} – {e.description} ({e.category}) on {e.date}
//             </li>
//           ))}
//         </ul>
//       </section>
//     </div>
//   );
// }



// 可运行版本

// import { useEffect, useMemo, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import { api } from '../api.js';
// import { socket } from '../socket.js';

// export default function GroupDetail() {
//   const { id } = useParams(); // groupId

//   // group 信息（包含 created_by / is_finalized）
//   const [group, setGroup] = useState(null);

//   // 成员 / 交易 / 汇总 / 明细
//   const [members, setMembers] = useState([]);
//   const [expenses, setExpenses] = useState([]);
//   const [summary, setSummary] = useState([]);
//   const [detailByExpense, setDetailByExpense] = useState({});

//   // 当前登录用户
//   const [currentUser, setCurrentUser] = useState(null);

//   // 新增账单表单
//   const [amount, setAmount] = useState('');
//   const [desc, setDesc] = useState('');
//   const [mode, setMode] = useState('equal'); // equal | partial | percent | custom
//   const [selected, setSelected] = useState([]); // 参与分摊成员 user_id 列表（非 equal 模式）
//   const [percents, setPercents] = useState({}); // {user_id: percent}
//   const [customs, setCustoms] = useState({}); // {user_id: amount}
//   const [payerId, setPayerId] = useState(null); // 谁是这笔账的付款人（仅用于 UI 选择）

//   // 邀请成员
//   const [inviteEmail, setInviteEmail] = useState('');

//   // 结算预览 / Finalize
//   const [previewTxs, setPreviewTxs] = useState([]);
//   const [previewLoading, setPreviewLoading] = useState(false);
//   const [notifyLoading, setNotifyLoading] = useState(false);

//   const isFinalized = group?.is_finalized === true;

//   // 方便查名字
//   const memberById = useMemo(
//     () => new Map(members.map((m) => [m.id, m])),
//     [members]
//   );

//   // 刷新全部数据：group / members / expenses / summary / detail / currentUser
//   async function refreshAll() {
//     const [g, m, e, s, d, me] = await Promise.all([
//       api(`/groups/${id}`),
//       api(`/groups/${id}/members`),
//       api(`/expenses/${id}`),
//       api(`/expenses/${id}/summary`),
//       api(`/expenses/${id}/detail`),
//       api('/users/me'),
//     ]);

//     setGroup(g);
//     setMembers(m);
//     setExpenses(e);
//     setSummary(s);
//     setCurrentUser(me);

//     // 默认 payer 设为当前用户
//     if (!payerId && me?.id) {
//       setPayerId(me.id);
//     }

//     // 把 detail 扁平数据按 expense_id 聚合
//     const grouped = {};
//     for (const row of d) {
//       if (!grouped[row.expense_id]) {
//         grouped[row.expense_id] = {
//           expense_id: row.expense_id,
//           description: row.expense_description,
//           amount: Number(row.expense_amount),
//           date: row.expense_date,
//           payer_id: row.payer_id,
//           payer_name: row.payer_name,
//           payer_email: row.payer_email,
//           shares: [],
//         };
//       }
//       grouped[row.expense_id].shares.push({
//         user_id: row.user_id,
//         user_name: row.user_name,
//         user_email: row.user_email,
//         share_amount: Number(row.share_amount),
//         owed_amount: Number(row.owed_amount),
//         is_settled: row.is_settled,
//       });
//     }
//     setDetailByExpense(grouped);
//   }

//   useEffect(() => {
//     refreshAll().catch((e) => {
//       console.error('Failed to refresh group detail', e);
//     });

//     // Socket 房间订阅
//     socket.emit('join_group', id);

//     const onAdd = (evt) => {
//       if (String(evt.groupId) === String(id)) refreshAll();
//     };
//     const onSettle = (evt) => {
//       if (String(evt.groupId) === String(id)) refreshAll();
//     };
//     const onUpdate = (evt) => {
//       if (String(evt.groupId) === String(id)) refreshAll();
//     };
//     const onDelete = (evt) => {
//       if (String(evt.groupId) === String(id)) refreshAll();
//     };

//     socket.on('expense_added', onAdd);
//     socket.on('settlement_marked', onSettle);
//     socket.on('expense_updated', onUpdate);
//     socket.on('expense_deleted', onDelete);

//     return () => {
//       socket.off('expense_added', onAdd);
//       socket.off('settlement_marked', onSettle);
//       socket.off('expense_updated', onUpdate);
//       socket.off('expense_deleted', onDelete);
//     };
//   }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ====== 工具函数 ======

//   function toggleUser(uid) {
//     setSelected((prev) =>
//       prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
//     );
//   }

//   // ====== 新增账单 ======

//   async function submitExpense() {
//     if (!amount || Number(amount) <= 0) {
//       alert('请输入大于 0 的金额');
//       return;
//     }
//     if (!payerId) {
//       alert('请选择付款人');
//       return;
//     }

//     const baseSplit = { type: mode };
//     const payload = {
//       amount: Number(amount),
//       description: desc,
//       payerId,
//       split: baseSplit,
//     };

//     if (mode === 'partial') {
//       if (selected.length === 0) {
//         alert('请选择参与分摊的成员');
//         return;
//       }
//       payload.split.shares = selected.map((uid) => ({ user_id: uid }));
//     } else if (mode === 'percent') {
//       if (selected.length === 0) {
//         alert('请选择参与分摊的成员');
//         return;
//       }
//       const shares = selected.map((uid) => ({
//         user_id: uid,
//         percent: Number(percents[uid] || 0),
//       }));
//       const totalPercent = shares.reduce(
//         (sum, s) => sum + (isNaN(s.percent) ? 0 : s.percent),
//         0
//       );
//       if (Math.abs(totalPercent - 100) > 0.1) {
//         if (
//           !window.confirm(
//             `当前总百分比为 ${totalPercent}%，不是 100%，是否仍然继续？`
//           )
//         ) {
//           return;
//         }
//       }
//       payload.split.shares = shares;
//     } else if (mode === 'custom') {
//       if (selected.length === 0) {
//         alert('请选择参与分摊的成员');
//         return;
//       }
//       const shares = selected.map((uid) => ({
//         user_id: uid,
//         amount: Number(customs[uid] || 0),
//       }));
//       const total = shares.reduce(
//         (sum, s) => sum + (isNaN(s.amount) ? 0 : s.amount),
//         0
//       );
//       if (Math.abs(total - Number(amount)) > 0.01) {
//         if (
//           !window.confirm(
//             `各自金额之和为 ${total}，与总金额 ${amount} 不一致，是否仍然继续？`
//           )
//         ) {
//           return;
//         }
//       }
//       payload.split.shares = shares;
//     } else if (mode === 'equal') {
//       // equal 模式不需要额外 split.shares
//     }

//     try {
//       await api(`/expenses/${id}`, {
//         method: 'POST',
//         body: JSON.stringify(payload),
//       });
//       setAmount('');
//       setDesc('');
//       setSelected([]);
//       setPercents({});
//       setCustoms({});
//       await refreshAll();
//     } catch (e) {
//       alert('添加账单失败：' + (e.message || '未知错误'));
//     }
//   }

//   // ====== 删除账单（替代编辑） ======

//   async function deleteExpense(expenseId) {
//     if (!window.confirm(`确认要删除这笔账单 #${expenseId} 吗？`)) {
//       return;
//     }
//     try {
//       await api(`/expenses/${id}/${expenseId}`, {
//         method: 'DELETE',
//       });
//       await refreshAll();
//     } catch (e) {
//       alert('删除失败：' + (e.message || '未知错误'));
//     }
//   }

//   // ====== 结算预览 & 发送邮件 ======

//   async function previewSettlements() {
//     setPreviewLoading(true);
//     setPreviewTxs([]);
//     try {
//       const txs = await api(`/settlements/${id}/suggest`);
//       setPreviewTxs(txs);
//     } catch (e) {
//       alert('获取结算方案失败：' + (e.message || '未知错误'));
//     } finally {
//       setPreviewLoading(false);
//     }
//   }

//   async function sendFinalNotifications() {
//     if (!window.confirm('确认要最终结算并发送邮件给所有成员吗？')) {
//       return;
//     }
//     setNotifyLoading(true);
//     try {
//       const res = await api(`/settlements/${id}/notify`, {
//         method: 'POST',
//         body: JSON.stringify({}),
//       });
//       alert(
//         `已发送结算邮件。生成的结算转账条数：${res.settlementsCount || 0}`
//       );
//       await refreshAll();
//     } catch (e) {
//       alert('发送结算邮件失败：' + (e.message || '未知错误'));
//     } finally {
//       setNotifyLoading(false);
//     }
//   }

//   // ====== 邀请成员 ======

//   async function invite() {
//     if (!inviteEmail) {
//       alert('请输入要邀请的用户邮箱（该邮箱需要已注册）');
//       return;
//     }
//     try {
//       await api(`/groups/${id}/invite`, {
//         method: 'POST',
//         body: JSON.stringify({ email: inviteEmail }),
//       });
//       setInviteEmail('');
//       await refreshAll();
//       alert('邀请成功（该邮箱需要已经在系统里注册过账号）');
//     } catch (e) {
//       alert('邀请失败：' + (e.message || '未知错误'));
//     }
//   }

//   // ====== 渲染 ======

//   if (!group) {
//     return <div>Loading group...</div>;
//   }

//   const detailList = Object.values(detailByExpense).sort(
//     (a, b) => b.expense_id - a.expense_id
//   );

//   const isCreator = currentUser && group.created_by === currentUser.id;

//   return (
//     <div>
//       {/* DEBUG 标记，确认前端版本 */}
//       <div
//         style={{
//           background: 'red',
//           color: 'white',
//           padding: 8,
//           marginBottom: 8,
//         }}
//       >
//         DEBUG INVITE & SETTLEMENT VERSION
//       </div>

//       <h2>
//         Group #{group.id}: {group.name}
//       </h2>
//       <p style={{ color: '#555' }}>{group.description}</p>
//       <p>
//         Currency: <strong>{group.currency}</strong>
//       </p>
//       <p>
//         状态：{' '}
//         {isFinalized ? (
//           <span style={{ color: 'green', fontWeight: 600 }}>已最终结算（只读）</span>
//         ) : (
//           <span style={{ color: 'orange', fontWeight: 600 }}>可继续记录/结算</span>
//         )}
//       </p>

//       {/* 成员列表 & 邀请 */}
//       <section style={{ marginTop: 16 }}>
//         <h4>Members</h4>
//         <ul>
//           {members.map((m) => (
//             <li key={m.id}>
//               {m.name} ({m.email}){' '}
//               {group.created_by === m.id && (
//                 <span style={{ fontSize: 12, color: '#999' }}>[创建者]</span>
//               )}
//             </li>
//           ))}
//         </ul>

//         <div style={{ marginTop: 8 }}>
//           <h5>Invite Member</h5>
//           <input
//             placeholder="Email"
//             value={inviteEmail}
//             onChange={(e) => setInviteEmail(e.target.value)}
//             disabled={isFinalized}
//           />
//           <button
//             onClick={invite}
//             style={{ marginLeft: 8 }}
//             disabled={isFinalized}
//           >
//             Invite
//           </button>
//           {isFinalized && (
//             <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
//               已最终结算的 group 无法再邀请新成员。
//             </div>
//           )}
//         </div>
//       </section>

//       {/* 新增账单 */}
//       <section style={{ marginTop: 24 }}>
//         <h4>Add Expense</h4>

//         {isFinalized && (
//           <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>
//             本 group 已最终结算，不能再新增或删除账单。
//           </div>
//         )}

//         <div
//           style={{
//             display: 'flex',
//             gap: 8,
//             alignItems: 'center',
//             flexWrap: 'wrap',
//           }}
//         >
//           <input
//             type="number"
//             value={amount}
//             onChange={(e) => setAmount(e.target.value)}
//             placeholder="Amount"
//             disabled={isFinalized}
//           />
//           <input
//             value={desc}
//             onChange={(e) => setDesc(e.target.value)}
//             placeholder="Description"
//             disabled={isFinalized}
//           />
//           <select
//             value={payerId || ''}
//             onChange={(e) => setPayerId(Number(e.target.value))}
//             disabled={isFinalized}
//           >
//             <option value="">选择付款人</option>
//             {members.map((m) => (
//               <option key={m.id} value={m.id}>
//                 {m.name} ({m.email})
//               </option>
//             ))}
//           </select>
//         </div>

//         <div style={{ marginTop: 8 }}>
//           <label>
//             <input
//               type="radio"
//               name="mode"
//               value="equal"
//               checked={mode === 'equal'}
//               onChange={() => setMode('equal')}
//               disabled={isFinalized}
//             />{' '}
//             Equal（全员平分）
//           </label>{' '}
//           <label>
//             <input
//               type="radio"
//               name="mode"
//               value="partial"
//               checked={mode === 'partial'}
//               onChange={() => setMode('partial')}
//               disabled={isFinalized}
//             />{' '}
//             Partial（部分参与）
//           </label>{' '}
//           <label>
//             <input
//               type="radio"
//               name="mode"
//               value="percent"
//               checked={mode === 'percent'}
//               onChange={() => setMode('percent')}
//               disabled={isFinalized}
//             />{' '}
//             Percent（百分比分摊）
//           </label>{' '}
//           <label>
//             <input
//               type="radio"
//               name="mode"
//               value="custom"
//               checked={mode === 'custom'}
//               onChange={() => setMode('custom')}
//               disabled={isFinalized}
//             />{' '}
//             Custom（自定义金额）
//           </label>
//         </div>

//         {mode !== 'equal' && (
//           <div style={{ marginTop: 8 }}>
//             <div>选择参与分摊的成员：</div>
//             <ul>
//               {members.map((m) => (
//                 <li key={m.id}>
//                   <label>
//                     <input
//                       type="checkbox"
//                       checked={selected.includes(m.id)}
//                       onChange={() => toggleUser(m.id)}
//                       disabled={isFinalized}
//                     />
//                     {m.name} ({m.email})
//                   </label>
//                   {mode === 'percent' && selected.includes(m.id) && (
//                     <input
//                       type="number"
//                       style={{ marginLeft: 8, width: 80 }}
//                       placeholder="%"
//                       value={percents[m.id] || ''}
//                       onChange={(e) =>
//                         setPercents({
//                           ...percents,
//                           [m.id]: e.target.value,
//                         })
//                       }
//                       disabled={isFinalized}
//                     />
//                   )}
//                   {mode === 'custom' && selected.includes(m.id) && (
//                     <input
//                       type="number"
//                       style={{ marginLeft: 8, width: 100 }}
//                       placeholder="Amount"
//                       value={customs[m.id] || ''}
//                       onChange={(e) =>
//                         setCustoms({
//                           ...customs,
//                           [m.id]: e.target.value,
//                         })
//                       }
//                       disabled={isFinalized}
//                     />
//                   )}
//                 </li>
//               ))}
//             </ul>
//             {mode === 'percent' && (
//               <small>提示：所有输入的百分比之和最好为 100。</small>
//             )}
//           </div>
//         )}

//         <button
//           onClick={submitExpense}
//           style={{ marginTop: 8 }}
//           disabled={isFinalized}
//         >
//           Add Expense
//         </button>
//       </section>

//       {/* 当前余额总览 */}
//       <section style={{ marginTop: 24 }}>
//         <h4>Balances（当前未结清净额）</h4>
//         <ul>
//           {summary.map((s) => (
//             <li key={s.user_id}>
//               {s.name}: {Number(s.amount).toFixed(2)}
//             </li>
//           ))}
//         </ul>
//       </section>

//       {/* 预览结算方案 & 最终邮件 */}
//       <section style={{ marginTop: 24 }}>
//         <h4>Settlement</h4>
//         {!isCreator && (
//           <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
//             只有 group 创建者可以发送最终结算邮件，其余成员只能查看预览方案。
//           </div>
//         )}
//         {isFinalized && (
//           <div style={{ fontSize: 13, color: 'green', marginBottom: 4 }}>
//             本 group 已最终结算，账目已锁定；如果需要调整，请新建一个新的 trip。
//           </div>
//         )}

//         <button onClick={previewSettlements} disabled={previewLoading}>
//           {previewLoading ? '正在计算结算方案...' : '预览结算方案'}
//         </button>

//         {isCreator && (
//           <button
//             onClick={sendFinalNotifications}
//             style={{ marginLeft: 8 }}
//             disabled={notifyLoading || isFinalized}
//           >
//             {notifyLoading ? '正在发送结算邮件...' : '最终结算并发送邮件'}
//           </button>
//         )}

//         {previewTxs.length > 0 ? (
//           <div style={{ marginTop: 12 }}>
//             <h5>建议转账方案：</h5>
//             <ul>
//               {previewTxs.map((t, idx) => {
//                 const from = memberById.get(t.from_user_id);
//                 const to = memberById.get(t.to_user_id);
//                 const amount = Number(t.amount).toFixed(2);
//                 return (
//                   <li key={idx}>
//                     {from ? `${from.name} (${from.email})` : t.from_user_id} →{' '}
//                     {to ? `${to.name} (${to.email})` : t.to_user_id}: ${amount}
//                   </li>
//                 );
//               })}
//             </ul>
//           </div>
//         ) : (
//           <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
//             暂无建议转账（可能本身已经比较均衡，或尚未添加账单）。
//           </div>
//         )}
//       </section>

//       {/* Expense 列表（简单版） */}
//       <section style={{ marginTop: 24 }}>
//         <h4>Recent Expenses</h4>
//         <ul>
//           {expenses.map((e) => (
//             <li key={e.id}>
//               #{e.id} ${e.amount} – {e.description} ({e.category}) on {e.date}
//             </li>
//           ))}
//         </ul>
//       </section>

//       {/* 每笔 Expense 详细分摊情况 + 删除按钮 */}
//       <section style={{ marginTop: 24 }}>
//         <h4>Expense Details</h4>
//         {detailList.length === 0 && (
//           <div style={{ fontSize: 13, color: '#666' }}>暂无明细。</div>
//         )}
//         {detailList.map((exp) => {
//           const allUnsettled = exp.shares.every((s) => !s.is_settled);
//           const canDelete =
//             !isFinalized &&
//             currentUser &&
//             exp.payer_id === currentUser.id &&
//             allUnsettled;

//           return (
//             <div
//               key={exp.expense_id}
//               style={{
//                 border: '1px solid #ccc',
//                 padding: 8,
//                 marginBottom: 8,
//               }}
//             >
//               <div>
//                 <strong>
//                   #{exp.expense_id} ${exp.amount.toFixed(2)} –{' '}
//                   {exp.description}
//                 </strong>{' '}
//                 on {exp.date}
//               </div>
//               <div style={{ fontSize: 12, color: '#555' }}>
//                 Payer: {exp.payer_name} ({exp.payer_email})
//               </div>
//               {canDelete && (
//                 <button
//                   style={{ marginTop: 4 }}
//                   onClick={() => deleteExpense(exp.expense_id)}
//                 >
//                   Delete
//                 </button>
//               )}
//               {!canDelete && currentUser && exp.payer_id === currentUser.id && (
//                 <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
//                   这笔账已有成员标记结清或 group 已锁定，不能删除。
//                 </div>
//               )}

//               <ul style={{ marginTop: 8 }}>
//                 {exp.shares.map((s) => (
//                   <li key={s.user_id}>
//                     {s.user_name} ({s.user_email}) – 应付 $
//                     {s.share_amount.toFixed(2)}，本笔净额{' '}
//                     {s.owed_amount.toFixed(2)}{' '}
//                     {s.is_settled && (
//                       <span style={{ color: 'green', fontSize: 12 }}>
//                         [已结清]
//                       </span>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           );
//         })}
//       </section>
//     </div>
//   );
// }
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import { socket } from '../socket.js';

export default function GroupDetail() {
  const { id } = useParams(); // groupId

  // group information (includes created_by / is_finalized)
  const [group, setGroup] = useState(null);

  // members / expenses / summary / details
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [detailByExpense, setDetailByExpense] = useState({});

  // current logged-in user
  const [currentUser, setCurrentUser] = useState(null);

  // new expense form
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [mode, setMode] = useState('equal'); // equal | partial | percent | custom
  const [selected, setSelected] = useState([]); // list of user_ids participating in split (non-equal modes)
  const [percents, setPercents] = useState({}); // {user_id: percent}
  const [customs, setCustoms] = useState({}); // {user_id: amount}
  const [payerId, setPayerId] = useState(null); // who paid for this expense (for UI selection only)

  // invite member
  const [inviteEmail, setInviteEmail] = useState('');

  // settlement preview / Finalize
  const [previewTxs, setPreviewTxs] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const isFinalized = group?.is_finalized === true;

  // convenience for looking up names
  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  // refresh all data: group / members / expenses / summary / detail / currentUser
  async function refreshAll() {
    const [g, m, e, s, d, me] = await Promise.all([
      api(`/groups/${id}`),
      api(`/groups/${id}/members`),
      api(`/expenses/${id}`),
      api(`/expenses/${id}/summary`),
      api(`/expenses/${id}/detail`),
      api('/users/me'),
    ]);

    setGroup(g);
    setMembers(m);
    setExpenses(e);
    setSummary(s);
    setCurrentUser(me);

    // set default payer to current user
    if (!payerId && me?.id) {
      setPayerId(me.id);
    }

    // aggregate flat detail data by expense_id
    const grouped = {};
    for (const row of d) {
      if (!grouped[row.expense_id]) {
        grouped[row.expense_id] = {
          expense_id: row.expense_id,
          description: row.expense_description,
          amount: Number(row.expense_amount),
          date: row.expense_date,
          payer_id: row.payer_id,
          payer_name: row.payer_name,
          payer_email: row.payer_email,
          shares: [],
        };
      }
      grouped[row.expense_id].shares.push({
        user_id: row.user_id,
        user_name: row.user_name,
        user_email: row.user_email,
        share_amount: Number(row.share_amount),
        owed_amount: Number(row.owed_amount),
        is_settled: row.is_settled,
      });
    }
    setDetailByExpense(grouped);
  }

  useEffect(() => {
    refreshAll().catch((e) => {
      console.error('Failed to refresh group detail', e);
    });

    // Socket room subscription
    socket.emit('join_group', id);

    const onAdd = (evt) => {
      if (String(evt.groupId) === String(id)) refreshAll();
    };
    const onSettle = (evt) => {
      if (String(evt.groupId) === String(id)) refreshAll();
    };
    const onUpdate = (evt) => {
      if (String(evt.groupId) === String(id)) refreshAll();
    };
    const onDelete = (evt) => {
      if (String(evt.groupId) === String(id)) refreshAll();
    };

    socket.on('expense_added', onAdd);
    socket.on('settlement_marked', onSettle);
    socket.on('expense_updated', onUpdate);
    socket.on('expense_deleted', onDelete);

    return () => {
      socket.off('expense_added', onAdd);
      socket.off('settlement_marked', onSettle);
      socket.off('expense_updated', onUpdate);
      socket.off('expense_deleted', onDelete);
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ====== Utility functions ======

  function toggleUser(uid) {
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  }

  // ====== Add expense ======

  async function submitExpense() {
    if (!amount || Number(amount) <= 0) {
      alert('Please enter an amount greater than 0');
      return;
    }
    if (!payerId) {
      alert('Please select a payer');
      return;
    }

    const baseSplit = { type: mode };
    const payload = {
      amount: Number(amount),
      description: desc,
      payerId,
      split: baseSplit,
    };

    if (mode === 'partial') {
      if (selected.length === 0) {
        alert('Please select members participating in the split');
        return;
      }
      payload.split.shares = selected.map((uid) => ({ user_id: uid }));
    } else if (mode === 'percent') {
      if (selected.length === 0) {
        alert('Please select members participating in the split');
        return;
      }
      const shares = selected.map((uid) => ({
        user_id: uid,
        percent: Number(percents[uid] || 0),
      }));
      const totalPercent = shares.reduce(
        (sum, s) => sum + (isNaN(s.percent) ? 0 : s.percent),
        0
      );
      if (Math.abs(totalPercent - 100) > 0.1) {
        if (
          !window.confirm(
            `Current total percentage is ${totalPercent}%, not 100%, continue anyway?`
          )
        ) {
          return;
        }
      }
      payload.split.shares = shares;
    } else if (mode === 'custom') {
      if (selected.length === 0) {
        alert('Please select members participating in the split');
        return;
      }
      const shares = selected.map((uid) => ({
        user_id: uid,
        amount: Number(customs[uid] || 0),
      }));
      const total = shares.reduce(
        (sum, s) => sum + (isNaN(s.amount) ? 0 : s.amount),
        0
      );
      if (Math.abs(total - Number(amount)) > 0.01) {
        if (
          !window.confirm(
            `Sum of individual amounts is ${total}, which doesn't match total amount ${amount}, continue anyway?`
          )
        ) {
          return;
        }
      }
      payload.split.shares = shares;
    } else if (mode === 'equal') {
      // equal mode doesn't need extra split.shares
    }

    try {
      await api(`/expenses/${id}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAmount('');
      setDesc('');
      setSelected([]);
      setPercents({});
      setCustoms({});
      await refreshAll();
    } catch (e) {
      alert('Failed to add expense: ' + (e.message || 'Unknown error'));
    }
  }

  // ====== Delete expense (instead of edit) ======

  async function deleteExpense(expenseId) {
    if (!window.confirm(`Confirm deletion of expense #${expenseId}?`)) {
      return;
    }
    try {
      await api(`/expenses/${id}/${expenseId}`, {
        method: 'DELETE',
      });
      await refreshAll();
    } catch (e) {
      alert('Deletion failed: ' + (e.message || 'Unknown error'));
    }
  }

  // ====== Settlement preview & send emails ======

  async function previewSettlements() {
    setPreviewLoading(true);
    setPreviewTxs([]);
    try {
      const txs = await api(`/settlements/${id}/suggest`);
      setPreviewTxs(txs);
    } catch (e) {
      alert('Failed to get settlement scheme: ' + (e.message || 'Unknown error'));
    } finally {
      setPreviewLoading(false);
    }
  }

  async function sendFinalNotifications() {
    if (!window.confirm('Confirm final settlement and send emails to all members?')) {
      return;
    }
    setNotifyLoading(true);
    try {
      const res = await api(`/settlements/${id}/notify`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      alert(
        `Settlement emails sent. Number of transfer transactions generated: ${res.settlementsCount || 0}`
      );
      await refreshAll();
    } catch (e) {
      alert('Failed to send settlement emails: ' + (e.message || 'Unknown error'));
    } finally {
      setNotifyLoading(false);
    }
  }

  // ====== Invite member ======

  async function invite() {
    if (!inviteEmail) {
      alert('Please enter the email of the user to invite (this email must be registered)');
      return;
    }
    try {
      await api(`/groups/${id}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail }),
      });
      setInviteEmail('');
      await refreshAll();
      alert('Invitation sent (this email must already have a registered account in the system)');
    } catch (e) {
      alert('Invitation failed: ' + (e.message || 'Unknown error'));
    }
  }

  // ====== Render ======

  if (!group) {
    return <div>Loading group...</div>;
  }

  const detailList = Object.values(detailByExpense).sort(
    (a, b) => b.expense_id - a.expense_id
  );

  const isCreator = currentUser && group.created_by === currentUser.id;

  return (
    <div>

      <h2>
        Group #{group.id}: {group.name}
      </h2>
      <p style={{ color: '#555' }}>{group.description}</p>
      <p>
        Currency: <strong>{group.currency}</strong>
      </p>
      <p>
        Status:{' '}
        {isFinalized ? (
          <span style={{ color: 'green', fontWeight: 600 }}>Finalized (read-only)</span>
        ) : (
          <span style={{ color: 'orange', fontWeight: 600 }}>Active - can record/settle</span>
        )}
      </p>

      {/* Member list & invitation */}
      <section style={{ marginTop: 16 }}>
        <h4>Members</h4>
        <ul>
          {members.map((m) => (
            <li key={m.id}>
              {m.name} ({m.email}){' '}
              {group.created_by === m.id && (
                <span style={{ fontSize: 12, color: '#999' }}>[Creator]</span>
              )}
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 8 }}>
          <h5>Invite Member</h5>
          <input
            placeholder="Email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            disabled={isFinalized}
          />
          <button
            onClick={invite}
            style={{ marginLeft: 8 }}
            disabled={isFinalized}
          >
            Invite
          </button>
          {isFinalized && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              Finalized groups cannot invite new members.
            </div>
          )}
        </div>
      </section>

      {/* Add expense */}
      <section style={{ marginTop: 24 }}>
        <h4>Add Expense</h4>

        {isFinalized && (
          <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>
            This group is finalized, cannot add or delete expenses.
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            disabled={isFinalized}
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description"
            disabled={isFinalized}
          />
          <select
            value={payerId || ''}
            onChange={(e) => setPayerId(Number(e.target.value))}
            disabled={isFinalized}
          >
            <option value="">Select payer</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 8 }}>
          <label>
            <input
              type="radio"
              name="mode"
              value="equal"
              checked={mode === 'equal'}
              onChange={() => setMode('equal')}
              disabled={isFinalized}
            />{' '}
            Equal (split equally among all)
          </label>{' '}
          <label>
            <input
              type="radio"
              name="mode"
              value="partial"
              checked={mode === 'partial'}
              onChange={() => setMode('partial')}
              disabled={isFinalized}
            />{' '}
            Partial (selected participants only)
          </label>{' '}
          <label>
            <input
              type="radio"
              name="mode"
              value="percent"
              checked={mode === 'percent'}
              onChange={() => setMode('percent')}
              disabled={isFinalized}
            />{' '}
            Percent (split by percentage)
          </label>{' '}
          <label>
            <input
              type="radio"
              name="mode"
              value="custom"
              checked={mode === 'custom'}
              onChange={() => setMode('custom')}
              disabled={isFinalized}
            />{' '}
            Custom (specify individual amounts)
          </label>
        </div>

        {mode !== 'equal' && (
          <div style={{ marginTop: 8 }}>
            <div>Select members participating in split:</div>
            <ul>
              {members.map((m) => (
                <li key={m.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.includes(m.id)}
                      onChange={() => toggleUser(m.id)}
                      disabled={isFinalized}
                    />
                    {m.name} ({m.email})
                  </label>
                  {mode === 'percent' && selected.includes(m.id) && (
                    <input
                      type="number"
                      style={{ marginLeft: 8, width: 80 }}
                      placeholder="%"
                      value={percents[m.id] || ''}
                      onChange={(e) =>
                        setPercents({
                          ...percents,
                          [m.id]: e.target.value,
                        })
                      }
                      disabled={isFinalized}
                    />
                  )}
                  {mode === 'custom' && selected.includes(m.id) && (
                    <input
                      type="number"
                      style={{ marginLeft: 8, width: 100 }}
                      placeholder="Amount"
                      value={customs[m.id] || ''}
                      onChange={(e) =>
                        setCustoms({
                          ...customs,
                          [m.id]: e.target.value,
                        })
                      }
                      disabled={isFinalized}
                    />
                  )}
                </li>
              ))}
            </ul>
            {mode === 'percent' && (
              <small>Tip: The sum of all percentages should ideally be 100.</small>
            )}
          </div>
        )}

        <button
          onClick={submitExpense}
          style={{ marginTop: 8 }}
          disabled={isFinalized}
        >
          Add Expense
        </button>
      </section>

      {/* Current balance overview */}
      <section style={{ marginTop: 24 }}>
        <h4>Balances (current unsettled net amounts)</h4>
        <ul>
          {summary.map((s) => (
            <li key={s.user_id}>
              {s.name}: {Number(s.amount).toFixed(2)}
            </li>
          ))}
        </ul>
      </section>

      {/* Settlement preview & final email */}
      <section style={{ marginTop: 24 }}>
        <h4>Settlement</h4>
        {!isCreator && (
          <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
            Only group creator can send final settlement emails, other members can only preview the scheme.
          </div>
        )}
        {isFinalized && (
          <div style={{ fontSize: 13, color: 'green', marginBottom: 4 }}>
            This group is finalized, accounts are locked; if adjustments are needed, please create a new trip.
          </div>
        )}

        <button onClick={previewSettlements} disabled={previewLoading}>
          {previewLoading ? 'Calculating settlement scheme...' : 'Preview settlement scheme'}
        </button>

        {isCreator && (
          <button
            onClick={sendFinalNotifications}
            style={{ marginLeft: 8 }}
            disabled={notifyLoading || isFinalized}
          >
            {notifyLoading ? 'Sending settlement emails...' : 'Finalize and send emails'}
          </button>
        )}

        {previewTxs.length > 0 ? (
          <div style={{ marginTop: 12 }}>
            <h5>Suggested transfer scheme:</h5>
            <ul>
              {previewTxs.map((t, idx) => {
                const from = memberById.get(t.from_user_id);
                const to = memberById.get(t.to_user_id);
                const amount = Number(t.amount).toFixed(2);
                return (
                  <li key={idx}>
                    {from ? `${from.name} (${from.email})` : t.from_user_id} →{' '}
                    {to ? `${to.name} (${to.email})` : t.to_user_id}: ${amount}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
            No suggested transfers (may already be balanced, or no expenses added yet).
          </div>
        )}
      </section>

      {/* Expense list (simple version) */}
      <section style={{ marginTop: 24 }}>
        <h4>Recent Expenses</h4>
        <ul>
          {expenses.map((e) => (
            <li key={e.id}>
              #{e.id} ${e.amount} – {e.description} ({e.category}) on {e.date}
            </li>
          ))}
        </ul>
      </section>

      {/* Each expense detailed split + delete button */}
      <section style={{ marginTop: 24 }}>
        <h4>Expense Details</h4>
        {detailList.length === 0 && (
          <div style={{ fontSize: 13, color: '#666' }}>No details yet.</div>
        )}
        {detailList.map((exp) => {
          const allUnsettled = exp.shares.every((s) => !s.is_settled);
          const canDelete =
            !isFinalized &&
            currentUser &&
            exp.payer_id === currentUser.id &&
            allUnsettled;

          return (
            <div
              key={exp.expense_id}
              style={{
                border: '1px solid #ccc',
                padding: 8,
                marginBottom: 8,
              }}
            >
              <div>
                <strong>
                  #{exp.expense_id} ${exp.amount.toFixed(2)} –{' '}
                  {exp.description}
                </strong>{' '}
                on {exp.date}
              </div>
              <div style={{ fontSize: 12, color: '#555' }}>
                Payer: {exp.payer_name} ({exp.payer_email})
              </div>
              {canDelete && (
                <button
                  style={{ marginTop: 4 }}
                  onClick={() => deleteExpense(exp.expense_id)}
                >
                  Delete
                </button>
              )}
              {!canDelete && currentUser && exp.payer_id === currentUser.id && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                  This expense has members marked as settled or group is locked, cannot delete.
                </div>
              )}

              <ul style={{ marginTop: 8 }}>
                {exp.shares.map((s) => (
                  <li key={s.user_id}>
                    {s.user_name} ({s.user_email}) – owes $
                    {s.share_amount.toFixed(2)}, net amount in this expense{' '}
                    {s.owed_amount.toFixed(2)}{' '}
                    {s.is_settled && (
                      <span style={{ color: 'green', fontSize: 12 }}>
                        [Settled]
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
