'use client';

import { Budget } from '@/hooks/useBudgets';
import { Category } from '@/hooks/useCategories';
import { getCurrentMonthLocal } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Budget>) => Promise<void>;
  loading?: boolean;
  budget?: Budget | null;
  mode?: 'create' | 'edit';
  categories: Category[];
}

export const BudgetModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  budget,
  mode = 'create',
  categories,
}: BudgetModalProps) => {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [month, setMonth] = useState(getCurrentMonthLocal());
  const [error, setError] = useState('');

  // Filtrar apenas categorias de despesa
  const expenseCategories = categories.filter((c: Category) => c.type === 'expense' || c.type === 'both');

  useEffect(() => {
    if (mode === 'edit' && budget) {
      setCategory(budget.category);
      setLimit(budget.limit.toString());
      setMonth(new Date(budget.month).toISOString().slice(0, 7));
    } else if (mode === 'create') {
      setCategory('');
      setLimit('');
      setMonth(getCurrentMonthLocal());
    }
  }, [mode, budget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!category) {
      setError('Selecione uma categoria');
      return;
    }
    if (!limit || parseFloat(limit) <= 0) {
      setError('Limite deve ser maior que 0');
      return;
    }

    try {
      await onSubmit({
        category,
        limit: parseFloat(limit),
        month: new Date(month + '-01'),
      });

      // Limpar formulário apenas se for criação
      if (mode === 'create') {
        setCategory('');
        setLimit('');
        setMonth(getCurrentMonthLocal());
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'edit' ? 'Editar Orçamento' : 'Novo Orçamento'}
            </h2>
            <button
              onClick={onClose}
              className="text-2xl text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Escolha uma categoria</option>
                {expenseCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Limite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite Mensal (R$)
              </label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={limit}
                onChange={e => setLimit(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mês */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês de Referência
              </label>
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Dica */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Dica:</strong> Defina um limite realista baseado nos seus gastos
                anteriores. Você receberá alertas quando se aproximar do limite.
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Botões */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
