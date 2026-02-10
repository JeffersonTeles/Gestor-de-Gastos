'use client';

import { BudgetCard } from '@/components/dashboard/BudgetCard';
import { BudgetModal } from '@/components/dashboard/BudgetModal';
import { Header } from '@/components/dashboard/Header';
import { useAuth } from '@/hooks/useAuth';
import { Budget, useBudgets } from '@/hooks/useBudgets';
import Link from 'next/link';
import { useState } from 'react';

export default function BudgetsPage() {
  const { user } = useAuth();
  const { budgets, categories, addBudget, deleteBudget, updateBudget, refetch } = useBudgets(user?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  const handleAddBudget = async (data: Partial<Budget>) => {
    setIsSaving(true);
    try {
      if (modalMode === 'edit' && editingBudget) {
        await updateBudget(editingBudget.id, data);
      } else {
        await addBudget(data);
      }
      setIsModalOpen(false);
      setEditingBudget(null);
      setModalMode('create');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteBudget(id);
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
    setModalMode('create');
  };

  const handleMonthChange = async (month: string) => {
    setSelectedMonth(month);
    await refetch(month);
  };

  // Filtrar orçamentos do mês selecionado
  const filteredBudgets = budgets.filter(budget => {
    const budgetMonth = new Date(budget.month).toISOString().slice(0, 7);
    return budgetMonth === selectedMonth;
  });

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
            Orçamentos
          </div>
        </div>
      </div>

      {/* Seletor de Mês */}
      <div className="max-w-md mx-auto px-4 py-4 bg-white/90 backdrop-blur border-b border-gray-200">
        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
          Selecionar Mês
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => handleMonthChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Content */}
      <main className="pb-32">
        <BudgetCard
          budgets={filteredBudgets}
          onEdit={handleEditBudget}
          onDelete={handleDeleteBudget}
        />
      </main>

      {/* Floating Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all font-bold"
        title="Adicionar orçamento"
      >
        +
      </button>

      {/* Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddBudget}
        loading={isSaving}
        mode={modalMode}
        budget={editingBudget}
        categories={categories}
      />
    </div>
  );
}
