
import { AlertCircle, Calendar, DollarSign, Loader2, Save, StickyNote } from 'lucide-react';
import React, { useState } from 'react';
import { Category, Transaction } from '../types';
import { sanitizeTransaction, validateTransaction } from '../utils/validation';
import AttachmentUploader from './AttachmentUploader';
import TagInput from './TagInput';

interface TransactionFormProps {
  onSave: (transaction: Partial<Transaction>) => Promise<void> | void;
  initialData?: Transaction;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Transaction>>(initialData || {
    description: '',
    value: 0,
    type: 'expense',
    category: Category.Others,
    date: new Date().toISOString().split('T')[0],
    tags: [],
    notes: '',
  });

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring || false);
  const [recurringMonths, setRecurringMonths] = useState(1);

  const addMonths = (dateStr: string, months: number) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar e sanitizar dados
    const sanitized = sanitizeTransaction(formData);
    const validation = validateTransaction(sanitized);

    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    try {
      setIsSaving(true);
      if (isRecurring && recurringMonths > 1) {
        for (let i = 0; i < recurringMonths; i += 1) {
          const nextDate = addMonths(formData.date as string, i);
          await onSave({ ...sanitized, date: nextDate, is_recurring: true });
        }
      } else {
        await onSave({ ...sanitized, is_recurring: isRecurring });
      }

      // Reset form
      setFormData({
        description: '',
        value: 0,
        type: 'expense',
        category: Category.Others,
        date: new Date().toISOString().split('T')[0],
        tags: [],
        notes: '',
      });
      setIsRecurring(false);
      setRecurringMonths(1);
    } catch (err) {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
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

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, type: 'expense' })}
          className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-md' : 'text-slate-500 dark:text-zinc-500'
            }`}
        >
          💸 Despesa
        </button>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, type: 'income' })}
          className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${formData.type === 'income' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-md' : 'text-slate-500 dark:text-zinc-500'
            }`}
        >
          💰 Receita
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
          <Tag size={16} />
          Descrição
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ex: Aluguel, Supermercado, Salário..."
          className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-zinc-100"
          maxLength={50}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            <DollarSign size={16} />
            Valor (R$)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.value || ''}
              onChange={handleValueChange}
              placeholder="0,00"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-zinc-100"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            <Calendar size={16} />
            Data
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-zinc-100"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Categoria</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-zinc-100 cursor-pointer"
        >
          {Object.values(Category).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <TagInput
        tags={formData.tags || []}
        onChange={(tags) => setFormData({ ...formData, tags })}
      />

      {/* Notas adicionais */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
          <StickyNote size={16} />
          Notas (opcional)
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Adicione observações, detalhes ou lembretes..."
          className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-zinc-100 resize-none"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          {(formData.notes || '').length}/500 caracteres
        </p>
      </div>

      {/* Upload de anexo */}
      <AttachmentUploader
        currentUrl={formData.attachment_url}
        onUploadComplete={(url) => setFormData({ ...formData, attachment_url: url })}
        onRemove={() => setFormData({ ...formData, attachment_url: undefined })}
      />

      <div className="space-y-2">
        <label className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-zinc-300">
          <span>Recorrente</span>
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
        </label>
        {isRecurring && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 dark:text-zinc-400">Repetir por</label>
              <select
                value={recurringMonths}
                onChange={(e) => setRecurringMonths(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm"
              >
                {[1, 2, 3, 6, 12].map((m) => (
                  <option key={m} value={m}>{m} mês(es)</option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-400 dark:text-zinc-500 flex items-end">
              Cria lançamentos futuros automaticamente.
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
        {isSaving ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Adicionar Transação')}
      </button>
    </form>
  );
};

export default TransactionForm;
