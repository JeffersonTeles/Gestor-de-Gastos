'use client';

import { Bill, BillPayload } from '@/types/index';
import { useCallback, useEffect, useState } from 'react';

export const useBills = (userId: string | undefined) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(async (month?: string) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const url = month ? `/api/bills?month=${month}` : '/api/bills';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar contas');

      const data = await response.json();
      setBills(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar contas');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const addBill = useCallback(
    async (bill: BillPayload) => {
      try {
        setError(null);

        const response = await fetch('/api/bills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bill),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar conta');
        }

        const data = await response.json();
        setBills(prev => [data, ...prev]);
        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao adicionar conta');
        throw err;
      }
    },
    []
  );

  const updateBill = useCallback(
    async (id: string, updates: BillPayload) => {
      try {
        setError(null);

        const response = await fetch(`/api/bills/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar conta');
        }

        const data = await response.json();
        setBills(prev => prev.map(b => (b.id === id ? data : b)));
        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao atualizar conta');
        throw err;
      }
    },
    []
  );

  const deleteBill = useCallback(
    async (id: string) => {
      try {
        setError(null);

        const response = await fetch(`/api/bills/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao deletar conta');
        }

        setBills(prev => prev.filter(b => b.id !== id));
      } catch (err: any) {
        setError(err.message || 'Erro ao deletar conta');
        throw err;
      }
    },
    []
  );

  const markAsPaid = useCallback(
    async (bill: Bill) => {
      return updateBill(bill.id, {
        status: 'paid',
        paidAt: new Date(),
      });
    },
    [updateBill]
  );

  const reopenBill = useCallback(
    async (bill: Bill) => {
      return updateBill(bill.id, {
        status: 'open',
        paidAt: null,
      });
    },
    [updateBill]
  );

  return {
    bills,
    loading,
    error,
    addBill,
    updateBill,
    deleteBill,
    markAsPaid,
    reopenBill,
    refetch: fetchBills,
  };
};
