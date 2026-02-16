'use client';

import { useEffect, useState } from 'react';

interface QuickActionsProps {
  onNewIncome: () => void;
  onNewExpense: () => void;
  onNewBill: () => void;
  onNewBudget: () => void;
  onSearch: () => void;
}

export const QuickActions = ({
  onNewIncome,
  onNewExpense,
  onNewBill,
  onNewBudget,
  onSearch,
}: QuickActionsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N = Nova despesa
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onNewExpense();
      }
      // Ctrl/Cmd + I = Nova receita
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        onNewIncome();
      }
      // Ctrl/Cmd + B = Nova conta
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        onNewBill();
      }
      // Ctrl/Cmd + K = Busca
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onSearch();
      }
      // ESC = Fechar menu
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isExpanded, onNewExpense, onNewIncome, onNewBill, onSearch]);

  const actions = [
    {
      id: 'expense',
      label: 'Nova Despesa',
      icon: '💸',
      shortcut: 'Ctrl+N',
      color: 'from-red-500 to-rose-600',
      hoverColor: 'hover:from-red-600 hover:to-rose-700',
      onClick: onNewExpense,
    },
    {
      id: 'income',
      label: 'Nova Receita',
      icon: '💰',
      shortcut: 'Ctrl+I',
      color: 'from-emerald-500 to-green-600',
      hoverColor: 'hover:from-emerald-600 hover:to-green-700',
      onClick: onNewIncome,
    },
    {
      id: 'bill',
      label: 'Nova Conta',
      icon: '📋',
      shortcut: 'Ctrl+B',
      color: 'from-blue-500 to-indigo-600',
      hoverColor: 'hover:from-blue-600 hover:to-indigo-700',
      onClick: onNewBill,
    },
    {
      id: 'budget',
      label: 'Novo Orçamento',
      icon: '🎯',
      shortcut: '',
      color: 'from-purple-500 to-violet-600',
      hoverColor: 'hover:from-purple-600 hover:to-violet-700',
      onClick: onNewBudget,
    },
    {
      id: 'search',
      label: 'Buscar',
      icon: '🔍',
      shortcut: 'Ctrl+K',
      color: 'from-amber-500 to-orange-600',
      hoverColor: 'hover:from-amber-600 hover:to-orange-700',
      onClick: onSearch,
    },
  ];

  return (
    <>
      {/* Overlay para fechar ao clicar fora */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Container de ações - Apenas Desktop */}
      <div className="hidden lg:flex fixed bottom-6 right-6 z-50 flex-col items-end gap-3">
        {/* Botões de ação - aparecem quando expandido */}
        <div
          className={`flex flex-col-reverse gap-3 transition-all duration-300 ${
            isExpanded
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {actions.map((action, index) => (
            <div
              key={action.id}
              className="flex items-center gap-3 group"
              style={{
                transitionDelay: isExpanded ? `${index * 40}ms` : '0ms',
              }}
              onMouseEnter={() => setShowTooltip(action.id)}
              onMouseLeave={() => setShowTooltip(null)}
            >
              {/* Label com atalho */}
              <div
                className={`glass-panel px-3 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                  showTooltip === action.id
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-2 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--ink)]">
                    {action.label}
                  </span>
                  {action.shortcut && (
                    <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded">
                      {action.shortcut}
                    </kbd>
                  )}
                </div>
              </div>

              {/* Botão da ação */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setIsExpanded(false);
                }}
                className={`
                  relative h-14 w-14 rounded-full
                  bg-gradient-to-r ${action.color} ${action.hoverColor}
                  shadow-[0_8px_16px_rgba(0,0,0,0.15)]
                  hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)]
                  hover:scale-105
                  active:scale-95
                  transition-all duration-200
                  flex items-center justify-center
                  text-2xl
                `}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>

        {/* Botão principal FAB */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            relative h-16 w-16 rounded-full
            bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500
            hover:from-teal-700 hover:via-teal-600 hover:to-emerald-600
            shadow-[0_12px_28px_rgba(13,148,136,0.4)]
            hover:shadow-[0_16px_36px_rgba(13,148,136,0.5)]
            hover:scale-105
            active:scale-95
            transition-all duration-300
            flex items-center justify-center
            text-white text-3xl font-bold
            z-50
            ${isExpanded ? 'rotate-45' : 'rotate-0'}
          `}
          aria-label="Ações rápidas"
          aria-expanded={isExpanded}
        >
          <span className="select-none">+</span>
        </button>

        {/* Indicador de atalhos */}
        {!isExpanded && (
          <div className="absolute -top-2 -left-2 glass-panel px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="text-xs font-medium text-[var(--ink)]">
              Atalhos disponíveis
            </span>
          </div>
        )}
      </div>
    </>
  );
};
