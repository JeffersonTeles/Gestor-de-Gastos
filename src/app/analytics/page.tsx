'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Gráficos carregados sob demanda
const CategoryBreakdown = dynamic(() => import('@/components/dashboard/CategoryBreakdown').then(mod => ({ default: mod.CategoryBreakdown })));
const MonthComparisonChart = dynamic(() => import('@/components/dashboard/MonthComparisonChart').then(mod => ({ default: mod.MonthComparisonChart })));

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: transactionsLoading } = useTransactions(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Carregando análises...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pb-16">
      <header className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Análises Financeiras</p>
            <h2 className="text-3xl sm:text-4xl font-semibold">Insights dos seus gastos</h2>
            <p className="text-sm text-slate-500">
              Visualize padrões, compare períodos e entenda para onde vai seu dinheiro.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>
              ← Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-6">
        {/* Comparativo Mensal */}
        <MonthComparisonChart transactions={transactions} monthsToShow={6} />

        {/* Breakdown por categoria */}
        <div className="grid lg:grid-cols-2 gap-6">
          <CategoryBreakdown transactions={transactions} type="expense" currentMonth={true} />
          <CategoryBreakdown transactions={transactions} type="income" currentMonth={true} />
        </div>

        {/* Visão anual */}
        <div className="glass-panel rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-[var(--ink)] mb-4">
            📈 Tendência Anual
          </h3>
          <MonthComparisonChart transactions={transactions} monthsToShow={12} />
        </div>
      </main>
    </div>
  );
}
