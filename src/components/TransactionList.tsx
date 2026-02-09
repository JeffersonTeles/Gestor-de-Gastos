
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronUp, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Category, Transaction, TransactionType } from '../types';
import QuickAddModal from './QuickAddModal';

const TransactionList: React.FC = () => {
  const { transactions, deleteTransaction, addTransaction, updateTransaction, loading, lastError } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Transaction>>({});

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

  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditDraft({ ...transaction });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const updated = {
      ...(editDraft as Transaction),
      id: editingId
    } as Transaction;
    await updateTransaction(updated);
    setEditingId(null);
    setEditDraft({});
  };

  const categories = Object.values(Category);

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-24 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
        <div className="h-32 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
        <div className="h-48 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors pb-12">
      {/* Quick Add Buttons */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 animate-slide-in-up">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-3 bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white py-5 px-6 rounded-2xl font-bold shadow-lg hover:shadow-2xl transition-all active:scale-95 group"
        >
          <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="hidden sm:inline">Despesa</span>
          <span className="sm:hidden">-</span>
        </button>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-3 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-5 px-6 rounded-2xl font-bold shadow-lg hover:shadow-2xl transition-all active:scale-95 group"
        >
          <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="hidden sm:inline">Receita</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      {/* Modal */}
      <QuickAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTransaction}
      />

      {lastError && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl text-sm font-semibold">
          {lastError}
        </div>
      )}

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
                        {monthTransactions.map(transaction => {
                          const isEditing = editingId === transaction.id;

                          return (
                            <tr key={transaction.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="px-6 py-3 text-sm text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                                {isEditing ? (
                                  <input
                                    type="date"
                                    value={editDraft.date || transaction.date}
                                    onChange={(e) => setEditDraft(prev => ({ ...prev, date: e.target.value }))}
                                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                                  />
                                ) : (
                                  new Date(transaction.date).toLocaleDateString('pt-BR')
                                )}
                              </td>
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg ${transaction.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    }`}>
                                    {transaction.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                  </div>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editDraft.description || ''}
                                      onChange={(e) => setEditDraft(prev => ({ ...prev, description: e.target.value }))}
                                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm"
                                    />
                                  ) : (
                                    <span className="font-semibold text-slate-800 dark:text-zinc-200 text-sm truncate">{transaction.description}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap">
                                {isEditing ? (
                                  <select
                                    value={editDraft.category || transaction.category}
                                    onChange={(e) => setEditDraft(prev => ({ ...prev, category: e.target.value as Category }))}
                                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                                  >
                                    {categories.map((cat) => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${transaction.category === Category.Loan ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                                    }`}>
                                    {transaction.category}
                                  </span>
                                )}
                              </td>
                              <td className={`px-6 py-3 text-sm font-bold text-right whitespace-nowrap ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                }`}>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editDraft.value ?? transaction.value}
                                    onChange={(e) => setEditDraft(prev => ({ ...prev, value: Number(e.target.value) }))}
                                    className="w-28 px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm text-right"
                                  />
                                ) : (
                                  <>{transaction.type === 'income' ? '+' : '-'} {transaction.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</>
                                )}
                              </td>
                              <td className="px-6 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={saveEdit}
                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all"
                                      >
                                        <Check size={16} />
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                      >
                                        <X size={16} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => startEdit(transaction)}
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
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
