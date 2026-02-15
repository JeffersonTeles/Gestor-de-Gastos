import type { Transaction } from '@/types/index';
import { useMemo } from 'react';

export interface Insight {
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  icon: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useInsights = (transactions: Transaction[], monthlyIncome: number = 0): Insight[] => {
  return useMemo(() => {
    const insights: Insight[] = [];
    
    if (!transactions || transactions.length === 0) return insights;

    // Calcular período atual e anterior
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthTransactions = transactions.filter(t => 
      new Date(t.date) >= currentMonthStart
    );
    const lastMonthTransactions = transactions.filter(t => 
      new Date(t.date) >= lastMonthStart && new Date(t.date) <= lastMonthEnd
    );

    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastExpenses = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // INSIGHT 1: Comparação de gastos mês a mês
    if (lastExpenses > 0) {
      const percentChange = ((currentExpenses - lastExpenses) / lastExpenses) * 100;
      
      if (percentChange > 20) {
        insights.push({
          type: 'warning',
          title: '⚠️ Gastos Aumentaram',
          message: `Você gastou ${percentChange.toFixed(1)}% a mais este mês (R$ ${(currentExpenses - lastExpenses).toFixed(2)})`,
          icon: '📈',
        });
      } else if (percentChange < -10) {
        insights.push({
          type: 'success',
          title: '✅ Economia em Alta',
          message: `Parabéns! Você economizou ${Math.abs(percentChange).toFixed(1)}% este mês (R$ ${Math.abs(currentExpenses - lastExpenses).toFixed(2)})`,
          icon: '💰',
        });
      }
    }

    // INSIGHT 2: Categoria mais cara
    const categoryExpenses: { [key: string]: number } = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
      });

    const topCategory = Object.entries(categoryExpenses).sort(([,a], [,b]) => b - a)[0];
    if (topCategory && currentExpenses > 0) {
      const categoryValue = Number(topCategory[1]);
      const percentage = (categoryValue / currentExpenses) * 100;
      insights.push({
        type: 'info',
        title: '📊 Categoria Dominante',
        message: `${topCategory[0]} representa ${percentage.toFixed(1)}% dos gastos (R$ ${categoryValue.toFixed(2)})`,
        icon: '🎯',
      });
    }

    // INSIGHT 3: Frequência de transações
    const avgDailyExpenses = currentExpenses / now.getDate();
    const projectedMonthExpense = avgDailyExpenses * 30;
    const incomeToUse = monthlyIncome > 0 ? monthlyIncome : currentIncome;
    
    if (incomeToUse > 0 && projectedMonthExpense > incomeToUse * 0.9) {
      insights.push({
        type: 'danger',
        title: '🚨 Atenção ao Orçamento',
        message: `Com o ritmo atual, você pode gastar R$ ${projectedMonthExpense.toFixed(2)} este mês`,
        icon: '⚡',
      });
    }

    // INSIGHT 4: Gastos incomuns
    const expensesByDay = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc: { [key: string]: number }, t) => {
        const day = new Date(t.date).toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + t.amount;
        return acc;
      }, {});

    const totalDays = Object.keys(expensesByDay).length;
    const avgDailySpend = totalDays > 0 ? Object.values(expensesByDay).reduce((a, b) => a + b, 0) / totalDays : 0;
    const todaySpend = expensesByDay[now.toISOString().split('T')[0]] || 0;

    if (avgDailySpend > 0 && todaySpend > avgDailySpend * 2) {
      insights.push({
        type: 'warning',
        title: '💸 Gasto Alto Hoje',
        message: `Você gastou R$ ${todaySpend.toFixed(2)} hoje, ${((todaySpend / avgDailySpend - 1) * 100).toFixed(0)}% acima da média diária`,
        icon: '📅',
      });
    }

    // INSIGHT 5: Streaks de economia
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const daysWithoutExpenses = last7Days.filter(day => !expensesByDay[day]).length;
    if (daysWithoutExpenses >= 3) {
      insights.push({
        type: 'success',
        title: '🌟 Sequência de Economia',
        message: `Você ficou ${daysWithoutExpenses} dias sem registrar despesas!`,
        icon: '🔥',
      });
    }

    return insights;
  }, [transactions, monthlyIncome]);
};
