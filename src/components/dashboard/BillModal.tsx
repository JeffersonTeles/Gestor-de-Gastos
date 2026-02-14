'use client';

import { useCategories } from '@/hooks/useCategories';
import { Bill, BillPayload } from '@/types/index';
import { useEffect, useState } from 'react';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BillPayload) => Promise<void>;
  loading?: boolean;
  bill?: Bill | null;
  mode?: 'create' | 'edit';
}

export const BillModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  bill,
  mode = 'create',
}: BillModalProps) => {
  const { getCategoriesByType } = useCategories();
  const [type, setType] = useState<'payable' | 'receivable'>('payable');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'open' | 'paid' | 'canceled'>('open');
  const [error, setError] = useState('');
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [interval, setInterval] = useState(1);
  const [repeatEndDate, setRepeatEndDate] = useState('');

  const categories = getCategoriesByType(type === 'payable' ? 'expense' : 'income');

  useEffect(() => {
    if (mode === 'edit' && bill) {
      setType(bill.type);
      setAmount(bill.amount.toString());
      setCategory(bill.category);
      setDescription(bill.description);
      setDueDate(new Date(bill.dueDate).toISOString().split('T')[0]);
      setNotes(bill.notes || '');
      setStatus(bill.status === 'overdue' ? 'open' : bill.status);
      setRepeatEnabled(Boolean(bill.recurrenceId));
      setFrequency('monthly');
      setInterval(1);
      setRepeatEndDate('');
    } else if (mode === 'create') {
      setType('payable');
      setAmount('');
      setCategory('');
      setDescription('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setStatus('open');
      setRepeatEnabled(false);
      setFrequency('monthly');
      setInterval(1);
      setRepeatEndDate('');
    }
  }, [mode, bill, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Valor deve ser maior que 0');
      return;
    }
    if (!category) {
      setError('Selecione uma categoria');
      return;
    }
    if (!description.trim()) {
      setError('Digite uma descricao');
      return;
    }

    try {
      const recurrence = repeatEnabled
        ? {
            frequency,
            interval,
            endDate: repeatEndDate || undefined,
          }
        : undefined;

      await onSubmit({
        type,
        amount: parseFloat(amount),
        category,
        description: description.trim(),
        dueDate: new Date(dueDate),
        notes: notes.trim() || undefined,
        status,
        paidAt: status === 'paid' ? new Date() : null,
        recurrence,
      });

      if (mode === 'create') {
        setAmount('');
        setCategory('');
        setDescription('');
        setDueDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        setStatus('open');
        setRepeatEnabled(false);
        setFrequency('monthly');
        setInterval(1);
        setRepeatEndDate('');
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'edit' ? 'Editar Conta' : 'Nova Conta'}
            </h2>
            <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('payable');
                  setCategory('');
                }}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  type === 'payable'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Pagar 📤
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('receivable');
                  setCategory('');
                }}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  type === 'receivable'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Receber 📥
              </button>
            </div>

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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Escolha uma categoria</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descricao
              </label>
              <input
                type="text"
                placeholder="Ex: Conta de energia"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vencimento
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {mode === 'create' && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={repeatEnabled}
                    onChange={e => setRepeatEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Repetir automaticamente
                </label>

                {repeatEnabled && (
                  <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          Frequencia
                        </label>
                        <select
                          value={frequency}
                          onChange={e => setFrequency(e.target.value as typeof frequency)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensal</option>
                          <option value="yearly">Anual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          Intervalo
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={interval}
                          onChange={e => setInterval(Math.max(1, Number(e.target.value)))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        Termino (opcional)
                      </label>
                      <input
                        type="date"
                        value={repeatEndDate}
                        onChange={e => setRepeatEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === 'edit' && bill?.recurrenceId && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Esta conta faz parte de uma recorrencia.
              </div>
            )}

            {mode === 'edit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'open' | 'paid' | 'canceled')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Em aberto</option>
                  <option value="paid">Pago</option>
                  <option value="canceled">Cancelado</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observacoes (opcional)
              </label>
              <textarea
                placeholder="Detalhes da conta..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
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
