import React, { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AICounselor from './components/AICounselor';
import { Auth } from './components/Auth';
import Dashboard from './components/Dashboard';
import FloatingAddButton from './components/FloatingAddButton';
import { LoanDashboard } from './components/LoanDashboard';
import QuickAddModal from './components/QuickAddModal';
import TransactionList from './components/TransactionList';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import { Transaction } from './types';

export const AppRouter: React.FC = () => {
    const { user, loading } = useAuth();
    const { addTransaction } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

    const handleAddTransaction = (transaction: Partial<Transaction>) => {
        addTransaction(transaction as Transaction);
    };

    return (
        <>
            <Routes>
                <Route path="/" element={!user ? <Auth /> : <Navigate to="/dashboard" replace />} />

                <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
                <Route path="/transactions" element={user ? <TransactionList /> : <Navigate to="/" replace />} />
                <Route path="/loans" element={user ? <LoanDashboard /> : <Navigate to="/" replace />} />
                <Route path="/ai" element={user ? <AICounselor /> : <Navigate to="/" replace />} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {user && (
                <>
                    <FloatingAddButton onClick={() => setIsModalOpen(true)} />
                    <QuickAddModal 
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onAdd={handleAddTransaction}
                    />
                </>
            )}
        </>
    );
};
