'use client';

import { useCategories, type Category } from '@/hooks/useCategories';
import { useEffect, useState } from 'react';

interface SearchFilters {
  text: string;
  type: 'all' | 'income' | 'expense';
  categories: string[];
  tags: string[];
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onFilter: (filters: SearchFilters) => void;
  availableTags?: string[];
}

export const SearchBar = ({
  isOpen,
  onClose,
  onFilter,
  availableTags = [],
}: SearchBarProps) => {
  const { categories: allCategories } = useCategories();
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    text: '',
    type: 'all',
    categories: [],
    tags: [],
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
  });

  const [savedPresets, setSavedPresets] = useState<{ name: string; filters: SearchFilters }[]>([]);
  const [presetName, setPresetName] = useState('');

  // Carregar presets salvos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('searchPresets');
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar presets:', e);
      }
    }
  }, []);

  // Aplicar filtros automaticamente quando o texto muda
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onFilter(filters);
    }, 300); // Debounce de 300ms
    return () => clearTimeout(timer);
  }, [filters, isOpen, onFilter]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleCategoryToggle = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((c: string) => c !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t: string) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleReset = () => {
    const emptyFilters = {
      text: '',
      type: 'all' as const,
      categories: [],
      tags: [],
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
    };
    setFilters(emptyFilters);
    onFilter(emptyFilters);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    const newPreset = { name: presetName, filters };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('searchPresets', JSON.stringify(updated));
    setPresetName('');
  };

  const handleLoadPreset = (preset: { name: string; filters: SearchFilters }) => {
    setFilters(preset.filters);
    onFilter(preset.filters);
  };

  const handleDeletePreset = (index: number) => {
    const updated = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(updated);
    localStorage.setItem('searchPresets', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-3xl glass-panel rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Header com busca principal */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <input
              type="text"
              value={filters.text}
              onChange={(e) => setFilters({ ...filters, text: e.target.value })}
              placeholder="Buscar por descrição, categoria, tags..."
              className="flex-1 text-lg bg-transparent border-none outline-none text-[var(--ink)] placeholder:text-gray-400"
              autoFocus
            />
            <kbd className="px-3 py-1 text-sm font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded">
              ESC
            </kbd>
          </div>

          {/* Filtros rápidos de tipo */}
          <div className="flex gap-2 mt-4">
            {(['all', 'income', 'expense'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilters({ ...filters, type })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filters.type === type
                    ? type === 'income'
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                      : type === 'expense'
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                      : 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'Todos' : type === 'income' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>
        </div>

        {/* Botão de filtros avançados */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-6 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="text-sm font-medium text-[var(--ink)]">
            Filtros Avançados
          </span>
          <span
            className={`text-xl transition-transform ${
              showAdvanced ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </button>

        {/* Painel de filtros avançados */}
        {showAdvanced && (
          <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
            {/* Filtro de data */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                📅 Período
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                />
                <span className="flex items-center text-gray-400">até</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                />
              </div>
            </div>

            {/* Filtro de valor */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                💵 Valor
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={filters.amountMin}
                  onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
                  placeholder="Mínimo"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  value={filters.amountMax}
                  onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
                  placeholder="Máximo"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                />
              </div>
            </div>

            {/* Filtro de categorias */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                🏷️ Categorias
              </label>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((cat: Category) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      filters.categories.includes(cat.id)
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro de tags */}
            {availableTags.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                  🔖 Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag: string) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        filters.tags.includes(tag)
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Salvar preset */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                💾 Salvar Filtro
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Nome do filtro..."
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                />
                <button
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
                >
                  Salvar
                </button>
              </div>
            </div>

            {/* Presets salvos */}
            {savedPresets.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                  📌 Filtros Salvos
                </label>
                <div className="space-y-2">
                  {savedPresets.map((preset, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <button
                        onClick={() => handleLoadPreset(preset)}
                        className="flex-1 text-left text-sm font-medium text-[var(--ink)]"
                      >
                        {preset.name}
                      </button>
                      <button
                        onClick={() => handleDeletePreset(index)}
                        className="ml-2 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer com ações */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Limpar Filtros
          </button>
          <div className="text-xs text-gray-500">
            {filters.text && `Buscando: "${filters.text}"`}
          </div>
        </div>
      </div>
    </div>
  );
};
