import React from 'react';
import { Wallet, LayoutDashboard, List, Landmark, Sparkles, CloudCheck, CloudOff, RefreshCw, UploadCloud, Sun, Moon, LogOut } from 'lucide-react';

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
            <div className="flex items-center gap-4 mb-12">
                <button 
                    className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-none" 
                    onClick={() => onNavigate('/dashboard')}
                    aria-label="Ir para página inicial"
                >
                    <Wallet size={24} aria-hidden="true" />
                </button>
                <h1 className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => onNavigate('/dashboard')}>Gestor de Gastos</h1>
            </div>

            <nav className="flex-1 space-y-3" aria-label="Menu principal">
                <NavItem active={activeTab === 'dashboard'} onClick={() => onNavigate('/dashboard')} icon={<LayoutDashboard size={20} />} label="Início" />
                <NavItem active={activeTab === 'transactions'} onClick={() => onNavigate('/transactions')} icon={<List size={20} />} label="Extrato Geral" />
                <NavItem active={activeTab === 'loans'} onClick={() => onNavigate('/loans')} icon={<Landmark size={20} />} label="Empréstimos" />
                <NavItem active={activeTab === 'ai'} onClick={() => onNavigate('/ai')} icon={<Sparkles size={20} />} label="IA Insight" />
            </nav>

            <div className="pt-8 border-t border-slate-100 dark:border-zinc-800 space-y-4">
                <div className={`px-4 py-3 rounded-2xl flex items-center justify-between transition-all ${isSynced ? 'bg-slate-50 dark:bg-zinc-800/50' : 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 animate-pulse'}`}>
                    <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Status Nuvem</span>
                        <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${isSynced ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {isSynced ? <CloudCheck size={12} aria-hidden="true" /> : <CloudOff size={12} aria-hidden="true" />}
                            {isSynced ? 'Sincronizado' : 'Pendente'}
                        </span>
                    </div>
                    <button
                        onClick={isSynced ? onRefresh : onSync}
                        disabled={isRefreshing}
                        className={`p-2 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors ${isRefreshing ? 'animate-spin opacity-50' : ''}`}
                        aria-label={isSynced ? 'Atualizar dados' : 'Sincronizar com a nuvem'}
                    >
                        {isSynced ? <RefreshCw size={14} className="text-slate-400" aria-hidden="true" /> : <UploadCloud size={14} className="text-amber-500" aria-hidden="true" />}
                    </button>
                </div>

                <button onClick={onToggleTheme} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800" aria-label={darkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}>
                    {darkMode ? <Sun size={20} className="text-amber-400" aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
                    {darkMode ? 'Modo Claro' : 'Modo Escuro'}
                </button>

                <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" aria-label="Sair da conta">
                    <LogOut size={20} aria-hidden="true" />
                    Sair da Conta
                </button>
            </div>
        </aside>
    );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] text-sm font-black transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
        aria-current={active ? 'page' : undefined}
    >
        <span aria-hidden="true">{icon}</span>
        {label}
    </button>
);
