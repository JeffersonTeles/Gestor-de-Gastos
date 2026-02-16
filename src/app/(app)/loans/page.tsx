'use client';

import { LoanModal } from '@/components/dashboard/LoanModal';
import { LoansList } from '@/components/dashboard/LoansList';
import { PaymentModal } from '@/components/dashboard/PaymentModal';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import { Loan } from '@/types/index';
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

  const totals = loans.reduce(
    (acc: { lent: number; lentPaid: number; borrowed: number; borrowedPaid: number }, loan: Loan) => {
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
    <>
      <Topbar 
        title="Empréstimos"
        subtitle="Gestão de empréstimos dados e recebidos"
        actions={
          <button
            onClick={() => setIsLoanModalOpen(true)}
            className="btn-primary text-sm"
          >
            + Novo Empréstimo
          </button>
        }
      />

      <div className="app-content bg-neutral-50 dark:bg-neutral-900 flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card bg-white dark:bg-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <p className="metric-card-label">Emprestei</p>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-50 to-success-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-success-600">R$ {totals.lent.toFixed(2)}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Pendente: R$ {lentPending.toFixed(2)}</p>
          </div>

          <div className="card bg-white dark:bg-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <p className="metric-card-label">Peguei Emprestado</p>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning-50 to-warning-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-warning-600">R$ {totals.borrowed.toFixed(2)}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Pendente: R$ {borrowedPending.toFixed(2)}</p>
          </div>
        </div>

        <LoansList
          loans={loans}
          onDelete={handleDeleteLoan}
          onEdit={handleEditLoan}
          onAddPayment={handleAddPayment}
          loading={loading}
        />
      </div>

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
    </>
  );
}
