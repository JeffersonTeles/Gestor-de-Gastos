export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function calculateTotals(transactions) {
  return transactions.reduce(
    (acc, tx) => {
      if (tx.type === "income") {
        acc.income += tx.amount;
        acc.balance += tx.amount;
      } else {
        acc.expense += tx.amount;
        acc.balance -= tx.amount;
      }
      return acc;
    },
    { income: 0, expense: 0, balance: 0 }
  );
}

export function buildProjectionSeries(initialBalance, monthlyNet, months) {
  const series = [];
  let running = initialBalance;

  for (let i = 1; i <= months; i += 1) {
    running += monthlyNet;
    series.push(running);
  }

  return series;
}

export function calculateFinancialScore(params) {
  const { savingsRate, budgetExceeded, budgetWarning, transactionCount } = params;

  const savingsRateNorm = clamp(savingsRate / 30, 0, 1);
  const budgetPenalty = Math.min(1, budgetExceeded * 0.25 + budgetWarning * 0.1);
  const consistency = clamp(transactionCount / 20, 0, 1);

  const score = (savingsRateNorm * 55 + (1 - budgetPenalty) * 30 + consistency * 15) * 100 / 100;
  return clamp(score, 0, 100);
}

export function detectOutlierExpenses(expenses, sensitivity = 1.35) {
  if (expenses.length < 4) {
    return [];
  }

  const values = expenses.map((tx) => tx.amount);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return expenses
    .filter((tx) => tx.amount > mean + stdDev * sensitivity)
    .sort((a, b) => b.amount - a.amount);
}

export function projectEndMonthBalance(params) {
  const { monthBalance, currentDay, totalDays } = params;
  const elapsedDays = Math.max(1, currentDay);
  const dailyNet = monthBalance / elapsedDays;
  return dailyNet * totalDays;
}
