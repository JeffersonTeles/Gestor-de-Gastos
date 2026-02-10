'use client';

import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { ChartSection } from '@/components/dashboard/ChartSection';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { Header } from '@/components/dashboard/Header';
import { TransactionModal } from '@/components/dashboard/TransactionModal';
import { TransactionsList } from '@/components/dashboard/TransactionsList';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { exportToCSV } from '@/lib/utils';
import { useState } from 'react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { transactions, addTransaction, deleteTransaction, updateTransaction, loading } =
    useTransactions(user?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeTab, setActiveTab] = useState<'overview' | 'charts'>('overview');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  // Inicializa com todas as transações
  const displayTransactions = filteredTransactions.length > 0 || transactions.length > 0 
    ? (filteredTransactions.length > 0 ? filteredTransactions : transactions)
    : [];

  const handleAddTransaction = async (data: any) => {
    setIsSaving(true);
    try {
      if (modalMode === 'edit' && editingTransaction) {
        // Atualizar transação existente
        await updateTransaction(editingTransaction.id, {
          type: data.type,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: new Date(data.date).toISOString(),
          tags: data.tags || [],
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        });
      } else {
        // Criar nova transação
        await addTransaction({
          user_id: user.id,
          ...data,
          date: new Date(data.date).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      setEditingTransaction(null);
      setModalMode('create');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setModalMode('create');
  };

  const handleExportCSV = () => {
    exportToCSV(displayTransactions);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Tabs */}
      <div className="bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-2 flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 text-sm font-semibold rounded-full transition ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📊 Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex-1 py-3 text-sm font-semibold rounded-full transition ${
              activeTab === 'charts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📈 Gráficos
          </button>
        </div>
      </div>

      {/* Filtros */}
      <FilterBar 
        transactions={transactions}
        onFilter={setFilteredTransactions}
        onExport={handleExportCSV}
      />

      {/* Conteúdo Principal */}
      <main className="pb-32">
        {activeTab === 'overview' ? (
          <>
            <BalanceCard transactions={displayTransactions} />
            <ChartSection transactions={displayTransactions} />
            <TransactionsList
              transactions={displayTransactions}
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTransaction}
              loading={loading}
            />
          </>
        ) : (
          <div className="space-y-6 py-6">
            <CategoryChart transactions={displayTransactions} type="expense" />
            <CategoryChart transactions={displayTransactions} type="income" />
            <TrendChart transactions={displayTransactions} period="month" />
          </div>
        )}
      </main>

      {/* Botão Flutuante */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all font-bold"
        title="Adicionar transação"
      >
        +
      </button>

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddTransaction}
        loading={isSaving}
        mode={modalMode}
        transaction={editingTransaction}
      />
    </div>
  );
}
