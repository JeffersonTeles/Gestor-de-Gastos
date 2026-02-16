'use client';

import { Loan } from '@/types/index';
import { useEffect, useState } from 'react';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Loan>) => Promise<void>;
  loading?: boolean;
  loan?: Loan | null;
  mode?: 'create' | 'edit';
}

export const LoanModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  loan,
  mode = 'create',
}: LoanModalProps) => {
  const [type, setType] = useState<'lent' | 'borrowed'>('lent');
  const [amount, setAmount] = useState('');
  const [person, setPerson] = useState('');
  const [description, setDescription] = useState('');
  const [loanDate, setLoanDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Atualizar formulário quando em modo edição
  useEffect(() => {
    if (mode === 'edit' && loan) {
      setType(loan.type);
      setAmount(loan.amount.toString());
      setPerson(loan.person);
      setDescription(loan.description || '');
      setLoanDate(new Date(loan.loanDate).toISOString().split('T')[0]);
      setDueDate(loan.dueDate ? new Date(loan.dueDate).toISOString().split('T')[0] : '');
      setNotes(loan.notes || '');
    } else if (mode === 'create') {
      setType('lent');
      setAmount('');
      setPerson('');
      setDescription('');
      setLoanDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setNotes('');
    }
  }, [mode, loan, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!amount || parseFloat(amount) <= 0) {
      setError('Valor deve ser maior que 0');
      return;
    }
    if (!person.trim()) {
      setError('Digite o nome da pessoa');
      return;
    }

    try {
      const data: Partial<Loan> = {
        type,
        amount: parseFloat(amount),
        person: person.trim(),
        description: description.trim() || undefined,
        loanDate: new Date(loanDate),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: notes.trim() || undefined,
      };

      await onSubmit(data);

      // Limpar formulário apenas se for criação
      if (mode === 'create') {
        setAmount('');
        setPerson('');
        setDescription('');
        setLoanDate(new Date().toISOString().split('T')[0]);
        setDueDate('');
        setNotes('');
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
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'edit' ? 'Editar Empréstimo' : 'Novo Empréstimo'}
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
                onClick={() => setType('lent')}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  type === 'lent'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Emprestei 💸
              </button>
              <button
                type="button"
                onClick={() => setType('borrowed')}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  type === 'borrowed'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Peguei 🤝
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

            {/* Pessoa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === 'lent' ? 'Emprestei para' : 'Peguei de'}
              </label>
              <input
                type="text"
                placeholder="Nome da pessoa"
                value={person}
                onChange={e => setPerson(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Ajuda com aluguel"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data do empréstimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Empréstimo
              </label>
              <input
                type="date"
                value={loanDate}
                onChange={e => setLoanDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data de vencimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Vencimento (opcional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
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
