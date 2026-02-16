'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
const BarChart = dynamic(() => import('@/components/charts/BarChart').then(mod => ({ default: mod.BarChart })));
const LineChart = dynamic(() => import('@/components/charts/LineChart').then(mod => ({ default: mod.LineChart })));
const PieChart = dynamic(() => import('@/components/charts/PieChart').then(mod => ({ default: mod.PieChart })));
const InsightsCard = dynamic(() => import('@/components/analytics/InsightsCard').then(mod => ({ default: mod.InsightsCard })));
const PredictionsCard = dynamic(() => import('@/components/analytics/PredictionsCard').then(mod => ({ default: mod.PredictionsCard })));
const ImportModal = dynamic(() => import('@/components/dashboard/ImportModal').then(mod => ({ default: mod.ImportModal })));
const WeeklyReview = dynamic(() => import('@/components/dashboard/WeeklyReview').then(mod => ({ default: mod.WeeklyReview })));
const WhatsAppIntegration = dynamic(() => import('@/components/integrations/WhatsAppIntegration').then(mod => ({ default: mod.WhatsAppIntegration })));
const SmartAlerts = dynamic(() => import('@/components/dashboard/SmartAlerts').then(mod => ({ default: mod.SmartAlerts })));
const QuickAddFAB = dynamic(() => import('@/components/mobile/QuickAddFAB').then(mod => ({ default: mod.QuickAddFAB })));

// Componentes críticos carregados normalmente
import { QuickActions } from '@/components/dashboard/QuickActions';
import { QuickFilters } from '@/components/dashboard/QuickFilters';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { TransactionModal } from '@/components/dashboard/TransactionModal';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import {
    AdvancedFilters,
    EmptyTransactions,
    ExportButton,
    MetricCard,
    SkeletonMetricCard,
    SkeletonTable,
    TransactionCard
} from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { useInsights } from '@/hooks/useInsights';
import { usePredictions } from '@/hooks/usePredictions';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: transactionsLoading, addTransaction } = useTransactions(user?.id);
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    total: 0,
    income: 0,
    expense: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  // Insights e Previsões
  const insights = useInsights(transactions, stats.income);
  const predictions = usePredictions(transactions);

  // Preparar dados para gráficos
  const chartData = useMemo(() => {
    // Paleta de cores para gráficos
    const colors = [
      '#3B82F6', // blue-500
      '#10B981', // green-500
      '#F59E0B', // yellow-500
      '#EF4444', // red-500
      '#8B5CF6', // purple-500
      '#EC4899', // pink-500
      '#14B8A6', // teal-500
      '#F97316', // orange-500
    ];

    // Dados para PieChart (despesas por categoria)
    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((tx: any) => tx.type === 'expense')
      .forEach((tx: any) => {
        const category = tx.category || 'Outros';
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(tx.amount);
      });

    const pieData = Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));

    // Dados para LineChart (tendência mensal)
    const monthlyData: Record<string, number> = {};
    transactions.forEach((tx: any) => {
      const month = new Date(tx.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (tx.type === 'expense') {
        monthlyData[month] = (monthlyData[month] || 0) + Number(tx.amount);
      }
    });

    const lineData = Object.entries(monthlyData)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([label, value]) => ({ label, value }));

    // Dados para BarChart (receitas vs despesas por mês)
    const monthlyComparison: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((tx: any) => {
      const month = new Date(tx.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!monthlyComparison[month]) {
        monthlyComparison[month] = { income: 0, expense: 0 };
      }
      monthlyComparison[month][tx.type === 'income' ? 'income' : 'expense'] += Number(tx.amount);
    });

    const barData = Object.entries(monthlyComparison)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([label, values]) => ({ label, ...values }));

    return { pieData, lineData, barData };
  }, [transactions]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  // Lembrete de revisão semanal
  useEffect(() => {
    if (!user || !transactions.length) return;

    const lastReview = localStorage.getItem('lastWeeklyReview');
    if (!lastReview) {
      // Primeira vez - perguntar depois de 7 dias
      return;
    }

    const lastReviewDate = new Date(lastReview);
    const daysSinceReview = (Date.now() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24);

    // Mostrar lembrete a cada 7 dias
    if (daysSinceReview >= 7) {
      setTimeout(() => {
        showToast('info', '📅 Hora da revisão semanal! Clique no botão abaixo.', 10000);
      }, 3000);
    }
  }, [user, transactions, showToast]);

  useEffect(() => {
    if (!user) return;
    let income = 0;
    let expense = 0;
    const tagsSet = new Set<string>();
    
    // Aplicar filtros de período e tipo
    let filtered = [...transactions];
    
    // Filtro de período
    const now = new Date();
    if (selectedPeriod === 'today') {
      const today = now.toISOString().split('T')[0];
      filtered = filtered.filter((tx: any) => tx.date.startsWith(today));
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((tx: any) => new Date(tx.date) >= weekAgo);
    } else if (selectedPeriod === 'month') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filtered = filtered.filter((tx: any) => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      });
    } else if (selectedPeriod === 'year') {
      const currentYear = now.getFullYear();
      filtered = filtered.filter((tx: any) => new Date(tx.date).getFullYear() === currentYear);
    }
    
    // Filtro de tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter((tx: any) => tx.type === selectedType);
    }
    
    filtered.forEach((tx: any) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amount;
      } else {
        expense += amount;
      }
      
      // Coletar todas as tags
      if (tx.tags && Array.isArray(tx.tags)) {
        tx.tags.forEach((tag: string) => tagsSet.add(tag));
      }
    });

    setStats({
      total: income - expense,
      income,
      expense,
    });
    
    setAllTags(Array.from(tagsSet));
    setFilteredTransactions(filtered);
  }, [transactions, user, selectedPeriod, selectedType]);

  if (authLoading || transactionsLoading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="app-main-wrapper">
          <Topbar title="Dashboard" subtitle="Carregando..." />
          <div className="app-content bg-neutral-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
            </div>
            <div className="card bg-white">
              <SkeletonTable rows={8} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="mb-4">Você precisa entrar para acessar o dashboard.</p>
          <Link href="/auth/login">
            <Button variant="primary" size="sm">Ir para login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddTransaction = async (data: any) => {
    setIsSaving(true);
    try {
      await addTransaction({
        type: data.type,
        amount: Number(data.amount) || 0,
        category: data.category,
        description: data.description,
        date: data.date,
        currency: 'BRL',
        tags: data.tags || [],
        notes: data.notes || null,
      });
      setIsModalOpen(false);
      showToast(
        'success',
        `${data.type === 'income' ? 'Receita' : 'Despesa'} de ${formatCurrency(Number(data.amount))} adicionada com sucesso!`
      );
    } catch (error: any) {
      showToast('error', error.message || 'Erro ao salvar transação');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFilter = (filters: any) => {
    let filtered = [...transactions];

    // Filtro de texto
    if (filters.text) {
      const search = filters.text.toLowerCase();
      filtered = filtered.filter((tx: any) => 
        tx.description?.toLowerCase().includes(search) ||
        tx.category?.toLowerCase().includes(search) ||
        tx.tags?.some((tag: string) => tag.toLowerCase().includes(search))
      );
    }

    // Filtro de tipo
    if (filters.type !== 'all') {
      filtered = filtered.filter((tx: any) => tx.type === filters.type);
    }

    // Filtro de categorias
    if (filters.categories.length > 0) {
      filtered = filtered.filter((tx: any) => 
        filters.categories.includes(tx.category)
      );
    }

    // Filtro de tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter((tx: any) => 
        tx.tags?.some((tag: string) => filters.tags.includes(tag))
      );
    }

    // Filtro de data
    if (filters.dateFrom) {
      filtered = filtered.filter((tx: any) => tx.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter((tx: any) => tx.date <= filters.dateTo);
    }

    // Filtro de valor
    if (filters.amountMin) {
      filtered = filtered.filter((tx: any) => 
        Number(tx.amount) >= Number(filters.amountMin)
      );
    }
    if (filters.amountMax) {
      filtered = filtered.filter((tx: any) => 
        Number(tx.amount) <= Number(filters.amountMax)
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleBulkImport = async (transactions: any[]) => {
    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const tx of transactions) {
      try {
        await addTransaction({
          type: tx.type,
          amount: tx.amount,
          category: tx.category || 'Importado',
          description: tx.description,
          date: tx.date,
          currency: 'BRL',
          tags: ['importado'],
        });
        successCount++;
      } catch (error) {
        errorCount++;
        console.error('Erro ao importar transação:', error);
      }
    }

    setIsSaving(false);
    
    if (errorCount === 0) {
      showToast('success', `${successCount} transações importadas com sucesso!`);
    } else {
      showToast('warning', `${successCount} importadas, ${errorCount} falharam`);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      
      <div className="app-main-wrapper">
        <Topbar 
          title="Dashboard"
          subtitle="Visão geral das suas finanças"
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary text-sm"
            >
              + Nova Transação
            </button>
          }
        />

        <div className="app-content bg-neutral-50 max-w-full overflow-x-hidden">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 animate-fade-in">
            <MetricCard
              title="Saldo Total"
              value={formatCurrency(Math.abs(stats.total))}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color={stats.total >= 0 ? 'success' : 'danger'}
            />

            <MetricCard
              title="Receitas"
              value={formatCurrency(stats.income)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              color="success"
            />

            <MetricCard
              title="Despesas"
              value={formatCurrency(stats.expense)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              }
              color="danger"
            />

            <MetricCard
              title="Transações"
              value={filteredTransactions.length.toString()}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              color="warning"
            />
          </div>

          {/* Filtros Rápidos */}
          <div className="mb-6 sm:mb-8">
            <QuickFilters 
              onPeriodChange={setSelectedPeriod}
              onTypeChange={setSelectedType}
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setIsWeeklyReviewOpen(true)}
              className="btn-secondary text-sm"
            >
              📅 Revisão Semanal
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="btn-secondary text-sm"
            >
              📥 Importar Dados
            </button>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="btn-secondary text-sm"
            >
              🔍 Buscar
            </button>
          </div>

          {/* Alertas inteligentes */}
          <SmartAlerts
            userId={user.id}
            transactions={transactions}
            onViewBudgets={() => router.push('/budgets')}
          />

          {/* Insights Automáticos */}
          {insights.length > 0 && (
            <div className="mt-8">
              <InsightsCard insights={insights.slice(0, 4)} />
            </div>
          )}

          {/* Gráficos Interativos */}
          {transactions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">📊 Análise Visual</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico de Pizza - Despesas por Categoria */}
                <div className="card">
                  <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                    Despesas por Categoria
                  </h4>
                  {chartData.pieData.length > 0 ? (
                    <PieChart data={chartData.pieData} />
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-sm text-neutral-500">
                      Sem despesas para exibir
                    </div>
                  )}
                </div>

                {/* Gráfico de Linha - Tendência */}
                <div className="card lg:col-span-2">
                  <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                    Tendência de Gastos
                  </h4>
                  {chartData.lineData.length > 0 ? (
                    <LineChart data={chartData.lineData} />
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-sm text-neutral-500">
                      Sem dados para exibir
                    </div>
                  )}
                </div>
              </div>

              {/* Gráfico de Barras - Receitas vs Despesas */}
              <div className="card mt-6">
                <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                  Receitas vs Despesas
                </h4>
                {chartData.barData.length > 0 ? (
                  <BarChart data={chartData.barData} />
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-sm text-neutral-500">
                    Sem dados para comparação
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Previsões */}
          {predictions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">🔮 Previsões Financeiras</h3>
              <PredictionsCard predictions={predictions} />
            </div>
          )}

          {/* Integração WhatsApp */}
          <div className="mt-8">
            <WhatsAppIntegration />
          </div>

          {/* Transações Recentes */}
          <div className="card bg-white mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Transações Recentes</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Últimas movimentações registradas</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AdvancedFilters
                  onFilter={(filters) => {
                    // Aplicar filtros aqui
                    console.log('Filtros aplicados:', filters);
                  }}
                  categories={['Alimentação', 'Transporte', 'Saúde', 'Lazer']}
                  tags={allTags}
                />
                <ExportButton
                  data={filteredTransactions}
                  filename={`transacoes-${new Date().toISOString().split('T')[0]}`}
                  type="csv"
                />
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-primary text-sm"
                >
                  + Nova Transação
                </button>
              </div>
            </div>

            {transactions.length === 0 ? (
              <EmptyTransactions onAddTransaction={() => setIsModalOpen(true)} />
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto -mx-6">
                  <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-700/50 border-y border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12">
                        <EmptyTransactions onAddTransaction={() => setIsModalOpen(true)} />
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.slice(0, 10).map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">{tx.description}</p>
                          {tx.tags && tx.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {tx.tags.slice(0, 2).map((tag: string) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{tx.category}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                              tx.type === 'income'
                                ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                                : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
                            }`}
                          >
                            {tx.type === 'income' ? 'Receita' : 'Despesa'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right text-sm font-semibold ${
                          tx.type === 'income' ? 'text-success-600' : 'text-danger-600'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                          {new Date(tx.date).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredTransactions.slice(0, 10).map((tx: any) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                />
              ))}
            </div>
            </>
            )}

            {filteredTransactions.length > 10 && (
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Mostrando 10 de {filteredTransactions.length} transações
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTransaction}
        loading={isSaving}
        defaultType={modalType}
      />

      <QuickActions
        onNewIncome={() => {
          setModalType('income');
          setIsModalOpen(true);
        }}
        onNewExpense={() => {
          setModalType('expense');
          setIsModalOpen(true);
        }}
        onNewBill={() => {
          // TODO: Abrir modal de nova conta
        }}
        onNewBudget={() => {
          // TODO: Abrir modal de novo orçamento
        }}
        onSearch={() => setIsSearchOpen(true)}
      />

      <SearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onFilter={handleFilter}
        availableTags={allTags}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleBulkImport}
      />

      <WeeklyReview
        isOpen={isWeeklyReviewOpen}
        onClose={() => setIsWeeklyReviewOpen(false)}
        transactions={transactions}
      />

      {/* Botão flutuante para adicionar transações rapidamente no mobile */}
      <QuickAddFAB
        onAddIncome={() => {
          setModalType('income');
          setIsModalOpen(true);
        }}
        onAddExpense={() => {
          setModalType('expense');
          setIsModalOpen(true);
        }}
      />
    </div>
  );
}
