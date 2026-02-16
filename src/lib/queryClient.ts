import { QueryClient } from '@tanstack/react-query';

/**
 * Configuração otimizada do React Query para cache de dados
 * Reduz requisições desnecessárias ao Supabase
 */
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache por 5 minutos (300000ms)
        staleTime: 5 * 60 * 1000,
        // Manter dados em cache por 30 minutos
        gcTime: 30 * 60 * 1000,
        // Retry apenas 1 vez em caso de erro
        retry: 1,
        // Sem retry delay (falha rápido)
        retryDelay: 0,
      },
      mutations: {
        // Retry 2 vezes em mutações com falha
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });
};

// Query keys factory para type-safety
export const queryKeys = {
  all: () => ['queries'] as const,
  
  transactions: () => [...queryKeys.all(), 'transactions'] as const,
  transactionsList: () => [...queryKeys.transactions(), 'list'] as const,
  transactionsDetail: (id: string) => [...queryKeys.transactions(), 'detail', id] as const,
  
  budgets: () => [...queryKeys.all(), 'budgets'] as const,
  budgetsList: () => [...queryKeys.budgets(), 'list'] as const,
  budgetsDetail: (id: string) => [...queryKeys.budgets(), 'detail', id] as const,
  
  bills: () => [...queryKeys.all(), 'bills'] as const,
  billsList: () => [...queryKeys.bills(), 'list'] as const,
  billsDetail: (id: string) => [...queryKeys.bills(), 'detail', id] as const,
  
  loans: () => [...queryKeys.all(), 'loans'] as const,
  loansList: () => [...queryKeys.loans(), 'list'] as const,
  loansDetail: (id: string) => [...queryKeys.loans(), 'detail', id] as const,
  
  analytics: () => [...queryKeys.all(), 'analytics'] as const,
  analyticsSummary: () => [...queryKeys.analytics(), 'summary'] as const,
  
  categories: () => [...queryKeys.all(), 'categories'] as const,
  
  user: () => [...queryKeys.all(), 'user'] as const,
  userProfile: (userId: string) => [...queryKeys.user(), 'profile', userId] as const,
} as const;
