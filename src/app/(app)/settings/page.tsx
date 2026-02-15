'use client';

import { Topbar } from '@/components/layout/Topbar';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <Topbar 
        title="Configurações"
        subtitle="Gerenciar preferências da aplicação"
      />

      <div className="app-content bg-neutral-50 dark:bg-neutral-900 flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Aparência */}
          <div className="card bg-white dark:bg-neutral-800 p-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Aparência</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Modo Escuro</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Alternar entre temas claro e escuro
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  theme === 'dark'
                    ? 'bg-primary-600'
                    : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notificações */}
          <div className="card bg-white dark:bg-neutral-800 p-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Notificações</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Alertas de Orçamento</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Notificar quando atingir limites
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5"
                />
              </div>

              <hr className="border-neutral-200 dark:border-neutral-700" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Lembretes de Contas</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Notificar sobre vencimentos
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5"
                />
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className="card bg-white dark:bg-neutral-800 p-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Segurança</h3>
            
            <div className="space-y-4">
              <button className="w-full text-left px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                <p className="font-medium text-neutral-900 dark:text-white">Alterar Senha</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Atualize sua senha regularmente</p>
              </button>

              <button className="w-full text-left px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                <p className="font-medium text-neutral-900 dark:text-white">Sessões Ativas</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Gerenciar dispositivos conectados</p>
              </button>
            </div>
          </div>

          {/* Dados */}
          <div className="card bg-white dark:bg-neutral-800 p-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Dados</h3>
            
            <div className="space-y-4">
              <button className="w-full text-left px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                <p className="font-medium text-neutral-900 dark:text-white">Exportar Dados</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Baixar cópia de seus dados</p>
              </button>

              <button className="w-full text-left px-4 py-3 rounded-lg border border-danger-200 dark:border-danger-900 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors">
                <p className="font-medium text-danger-600">Deletar Conta</p>
                <p className="text-sm text-danger-600/80 mt-1">Remover permanentemente sua conta</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
