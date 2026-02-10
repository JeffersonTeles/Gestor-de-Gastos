'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

interface User {
  id: string;
  email: string;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user] = useState<User | null>(null);
  const [loading] = useState(false);
  const [theme] = useState<'light' | 'dark'>('light');

  const signOut = async () => {
    console.log('Sign out');
  };

  const toggleTheme = () => {
    console.log('Toggle theme');
  };

  const showNotification = (message: string, type?: 'success' | 'error' | 'info') => {
    console.log(`[${type || 'info'}] ${message}`);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        signOut,
        theme,
        toggleTheme,
        showNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
