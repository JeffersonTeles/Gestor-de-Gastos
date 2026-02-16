'use client';

import { useState } from 'react';

interface QuickFiltersProps {
  onPeriodChange?: (period: string) => void;
  onTypeChange?: (type: 'all' | 'income' | 'expense') => void;
}

export const QuickFilters = ({ onPeriodChange, onTypeChange }: QuickFiltersProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  const periods = [
    { value: 'today', label: 'Hoje', icon: '📅' },
    { value: 'week', label: 'Semana', icon: '📆' },
    { value: 'month', label: 'Mês', icon: '🗓️' },
    { value: 'year', label: 'Ano', icon: '📈' },
  ];

  const types = [
    { value: 'all', label: 'Todos', icon: '💰' },
    { value: 'income', label: 'Receitas', icon: '💚' },
    { value: 'expense', label: 'Despesas', icon: '❤️' },
  ];

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  const handleTypeChange = (type: 'all' | 'income' | 'expense') => {
    setSelectedType(type);
    onTypeChange?.(type);
  };

  return (
    <div className="space-y-4">
      {/* Filtros de Período - Mobile Scrollable */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-4 shadow-sm border border-neutral-200 dark:border-neutral-700">
        <h3 className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 sm:mb-3 flex items-center gap-2">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Período
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin w-full">\n          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => handlePeriodChange(period.value)}
              className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                selectedPeriod === period.value
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-neutral-50 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600'
              }`}
            >
              <span className="mr-1">{period.icon}</span>
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros de Tipo - Mobile Optimized */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-4 shadow-sm border border-neutral-200 dark:border-neutral-700">
        <h3 className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 sm:mb-3 flex items-center gap-2">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Tipo
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {types.map((type) => (
            <button
              key={type.value}
              onClick={() => handleTypeChange(type.value as 'all' | 'income' | 'expense')}
              className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                selectedType === type.value
                  ? 'bg-primary-500 text-white shadow-md ring-2 ring-primary-200'
                  : 'bg-neutral-50 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600'
              }`}
            >
              <div className="text-base sm:text-lg mb-0.5">{type.icon}</div>
              <div className="text-[10px] sm:text-xs">{type.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
