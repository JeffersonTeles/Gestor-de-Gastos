
import { ArrowDownRight, ArrowUpRight, Calendar, Download, Plus, TrendingUp, Wallet } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../contexts/DataContext';
import { FinancialSummary, TransactionType } from '../types';
import QuickAddModal from './QuickAddModal';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const Dashboard: React.FC = () => {
  const { transactions, addTransaction } = useData();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<TransactionType>('expense');

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

  const selectedTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return monthlyData.find(([month]) => month === selectedMonth)?.[1] || [];
  }, [transactions, monthlyData, selectedMonth]);

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

  const recentTransactions = useMemo(() => {
    return [...selectedTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [selectedTransactions]);

  const formatDelta = (current: number, previous?: number | null) => {
    if (previous === null || previous === undefined) return null;
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 p-6 md:p-7 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-100">Resumo Financeiro</h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm md:text-base">
              Acompanhe receitas, despesas e desempenho mensal com visão clara e organizada.
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

            {selectedMonth !== 'all' && (
              <button
                onClick={() => setSelectedMonth('all')}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Limpar filtro
              </button>
            )}

            <button
              onClick={() => { setAddType('expense'); setIsAddModalOpen(true); }}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              + Despesa
            </button>
            <button
              onClick={() => { setAddType('income'); setIsAddModalOpen(true); }}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
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

      {/* Modal */}
      <QuickAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTransaction}
        defaultType={addType}
      />

      {/* Cards de Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Balanço"
          amount={summary.totalBalance}
          icon={<Wallet />}
          accent="indigo"
          delta={formatDelta(summary.totalBalance, previousSummary?.totalBalance)}
          deltaLabel={previousMonthKey ? `vs ${previousMonthKey}` : undefined}
        />
        <SummaryCard
          title="Receitas"
          amount={summary.totalIncome}
          icon={<ArrowUpRight />}
          accent="emerald"
          delta={formatDelta(summary.totalIncome, previousSummary?.totalIncome)}
          deltaLabel={previousMonthKey ? `vs ${previousMonthKey}` : undefined}
        />
        <SummaryCard
          title="Despesas"
          amount={summary.totalExpenses}
          icon={<ArrowDownRight />}
          accent="rose"
          delta={formatDelta(summary.totalExpenses, previousSummary?.totalExpenses)}
          deltaLabel={previousMonthKey ? `vs ${previousMonthKey}` : undefined}
        />
      </div>

      {/* Insights rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Maior gasto</div>
          <div className="mt-2 text-sm font-semibold text-slate-700 dark:text-zinc-300">
            {insights.largestExpense ? insights.largestExpense.description : 'Sem despesas no período'}
          </div>
          <div className="mt-1 text-lg font-black text-rose-600 dark:text-rose-400">
            {insights.largestExpense ? formatCurrency(insights.largestExpense.value) : formatCurrency(0)}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
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
              : 'Fluxo saudável no período'}
          </div>
          <div className={`mt-1 text-lg font-black ${summary.totalExpenses > summary.totalIncome ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {summary.totalExpenses > summary.totalIncome ? 'Ajuste recomendado' : 'Dentro do esperado'}
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
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon, accent, delta, deltaLabel }) => {
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
    <div className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer group ${styles[accent]}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
        <span className="text-sm font-bold opacity-80 uppercase tracking-tight">{title}</span>
      </div>
      <div className="text-2xl md:text-3xl font-black truncate">
        {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </div>
      {deltaLabel && (
        <div className={`mt-2 text-xs font-semibold ${deltaColor}`}>
          {delta === null || delta === undefined ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`} {deltaLabel}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
