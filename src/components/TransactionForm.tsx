
import React, { useState } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { Save, AlertCircle } from 'lucide-react';

interface TransactionFormProps {
  onSave: (transaction: Partial<Transaction>) => void;
  initialData?: Transaction;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Transaction>>(initialData || {
    description: '',
    value: 0,
    type: 'expense',
    category: Category.Others,
    date: new Date().toISOString().split('T')[0]
  });

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.description?.trim() || !formData.value || formData.value <= 0) {
      setError('Por favor, preencha a descrição e um valor válido.');
      return;
    }

    onSave(formData);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setFormData({ ...formData, value: isNaN(val) ? 0 : val });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 transition-colors">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl" role="group" aria-label="Tipo de transação">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, type: 'expense' })}
          aria-pressed={formData.type === 'expense'}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 dark:text-zinc-500'
            }`}
        >
          Despesa
        </button>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, type: 'income' })}
          aria-pressed={formData.type === 'income'}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${formData.type === 'income' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-zinc-500'
            }`}
        >
          Receita
        </button>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="transaction-description" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Descrição</label>
        <input
          id="transaction-description"
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ex: Aluguel, Supermercado, Salário..."
          className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-zinc-100"
          maxLength={50}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="transaction-value" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Valor (R$)</label>
          <input
            id="transaction-value"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.value || ''}
            onChange={handleValueChange}
            placeholder="0,00"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-zinc-100"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="transaction-date" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Data</label>
          <input
            id="transaction-date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-zinc-100"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="transaction-category" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Categoria</label>
        <select
          id="transaction-category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-zinc-100 cursor-pointer"
        >
          {Object.values(Category).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none transition-all mt-4 active:scale-95"
      >
        <Save size={20} />
        {initialData ? 'Salvar Alterações' : 'Adicionar Transação'}
      </button>
    </form>
  );
};

export default TransactionForm;
