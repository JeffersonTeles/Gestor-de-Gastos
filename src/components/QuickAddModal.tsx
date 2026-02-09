import { X } from 'lucide-react';
import React from 'react';
import { Transaction, TransactionType } from '../types';
import TransactionForm from './TransactionForm';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Partial<Transaction>) => void;
  defaultType?: TransactionType;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd,
  defaultType = 'expense'
}) => {
  const handleAdd = (transaction: Partial<Transaction>) => {
    onAdd(transaction);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl md:rounded-2xl w-full md:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto animation-in slide-in-from-bottom-4 duration-300 transform transition-all">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-b from-white dark:from-zinc-900 to-white/80 dark:to-zinc-900/80 px-6 py-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Nova Transação</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Registre uma receita ou despesa</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <TransactionForm 
              onSave={handleAdd}
              initialData={{ type: defaultType }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickAddModal;
