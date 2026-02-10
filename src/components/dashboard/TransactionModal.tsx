'use client';

import { useCategories } from '@/hooks/useCategories';
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
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionData) => Promise<void>;
  loading?: boolean;
  transaction?: TransactionData | null;
  mode?: 'create' | 'edit';
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionData) => Promise<void>;
  loading?: boolean;
  transaction?: TransactionData | null;
  mode?: 'create' | 'edit';
}

export const TransactionModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  transaction,
  mode = 'create',
}: TransactionModalProps) => {
  const { getCategoriesByType } = useCategories();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Obter categorias do tipo selecionado
  const categories = getCategoriesByType(type);

  // Atualizar formulário quando em modo edição
  useEffect(() => {
    if (mode === 'edit' && transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setDescription(transaction.description);
      setDate(transaction.date.split('T')[0]);
      setTags(transaction.tags?.join(', ') || '');
      setNotes(transaction.notes || '');
    } else if (mode === 'create') {
      // Resetar formulário no modo criação
      setType('expense');
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setTags('');
      setNotes('');
    }
  }, [mode, transaction, isOpen]);

  const categories =
    type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!amount || parseFloat(amount) <= 0) {
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
        amount: parseFloat(amount),
        category,
        description: description.trim(),
        date,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        notes: notes.trim() || undefined,
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
        setTags('');
        setNotes('');
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="max-w-md mx-auto">
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
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory('');
                }}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  type === 'expense'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Despesa 📉
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('');
                }}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  type === 'income'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Receita 📈
              </button>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <input
                type="text"
                placeholder="Ex: Almoço com a família"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                placeholder="Ex: trabalho, importante"
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                placeholder="Observações adicionais..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Botões */}
            <div className="grid grid-cols-2 gap-3 pt-4">
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
