'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCategories } from '@/hooks/useCategories';

const BUDGETS_QUERY_KEY = 'budgets';

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  month: Date;
  spent?: number;
  percentage?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const useBudgets = (userId: string | undefined) => {
  const { categories } = useCategories();
  const queryClient = useQueryClient();

  // Fetch com cache React Query
  const { data: budgets = [], isLoading: loading, error } = useQuery({
    queryKey: [BUDGETS_QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];

      const response = await fetch('/api/budgets');
      if (!response.ok) throw new Error('Erro ao buscar orçamentos');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 0,
    enabled: false, // Desabilitado para evitar loop
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: async (budget: Partial<Budget>) => {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budget),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar orçamento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY, userId] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar orçamento');
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData([BUDGETS_QUERY_KEY, userId], (old: Budget[]) => 
        (old || []).filter(b => b.id !== id)
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Budget> }) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar orçamento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY, userId] });
    },
  });

  return {
    budgets,
    categories,
    loading,
    error: error?.message || null,
    addBudget: addMutation.mutateAsync,
    deleteBudget: deleteMutation.mutateAsync,
    updateBudget: (id: string, updates: Partial<Budget>) => 
      updateMutation.mutateAsync({ id, updates }),
    refetch: () => queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY, userId] }),
  };
};
