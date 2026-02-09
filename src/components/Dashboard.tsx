
import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet, Calendar } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../contexts/DataContext';
import { FinancialSummary } from '../types';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const Dashboard: React.FC = () => {
  const { transactions } = useData();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

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

  // Calcular summary baseado no filtro selecionado
  const summary: FinancialSummary = useMemo(() => {
    let filteredTx = transactions;
    
    if (selectedMonth !== 'all') {
      filteredTx = monthlyData.find(([month]) => month === selectedMonth)?.[1] || [];
    }

    const totalIncome = filteredTx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
    const totalExpenses = filteredTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);
    return {
      totalIncome,
      totalExpenses,
      totalBalance: totalIncome - totalExpenses,
    };
  }, [transactions, monthlyData, selectedMonth]);

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
    let filteredTx = transactions;
    
    if (selectedMonth !== 'all') {
      filteredTx = monthlyData.find(([month]) => month === selectedMonth)?.[1] || [];
    }

    return filteredTx
      .filter(t => t.type === 'expense')
      .reduce((acc: { name: string; value: number }[], curr) => {
        const existing = acc.find(a => a.name === curr.category);
        if (existing) existing.value += curr.value;
        else acc.push({ name: curr.category, value: curr.value });
        return acc;
      }, []);
  }, [transactions, monthlyData, selectedMonth]);

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Filtro de Mês */}
      <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-indigo-600 dark:text-indigo-400" />
            <label className="font-bold text-slate-700 dark:text-zinc-300">Período:</label>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 dark:text-zinc-300 font-medium"
          >
            <option value="all">Todos os meses</option>
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          {selectedMonth !== 'all' && (
            <button
              onClick={() => setSelectedMonth('all')}
              className="ml-auto px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 transition-colors"
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      {/* Cards de Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title="Balanço" amount={summary.totalBalance} icon={<Wallet />} accent="indigo" />
        <SummaryCard title="Receitas" amount={summary.totalIncome} icon={<ArrowUpRight />} accent="emerald" />
        <SummaryCard title="Despesas" amount={summary.totalExpenses} icon={<ArrowDownRight />} accent="rose" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800">
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

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800">
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
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  accent: 'indigo' | 'emerald' | 'rose';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon, accent }) => {
  const styles: Record<string, string> = {
    indigo: "bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20",
    emerald: "bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
    rose: "bg-rose-50/50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20"
  };

  return (
    <div className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.02] ${styles[accent]}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">{icon}</div>
        <span className="text-sm font-bold opacity-80 uppercase tracking-tight">{title}</span>
      </div>
      <div className="text-2xl md:text-3xl font-black truncate">
        {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </div>
    </div>
  );
};

export default Dashboard;

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800">
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

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800">
          <h3 className="text-lg font-bold mb-6">Distribuição</h3>
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
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  accent: 'indigo' | 'emerald' | 'rose';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon, accent }) => {
  const styles: Record<string, string> = {
    indigo: "bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20",
    emerald: "bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
    rose: "bg-rose-50/50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20"
  };

  return (
    <div className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.02] ${styles[accent]}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">{icon}</div>
        <span className="text-sm font-bold opacity-80 uppercase tracking-tight">{title}</span>
      </div>
      <div className="text-2xl md:text-3xl font-black truncate">
        {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </div>
    </div>
  );
};

export default Dashboard;
