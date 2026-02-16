'use client';

import { Bill } from '@/types/index';
import { useState } from 'react';

interface BillsListProps {
  bills: Bill[];
  onDelete: (id: string) => void;
  onEdit: (bill: Bill) => void;
  onMarkPaid: (bill: Bill) => void;
  onReopen: (bill: Bill) => void;
  loading?: boolean;
}

export const BillsList = ({
  bills,
  onDelete,
  onEdit,
  onMarkPaid,
  onReopen,
  loading,
}: BillsListProps) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'payable' | 'receivable'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'paid' | 'overdue' | 'canceled'>('all');

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  const filtered = bills.filter((bill) => {
    if (typeFilter !== 'all' && bill.type !== typeFilter) return false;
    if (statusFilter !== 'all' && bill.status !== statusFilter) return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-2xl">🧾</p>
        <p className="text-gray-500 mt-2">Nenhuma conta cadastrada.</p>
        <p className="text-xs text-gray-400 mt-1">Use o botao + para criar a primeira.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatDate = (value: Date) =>
    new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const statusBadge = (status: string) => {
    const map = {
      open: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      canceled: 'bg-gray-200 text-gray-600',
    };
    return map[status as keyof typeof map] || map.open;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${
              typeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setTypeFilter('payable')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${
              typeFilter === 'payable' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            A pagar
          </button>
          <button
            onClick={() => setTypeFilter('receivable')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${
              typeFilter === 'receivable' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            A receber
          </button>
        </div>

        <div className="flex gap-2">
          {['all', 'open', 'overdue', 'paid', 'canceled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as typeof statusFilter)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                statusFilter === status ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {status === 'all'
                ? 'Todas'
                : status === 'open'
                ? 'Em aberto'
                : status === 'overdue'
                ? 'Atrasadas'
                : status === 'paid'
                ? 'Pagas'
                : 'Canceladas'}
            </button>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-1">Contas</h3>
      <p className="text-xs text-gray-500 mb-4">
        Mostrando {filtered.length} de {bills.length}
      </p>

      <div className="space-y-3">
        {filtered.map((bill) => (
          <div
            key={bill.id}
            className={`p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition group border-l-4 ${
              bill.type === 'payable' ? 'border-l-red-500' : 'border-l-green-500'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">{bill.description}</h4>
                <p className="text-xs text-gray-500">
                  {bill.category} • Venc: {formatDate(bill.dueDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {bill.recurrenceId && (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                    Recorrente
                  </span>
                )}
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge(bill.status)}`}>
                  {bill.status === 'open'
                    ? 'Em aberto'
                    : bill.status === 'paid'
                    ? 'Pago'
                    : bill.status === 'overdue'
                    ? 'Atrasado'
                    : 'Cancelado'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Valor</p>
                <p className={`text-lg font-bold ${bill.type === 'payable' ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(bill.amount)}
                </p>
              </div>
              {bill.paidAt && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Pago em</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {formatDate(bill.paidAt)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
              {bill.status !== 'paid' && bill.status !== 'canceled' && (
                <button
                  onClick={() => onMarkPaid(bill)}
                  className="flex-1 py-2 px-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition"
                >
                  ✅ Marcar pago
                </button>
              )}
              {bill.status === 'paid' && (
                <button
                  onClick={() => onReopen(bill)}
                  className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition"
                >
                  ↩️ Reabrir
                </button>
              )}
              <button
                onClick={() => onEdit(bill)}
                className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Editar"
              >
                ✏️
              </button>
              <button
                onClick={() => {
                  if (confirm('Deletar conta?')) {
                    onDelete(bill.id);
                  }
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Deletar"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
