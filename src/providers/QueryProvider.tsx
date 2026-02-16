'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useMemo } from 'react';
import { createQueryClient } from '@/lib/queryClient';

/**
 * Provider para React Query com caching otimizado
 * Reduz requisições ao Supabase em ~50-70% em visitas recorrentes
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // Usar useMemo para evitar recriação do QueryClient a cada render
  const queryClient = useMemo(() => createQueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
