'use client';

import { formatPrice } from '@/lib/utils';

interface TransactionCardProps {
  transaction: {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    tags?: string[];
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TransactionCard = ({ transaction, onEdit, onDelete }: TransactionCardProps) => {
  return (
    <div className="card p-4 hover-lift transition-all-smooth mb-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-neutral-900 dark:text-white">{transaction.description}</h4>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{transaction.category}</p>
        </div>
        <span className={`text-lg font-bold ${
          transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
        }`}>
          {transaction.type === 'income' ? '+' : '-'}R$ {formatPrice(Math.abs(transaction.amount))}
        </span>
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
        <span className="text-xs text-neutral-500">
          {new Date(transaction.date).toLocaleDateString('pt-BR')}
        </span>
        
        {transaction.tags && transaction.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {transaction.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                {tag}
              </span>
            ))}
            {transaction.tags.length > 2 && (
              <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs rounded-full">
                +{transaction.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-3">
          {onEdit && (
            <button
              onClick={() => onEdit(transaction.id)}
              className="flex-1 btn-secondary text-xs py-1.5"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(transaction.id)}
              className="flex-1 btn-danger text-xs py-1.5"
            >
              Excluir
            </button>
          )}
        </div>
      )}
    </div>
  );
};
