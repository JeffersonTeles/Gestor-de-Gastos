'use client';

import { Header } from '@/components/dashboard/Header';
import { LoanModal } from '@/components/dashboard/LoanModal';
import { LoansList } from '@/components/dashboard/LoansList';
import { PaymentModal } from '@/components/dashboard/PaymentModal';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import { Loan } from '@/types/index';
import Link from 'next/link';
import { useState } from 'react';

export default function LoansPage() {
  const { user } = useAuth();
  const { loans, addLoan, deleteLoan, updateLoan, addPayment, loading } = useLoans(user?.id);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  const handleAddLoan = async (data: Partial<Loan>) => {
    setIsSaving(true);
    try {
      if (modalMode === 'edit' && editingLoan) {
        await updateLoan(editingLoan.id, data);
      } else {
        await addLoan(data);
      }
      setIsLoanModalOpen(false);
      setEditingLoan(null);
      setModalMode('create');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setModalMode('edit');
    setIsLoanModalOpen(true);
  };

  const handleDeleteLoan = async (id: string) => {
    try {
      await deleteLoan(id);
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const handleAddPayment = (loan: Loan) => {
    setPayingLoan(loan);
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (data: { amount: number; paymentDate: string; notes?: string }) => {
    if (!payingLoan) return;

    setIsSaving(true);
    try {
      await addPayment(payingLoan.id, data);
      setIsPaymentModalOpen(false);
      setPayingLoan(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseLoanModal = () => {
    setIsLoanModalOpen(false);
    setEditingLoan(null);
    setModalMode('create');
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setPayingLoan(null);
  };

  // Calcular totais
  const totals = loans.reduce(
    (acc, loan) => {
      const amount = Number(loan.amount);
      const paidAmount = Number(loan.paidAmount);
      
      if (loan.type === 'lent') {
        acc.lent += amount;
        acc.lentPaid += paidAmount;
      } else {
        acc.borrowed += amount;
        acc.borrowedPaid += paidAmount;
      }
      
      return acc;
    },
    { lent: 0, lentPaid: 0, borrowed: 0, borrowedPaid: 0 }
  );

  const lentPending = totals.lent - totals.lentPaid;
  const borrowedPending = totals.borrowed - totals.borrowedPaid;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Navigation Tabs */}
      <div className="bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-2 flex gap-2">
          <Link
            href="/dashboard"
            className="flex-1 py-3 text-center text-sm font-semibold rounded-full text-gray-600 hover:bg-gray-100 transition"
          >
            ← Dashboard
          </Link>
          <div className="flex-1 py-3 text-center text-sm font-semibold rounded-full bg-blue-600 text-white shadow-sm">
            Empréstimos
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Emprestei */}
          <div className="bg-gradient-to-br from-green-500 to-green-700 p-4 rounded-2xl text-white shadow-sm">
            <p className="text-xs uppercase tracking-wide opacity-90 mb-1">💸 Emprestei</p>
            <p className="text-2xl font-bold mb-1">
              R$ {totals.lent.toFixed(2)}
            </p>
            <p className="text-xs opacity-90">
              Pendente: R$ {lentPending.toFixed(2)}
            </p>
          </div>

          {/* Peguei */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-4 rounded-2xl text-white shadow-sm">
            <p className="text-xs uppercase tracking-wide opacity-90 mb-1">🤝 Peguei</p>
            <p className="text-2xl font-bold mb-1">
              R$ {totals.borrowed.toFixed(2)}
            </p>
            <p className="text-xs opacity-90">
              Pendente: R$ {borrowedPending.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="pb-32">
        <LoansList
          loans={loans}
          onDelete={handleDeleteLoan}
          onEdit={handleEditLoan}
          onAddPayment={handleAddPayment}
          loading={loading}
        />
      </main>

      {/* Floating Button */}
      <button
        onClick={() => setIsLoanModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all font-bold"
        title="Adicionar empréstimo"
      >
        +
      </button>

      {/* Modals */}
      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={handleCloseLoanModal}
        onSubmit={handleAddLoan}
        loading={isSaving}
        mode={modalMode}
        loan={editingLoan}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        onSubmit={handleSubmitPayment}
        loan={payingLoan}
        loading={isSaving}
      />
    </div>
  );
}
