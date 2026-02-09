import { CloudCheck, CloudOff, Landmark, LayoutDashboard, List, LogOut, Moon, Plus, RefreshCw, Sparkles, Sun, UploadCloud, Wallet } from 'lucide-react';
import React from 'react';

interface SidebarProps {
    activeTab: string;
    isSynced: boolean;
    isRefreshing: boolean;
    darkMode: boolean;
    onNavigate: (path: string) => void;
    onSync: () => void;
    onRefresh: () => void;
    onToggleTheme: () => void;
    onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    isSynced,
    isRefreshing,
    darkMode,
    onNavigate,
    onSync,
    onRefresh,
    onToggleTheme,
    onSignOut
}) => {
    return (
        <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-12 group cursor-pointer" onClick={() => onNavigate('/dashboard')}>
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-none group-hover:scale-110 transition-transform">
                    <Wallet size={24} />
                </div>
                <h1 className="font-black text-2xl tracking-tighter group-hover:text-indigo-600 transition-colors">Gestor de Gastos</h1>
            </div>

            <nav className="flex-1 space-y-3">
                <NavItem active={activeTab === 'dashboard'} onClick={() => onNavigate('/dashboard')} icon={<LayoutDashboard size={20} />} label="Início" />
                <NavItem active={activeTab === 'transactions'} onClick={() => onNavigate('/transactions')} icon={<List size={20} />} label="Extrato Geral" />
                <NavItem active={activeTab === 'loans'} onClick={() => onNavigate('/loans')} icon={<Landmark size={20} />} label="Empréstimos" />
                <NavItem active={activeTab === 'ai'} onClick={() => onNavigate('/ai')} icon={<Sparkles size={20} />} label="IA Insight" />
                
                {/* Add Transaction Button in Sidebar */}
                <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
                    <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95">
                        <Plus size={20} />
                        Adicionar
                    </button>
                </div>
            </nav>

            <div className="pt-8 border-t border-slate-100 dark:border-zinc-800 space-y-4">
                <div className={`px-4 py-3 rounded-2xl flex items-center justify-between transition-all ${isSynced ? 'bg-slate-50 dark:bg-zinc-800/50' : 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 animate-pulse'}`}>
                    <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Status Nuvem</span>
                        <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${isSynced ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {isSynced ? <CloudCheck size={12} /> : <CloudOff size={12} />}
                            {isSynced ? 'Sincronizado' : 'Pendente'}
                        </span>
                    </div>
                    <button
                        onClick={isSynced ? onRefresh : onSync}
                        disabled={isRefreshing}
                        className={`p-2 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors ${isRefreshing ? 'animate-spin opacity-50' : ''}`}
                    >
                        {isSynced ? <RefreshCw size={14} className="text-slate-400" /> : <UploadCloud size={14} className="text-amber-500" />}
                    </button>
                </div>

                <button onClick={onToggleTheme} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800">
                    {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
                    {darkMode ? 'Modo Claro' : 'Modo Escuro'}
                </button>

                <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                    <LogOut size={20} />
                    Sair da Conta
                </button>
            </div>
        </aside>
    );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] text-sm font-black transition-all group ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 group'}`}>
        <span className={active ? '' : 'group-hover:scale-110 transition-transform'}>{icon}</span>
        {label}
    </button>
);
