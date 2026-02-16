'use client';

import { useState } from 'react';

interface QuickAddFABProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export const QuickAddFAB = ({ onAddIncome, onAddExpense }: QuickAddFABProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 z-[99] lg:hidden animate-fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* FAB Principal */}
      <div className="lg:hidden fixed bottom-20 right-4 z-[100]">
        {/* Ações Expandidas */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-3 animate-scale-in">
            <button
              onClick={() => {
                onAddIncome();
                setIsExpanded(false);
              }}
              className="flex items-center gap-3 bg-success-500 text-white px-4 py-3 rounded-full shadow-lg hover:bg-success-600 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="font-medium">Receita</span>
            </button>
            
            <button
              onClick={() => {
                onAddExpense();
                setIsExpanded(false);
              }}
              className="flex items-center gap-3 bg-danger-500 text-white px-4 py-3 rounded-full shadow-lg hover:bg-danger-600 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              <span className="font-medium">Despesa</span>
            </button>
          </div>
        )}

        {/* Botão Principal */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-14 h-14 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl transition-all ${
            isExpanded ? 'rotate-45' : ''
          }`}
          aria-label="Adicionar transação"
        >
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </>
  );
};
