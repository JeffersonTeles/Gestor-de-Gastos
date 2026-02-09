import { Keyboard, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const KeyboardShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && (e.shiftKey || e.key === '/')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const shortcuts = [
    { keys: ['Ctrl', 'K'], description: 'Alternar modo foco' },
    { keys: ['Ctrl', 'E'], description: 'Exportar para CSV' },
    { keys: ['Ctrl', 'M'], description: 'Modo compacto/normal' },
    { keys: ['Ctrl', 'P'], description: 'Previsões com IA' },
    { keys: ['Ctrl', 'N'], description: 'Nova transação' },
    { keys: ['?'], description: 'Mostrar atalhos' },
    { keys: ['Esc'], description: 'Fechar modais' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl hover:scale-110 transition-all group"
        title="Atalhos de teclado (?)"
      >
        <Keyboard size={24} className="group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-8 max-w-2xl w-full mx-4 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
              <Keyboard size={28} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-100">Atalhos de Teclado</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Navegue mais rápido pelo sistema</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                {shortcut.description}
              </span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, i) => (
                  <kbd
                    key={i}
                    className="px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg shadow-sm"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Pressione <kbd className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700 font-mono">?</kbd> ou <kbd className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700 font-mono">Esc</kbd> para alternar este painel
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
