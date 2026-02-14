'use client';

import { Transaction } from '@/types/index';
import { useCallback, useEffect, useState } from 'react';

export const useTransactions = (userId: string | undefined) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

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

  // Buscar transações via API
  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured) {
        const localItems = readLocalTransactions();
        setTransactions(localItems);
        return;
      }

      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Erro ao buscar transações');

      const data = await response.json();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar transações');
      const localItems = readLocalTransactions();
      setTransactions(localItems);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Buscar ao montar
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Adicionar transação via API
  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      try {
        setError(null);

        if (!isSupabaseConfigured) {
          const now = new Date().toISOString();
          const id = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `tx-${Date.now()}`;
          const newItem: Transaction = {
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
          };

          const updated = [newItem, ...readLocalTransactions()];
          writeLocalTransactions(updated);
          setTransactions(updated);
          return newItem;
        }

        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction),
        });

        if (!response.ok) {
          throw new Error('Erro ao adicionar transação');
        }

        const data = await response.json();
        setTransactions(prev => [data, ...prev]);
        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao adicionar transação');
        const now = new Date().toISOString();
        const id = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `tx-${Date.now()}`;
        const newItem: Transaction = {
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
        };
        const updated = [newItem, ...readLocalTransactions()];
        writeLocalTransactions(updated);
        setTransactions(updated);
        return newItem;
      }
    },
    []
  );

  // Deletar transação via API
  const deleteTransaction = useCallback(
    async (id: string) => {
      try {
        setError(null);

        if (!isSupabaseConfigured) {
          const updated = readLocalTransactions().filter(t => t.id !== id);
          writeLocalTransactions(updated);
          setTransactions(updated);
          return;
        }

        const response = await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Erro ao deletar transação');
        }

        setTransactions(prev => prev.filter(t => t.id !== id));
      } catch (err: any) {
        setError(err.message || 'Erro ao deletar transação');
        const updated = readLocalTransactions().filter(t => t.id !== id);
        writeLocalTransactions(updated);
        setTransactions(updated);
      }
    },
    []
  );

  // Atualizar transação via API
  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      try {
        setError(null);

        if (!isSupabaseConfigured) {
          const updatedAt = new Date().toISOString();
          const items = readLocalTransactions().map(item =>
            item.id === id ? { ...item, ...updates, updatedAt: updatedAt as any } : item
          );
          writeLocalTransactions(items);
          const updatedItem = items.find(item => item.id === id);
          setTransactions(items);
          return updatedItem as Transaction;
        }

        const response = await fetch(`/api/transactions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar transação');
        }

        const data = await response.json();
        setTransactions(prev =>
          prev.map(t => (t.id === id ? data : t))
        );

        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao atualizar transação');
        const updatedAt = new Date().toISOString();
        const items = readLocalTransactions().map(item =>
          item.id === id ? { ...item, ...updates, updatedAt: updatedAt as any } : item
        );
        writeLocalTransactions(items);
        const updatedItem = items.find(item => item.id === id);
        setTransactions(items);
        return updatedItem as Transaction;
      }
    },
    []
  );

  return {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    refetch: fetchTransactions,
  };
};
