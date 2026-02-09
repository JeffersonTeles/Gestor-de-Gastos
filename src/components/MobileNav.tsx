import { Landmark, LayoutDashboard, List, Sparkles } from 'lucide-react';
import React from 'react';

interface MobileNavProps {
    activeTab: string;
    onNavigate: (path: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onNavigate }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-800 flex justify-around p-3 z-30 shadow-2xl">
            <MobileNavItem active={activeTab === 'dashboard'} onClick={() => onNavigate('/dashboard')} icon={<LayoutDashboard size={24} />} label="Início" />
            <MobileNavItem active={activeTab === 'transactions'} onClick={() => onNavigate('/transactions')} icon={<List size={24} />} label="Extrato" />
            <MobileNavItem active={activeTab === 'loans'} onClick={() => onNavigate('/loans')} icon={<Landmark size={24} />} label="Empréstimos" />
            <MobileNavItem active={activeTab === 'ai'} onClick={() => onNavigate('/ai')} icon={<Sparkles size={24} />} label="IA" />
        </nav>
    );
};

const MobileNavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`p-3 rounded-2xl transition-all flex flex-col items-center text-xs font-bold gap-1 ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'}`}>
        {icon}
        <span className="text-[10px]">{label}</span>
    </button>
);
