'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bill, BillPayload } from '@/types/index';
import { useCallback } from 'react';

const BILLS_QUERY_KEY = 'bills';

export const useBills = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch com cache React Query
  const { data: bills = [], isLoading: loading, error } = useQuery({
    queryKey: [BILLS_QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];

      const response = await fetch('/api/bills');
      if (!response.ok) throw new Error('Erro ao buscar contas');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 0,
    enabled: false, // Desabilitado para evitar loop
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: async (bill: BillPayload) => {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bill),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar conta');
      }

      return response.json();
    },
    onSuccess: (newBill) => {
      queryClient.setQueryData([BILLS_QUERY_KEY, userId], (old: Bill[]) => 
        [newBill, ...(old || [])]
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BillPayload }) => {
      const response = await fetch(`/api/bills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar conta');
      }

      return response.json();
    },
    onSuccess: (updatedBill) => {
      queryClient.setQueryData([BILLS_QUERY_KEY, userId], (old: Bill[]) => 
        (old || []).map(b => b.id === updatedBill.id ? updatedBill : b)
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/bills/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar conta');
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData([BILLS_QUERY_KEY, userId], (old: Bill[]) => 
        (old || []).filter(b => b.id !== id)
      );
    },
  });

  const markAsPaid = useCallback(
    (bill: Bill) => {
      return updateMutation.mutateAsync({
        id: bill.id,
        updates: {
          status: 'paid' as any,
          paidAt: new Date(),
        } as BillPayload,
      });
    },
    [updateMutation]
  );

  const reopenBill = useCallback(
    (bill: Bill) => {
      return updateMutation.mutateAsync({
        id: bill.id,
        updates: {
          status: 'open' as any,
          paidAt: null,
        } as BillPayload,
      });
    },
    [updateMutation]
  );

  return {
    bills,
    loading,
    error: error?.message || null,
    addBill: addMutation.mutateAsync,
    updateBill: (id: string, updates: BillPayload) => 
      updateMutation.mutateAsync({ id, updates }),
    deleteBill: deleteMutation.mutateAsync,
    markAsPaid,
    reopenBill,
    refetch: () => queryClient.invalidateQueries({ queryKey: [BILLS_QUERY_KEY, userId] }),
  };
};
