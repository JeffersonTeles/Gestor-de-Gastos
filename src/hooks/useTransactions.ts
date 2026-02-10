'use client';

import { createClient } from '@/lib/supabase/client';
import { Transaction } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

export const useTransactions = (userId: string | undefined) => {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar transações
  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar transações');
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  // Buscar ao montar
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Adicionar transação
  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        setError(null);

        const { data, error: insertError } = await supabase
          .from('transactions')
          .insert([transaction])
          .select()
          .single();

        if (insertError) throw insertError;

        setTransactions(prev => [data, ...prev]);
        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao adicionar transação');
        throw err;
      }
    },
    [supabase]
  );

  // Deletar transação
  const deleteTransaction = useCallback(
    async (id: string) => {
      try {
        setError(null);

        const { error: deleteError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        setTransactions(prev => prev.filter(t => t.id !== id));
      } catch (err: any) {
        setError(err.message || 'Erro ao deletar transação');
        throw err;
      }
    },
    [userId, supabase]
  );

  // Atualizar transação
  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      try {
        setError(null);

        const { data, error: updateError } = await supabase
          .from('transactions')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) throw updateError;

        setTransactions(prev =>
          prev.map(t => (t.id === id ? data : t))
        );

        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao atualizar transação');
        throw err;
      }
    },
    [userId, supabase]
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
