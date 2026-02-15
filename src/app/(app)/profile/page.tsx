'use client';

import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <>
      <Topbar 
        title="Meu Perfil"
        subtitle="Gerenciar informações pessoais"
      />

      <div className="app-content bg-neutral-50 dark:bg-neutral-900 flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="card bg-white dark:bg-neutral-800 p-6">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-2xl">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {user?.email?.split('@')[0] || 'Usuário'}
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Informações da Conta</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Email</label>
                    <p className="text-sm text-neutral-900 dark:text-white mt-1">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Nome de Usuário</label>
                    <p className="text-sm text-neutral-900 dark:text-white mt-1">{user?.email?.split('@')[0]}</p>
                  </div>
                </div>
              </div>

              <hr className="border-neutral-200 dark:border-neutral-700" />

              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Preferências</h3>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Editar Perfil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
