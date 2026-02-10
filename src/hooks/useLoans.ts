'use client';

import { Loan } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export const useLoans = (userId: string | undefined) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar empréstimos
  const fetchLoans = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/loans');
      if (!response.ok) throw new Error('Erro ao buscar empréstimos');

      const data = await response.json();
      setLoans(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar empréstimos');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Buscar ao montar
  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Adicionar empréstimo
  const addLoan = useCallback(
    async (loan: Partial<Loan>) => {
      try {
        setError(null);

        const response = await fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loan),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar empréstimo');
        }

        const data = await response.json();
        setLoans(prev => [data, ...prev]);
        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao adicionar empréstimo');
        throw err;
      }
    },
    []
  );

  // Deletar empréstimo
  const deleteLoan = useCallback(
    async (id: string) => {
      try {
        setError(null);

        const response = await fetch(`/api/loans/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao deletar empréstimo');
        }

        setLoans(prev => prev.filter(l => l.id !== id));
      } catch (err: any) {
        setError(err.message || 'Erro ao deletar empréstimo');
        throw err;
      }
    },
    []
  );

  // Atualizar empréstimo
  const updateLoan = useCallback(
    async (id: string, updates: Partial<Loan>) => {
      try {
        setError(null);

        const response = await fetch(`/api/loans/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar empréstimo');
        }

        const data = await response.json();
        setLoans(prev =>
          prev.map(l => (l.id === id ? data : l))
        );

        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao atualizar empréstimo');
        throw err;
      }
    },
    []
  );

  // Registrar pagamento
  const addPayment = useCallback(
    async (loanId: string, payment: { amount: number; paymentDate: string; notes?: string }) => {
      try {
        setError(null);

        const response = await fetch(`/api/loans/${loanId}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao registrar pagamento');
        }

        const data = await response.json();
        
        // Atualizar o empréstimo na lista
        setLoans(prev =>
          prev.map(l => (l.id === loanId ? data.loan : l))
        );

        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao registrar pagamento');
        throw err;
      }
    },
    []
  );

  return {
    loans,
    loading,
    error,
    addLoan,
    deleteLoan,
    updateLoan,
    addPayment,
    refetch: fetchLoans,
  };
};
