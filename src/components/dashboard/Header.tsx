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

  const isLoansPage = pathname?.includes('/loans');
  const isBudgetsPage = pathname?.includes('/budgets');
  const isDashboard = !isLoansPage && !isBudgetsPage;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">💰 Gastos</h1>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className={`px-3 py-2 text-sm rounded-lg transition ${
              isDashboard
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Dashboard"
          >
            📊
          </Link>
          <Link
            href="/budgets"
            className={`px-3 py-2 text-sm rounded-lg transition ${
              isBudgetsPage
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Orçamentos"
          >
            🎯
          </Link>
          <Link
            href="/loans"
            className={`px-3 py-2 text-sm rounded-lg transition ${
              isLoansPage
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Empréstimos"
          >
            💸
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};
