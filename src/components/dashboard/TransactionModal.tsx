'use client';

import { MoneyInput } from '@/components/ui/MoneyInput';
import { useCategories, type Category } from '@/hooks/useCategories';
import { useEffect, useState } from 'react';

interface TransactionData {
  id?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionData) => Promise<void>;
  loading?: boolean;
  transaction?: TransactionData | null;
  mode?: 'create' | 'edit';
  defaultType?: 'income' | 'expense';
}

export const TransactionModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  transaction,
  mode = 'create',
  defaultType = 'expense',
}: TransactionModalProps) => {
  const { getCategoriesByType } = useCategories();
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState('');

  // Tags sugeridas
  const SUGGESTED_TAGS = [
    '🏠 Casa',
    '🚗 Transporte',
    '🍔 Alimentação',
    '💼 Trabalho',
    '🎓 Educação',
    '💳 Recorrente',
    '⚡ Urgente',
    '🎯 Meta',
    '🎁 Presente',
    '🏥 Saúde',
  ];

  // Obter categorias do tipo selecionado
  const categories = getCategoriesByType(type);

  // Reset tipo baseado no defaultType quando modal abre
  useEffect(() => {
    if (isOpen && mode === 'create') {
      setType(defaultType);
    }
  }, [isOpen, mode, defaultType]);

  // Auto-selecionar primeira categoria quando tipo muda
  useEffect(() => {
    if (mode === 'create' && categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [type, categories, category, mode]);

  // Atualizar formulário quando em modo edição
  useEffect(() => {
    if (mode === 'edit' && transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setDescription(transaction.description);
      setDate(transaction.date.split('T')[0]);
      setTags(transaction.tags || []);
      setNotes(transaction.notes || '');
    } else if (mode === 'create') {
      // Resetar formulário no modo criação
      setType('expense');
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setTags([]);
      setNotes('');
    }
  }, [mode, transaction, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Converter valor formatado (1.234,56) para número
    const parseFormattedMoney = (value: string): number => {
      const cleaned = value.replace(/\./g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    };

    const numericAmount = parseFormattedMoney(amount);

    // Validações
    if (!amount || numericAmount <= 0) {
      setError('Valor deve ser maior que 0');
      return;
    }
    if (!category) {
      setError('Selecione uma categoria');
      return;
    }
    if (!description.trim()) {
      setError('Digite uma descrição');
      return;
    }

    try {
      const data: TransactionData = {
        type,
        amount: numericAmount,
        category,
        description: description.trim(),
        date,
        tags: tags,
        notes: notes.trim() || undefined,
        isRecurring,
      };

      if (mode === 'edit' && transaction?.id) {
        data.id = transaction.id;
      }

      await onSubmit(data);

      // Limpar formulário apenas se for criação
      if (mode === 'create') {
        setAmount('');
        setCategory('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setTags([]);
        setTagInput('');
        setNotes('');
        setIsRecurring(false);
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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto glass-panel">
        <div className="max-w-xl mx-auto">
          <div className="h-1.5 w-12 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'edit' ? 'Editar Transação' : 'Nova Transação'}
            </h2>
            <button
              onClick={onClose}
              className="text-2xl text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory(''); // Será preenchido pelo useEffect
                }}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  type === 'expense'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Despesa 📉
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory(''); // Será preenchido pelo useEffect
                }}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Receita 📈
              </button>
            </div>

            {/* Valor */}
            <MoneyInput
              label="Valor (R$)"
              value={amount}
              onChange={setAmount}
              autoFocus={mode === 'create'}
            />

            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                Categoria
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white transition-colors"
              >
                <option value="" disabled>Escolha uma categoria</option>
                {categories.map((cat: Category) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                Descrição
              </label>
              <input
                type="text"
                placeholder="Ex: Almoço com a família"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              />
            </div>

            {/* Data e tipo de despesa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                  Tipo de despesa
                </label>
                <button
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-full h-[50px] rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    isRecurring
                      ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isRecurring ? '💳 Fixa/Recorrente' : '💸 Variável'}
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                🔖 Tags
              </label>
              
              {/* Tags selecionadas */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium rounded-full shadow-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((_, i) => i !== index))}
                        className="ml-1 hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center transition"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Input de nova tag */}
              <input
                type="text"
                placeholder="Digite e pressione Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newTag = tagInput.trim();
                    if (newTag && !tags.includes(newTag)) {
                      setTags([...tags, newTag]);
                      setTagInput('');
                    }
                  }
                }}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              />
              
              {/* Tags sugeridas */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs text-slate-500">Sugestões:</span>
                {SUGGESTED_TAGS.filter(tag => !tags.includes(tag)).slice(0, 5).map((tag: string) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!tags.includes(tag)) {
                        setTags([...tags, tag]);
                      }
                    }}
                    className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-200 transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                Notas (opcional)
              </label>
              <textarea
                placeholder="Observacoes adicionais..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none bg-white"
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Botões */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-slate-100 text-slate-700 rounded-2xl font-semibold hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-3 px-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
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
