import React from 'react';
import { LayoutDashboard, List, Landmark, Sparkles } from 'lucide-react';

interface MobileNavProps {
    activeTab: string;
    onNavigate: (path: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onNavigate }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-zinc-800 flex justify-around p-4 z-30 shadow-2xl">
            <MobileNavItem active={activeTab === 'dashboard'} onClick={() => onNavigate('/dashboard')} icon={<LayoutDashboard size={24} />} />
            <MobileNavItem active={activeTab === 'transactions'} onClick={() => onNavigate('/transactions')} icon={<List size={24} />} />
            <MobileNavItem active={activeTab === 'loans'} onClick={() => onNavigate('/loans')} icon={<Landmark size={24} />} />
            <MobileNavItem active={activeTab === 'ai'} onClick={() => onNavigate('/ai')} icon={<Sparkles size={24} />} />
        </nav>
    );
};

const MobileNavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ active, onClick, icon }) => (
    <button onClick={onClick} className={`p-3 rounded-2xl transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>{icon}</button>
);
