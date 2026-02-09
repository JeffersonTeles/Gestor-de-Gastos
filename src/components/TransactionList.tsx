
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronUp, Edit3, Search, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Category, TransactionType } from '../types';

const TransactionList: React.FC = () => {
  const { transactions, deleteTransaction } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const filteredAndGrouped = useMemo(() => {
    const filtered = transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesType;
    });

    // Agrupar por mês
    const grouped: Record<string, typeof filtered> = {};
    filtered.forEach(t => {
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
  }, [transactions, searchTerm, filterType]);

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  const calculateMonthTotals = (txs: typeof transactions) => {
    const income = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);
    return { income, expense, balance: income - expense };
  };

  const categories = Object.values(Category);

  return (
    <div className="space-y-6 transition-colors pb-12">
      <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row gap-4 items-center sticky top-0 z-10">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm dark:text-zinc-200"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
          className="w-full md:w-32 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 dark:text-zinc-300"
        >
          <option value="all">Todos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </select>
      </div>

      {filteredAndGrouped.length > 0 ? (
        filteredAndGrouped.map(([month, monthTransactions]) => {
          const { income, expense, balance } = calculateMonthTotals(monthTransactions);
          const isExpanded = expandedMonths.has(month);

          return (
            <div key={month} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden">
              <button
                onClick={() => toggleMonth(month)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group"
              >
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2 capitalize">
                    {month}
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-xs md:text-sm">
                    <div>
                      <span className="text-slate-600 dark:text-zinc-500">Receitas: </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-zinc-500">Despesas: </span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        -{expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-zinc-500">Saldo: </span>
                      <span className={`font-bold ${balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
                        {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-zinc-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 dark:bg-zinc-800/50">
                        <tr>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Data</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Descrição</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Categoria</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-right">Valor</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {monthTransactions.map(transaction => (
                          <tr key={transaction.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="px-6 py-3 text-sm text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                              {new Date(transaction.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${transaction.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  }`}>
                                  {transaction.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-zinc-200 text-sm truncate">{transaction.description}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${transaction.category === Category.Loan ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                                }`}>
                                {transaction.category}
                              </span>
                            </td>
                            <td className={`px-6 py-3 text-sm font-bold text-right whitespace-nowrap ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                              {transaction.type === 'income' ? '+' : '-'} {transaction.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {/* TODO: Implementar edição */}}
                                  className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={() => deleteTransaction(transaction.id)}
                                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 text-center">
          <p className="text-slate-500 dark:text-zinc-500 italic">Nenhuma transação encontrada.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
