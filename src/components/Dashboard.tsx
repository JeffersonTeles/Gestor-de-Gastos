
import { ArrowDownRight, ArrowUpRight, Calendar, Download, Eye, EyeOff, FileText, Plus, TrendingUp, Wallet } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../contexts/DataContext';
import { FinancialSummary, TransactionType } from '../types';
import KeyboardShortcuts from './KeyboardShortcuts';
import QuickAddModal from './QuickAddModal';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const Dashboard: React.FC = () => {
  const { transactions, addTransaction, loading, lastError } = useData();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<TransactionType>('expense');
  const [focusMode, setFocusMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [compactMode, setCompactMode] = useState(false);
  const [showPredictions, setShowPredictions] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePeriod, setComparePeriod] = useState<string>('lastMonth');
  const [categoryTargets, setCategoryTargets] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('category_targets');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Agrupar transações por mês
  const monthlyData = useMemo(() => {
    const grouped: Record<string, typeof transactions> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(t);
    });

    // Ordenar meses em ordem decrescente
    return Object.entries(grouped).sort((a, b) => {
      const dateA = new Date(grouped[a[0]][0].date);
      const dateB = new Date(grouped[b[0]][0].date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [transactions]);

  const months = useMemo(() => {
    return monthlyData.map(([month]) => month);
  }, [monthlyData]);

  useEffect(() => {
    try {
      localStorage.setItem('category_targets', JSON.stringify(categoryTargets));
    } catch {
      // ignore
    }
  }, [categoryTargets]);

  // Atalhos de teclado globais
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setFocusMode(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExportCSV();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        setCompactMode(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setShowPredictions(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const selectedTransactions = useMemo(() => {
    let filtered = selectedMonth === 'all' ? transactions : monthlyData.find(([month]) => month === selectedMonth)?.[1] || [];
    if (selectedCategory !== 'all') filtered = filtered.filter(t => t.category === selectedCategory);
    if (selectedType !== 'all') filtered = filtered.filter(t => t.type === selectedType);
    return filtered;
  }, [transactions, monthlyData, selectedMonth, selectedCategory, selectedType]);

  // Calcular summary baseado no filtro selecionado
  const summary: FinancialSummary = useMemo(() => {
    const totalIncome = selectedTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
    const totalExpenses = selectedTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);
    return {
      totalIncome,
      totalExpenses,
      totalBalance: totalIncome - totalExpenses,
    };
  }, [selectedTransactions]);

  const currentMonthKey = useMemo(() => {
    if (selectedMonth !== 'all') return selectedMonth;
    return monthlyData[0]?.[0] || null;
  }, [selectedMonth, monthlyData]);

  const previousMonthKey = useMemo(() => {
    if (!monthlyData.length) return null;
    if (selectedMonth === 'all') return monthlyData[1]?.[0] || null;
    const idx = monthlyData.findIndex(([month]) => month === selectedMonth);
    return idx >= 0 ? (monthlyData[idx + 1]?.[0] || null) : null;
  }, [selectedMonth, monthlyData]);

  const previousSummary = useMemo(() => {
    if (!previousMonthKey) return null;
    const prevTx = monthlyData.find(([month]) => month === previousMonthKey)?.[1] || [];
    const totalIncome = prevTx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
    const totalExpenses = prevTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);
    return {
      totalIncome,
      totalExpenses,
      totalBalance: totalIncome - totalExpenses,
    };
  }, [monthlyData, previousMonthKey]);

  const monthlySummary = useMemo(() => {
    const rows = monthlyData.map(([month, txs]) => {
      const totalIncome = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
      const totalExpenses = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);
      return { month, receitas: totalIncome, despesas: totalExpenses };
    });
    return [...rows].reverse();
  }, [monthlyData]);

  const timeData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const last30Days: Record<string, { date: string; receitas: number; despesas: number }> = {};

    sorted.forEach(t => {
      const dateKey = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!last30Days[dateKey]) last30Days[dateKey] = { date: dateKey, receitas: 0, despesas: 0 };
      if (t.type === 'income') last30Days[dateKey].receitas += t.value;
      else last30Days[dateKey].despesas += t.value;
    });

    return Object.values(last30Days).slice(-10);
  }, [transactions]);

  const categoryData = useMemo(() => {
    return selectedTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc: { name: string; value: number }[], curr) => {
        const existing = acc.find(a => a.name === curr.category);
        if (existing) existing.value += curr.value;
        else acc.push({ name: curr.category, value: curr.value });
        return acc;
      }, [])
      .sort((a, b) => b.value - a.value);
  }, [selectedTransactions]);

  const insights = useMemo(() => {
    const largestExpense = selectedTransactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.value - a.value)[0];

    const topCategory = categoryData[0];

    return {
      largestExpense,
      topCategory,
    };
  }, [selectedTransactions, categoryData]);

  const topCategoryPercent = useMemo(() => {
    if (!insights.topCategory || summary.totalExpenses === 0) return 0;
    return (insights.topCategory.value / summary.totalExpenses) * 100;
  }, [insights.topCategory, summary.totalExpenses]);

  const recentTransactions = useMemo(() => {
    return [...selectedTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [selectedTransactions]);

  const availableCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const advancedStats = useMemo(() => {
    const days = selectedTransactions.length > 0 ? new Set(selectedTransactions.map(t => new Date(t.date).toDateString())).size : 1;
    const avgDailyExpenses = summary.totalExpenses / days;
    const avgDailyIncome = summary.totalIncome / days;
    const savingsRate = summary.totalIncome > 0 ? (summary.totalBalance / summary.totalIncome) * 100 : 0;
    const projectedMonthlyExpenses = avgDailyExpenses * 30;
    
    // Previsão de gastos para próximos 7 dias
    const last7DaysExpenses = selectedTransactions
      .filter(t => t.type === 'expense')
      .slice(-7)
      .reduce((acc, t) => acc + t.value, 0) / 7;
    const predicted7Days = last7DaysExpenses * 7;
    
    return { avgDailyExpenses, avgDailyIncome, savingsRate, projectedMonthlyExpenses, predicted7Days };
  }, [selectedTransactions, summary]);

  const formatDelta = (current: number, previous?: number | null) => {
    if (previous === null || previous === undefined) return null;
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-28 md:h-32 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-80 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>
    );
  }

  const handleExportCSV = () => {
    const header = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    const rows = selectedTransactions.map((t) => [
      t.date,
      t.description,
      t.category,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.value.toFixed(2).replace('.', ',')
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const periodLabel = selectedMonth === 'all' ? 'todos-os-meses' : selectedMonth.replace(/\s+/g, '-');
    link.href = url;
    link.setAttribute('download', `gestor-de-gastos-${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const title = selectedMonth === 'all' ? 'Todos os meses' : selectedMonth;
    const rows = selectedTransactions.slice(0, 20).map((t) => {
      const sign = t.type === 'income' ? '+' : '-';
      return `<tr><td>${new Date(t.date).toLocaleDateString('pt-BR')}</td><td>${t.description}</td><td>${t.category}</td><td>${sign} ${formatCurrency(t.value)}</td></tr>`;
    }).join('');

    const html = `
      <html>
        <head>
          <title>Gestor de Gastos - Relatório</title>
          <style>
            body{font-family:Arial, sans-serif; padding:24px; color:#111;}
            h1{margin:0 0 8px 0;} .muted{color:#666;}
            table{width:100%; border-collapse:collapse; margin-top:16px;}
            th,td{border-bottom:1px solid #eee; padding:8px; text-align:left; font-size:12px;}
            .grid{display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:16px;}
            .card{border:1px solid #eee; border-radius:12px; padding:12px;}
            .strong{font-weight:700;}
          </style>
        </head>
        <body>
          <h1>Relatório Financeiro</h1>
          <div class="muted">Período: ${title}</div>
          <div class="grid">
            <div class="card"><div class="muted">Balanço</div><div class="strong">${formatCurrency(summary.totalBalance)}</div></div>
            <div class="card"><div class="muted">Receitas</div><div class="strong">${formatCurrency(summary.totalIncome)}</div></div>
            <div class="card"><div class="muted">Despesas</div><div class="strong">${formatCurrency(summary.totalExpenses)}</div></div>
          </div>
          <table>
            <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4">Sem transações no período</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const updateTarget = (category: string, value: number) => {
    setCategoryTargets(prev => ({ ...prev, [category]: value }));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 p-6 md:p-7 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-100">Resumo Financeiro</h1>
              {showPredictions && (
                <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-full animate-pulse">
                  IA Ativa
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm md:text-base flex items-center gap-2">
              Acompanhe receitas, despesas e desempenho mensal com visão clara e organizada.
              <kbd className="hidden md:inline-block px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700">Ctrl+K</kbd>
              <span className="hidden md:inline text-xs">foco</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2">
              <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent outline-none text-sm font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer"
              >
                <option value="all">Todos os meses</option>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent outline-none text-sm font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer"
              >
                <option value="all">Todas categorias</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'all' | 'income' | 'expense')}
                className="bg-transparent outline-none text-sm font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer"
              >
                <option value="all">Todos os tipos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
              </select>
            </div>

            {(selectedMonth !== 'all' || selectedCategory !== 'all' || selectedType !== 'all') && (
              <button
                onClick={() => { setSelectedMonth('all'); setSelectedCategory('all'); setSelectedType('all'); }}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all hover:scale-105"
              >
                Limpar filtros
              </button>
            )}

            <button
              onClick={() => { setAddType('expense'); setIsAddModalOpen(true); }}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all hover:scale-105"
            >
              + Despesa
            </button>
            <button
              onClick={() => { setAddType('income'); setIsAddModalOpen(true); }}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all hover:scale-105"
            >
              + Receita
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <Download size={16} />
                Exportar CSV
              </span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <FileText size={16} />
                Exportar PDF
              </span>
            </button>
            <button
              onClick={() => setFocusMode((prev) => !prev)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:scale-105 ${focusMode ? 'border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
            >
              <span className="inline-flex items-center gap-2">
                {focusMode ? <Eye size={16} /> : <EyeOff size={16} />}
                {focusMode ? 'Tudo' : 'Foco'}
              </span>
            </button>
            <button
              onClick={() => setCompactMode((prev) => !prev)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:scale-105 ${compactMode ? 'border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
              title="Ctrl+M"
            >
              <span className="inline-flex items-center gap-2">
                {compactMode ? '📊' : '📈'}
                {compactMode ? 'Normal' : 'Compacto'}
              </span>
            </button>
            <button
              onClick={() => setShowPredictions((prev) => !prev)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:scale-105 ${showPredictions ? 'border-fuchsia-200 dark:border-fuchsia-500/20 bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400' : 'border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
              title="Ctrl+P"
            >
              <span className="inline-flex items-center gap-2">
                ✨ {showPredictions ? 'IA On' : 'IA Off'}
              </span>
            </button>
            <button
              onClick={() => { setAddType('expense'); setIsAddModalOpen(true); }}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                Nova transação
              </span>
            </button>
          </div>
        </div>
      </div>

      {lastError && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl text-sm font-semibold">
          {lastError}
        </div>
      )}

      {/* Cards de Summary com animação */}
      <div className={`grid gap-4 md:gap-6 transition-all ${compactMode ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        <SummaryCard
          title="Balanço"
          amount={summary.totalBalance}
          icon={<Wallet />}
          accent="indigo"
          delta={formatDelta(summary.totalBalance, previousSummary?.totalBalance)}
          deltaLabel={previousMonthKey ? `vs ${previousMonthKey}` : undefined}
          compact={compactMode}
        />
        <SummaryCard
          title="Receitas"
          amount={summary.totalIncome}
          icon={<ArrowUpRight />}
          accent="emerald"
          delta={formatDelta(summary.totalIncome, previousSummary?.totalIncome)}
          deltaLabel={previousMonthKey ? `vs ${previousMonthKey}` : undefined}
          compact={compactMode}
        />
        <SummaryCard
          title="Despesas"
          amount={summary.totalExpenses}
          icon={<ArrowDownRight />}
          accent="rose"
          delta={formatDelta(summary.totalExpenses, previousSummary?.totalExpenses)}
          deltaLabel={previousMonthKey ? `vs ${previousMonthKey}` : undefined}
          compact={compactMode}
        />
        <div className={`p-6 rounded-[2rem] border bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 border-violet-100 dark:border-violet-500/20 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer group ${compactMode ? 'p-4' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
              <TrendingUp size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-sm font-bold opacity-80 uppercase tracking-tight text-violet-600 dark:text-violet-400">Taxa de Economia</span>
          </div>
          <div className="text-2xl md:text-3xl font-black truncate text-violet-600 dark:text-violet-400">
            {advancedStats.savingsRate.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs font-semibold text-violet-500 dark:text-violet-400">
            {advancedStats.savingsRate >= 20 ? 'Excelente desempenho!' : advancedStats.savingsRate >= 10 ? 'Bom desempenho' : 'Pode melhorar'}
          </div>
        </div>
        
        {showPredictions && (
          <div className={`p-6 rounded-[2rem] border bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border-orange-100 dark:border-orange-500/20 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer group animate-fade-in ${compactMode ? 'p-4' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                <span className="text-xl">🔮</span>
              </div>
              <span className="text-sm font-bold opacity-80 uppercase tracking-tight text-orange-600 dark:text-orange-400">Previsão 7 dias</span>
            </div>
            <div className="text-2xl md:text-3xl font-black truncate text-orange-600 dark:text-orange-400">
              {formatCurrency(advancedStats.predicted7Days)}
            </div>
            <div className="mt-2 text-xs font-semibold text-orange-500 dark:text-orange-400 flex items-center gap-1">
              <span className="animate-pulse">✨</span> Baseado em IA
            </div>
          </div>
        )}
      </div>

      {!focusMode && (
        <>
          {/* Estatísticas avançadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Média diária (despesas)</div>
              <div className="mt-2 text-xl font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(advancedStats.avgDailyExpenses)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Projeção mensal: {formatCurrency(advancedStats.projectedMonthlyExpenses)}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Média diária (receitas)</div>
              <div className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(advancedStats.avgDailyIncome)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Potencial mensal: {formatCurrency(advancedStats.avgDailyIncome * 30)}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria líder</div>
              <div className="mt-2 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                {insights.topCategory ? insights.topCategory.name : 'Sem categoria'}
              </div>
              <div className="mt-1 text-lg font-black text-indigo-600 dark:text-indigo-400">
                {insights.topCategory ? formatCurrency(insights.topCategory.value) : formatCurrency(0)}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Período</div>
              <div className="mt-2 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                {currentMonthKey || 'Todos os meses'}
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                {previousMonthKey ? `Comparando com ${previousMonthKey}` : 'Sem comparação disponível'}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alerta</div>
              <div className="mt-2 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                {summary.totalExpenses > summary.totalIncome
                  ? 'Despesas acima das receitas'
                  : topCategoryPercent >= 50
                    ? 'Categoria dominante no período'
                    : 'Fluxo saudável no período'}
              </div>
              <div className={`mt-1 text-lg font-black ${summary.totalExpenses > summary.totalIncome || topCategoryPercent >= 50 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {summary.totalExpenses > summary.totalIncome
                  ? 'Ajuste recomendado'
                  : topCategoryPercent >= 50
                    ? 'Rebalanceamento sugerido'
                    : 'Dentro do esperado'}
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-500" />
                  Evolução Financeira
                </h3>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timeData}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                        color: '#fff'
                      }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
                    <Bar dataKey="despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold mb-6">Distribuição por Categoria</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                      {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                      formatter={(val: number) => formatCurrency(val)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 space-y-2">
                {categoryData.slice(0, 3).map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                      <span className="text-slate-500 dark:text-zinc-400">{cat.name}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comparativo mês a mês */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Comparativo mensal</h3>
              <span className="text-xs font-semibold text-slate-400">receitas vs despesas</span>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySummary} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Legend />
                  <Bar dataKey="receitas" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="despesas" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Últimas transações e ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Últimas transações</h3>
                <span className="text-xs font-semibold text-slate-400">últimos 5</span>
              </div>
              <div className="space-y-4">
                {recentTransactions.length > 0 ? recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{t.description}</div>
                      <div className="text-xs text-slate-400 dark:text-zinc-500">{new Date(t.date).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.value)}
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-slate-500 dark:text-zinc-400">Sem transações no período.</div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Top categorias</h3>
                <span className="text-xs font-semibold text-slate-400">por despesa</span>
              </div>
              <div className="space-y-4">
                {categoryData.slice(0, 5).map((cat) => {
                  const percent = summary.totalExpenses > 0 ? (cat.value / summary.totalExpenses) * 100 : 0;
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-zinc-400">{cat.name}</span>
                        <span className="font-semibold">{formatCurrency(cat.value)}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                {categoryData.length === 0 && (
                  <div className="text-sm text-slate-500 dark:text-zinc-400">Sem despesas para exibir.</div>
                )}
              </div>
            </div>
          </div>

          {/* Metas por categoria */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Metas por categoria</h3>
              <span className="text-xs font-semibold text-slate-400">ajuste seus limites</span>
            </div>
            <div className="space-y-4">
              {categoryData.slice(0, 5).map((cat) => {
                const target = categoryTargets[cat.name] || 0;
                const percent = target > 0 ? Math.min((cat.value / target) * 100, 100) : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-zinc-400">{cat.name}</span>
                      <span className="font-semibold">{formatCurrency(cat.value)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        <div className={`h-full ${percent >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={target}
                        onChange={(e) => updateTarget(cat.name, Number(e.target.value))}
                        className="w-28 px-2 py-1 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-200"
                        placeholder="Meta"
                      />
                    </div>
                  </div>
                );
              })}
              {categoryData.length === 0 && (
                <div className="text-sm text-slate-500 dark:text-zinc-400">Defina metas ao registrar despesas.</div>
              )}
            </div>
          </div>
        </>
      )}

      {focusMode && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 text-sm text-slate-500 dark:text-zinc-400">
          Modo foco ativo: exibindo apenas resumo e ações rápidas.
        </div>
      )}

      {/* Modal */}
      <QuickAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTransaction}
        defaultType={addType}
      />

      {/* Atalhos de teclado */}
      <KeyboardShortcuts />
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  accent: 'indigo' | 'emerald' | 'rose';
  delta?: number | null;
  deltaLabel?: string;
  compact?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon, accent, delta, deltaLabel, compact = false }) => {
  const styles: Record<string, string> = {
    indigo: "bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20",
    emerald: "bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
    rose: "bg-rose-50/50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20"
  };

  const deltaColor = delta === null || delta === undefined
    ? 'text-slate-400 dark:text-zinc-500'
    : delta >= 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-rose-600 dark:text-rose-400';

  return (
    <div className={`${compact ? 'p-4' : 'p-6'} rounded-[2rem] border transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer group ${styles[accent]}`}>
      <div className={`flex items-center gap-3 ${compact ? 'mb-2' : 'mb-4'}`}>
        <div className={`${compact ? 'p-1.5' : 'p-2'} bg-white dark:bg-zinc-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform`}>
          <div className={compact ? 'scale-75' : ''}>{icon}</div>
        </div>
        {!compact && <span className="text-sm font-bold opacity-80 uppercase tracking-tight">{title}</span>}
      </div>
      {compact && <div className="text-xs font-bold opacity-60 uppercase mb-1">{title}</div>}
      <div className={`${compact ? 'text-xl' : 'text-2xl md:text-3xl'} font-black truncate`}>
        {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </div>
      {deltaLabel && !compact && (
        <div className={`mt-2 text-xs font-semibold ${deltaColor}`}>
          {delta === null || delta === undefined ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`} {deltaLabel}
        </div>
      )}
      {compact && delta !== null && delta !== undefined && (
        <div className={`mt-1 text-[10px] font-bold ${deltaColor}`}>
          {delta >= 0 ? '↗' : '↘'} {Math.abs(delta).toFixed(0)}%
        </div>
      )}
    </div>
  );
};

export default Dashboard;
