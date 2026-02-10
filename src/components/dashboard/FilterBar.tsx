'use client';

import { useCategories } from '@/hooks/useCategories';
import { Transaction } from '@/lib/types';
import { useState } from 'react';

interface FilterBarProps {
  transactions: Transaction[];
  onFilter: (filtered: Transaction[]) => void;
  onExport: () => void;
}

const MONTHS = [
  { value: 'all', label: 'Todos os meses' },
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

// Gerar anos disponíveis (últimos 5 anos + próximo ano)
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = -5; i <= 1; i++) {
    years.push({ value: String(currentYear + i), label: String(currentYear + i) });
  }
  return [{ value: 'all', label: 'Todos os anos' }, ...years.reverse()];
};

export const FilterBar = ({ transactions, onFilter, onExport }: FilterBarProps) => {
  const { categories } = useCategories();
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedType, setSelectedType] = useState('all');

  const applyFilters = (month: string, year: string, category: string, type: string) => {
    let filtered = [...transactions];

    // Filtro por mês
    if (month !== 'all') {
      filtered = filtered.filter(tx => {
        const txMonth = new Date(tx.date).toISOString().slice(5, 7);
        return txMonth === month;
      });
    }

    // Filtro por ano
    if (year !== 'all') {
      filtered = filtered.filter(tx => {
        const txYear = new Date(tx.date).getFullYear().toString();
        return txYear === year;
      });
    }

    // Filtro por categoria
    if (category !== 'Todas') {
      filtered = filtered.filter(tx => tx.category === category);
    }

    // Filtro por tipo
    if (type !== 'all') {
      filtered = filtered.filter(tx => tx.type === type);
    }

    onFilter(filtered);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    applyFilters(month, selectedYear, selectedCategory, selectedType);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    applyFilters(selectedMonth, year, selectedCategory, selectedType);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    applyFilters(selectedMonth, selectedYear, category, selectedType);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    applyFilters(selectedMonth, selectedYear, selectedCategory, type);
  };

  const handleClearFilters = () => {
    setSelectedMonth('all');
    setSelectedYear('all');
    setSelectedCategory('Todas');
    setSelectedType('all');
    onFilter(transactions);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 sticky top-16 bg-gray-50 border-b border-gray-200 z-40">
      <div className="space-y-3">
        {/* Tipo */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">
            Tipo
          </label>
          <select
            value={selectedType}
            onChange={e => handleTypeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </div>

        {/* Ano */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">
            Ano
          </label>
          <select
            value={selectedYear}
            onChange={e => handleYearChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {generateYears().map(y => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mês */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">
            Mês
          </label>
          <select
            value={selectedMonth}
            onChange={e => handleMonthChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Categoria */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">
            Categoria
          </label>
          <select
            value={selectedCategory}
            onChange={e => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Todas">Todas</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={handleClearFilters}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition"
          >
            🔄 Limpar
          </button>
          <button
            onClick={onExport}
            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition"
          >
            📥 Exportar
          </button>
        </div>
      </div>
    </div>
  );
};
