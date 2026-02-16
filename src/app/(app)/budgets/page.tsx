'use client';

import { BudgetCard } from '@/components/dashboard/BudgetCard';
import { BudgetModal } from '@/components/dashboard/BudgetModal';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/hooks/useAuth';
import { Budget, useBudgets } from '@/hooks/useBudgets';
import { useState } from 'react';

export default function BudgetsPage() {
  const { user } = useAuth();
  const { budgets, categories, addBudget, deleteBudget, updateBudget } = useBudgets(user?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

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
    // React Query vai cache automaticamente
  };

  const filteredBudgets = budgets.filter((budget: Budget) => {
    const budgetMonth = new Date(budget.month).toISOString().slice(0, 7);
    return budgetMonth === selectedMonth;
  });

  return (
    <>
      <Topbar 
        title="Orçamentos"
        subtitle="Metas mensais e controle de gastos"
        actions={
          <>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600 shadow-sm">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Mês:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => handleMonthChange(e.target.value)}
                className="bg-transparent text-sm font-medium text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary text-sm"
            >
              + Novo Orçamento
            </button>
          </>
        }
      />

      <div className="app-content bg-neutral-50 dark:bg-neutral-900 flex-1 overflow-auto">
        <BudgetCard
          budgets={filteredBudgets}
          onEdit={handleEditBudget}
          onDelete={handleDeleteBudget}
        />
      </div>

      <BudgetModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddBudget}
        loading={isSaving}
        mode={modalMode}
        budget={editingBudget}
        categories={categories}
      />
    </>
  );
}
