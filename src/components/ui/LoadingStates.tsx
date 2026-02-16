'use client';

import { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  type?: 'save' | 'load' | 'sync';
}

export const LoadingOverlay = ({
  isLoading,
  message = 'Carregando...',
  type = 'load',
}: LoadingOverlayProps) => {
  const [showDelayed, setShowDelayed] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Só mostra depois de 200ms para evitar flash em operações rápidas
      const timer = setTimeout(() => setShowDelayed(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowDelayed(false);
    }
  }, [isLoading]);

  if (!showDelayed) return null;

  const icons = {
    save: (
      <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    load: (
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    ),
    sync: (
      <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-2xl max-w-sm mx-4 animate-scale-in">
        <div className="flex flex-col items-center gap-4">
          <div className="text-primary-600 dark:text-primary-400">{icons[type]}</div>
          <p className="text-lg font-semibold text-neutral-900 dark:text-white text-center">
            {message}
          </p>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary-600 h-full rounded-full animate-progress"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader para Cards
export const CardSkeleton = () => (
  <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
      <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
    </div>
    <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-2"></div>
    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
  </div>
);

// Skeleton Loader para Tabela
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3 animate-pulse">
    {[...Array(rows)].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
      >
        <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
        </div>
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
      </div>
    ))}
  </div>
);

// Toast de sucesso/erro
interface ToastProps {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast = ({ show, message, type, onClose }: ToastProps) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const styles = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-danger-50 border-danger-200 text-danger-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800',
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-lg ${styles[type]}`}>
        {icons[type]}
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
