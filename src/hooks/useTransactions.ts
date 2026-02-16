'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@/types/index';
import { useCallback } from 'react';

const TRANSACTIONS_QUERY_KEY = 'transactions';

export const useTransactions = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const getStorageKey = useCallback(() => {
    return userId ? `transactions_${userId}` : 'transactions_anon';
  }, [userId]);

  const readLocalTransactions = useCallback((): Transaction[] => {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [getStorageKey]);

  const writeLocalTransactions = useCallback(
    (items: Transaction[]) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(getStorageKey(), JSON.stringify(items));
    },
    [getStorageKey]
  );

  // Fetch com cache React Query
  const { data: transactions = [], isLoading: loading, error } = useQuery({
    queryKey: [TRANSACTIONS_QUERY_KEY, userId],
    queryFn: async () => {
      // SEMPRE usa localStorage, sem API
      return readLocalTransactions();
    },
    enabled: true, // Sempre habilitado (usa localStorage)
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 30 * 60 * 1000,   // 30 min (antigo: cacheTime)
    retry: 0, // Sem retry (localStorage não falha)
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      if (!isSupabaseConfigured) {
        const now = new Date().toISOString();
        const id = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `tx-${Date.now()}`;
        return {
          id,
          userId: userId || 'demo-user-123',
          amount: Number(transaction.amount) || 0,
          currency: transaction.currency || 'BRL',
          category: transaction.category,
          description: transaction.description,
          type: transaction.type,
          date: transaction.date as any,
          tags: transaction.tags || [],
          notes: transaction.notes,
          createdAt: now as any,
          updatedAt: now as any,
        } as Transaction;
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) throw new Error('Erro ao adicionar transação');
      return response.json();
    },
    onSuccess: (newTransaction) => {
      // Atualizar cache localmente
      const updated = [newTransaction, ...readLocalTransactions()];
      writeLocalTransactions(updated);
      
      // Invalidar cache React Query
      queryClient.setQueryData([TRANSACTIONS_QUERY_KEY, userId], (old: Transaction[]) => 
        [newTransaction, ...(old || [])]
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) {
        const updated = readLocalTransactions().filter(t => t.id !== id);
        writeLocalTransactions(updated);
        return id;
      }

      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar transação');
      return id;
    },
    onSuccess: (id) => {
      const updated = readLocalTransactions().filter(t => t.id !== id);
      writeLocalTransactions(updated);
      
      queryClient.setQueryData([TRANSACTIONS_QUERY_KEY, userId], (old: Transaction[]) => 
        (old || []).filter(t => t.id !== id)
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      if (!isSupabaseConfigured) {
        const updatedAt = new Date().toISOString();
        const items = readLocalTransactions().map(item =>
          item.id === id ? { ...item, ...updates, updatedAt: updatedAt as any } : item
        );
        writeLocalTransactions(items);
        return items.find(item => item.id === id) as Transaction;
      }

      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Erro ao atualizar transação');
      return response.json();
    },
    onSuccess: (updatedTransaction) => {
      const updated = readLocalTransactions().map(t => 
        t.id === updatedTransaction.id ? updatedTransaction : t
      );
      writeLocalTransactions(updated);
      
      queryClient.setQueryData([TRANSACTIONS_QUERY_KEY, userId], (old: Transaction[]) => 
        (old || []).map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
      );
    },
  });

  return {
    transactions,
    loading,
    error: error?.message || null,
    addTransaction: addMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    updateTransaction: (id: string, updates: Partial<Transaction>) => 
      updateMutation.mutateAsync({ id, updates }),
    refetch: () => queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY, userId] }),
  };
};
