
import React, { useMemo } from 'react';
import { Transaction, Category } from '../types';
import { Landmark, ArrowRight, Calendar, AlertCircle, TrendingDown } from 'lucide-react';

interface LoanDashboardProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
}

export const LoanDashboard: React.FC<LoanDashboardProps> = ({ transactions, onEdit }) => {
  const loans = useMemo(() => 
    transactions.filter(t => t.category === Category.Loan), 
  [transactions]);

  const stats = useMemo(() => {
    const totalDebt = loans
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.value, 0);
    const totalPaid = loans
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.value, 0);
    
    return { totalDebt, totalPaid, count: loans.length };
  }, [loans]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-rose-500 to-orange-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-rose-100 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <Landmark size={24} />
            </div>
            <span className="font-bold uppercase tracking-widest text-xs opacity-80">Dívida Total em Empréstimos</span>
          </div>
          <div className="text-4xl font-black mb-2">
            {stats.totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <p className="text-rose-100 text-sm font-medium flex items-center gap-2">
            <AlertCircle size={14} />
            {stats.count} registros vinculados
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
          <h3 className="text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-xs mb-4">Saúde dos Empréstimos</h3>
          <div className="flex items-end gap-2 mb-6">
            <div className="text-3xl font-black text-slate-800 dark:text-white">Análise de Débito</div>
            <TrendingDown className="text-rose-500 mb-1" size={24} />
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
             <div className="bg-rose-500 h-full w-full"></div>
          </div>
          <p className="mt-4 text-xs text-slate-400 dark:text-zinc-500 leading-relaxed">
            Considere amortizar juros altos primeiro para reduzir o impacto mensal no seu orçamento.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b dark:border-zinc-800 flex justify-between items-center">
          <h3 className="text-xl font-bold">Listagem de Compromissos</h3>
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl flex items-center gap-2">
            <Calendar size={14} />
            Registros de Empréstimos
          </div>
        </div>
        
        <div className="divide-y dark:divide-zinc-800">
          {loans.length > 0 ? loans.map(loan => (
            <div key={loan.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-500 dark:bg-zinc-800">
                  <Landmark size={20} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-zinc-200">
                    {loan.description}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-zinc-500">
                    Lançado em: {new Date(loan.date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-black text-slate-900 dark:text-white">
                    {loan.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className="text-[10px] font-bold text-rose-500 uppercase">Valor do Lançamento</div>
                </div>
                <button onClick={() => onEdit(loan)} className="p-3 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )) : (
            <div className="p-20 text-center flex flex-col items-center gap-4">
               <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-300">
                  <Landmark size={32} />
               </div>
               <p className="text-slate-400 dark:text-zinc-500 font-medium">Nenhum empréstimo registrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
