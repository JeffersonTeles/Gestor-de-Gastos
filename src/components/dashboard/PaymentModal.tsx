'use client';

import { Loan } from '@/types/index';
import { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; paymentDate: string; notes?: string }) => Promise<void>;
  loan: Loan | null;
  loading?: boolean;
}

export const PaymentModal = ({
  isOpen,
  onClose,
  onSubmit,
  loan,
  loading,
}: PaymentModalProps) => {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loan) return;

    // Validações
    if (!amount || parseFloat(amount) <= 0) {
      setError('Valor deve ser maior que 0');
      return;
    }

    const paymentAmount = parseFloat(amount);
    const remainingAmount = Number(loan.amount) - Number(loan.paidAmount);

    if (paymentAmount > remainingAmount) {
      setError(`Valor não pode ser maior que o restante (R$ ${remainingAmount.toFixed(2)})`);
      return;
    }

    try {
      await onSubmit({
        amount: paymentAmount,
        paymentDate,
        notes: notes.trim() || undefined,
      });

      // Limpar formulário
      setAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar pagamento');
    }
  };

  if (!isOpen || !loan) return null;

  const remainingAmount = Number(loan.amount) - Number(loan.paidAmount);

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
              Registrar Pagamento
            </h2>
            <button
              onClick={onClose}
              className="text-2xl text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Info do empréstimo */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Empréstimo para</p>
            <p className="font-bold text-lg text-gray-900">{loan.person}</p>
            <div className="mt-2 flex justify-between text-sm">
              <div>
                <p className="text-gray-600">Total</p>
                <p className="font-semibold">R$ {Number(loan.amount).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Pago</p>
                <p className="font-semibold text-green-600">R$ {Number(loan.paidAmount).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Restante</p>
                <p className="font-semibold text-orange-600">R$ {remainingAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor do Pagamento (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={remainingAmount}
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo: R$ {remainingAmount.toFixed(2)}
              </p>
            </div>

            {/* Atalhos de valor */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAmount((remainingAmount / 2).toFixed(2))}
                className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setAmount(remainingAmount.toFixed(2))}
                className="flex-1 py-2 px-3 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition"
              >
                Pagar tudo
              </button>
            </div>

            {/* Data do pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Pagamento
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                placeholder="Observações sobre este pagamento..."
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
                className="py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition"
              >
                {loading ? 'Salvando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
