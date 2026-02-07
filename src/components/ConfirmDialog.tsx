import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  danger = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border dark:border-zinc-800 animate-in zoom-in-95 duration-300">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-indigo-100 dark:bg-indigo-500/20'}`}>
            <AlertTriangle size={24} className={danger ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'} />
          </div>
          <h3 id="confirm-dialog-title" className="text-xl font-bold text-center mb-2 text-slate-900 dark:text-white">{title}</h3>
          <p className="text-center text-slate-600 dark:text-zinc-400 text-sm">{message}</p>
        </div>
        <div className="flex gap-3 p-6 bg-slate-50 dark:bg-zinc-950 border-t dark:border-zinc-800">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all active:scale-95 ${
              danger 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 dark:shadow-none' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
