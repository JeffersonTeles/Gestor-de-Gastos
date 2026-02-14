'use client';

import { formatCurrency } from '@/lib/utils';
import { Transaction } from '@/types/index';

interface BalanceCardProps {
  transactions: Transaction[];
}

export const BalanceCard = ({ transactions }: BalanceCardProps) => {
  const balance = transactions.reduce((acc, tx) => {
    return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
  }, 0);

  const income = transactions
    .filter(tx => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const expense = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      {/* Saldo Principal */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Saldo Total</p>
        <h2 className="text-3xl font-bold mt-2">{formatCurrency(balance)}</h2>
        <p className="text-xs opacity-80 mt-2">Atualizado com base nas transações filtradas</p>
      </div>

      {/* Receitas vs Despesas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
          <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Receitas</p>
          <p className="text-xl font-bold text-green-700 mt-1">
            {formatCurrency(income)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
          <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Despesas</p>
          <p className="text-xl font-bold text-red-700 mt-1">
            {formatCurrency(expense)}
          </p>
        </div>
      </div>
    </div>
  );
};
