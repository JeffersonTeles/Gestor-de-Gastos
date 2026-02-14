import { useMemo } from 'react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
}

export interface Prediction {
  month: string;
  predictedExpense: number;
  predictedIncome: number;
  confidence: number; // 0-100
}

export const usePredictions = (transactions: Transaction[]): Prediction[] => {
  return useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Agrupar por mês
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      
      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });

    const months = Object.keys(monthlyData).sort();
    if (months.length < 2) {
      return []; // Precisa de pelo menos 2 meses para previsão
    }

    // Calcular médias e tendências
    const recentMonths = months.slice(-3); // Últimos 3 meses
    const avgIncome = recentMonths.reduce((sum, m) => sum + monthlyData[m].income, 0) / recentMonths.length;
    const avgExpense = recentMonths.reduce((sum, m) => sum + monthlyData[m].expense, 0) / recentMonths.length;

    // Calcular tendência (crescimento/decrescimento)
    const incomeTrend = recentMonths.length >= 2
      ? (monthlyData[recentMonths[recentMonths.length - 1]].income - monthlyData[recentMonths[0]].income) / recentMonths.length
      : 0;
    
    const expenseTrend = recentMonths.length >= 2
      ? (monthlyData[recentMonths[recentMonths.length - 1]].expense - monthlyData[recentMonths[0]].expense) / recentMonths.length
      : 0;

    // Gerar previsões para os próximos 3 meses
    const predictions: Prediction[] = [];
    const now = new Date();

    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      
      const predictedIncome = Math.max(0, avgIncome + (incomeTrend * i));
      const predictedExpense = Math.max(0, avgExpense + (expenseTrend * i));
      
      // Confiança diminui para meses mais distantes
      const confidence = Math.max(50, 90 - (i * 10));

      predictions.push({
        month: futureDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', ''),
        predictedExpense,
        predictedIncome,
        confidence,
      });
    }

    return predictions;
  }, [transactions]);
};
