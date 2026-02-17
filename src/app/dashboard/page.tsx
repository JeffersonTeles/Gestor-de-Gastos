'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
const ImportModal = dynamic(() => import('@/components/dashboard/ImportModal').then(mod => ({ default: mod.ImportModal })));
const WeeklyReview = dynamic(() => import('@/components/dashboard/WeeklyReview').then(mod => ({ default: mod.WeeklyReview })));
const SmartAlerts = dynamic(() => import('@/components/dashboard/SmartAlerts').then(mod => ({ default: mod.SmartAlerts })));

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

  // Gráficos removidos - componentes deletados durante limpeza

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

          {/* 🔥 LAYOUT 2 COLUNAS DESKTOP */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* ========== COLUNA ESQUERDA: Análises e Gráficos (60%) ========== */}
            <div className="xl:col-span-7 space-y-6">
              
              {/* Filtros Rápidos */}
              <QuickFilters 
                onPeriodChange={setSelectedPeriod}
                onTypeChange={setSelectedType}
              />

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
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

              {/* Análises e gráficos futuros aqui */}
            </div>

            {/* ========== COLUNA DIREITA: Transações Recentes (40%) ========== */}
            <div className="xl:col-span-5">
              <div className="xl:sticky xl:top-24 space-y-6">
                {/* Lista de Transações */}
                <div className="card bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Transações Recentes</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {filteredTransactions.length} movimentações
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AdvancedFilters
                        onFilter={handleFilter}
                        categories={['Alimentação', 'Transporte', 'Saúde', 'Lazer']}
                        tags={allTags}
                      />
                      <ExportButton
                        data={filteredTransactions}
                        filename={`transacoes-${new Date().toISOString().split('T')[0]}`}
                        type="csv"
                      />
                    </div>
                  </div>

                  {transactions.length === 0 ? (
                    <EmptyTransactions onAddTransaction={() => setIsModalOpen(true)} />
                  ) : (
                    <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-2">
                      {filteredTransactions.length === 0 ? (
                        <EmptyTransactions onAddTransaction={() => setIsModalOpen(true)} />
                      ) : (
                        filteredTransactions.slice(0, 20).map((tx: any) => (
                          <TransactionCard
                            key={tx.id}
                            transaction={tx}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {filteredTransactions.length > 20 && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 text-center">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Mostrando 20 de {filteredTransactions.length} transações
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

      {/* Mobile FAB removido - usar botões na header */}
    </div>
  );
}
