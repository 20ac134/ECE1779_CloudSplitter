export function minimizeTransactions(balances) {
  const creditors = balances.filter(b => b.amount > 0).map(b => ({...b})).sort((a,b)=>b.amount-a.amount);
  const debtors = balances.filter(b => b.amount < 0).map(b => ({...b})).sort((a,b)=>a.amount-b.amount);
  const txs = [];
  let i=0, j=0;
  while (i < debtors.length && j < creditors.length) {
    const owe = -debtors[i].amount;
    const due = creditors[j].amount;
    const pay = Math.min(owe, due);
    if (pay > 0.0001) {
      txs.push({ from_user_id: debtors[i].user_id, to_user_id: creditors[j].user_id, amount: Number(pay.toFixed(2)) });
      debtors[i].amount += pay;
      creditors[j].amount -= pay;
    }
    if (Math.abs(debtors[i].amount) < 0.0001) i++;
    if (Math.abs(creditors[j].amount) < 0.0001) j++;
  }
  return txs;
}
