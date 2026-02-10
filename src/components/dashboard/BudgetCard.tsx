'use client';

import { Budget } from '@/hooks/useBudgets';

interface BudgetCardProps {
  budgets: Budget[];
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

export const BudgetCard = ({ budgets, onEdit, onDelete }: BudgetCardProps) => {
  if (budgets.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-2xl">🎯</p>
        <p className="text-gray-500 mt-2">Nenhum orçamento definido.</p>
        <p className="text-xs text-gray-400 mt-1">Clique em + para criar um</p>
      </div>
    );
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-100';
    if (percentage >= 80) return 'text-orange-600 bg-orange-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Orçamentos</h3>
      
      <div className="space-y-3">
        {budgets.map(budget => {
          const percentage = budget.percentage || 0;
          const spent = budget.spent || 0;
          const limit = Number(budget.limit);
          const remaining = limit - spent;

          return (
            <div
              key={budget.id}
              className="p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{budget.category}</h4>
                  <p className="text-xs text-gray-500">
                    {new Date(budget.month).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    percentage
                  )}`}
                >
                  {percentage.toFixed(0)}%
                </span>
              </div>

              {/* Valores */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500">Gasto</p>
                  <p className="text-lg font-bold text-gray-900">
                    R$ {spent.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Limite</p>
                  <p className="text-sm font-semibold text-gray-700">
                    R$ {limit.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${getProgressColor(
                      percentage
                    )}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs">
                  <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {remaining >= 0 ? 'Disponível' : 'Excedido'}: R${' '}
                    {Math.abs(remaining).toFixed(2)}
                  </span>
                  {percentage >= 80 && percentage < 100 && (
                    <span className="text-orange-600 font-semibold">⚠️ Atenção!</span>
                  )}
                  {percentage >= 100 && (
                    <span className="text-red-600 font-semibold">🚨 Limite ultrapassado!</span>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => onEdit(budget)}
                  className="flex-1 py-2 px-3 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm('Deletar orçamento?')) {
                      onDelete(budget.id);
                    }
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Deletar"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo Total */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-600">Total Orçado</p>
            <p className="text-xl font-bold text-gray-900">
              R${' '}
              {budgets.reduce((sum, b) => sum + Number(b.limit), 0).toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Total Gasto</p>
            <p className="text-xl font-bold text-gray-900">
              R${' '}
              {budgets.reduce((sum, b) => sum + (b.spent || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
