'use client';

import { useState } from 'react';

interface AdvancedFiltersProps {
  onFilter: (filters: FilterOptions) => void;
  categories?: string[];
  tags?: string[];
}

export interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: string[];
  tags?: string[];
  amountRange?: {
    min: number;
    max: number;
  };
  type?: 'all' | 'income' | 'expense';
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export const AdvancedFilters = ({ onFilter }: AdvancedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const handleApply = () => {
    onFilter(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      type: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filtros Avançados
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 animate-scale-in">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Filtros Avançados</h3>
                <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Período */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Período
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value } as any
                    }))}
                  />
                  <input
                    type="date"
                    className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value } as any
                    }))}
                  />
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Tipo de Transação
                </label>
                <select
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <option value="all">Todas</option>
                  <option value="income">Receitas</option>
                  <option value="expense">Despesas</option>
                </select>
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Faixa de Valor
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Mínimo"
                    className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                    value={filters.amountRange?.min || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, min: Number(e.target.value) } as any
                    }))}
                  />
                  <input
                    type="number"
                    placeholder="Máximo"
                    className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                    value={filters.amountRange?.max || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, max: Number(e.target.value) } as any
                    }))}
                  />
                </div>
              </div>

              {/* Ordenação */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Ordenar por
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  >
                    <option value="date">Data</option>
                    <option value="amount">Valor</option>
                    <option value="category">Categoria</option>
                  </select>
                  <select
                    className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                    value={filters.sortOrder}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                  >
                    <option value="desc">Decrescente</option>
                    <option value="asc">Crescente</option>
                  </select>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <button onClick={handleReset} className="btn-secondary flex-1">
                  Limpar
                </button>
                <button onClick={handleApply} className="btn-primary flex-1">
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
