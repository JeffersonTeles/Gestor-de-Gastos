import { Loader2 } from 'lucide-react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRouter } from './AppRouter';
import { MobileNav } from './components/MobileNav';
import { Sidebar } from './components/Sidebar';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import { useTheme } from './contexts/ThemeContext';

const App: React.FC = () => {
  console.log('🎨 App.tsx renderizando');
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  // We can access data context here if we need global sync status in the layout
  const { isSynced, refresh, sync } = useData();
  
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname.replace('/', '') || 'dashboard';

  console.log('👤 User:', !!user, 'Loading:', authLoading, 'Path:', location.pathname);

  // Show full screen loader while checking auth
  if (authLoading) {
     return (
       <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950">
         <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
         <p className="text-slate-500 dark:text-zinc-400 font-bold tracking-tight">Iniciando...</p>
       </div>
     );
  }

  // If not logged in, Router handles showing Auth screen (which doesn't have sidebar)
  // But wait, the Sidebar is usually *around* the content if logged in.
  // If we are at root ('/') and not logged in, we see Auth.
  
  if (!user) {
    return <AppRouter />;
  }

  // Logged in Layout
  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300 ${theme}`}>
      <Sidebar
        activeTab={activeTab}
        isSynced={isSynced}
        isRefreshing={false} // Data context handles this mostly internally now, or we can expose it
        darkMode={theme === 'dark'}
        onNavigate={(path) => navigate(path)}
        onSync={sync}
        onRefresh={refresh}
        onToggleTheme={toggleTheme}
        onSignOut={signOut}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
         {/* We might want to move Header inside the pages or keep it here if generic.
             For now let's keep it here but we need props from the page potentially.
             Actually, let's keep it simple: Render Router content.
             The individual pages (Dashboard, etc.) can render their own headers OR we adapt.
             Current Header needs 'title', 'dateFilter', etc. 
             Ideally Dashboard manages its own filter.
             Let's put Header INSIDE components for now to decouple? 
             OR keep it global. The original App had state for DateFilter.
             Let's let the specific pages Manage their own top bar for now, OR 
             refactor Header to use Context. 
             Refactoring Header to Context is Phase 2.
             For Phase 1, let's assume AppRouter renders the page content which INCLUDES the header if needed?
             No, the original design had a fixed Header.
             Let's wrap AppRouter in the Main area.
         */}
         <AppRouter />
         
         <MobileNav activeTab={activeTab} onNavigate={(path) => navigate(path)} />
      </main>
    </div>
  );
};

export default App;
