/**
 * Hook exemplo usando React Query com caching
 * Este é um modelo para como integrar React Query em outros hooks
 * 
 * Benefícios:
 * - Cache automático por 5 minutos
 * - Evita re-fetches desnecessários
 * - Background refetch automático
 * - Retry automático em caso de falha
 * 
 * Uso:
 * const { data, isLoading, error } = useTransactionsQuery(userId);
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

// Exemplo de como usar React Query
/*
export function useTransactionsQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.transactionsList(),
    queryFn: async () => {
      if (!userId) return [];
      
      const response = await fetch(`/api/transactions?userId=${userId}`);
      if (!response.ok) throw new Error('Falha ao carregar transações');
      return response.json();
    },
    enabled: !!userId, // Só executa se userId existe
  });
}

export function useAddTransactionMutation(userId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Falha ao salvar transação');
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache após sucesso
      queryClient.invalidateQueries({ queryKey: queryKeys.transactionsList() });
    },
  });
}
*/
