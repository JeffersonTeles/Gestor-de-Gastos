'use client';

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: Toast['type'], message: string, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((type: Toast['type'], message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, type, message, duration };
    
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem = ({ toast, onClose }: ToastItemProps) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-rose-600 text-white';
      case 'warning':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white';
    }
  };

  return (
    <div
      className={`
        glass-panel pointer-events-auto
        min-w-[300px] max-w-md
        rounded-2xl shadow-[0_12px_28px_rgba(0,0,0,0.2)]
        overflow-hidden
        transition-all duration-300
        ${isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
      `}
    >
      {/* Barra de cor */}
      <div className={`h-1.5 ${getColors()}`} />
      
      {/* Conteúdo */}
      <div className="p-4 flex items-start gap-3">
        {/* Ícone */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full
            flex items-center justify-center
            text-lg font-bold
            ${getColors()}
          `}
        >
          {getIcon()}
        </div>

        {/* Mensagem */}
        <p className="flex-1 text-sm font-medium text-[var(--ink)] pt-1">
          {toast.message}
        </p>

        {/* Botão fechar */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};
