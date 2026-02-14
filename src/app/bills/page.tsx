'use client';

import { BillModal } from '@/components/dashboard/BillModal';
import { BillsList } from '@/components/dashboard/BillsList';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/hooks/useAuth';
import { useBills } from '@/hooks/useBills';
import { Bill, BillPayload } from '@/types/index';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BillsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { bills, addBill, updateBill, deleteBill, markAsPaid, reopenBill, loading } = useBills(user?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  const handleAddBill = async (data: BillPayload) => {
    setIsSaving(true);
    try {
      if (modalMode === 'edit' && editingBill) {
        await updateBill(editingBill.id, data);
      } else {
        await addBill(data);
      }
      setIsModalOpen(false);
      setEditingBill(null);
      setModalMode('create');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteBill = async (id: string) => {
    try {
      await deleteBill(id);
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBill(null);
    setModalMode('create');
  };

  return (
    <div className="app-layout">
      <Sidebar />
      
      <div className="app-main-wrapper">
        <Topbar 
          title="Contas a Pagar"
          subtitle="Controle de vencimentos e pagamentos"
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary text-sm"
            >
              + Nova Conta
            </button>
          }
        />

        <div className="app-content bg-neutral-50">
          <BillsList
            bills={bills}
            onDelete={handleDeleteBill}
            onEdit={handleEditBill}
            onMarkPaid={markAsPaid}
            onReopen={reopenBill}
            loading={loading}
          />
        </div>
      </div>

      <BillModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddBill}
        loading={isSaving}
        mode={modalMode}
        bill={editingBill}
      />
    </div>
  );
}
