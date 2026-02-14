'use client';

import { useBudgets } from '@/hooks/useBudgets';
import { useEffect, useState } from 'react';

interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface SmartAlertsProps {
  userId?: string;
  transactions: any[];
  onViewBudgets?: () => void;
}

export const SmartAlerts = ({ userId, transactions, onViewBudgets }: SmartAlertsProps) => {
  const { budgets } = useBudgets(userId);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || !transactions.length) return;

    const newAlerts: Alert[] = [];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Calcular gastos por categoria no mês atual
    const categorySpending: Record<string, number> = {};
    transactions
      .filter((tx: any) => tx.type === 'expense' && tx.date.startsWith(currentMonth))
      .forEach((tx: any) => {
        categorySpending[tx.category] = (categorySpending[tx.category] || 0) + Number(tx.amount);
      });

    // Verificar orçamentos
    budgets.forEach((budget: any) => {
      const spent = categorySpending[budget.category] || 0;
      const limit = Number(budget.limit_amount || budget.limitAmount);
      const percentage = (spent / limit) * 100;

      const alertId = `budget-${budget.id}`;

      if (percentage >= 100 && !dismissedAlerts.has(`${alertId}-danger`)) {
        newAlerts.push({
          id: `${alertId}-danger`,
          type: 'danger',
          title: '🚨 Orçamento estourado!',
          message: `Você gastou R$ ${spent.toFixed(2)} em ${budget.category}, ultrapassando o limite de R$ ${limit.toFixed(2)} (${percentage.toFixed(0)}%)`,
          action: {
            label: 'Ver Orçamentos',
            onClick: () => onViewBudgets?.(),
          },
        });
      } else if (percentage >= 80 && percentage < 100 && !dismissedAlerts.has(`${alertId}-warning`)) {
        newAlerts.push({
          id: `${alertId}-warning`,
          type: 'warning',
          title: '⚠️ Atenção ao orçamento',
          message: `Você já gastou ${percentage.toFixed(0)}% do orçamento de ${budget.category} (R$ ${spent.toFixed(2)} de R$ ${limit.toFixed(2)})`,
          action: {
            label: 'Ver Orçamentos',
            onClick: () => onViewBudgets?.(),
          },
        });
      }
    });

    // Verificar gastos incomuns (>50% da média dos últimos 30 dias)
    const last30Days = transactions
      .filter((tx: any) => {
        const txDate = new Date(tx.date);
        const daysAgo = (Date.now() - txDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 30 && tx.type === 'expense';
      });

    if (last30Days.length >= 5) {
      const avgDaily = last30Days.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) / 30;
      const today = new Date().toISOString().split('T')[0];
      const todaySpending = transactions
        .filter((tx: any) => tx.date === today && tx.type === 'expense')
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

      if (todaySpending > avgDaily * 1.5 && !dismissedAlerts.has('high-spending-today')) {
        newAlerts.push({
          id: 'high-spending-today',
          type: 'info',
          title: '💡 Gastos altos hoje',
          message: `Você gastou R$ ${todaySpending.toFixed(2)} hoje, acima da sua média diária de R$ ${avgDaily.toFixed(2)}`,
        });
      }
    }

    setAlerts(newAlerts);
  }, [userId, transactions, budgets, dismissedAlerts, onViewBudgets]);

  const handleDismiss = (id: string) => {
    setDismissedAlerts((prev) => new Set([...prev, id]));
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    
    // Salvar no localStorage
    const dismissed = Array.from(dismissedAlerts);
    dismissed.push(id);
    localStorage.setItem('dismissedAlerts', JSON.stringify(dismissed));
  };

  // Carregar alertas dispensados do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dismissedAlerts');
    if (saved) {
      try {
        setDismissedAlerts(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Erro ao carregar alertas dispensados:', e);
      }
    }
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`
            glass-panel rounded-2xl p-4 
            border-l-4 transition-all
            ${
              alert.type === 'danger'
                ? 'border-red-500 bg-red-50/50'
                : alert.type === 'warning'
                ? 'border-amber-500 bg-amber-50/50'
                : 'border-blue-500 bg-blue-50/50'
            }
          `}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-[var(--ink)] mb-1">{alert.title}</h4>
              <p className="text-sm text-slate-600">{alert.message}</p>
              {alert.action && (
                <button
                  onClick={alert.action.onClick}
                  className="mt-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition"
                >
                  {alert.action.label} →
                </button>
              )}
            </div>
            <button
              onClick={() => handleDismiss(alert.id)}
              className="text-gray-400 hover:text-gray-600 transition text-xl leading-none flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
