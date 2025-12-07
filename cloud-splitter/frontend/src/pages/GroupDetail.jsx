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
      {/* DEBUG marker, confirm frontend version */}
      <div
        style={{
          background: 'red',
          color: 'white',
          padding: 8,
          marginBottom: 8,
        }}
      >
        DEBUG INVITE & SETTLEMENT VERSION
      </div>

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