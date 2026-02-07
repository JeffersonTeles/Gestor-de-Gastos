import React from 'react';
import { Loader2, Calendar, FileUp, PlusCircle } from 'lucide-react';

interface HeaderProps {
    title: string;
    isRefreshing: boolean;
    dateFilter: { start: string; end: string };
    setDateFilter: (filter: { start: string; end: string }) => void;
    onOpenImport: () => void;
    onOpenNew: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    isRefreshing,
    dateFilter,
    setDateFilter,
    onOpenImport,
    onOpenNew
}) => {
    return (
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 p-4 md:px-10 md:py-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">{title}</h2>
                {isRefreshing && <Loader2 size={20} className="animate-spin text-indigo-500" />}
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 px-5 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
                    <Calendar size={18} className="text-indigo-500" aria-hidden="true" />
                    <div className="flex items-center gap-2">
                        <label htmlFor="filter-start-date" className="sr-only">Data inicial</label>
                        <input 
                            id="filter-start-date"
                            type="date" 
                            value={dateFilter.start} 
                            onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })} 
                            className="bg-transparent border-none outline-none text-xs font-black dark:text-zinc-200" 
                            aria-label="Data inicial do filtro"
                        />
                        <span className="text-slate-400 text-[10px] font-bold uppercase">até</span>
                        <label htmlFor="filter-end-date" className="sr-only">Data final</label>
                        <input 
                            id="filter-end-date"
                            type="date" 
                            value={dateFilter.end} 
                            onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })} 
                            className="bg-transparent border-none outline-none text-xs font-black dark:text-zinc-200" 
                            aria-label="Data final do filtro"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={onOpenImport} className="bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 px-4 py-3.5 rounded-2xl font-bold text-sm border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-2" aria-label="Importar extrato">
                        <FileUp size={18} aria-hidden="true" />
                        Importar
                    </button>
                    <button onClick={onOpenNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 flex items-center gap-2" aria-label="Nova transação">
                        <PlusCircle size={18} aria-hidden="true" />
                        Novo
                    </button>
                </div>
            </div>
        </header>
    );
};
