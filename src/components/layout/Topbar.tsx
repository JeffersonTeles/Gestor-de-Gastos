'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBreadcrumbs?: boolean;
}

export const Topbar = ({ title, subtitle, actions, showBreadcrumbs = true }: TopbarProps) => {
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [period, setPeriod] = useState('month');

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="app-topbar bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 backdrop-blur-sm bg-white/95 dark:bg-neutral-800/95">
      <div className="h-full px-6 flex flex-col justify-center gap-2">
        <div className="flex items-center justify-between gap-4">
          {/* Title Section */}
          <div className="flex-1">
            {showBreadcrumbs && <Breadcrumbs />}
            {title && (
              <div className="mt-1">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Period Filter */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600">
              <svg className="w-4 h-4 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="week">Esta semana</option>
                <option value="month">Este mês</option>
                <option value="quarter">Este trimestre</option>
                <option value="year">Este ano</option>
              </select>
            </div>

            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xl z-50 animate-scale-in">
                  <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">Notificações</h3>
                  </div>
                  <div className="p-2 max-h-96 overflow-y-auto">
                    <div className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg cursor-pointer">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">Orçamento de Alimentação</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Você atingiu 80% do limite mensal</p>
                      <p className="text-xs text-neutral-400 mt-1">Há 2 horas</p>
                    </div>
                    <div className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg cursor-pointer">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">Conta vencendo</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Internet vence em 3 dias</p>
                      <p className="text-xs text-neutral-400 mt-1">Há 5 horas</p>
                    </div>
                  </div>
                  <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium w-full text-center">
                      Ver todas
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xl z-50 animate-scale-in">
                  <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{user?.email?.split('@')[0]}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Meu perfil
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Configurações
                    </button>
                  </div>
                  <div className="p-2 border-t border-neutral-200 dark:border-neutral-700">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Actions */}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
