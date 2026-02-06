import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { X, Loader2, CloudOff, UploadCloud, AlertTriangle, RefreshCw } from 'lucide-react';
import { Transaction } from './types';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import AICounselor from './components/AICounselor';
import { LoanDashboard } from './components/LoanDashboard';
import { Auth } from './components/Auth';
import { FileImporter } from './components/FileImporter';
import { supabase } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { useTransactions } from './hooks/useTransactions';

const App: React.FC = () => {
  // Check if Supabase is configured
  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl p-8 md:p-12 text-center border border-rose-100 dark:border-rose-900/30">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 dark:text-rose-400">
            <CloudOff size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Configuração Necessária</h1>
          <p className="text-slate-600 dark:text-zinc-400 mb-6">
            O aplicativo não encontrou as chaves do Supabase. Se você está no GitHub Pages, isso é normal!
          </p>
          <div className="bg-slate-100 dark:bg-zinc-800/50 p-4 rounded-xl text-left text-sm text-slate-700 dark:text-zinc-300 mb-6 overflow-hidden">
            <p className="font-bold mb-2">Como resolver:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Vá no seu repositório GitHub</li>
              <li>Settings &gt; Secrets and variables &gt; Actions</li>
              <li>Adicione: <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code></li>
              <li>Rode o deploy novamente</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<any>(null);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [loadingObj, setLoadingObj] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [dateFilter, setDateFilter] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  // Use the custom hook for transaction logic
  const {
    transactions,
    loading: transactionsLoading,
    isSynced,
    isRefreshing,
    dbError,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh,
    sync
  } = useTransactions(session);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const activeTab = useMemo(() => {
    const path = location.pathname.replace('/', '');
    return path || 'dashboard';
  }, [location.pathname]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoadingObj(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleUpdateTransaction = async (updated: Transaction) => {
    await updateTransaction(updated);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Deseja excluir permanentemente este registro?')) return;
    await deleteTransaction(id);
  };

  const handleEdit = (transaction: Transaction) => setEditingTransaction(transaction);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Início';
      case 'transactions': return 'Extrato Geral';
      case 'loans': return 'Empréstimos';
      case 'ai': return 'IA Insight';
      default: return 'Financeiro';
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = t.date;
      return tDate >= dateFilter.start && tDate <= dateFilter.end;
    });
  }, [transactions, dateFilter]);

  const summary = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.value, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.value, 0);
    return { totalIncome: income, totalExpenses: expenses, totalBalance: income - expenses };
  }, [filteredTransactions]);

  const handleSignOut = async () => {
    if (confirm('Deseja realmente sair da conta?')) {
      try {
        await supabase.auth.signOut();
        setSession(null);
        localStorage.clear();
        navigate('/');
      } catch (err) {
        console.error("Erro ao sair:", err);
      }
    }
  };

  if ((loadingObj || (transactionsLoading && !transactions.length)) && !session) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-zinc-400 font-bold tracking-tight">Carregando...</p>
      </div>
    );
  }

  if (!session && !loadingObj) return <Auth />;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar
        activeTab={activeTab}
        isSynced={isSynced}
        isRefreshing={isRefreshing}
        darkMode={darkMode}
        onNavigate={(path) => navigate(path)}
        onSync={sync}
        onRefresh={refresh}
        onToggleTheme={() => setDarkMode(!darkMode)}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <Header
          title={getPageTitle()}
          isRefreshing={isRefreshing}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenNew={() => setIsFormOpen(true)}
        />

        <div className="p-4 md:p-10 max-w-7xl mx-auto w-full pb-24 md:pb-12">
          {dbError && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-center gap-4 text-rose-600 dark:text-rose-400 animate-in slide-in-from-top-4 duration-300">
              <AlertTriangle size={24} className="shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-sm">Problema de Sincronização</p>
                <p className="text-xs opacity-80">{dbError}</p>
              </div>
              <button onClick={() => refresh()} className="p-2 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-colors">
                <RefreshCw size={18} />
              </button>
            </div>
          )}

          {!isSynced && transactions.length > 0 && !dbError && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                <CloudOff size={24} />
                <div>
                  <p className="font-bold text-sm">Alterações locais não salvas</p>
                  <p className="text-xs opacity-80">Seus dados estão apenas no navegador. Clique ao lado para subir para a nuvem.</p>
                </div>
              </div>
              <button onClick={sync} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-amber-200 dark:shadow-none flex items-center gap-2">
                <UploadCloud size={16} />
                Salvar na Nuvem
              </button>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard transactions={filteredTransactions} summary={summary} onEdit={handleEdit} onDelete={handleDeleteTransaction} />} />
            <Route path="/transactions" element={<TransactionList transactions={filteredTransactions} onDelete={handleDeleteTransaction} onEdit={handleEdit} />} />
            <Route path="/loans" element={<LoanDashboard transactions={transactions} onEdit={handleEdit} />} />
            <Route path="/ai" element={<AICounselor transactions={filteredTransactions} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>

        <MobileNav activeTab={activeTab} onNavigate={(path) => navigate(path)} />
      </main>

      {(isFormOpen || editingTransaction) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-zinc-800">
            <div className="flex items-center justify-between p-8 border-b dark:border-zinc-800">
              <h3 className="text-2xl font-black tracking-tight">{editingTransaction ? 'Editar Registro' : 'Novo Registro'}</h3>
              <button onClick={() => { setIsFormOpen(false); setEditingTransaction(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <TransactionForm
                onSave={async (t) => {
                  if (editingTransaction) {
                    await handleUpdateTransaction(t as Transaction);
                  } else {
                    await addTransaction(t);
                    setIsFormOpen(false); // Close form after adding
                  }
                }}
                initialData={editingTransaction || undefined}
              />
            </div>
          </div>
        </div>
      )}

      {isImportOpen && (
        <FileImporter
          onClose={() => setIsImportOpen(false)}
          onImport={async (items) => {
            for (const item of items) {
              await addTransaction(item);
            }
            setIsImportOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
