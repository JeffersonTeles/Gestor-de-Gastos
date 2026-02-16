'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loan } from '@/types/index';

const LOANS_QUERY_KEY = 'loans';

export const useLoans = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch com cache React Query
  const { data: loans = [], isLoading: loading, error } = useQuery({
    queryKey: [LOANS_QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];

      const response = await fetch('/api/loans');
      if (!response.ok) throw new Error('Erro ao buscar empréstimos');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 0,
    enabled: false, // Desabilitado para evitar loop
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: async (loan: Partial<Loan>) => {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loan),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar empréstimo');
      }

      return response.json();
    },
    onSuccess: (newLoan) => {
      queryClient.setQueryData([LOANS_QUERY_KEY, userId], (old: Loan[]) => 
        [newLoan, ...(old || [])]
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/loans/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar empréstimo');
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData([LOANS_QUERY_KEY, userId], (old: Loan[]) => 
        (old || []).filter(l => l.id !== id)
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Loan> }) => {
      const response = await fetch(`/api/loans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar empréstimo');
      }

      return response.json();
    },
    onSuccess: (updatedLoan) => {
      queryClient.setQueryData([LOANS_QUERY_KEY, userId], (old: Loan[]) => 
        (old || []).map(l => l.id === updatedLoan.id ? updatedLoan : l)
      );
    },
  });

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async ({ loanId, payment }: { 
      loanId: string; 
      payment: { amount: number; paymentDate: string; notes?: string } 
    }) => {
      const response = await fetch(`/api/loans/${loanId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao registrar pagamento');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([LOANS_QUERY_KEY, userId], (old: Loan[]) => 
        (old || []).map(l => l.id === data.loan.id ? data.loan : l)
      );
    },
  });

  return {
    loans,
    loading,
    error: error?.message || null,
    addLoan: addMutation.mutateAsync,
    deleteLoan: deleteMutation.mutateAsync,
    updateLoan: (id: string, updates: Partial<Loan>) => 
      updateMutation.mutateAsync({ id, updates }),
    addPayment: (loanId: string, payment: { amount: number; paymentDate: string; notes?: string }) =>
      paymentMutation.mutateAsync({ loanId, payment }),
    refetch: () => queryClient.invalidateQueries({ queryKey: [LOANS_QUERY_KEY, userId] }),
  };
};
