'use client';

import { Transaction } from '@/lib/types';
import { formatCurrency, formatDate, getCategoryEmoji } from '@/lib/utils';

interface TransactionsListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  loading?: boolean;
}

export const TransactionsList = ({ transactions, onDelete, onEdit, loading }: TransactionsListProps) => {
  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-2xl">📭</p>
        <p className="text-gray-500 mt-2">Nenhuma transação registrada.</p>
        <p className="text-xs text-gray-400 mt-1">Use o botão + para adicionar a primeira.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Transações
        <span className="ml-2 text-xs font-semibold text-gray-500">
          {transactions.length}
        </span>
      </h3>
      
      <div className="space-y-2">
        {transactions.map(tx => (
          <div
            key={tx.id}
            className={`flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition group border-l-4 ${
              tx.type === 'income' ? 'border-l-green-500' : 'border-l-red-500'
            }`}
          >
            {/* Esquerda: Emoji + Descrição */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">
                {getCategoryEmoji(tx.category)}
              </span>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {tx.description}
                </p>
                <p className="text-xs text-gray-500">
                  {tx.category} • {formatDate(tx.date)}
                </p>
                {tx.notes && (
                  <p className="text-[11px] text-gray-400 truncate">
                    {tx.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Direita: Valor + Ações */}
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <span
                className={`font-bold text-lg ${
                  tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
              </span>

              <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                <button
                  onClick={() => onEdit(tx)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded transition"
                  title="Editar"
                  aria-label="Editar transacao"
                >
                  ✏️
                </button>

                <button
                  onClick={() => {
                    if (confirm('Deletar transação?')) {
                      onDelete(tx.id);
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                  title="Deletar"
                  aria-label="Deletar transacao"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
