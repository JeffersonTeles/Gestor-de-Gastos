import React, { useState } from 'react';

// SVG Icons inline
const AlertIcon = () => (
  <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
  </svg>
);

const LoadingIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  requireTyping?: boolean;
  confirmationWord?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  requireTyping = false,
  confirmationWord = 'DELETAR',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [typedWord, setTypedWord] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requireTyping && typedWord !== confirmationWord) {
      return;
    }

    setIsProcessing(true);
    try {
      await onConfirm();
      setTypedWord('');
      onClose();
    } catch (error) {
      console.error('Error in confirm action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setTypedWord('');
      onClose();
    }
  };

  const variantStyles = {
    danger: {
      icon: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
      button: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
      border: 'border-rose-200 dark:border-rose-500/20',
    },
    warning: {
      icon: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
      border: 'border-amber-200 dark:border-amber-500/20',
    },
    info: {
      icon: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      button: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
      border: 'border-indigo-200 dark:border-indigo-500/20',
    },
  };

  const styles = variantStyles[variant];
  const isConfirmDisabled = requireTyping && typedWord !== confirmationWord;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-md transform transition-all animate-slide-up">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${styles.icon}`}>
                  <AlertIcon />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-zinc-100">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2">
                    {message}
                  </p>
                </div>
              </div>
              {!isProcessing && (
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  disabled={isProcessing}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {requireTyping && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Para confirmar, digite{' '}
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    {confirmationWord}
                  </span>
                </label>
                <input
                  type="text"
                  value={typedWord}
                  onChange={(e) => setTypedWord(e.target.value.toUpperCase())}
                  placeholder={confirmationWord}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border rounded-xl outline-none focus:ring-2 transition-all text-slate-800 dark:text-zinc-100 font-mono ${
                    typedWord && typedWord !== confirmationWord
                      ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-zinc-700 focus:ring-indigo-500'
                  }`}
                  disabled={isProcessing}
                  autoFocus
                />
                {typedWord && typedWord !== confirmationWord && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    O texto não corresponde
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-zinc-800 flex gap-3">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing || isConfirmDisabled}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${styles.button}`}
            >
              {isProcessing ? (
                <>
                  <LoadingIcon />
                  Processando...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;
