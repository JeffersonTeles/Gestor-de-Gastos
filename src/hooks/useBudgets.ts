'use client';

import { useCategories } from '@/hooks/useCategories';
import { useCallback, useEffect, useState } from 'react';

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
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar orçamentos
  const fetchBudgets = useCallback(async (month?: string) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const url = month ? `/api/budgets?month=${month}` : '/api/budgets';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar orçamentos');

      const data = await response.json();
      setBudgets(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar orçamentos');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Buscar ao montar
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Adicionar orçamento
  const addBudget = useCallback(
    async (budget: Partial<Budget>) => {
      try {
        setError(null);

        const response = await fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(budget),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar orçamento');
        }

        const data = await response.json();
        await fetchBudgets(); // Recarregar para obter dados calculados
        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao adicionar orçamento');
        throw err;
      }
    },
    [fetchBudgets]
  );

  // Deletar orçamento
  const deleteBudget = useCallback(
    async (id: string) => {
      try {
        setError(null);

        const response = await fetch(`/api/budgets/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao deletar orçamento');
        }

        setBudgets(prev => prev.filter(b => b.id !== id));
      } catch (err: any) {
        setError(err.message || 'Erro ao deletar orçamento');
        throw err;
      }
    },
    []
  );

  // Atualizar orçamento
  const updateBudget = useCallback(
    async (id: string, updates: Partial<Budget>) => {
      try {
        setError(null);

        const response = await fetch(`/api/budgets/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar orçamento');
        }

        await fetchBudgets(); // Recarregar para obter dados calculados
      } catch (err: any) {
        setError(err.message || 'Erro ao atualizar orçamento');
        throw err;
      }
    },
    [fetchBudgets]
  );

  return {
    budgets,
    categories,
    loading,
    error,
    addBudget,
    deleteBudget,
    updateBudget,
    refetch: fetchBudgets,
  };
};
