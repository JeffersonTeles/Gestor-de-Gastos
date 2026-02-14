'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Header = () => {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut();
  };

  if (!user) return null;

  const isBillsPage = pathname?.startsWith('/bills');
  const isLoansPage = pathname?.startsWith('/loans');
  const isBudgetsPage = pathname?.startsWith('/budgets');
  const isAnalyticsPage = pathname?.startsWith('/analytics');
  const isDashboard = pathname === '/' || pathname?.startsWith('/dashboard');

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              G
            </div>
            <div>
              <span className="text-xl font-bold text-[var(--ink)]">Gestor de Gastos</span>
              <p className="text-xs text-slate-500">Dashboard Financeiro</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${
                isDashboard
                  ? 'text-teal-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/analytics"
              className={`text-sm font-medium transition-colors ${
                isAnalyticsPage
                  ? 'text-teal-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Análises
            </Link>
            <Link
              href="/budgets"
              className={`text-sm font-medium transition-colors ${
                isBudgetsPage
                  ? 'text-teal-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Orçamentos
            </Link>
            <Link
              href="/bills"
              className={`text-sm font-medium transition-colors ${
                isBillsPage
                  ? 'text-teal-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contas
            </Link>
            <Link
              href="/loans"
              className={`text-sm font-medium transition-colors ${
                isLoansPage
                  ? 'text-teal-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Empréstimos
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
