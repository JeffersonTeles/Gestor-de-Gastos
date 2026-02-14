'use client';

import { TransactionModal } from '@/components/dashboard/TransactionModal';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewTransactionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addTransaction } = useTransactions(user?.id);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Redirecionando para login...</p>
      </div>
    );
  }

  const handleSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      await addTransaction({
        type: data.type,
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description,
        date: data.date,
        currency: 'BRL',
        tags: data.tags || [],
        notes: data.notes || null,
      });
      router.push('/dashboard');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TransactionModal
      isOpen
      onClose={() => router.push('/dashboard')}
      onSubmit={handleSubmit}
      loading={isSaving}
      mode="create"
    />
  );
}
