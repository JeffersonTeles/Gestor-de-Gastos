'use client';

import { useToast } from '@/contexts/ToastContext';
import { formatCurrency } from '@/lib/utils';
import { useMemo, useState } from 'react';

interface WeeklyReviewProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: any[];
}

export const WeeklyReview = ({ isOpen, onClose, transactions }: WeeklyReviewProps) => {
  const { showToast } = useToast();
  const [checklist, setChecklist] = useState({
    reviewedTransactions: false,
    categorizedAll: false,
    checkedBudgets: false,
    plannedNextWeek: false,
  });

  const weekData = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekTransactions = transactions.filter((tx: any) => {
      const txDate = new Date(tx.date);
      return txDate >= weekAgo && txDate <= today;
    });

    let income = 0;
    let expense = 0;
    const categoryBreakdown: Record<string, number> = {};
    const uncategorized = weekTransactions.filter((tx: any) => 
      !tx.category || tx.category === 'Outros' || tx.category === 'Importado'
    );

    weekTransactions.forEach((tx: any) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amount;
      } else {
        expense += amount;
        categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + amount;
      }
    });

    const topCategories = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      transactions: weekTransactions,
      income,
      expense,
      balance: income - expense,
      topCategories,
      uncategorized,
      transactionCount: weekTransactions.length,
    };
  }, [transactions]);

  const handleCheckItem = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleComplete = () => {
    const allChecked = Object.values(checklist).every(Boolean);
    if (!allChecked) {
      showToast('warning', 'Complete todos os itens da revisão primeiro');
      return;
    }

    showToast('success', '🎉 Revisão semanal concluída! Continue assim!');
    
    // Salvar data da última revisão
    localStorage.setItem('lastWeeklyReview', new Date().toISOString());
    
    onClose();
  };

  if (!isOpen) return null;

  const progress = (Object.values(checklist).filter(Boolean).length / Object.keys(checklist).length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl glass-panel rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-[var(--ink)]">
              📅 Revisão Semanal
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Últimos 7 dias • {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-600">Progresso da Revisão</span>
            <span className="text-sm font-bold text-emerald-600">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="glass-panel rounded-2xl p-4 border-l-4 border-emerald-500">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Receitas</div>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(weekData.income)}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-4 border-l-4 border-amber-500">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Despesas</div>
            <div className="text-2xl font-bold text-amber-700">
              {formatCurrency(weekData.expense)}
            </div>
          </div>
          <div className={`glass-panel rounded-2xl p-4 border-l-4 ${weekData.balance >= 0 ? 'border-teal-500' : 'border-red-500'}`}>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Saldo</div>
            <div className={`text-2xl font-bold ${weekData.balance >= 0 ? 'text-teal-700' : 'text-red-700'}`}>
              {weekData.balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(weekData.balance))}
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">
            ✓ Lista de Verificação
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => handleCheckItem('reviewedTransactions')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                checklist.reviewedTransactions
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${
                  checklist.reviewedTransactions ? 'bg-emerald-500' : 'bg-slate-300'
                }`}>
                  {checklist.reviewedTransactions ? '✓' : ''}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[var(--ink)]">
                    Revisei todas as {weekData.transactionCount} transações da semana
                  </div>
                  <div className="text-sm text-slate-500">
                    Verifique se há duplicatas ou erros
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleCheckItem('categorizedAll')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                checklist.categorizedAll
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${
                  checklist.categorizedAll ? 'bg-emerald-500' : 'bg-slate-300'
                }`}>
                  {checklist.categorizedAll ? '✓' : ''}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[var(--ink)]">
                    Categorizei transações pendentes
                  </div>
                  <div className="text-sm text-slate-500">
                    {weekData.uncategorized.length} sem categoria adequada
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleCheckItem('checkedBudgets')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                checklist.checkedBudgets
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${
                  checklist.checkedBudgets ? 'bg-emerald-500' : 'bg-slate-300'
                }`}>
                  {checklist.checkedBudgets ? '✓' : ''}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[var(--ink)]">
                    Verifiquei meus orçamentos
                  </div>
                  <div className="text-sm text-slate-500">
                    Ajuste limites se necessário
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleCheckItem('plannedNextWeek')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                checklist.plannedNextWeek
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${
                  checklist.plannedNextWeek ? 'bg-emerald-500' : 'bg-slate-300'
                }`}>
                  {checklist.plannedNextWeek ? '✓' : ''}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[var(--ink)]">
                    Planejei a próxima semana
                  </div>
                  <div className="text-sm text-slate-500">
                    Defina metas e despesas previstas
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Top categories */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">
            📊 Top 5 Categorias de Despesas
          </h3>
          <div className="space-y-2">
            {weekData.topCategories.map(([category, amount], index) => {
              const percentage = (amount / weekData.expense) * 100;
              return (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-2xl w-8 text-center">{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-[var(--ink)]">{category}</span>
                      <span className="text-sm font-semibold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-slate-500 w-12 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-2xl font-semibold hover:bg-slate-200 transition"
          >
            Revisar Depois
          </button>
          <button
            onClick={handleComplete}
            disabled={progress < 100}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {progress === 100 ? '🎉 Concluir Revisão' : `Concluir (${progress.toFixed(0)}%)`}
          </button>
        </div>
      </div>
    </div>
  );
};
