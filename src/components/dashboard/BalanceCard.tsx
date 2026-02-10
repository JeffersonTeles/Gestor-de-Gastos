'use client';

import { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

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
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-sm font-medium opacity-90">Saldo Total</p>
        <h2 className="text-3xl font-bold mt-2">{formatCurrency(balance)}</h2>
      </div>

      {/* Receitas vs Despesas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-xs text-green-600 font-medium">Receitas</p>
          <p className="text-xl font-bold text-green-700 mt-1">
            {formatCurrency(income)}
          </p>
        </div>

        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-xs text-red-600 font-medium">Despesas</p>
          <p className="text-xl font-bold text-red-700 mt-1">
            {formatCurrency(expense)}
          </p>
        </div>
      </div>
    </div>
  );
};
