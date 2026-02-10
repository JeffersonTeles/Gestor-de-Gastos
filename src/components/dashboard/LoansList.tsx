'use client';

import { Loan } from '@/types';
import { useState } from 'react';

interface LoansListProps {
  loans: Loan[];
  onDelete: (id: string) => void;
  onEdit: (loan: Loan) => void;
  onAddPayment: (loan: Loan) => void;
  loading?: boolean;
}

export const LoansList = ({ loans, onDelete, onEdit, onAddPayment, loading }: LoansListProps) => {
  const [filter, setFilter] = useState<'all' | 'lent' | 'borrowed'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  const filteredLoans = loans.filter(loan => {
    if (filter !== 'all' && loan.type !== filter) return false;
    if (statusFilter !== 'all' && loan.status !== statusFilter) return false;
    return true;
  });

  if (filteredLoans.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-2xl">💰</p>
        <p className="text-gray-500 mt-2">Nenhum empréstimo registrado.</p>
        <p className="text-xs text-gray-400 mt-1">Clique em + para adicionar um</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      partial: { text: 'Parcial', color: 'bg-blue-100 text-blue-800' },
      paid: { text: 'Pago', color: 'bg-green-100 text-green-800' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const calculateProgress = (loan: Loan) => {
    const paid = Number(loan.paidAmount);
    const total = Number(loan.amount);
    return (paid / total) * 100;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Filtros */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('lent')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${
              filter === 'lent'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Emprestei
          </button>
          <button
            onClick={() => setFilter('borrowed')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${
              filter === 'borrowed'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Peguei
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Pendente
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'partial'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Parcial
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'paid'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Pago
          </button>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-4">Empréstimos</h3>
      
      <div className="space-y-3">
        {filteredLoans.map(loan => {
          const statusBadge = getStatusBadge(loan.status);
          const progress = calculateProgress(loan);

          return (
            <div
              key={loan.id}
              className="p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">
                      {loan.type === 'lent' ? '💸' : '🤝'}
                    </span>
                    <h4 className="font-semibold text-gray-900">{loan.person}</h4>
                  </div>
                  {loan.description && (
                    <p className="text-sm text-gray-600">{loan.description}</p>
                  )}
                </div>

                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
                  {statusBadge.text}
                </span>
              </div>

              {/* Valores */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(loan.amount)}
                  </p>
                </div>
                {loan.paidAmount > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Pago</p>
                    <p className="text-sm font-semibold text-green-600">
                      {formatCurrency(loan.paidAmount)}
                    </p>
                  </div>
                )}
              </div>

              {/* Barra de progresso */}
              {loan.paidAmount > 0 && (
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {progress.toFixed(0)}% pago
                  </p>
                </div>
              )}

              {/* Datas */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span>📅 {formatDate(loan.loanDate)}</span>
                {loan.dueDate && (
                  <span className={
                    new Date(loan.dueDate) < new Date() && loan.status !== 'paid'
                      ? 'text-red-600 font-semibold'
                      : ''
                  }>
                    ⏰ Venc: {formatDate(loan.dueDate)}
                  </span>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                {loan.status !== 'paid' && (
                  <button
                    onClick={() => onAddPayment(loan)}
                    className="flex-1 py-2 px-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition"
                  >
                    💵 Registrar Pagamento
                  </button>
                )}
                <button
                  onClick={() => onEdit(loan)}
                  className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => {
                    if (confirm('Deletar empréstimo?')) {
                      onDelete(loan.id);
                    }
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Deletar"
                >
                  🗑️
                </button>
              </div>

              {/* Histórico de pagamentos */}
              {loan.payments && loan.payments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Histórico de Pagamentos
                  </p>
                  <div className="space-y-1">
                    {loan.payments.slice(0, 3).map((payment: any) => (
                      <div key={payment.id} className="flex justify-between text-xs">
                        <span className="text-gray-600">
                          {formatDate(payment.paymentDate)}
                        </span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
