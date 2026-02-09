import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import { LoanDashboard } from './components/LoanDashboard';
import AICounselor from './components/AICounselor';

export const AppRouter: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

    return (
        <Routes>
            <Route path="/" element={!user ? <Auth /> : <Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
            <Route path="/transactions" element={user ? <TransactionList /> : <Navigate to="/" replace />} />
            <Route path="/loans" element={user ? <LoanDashboard /> : <Navigate to="/" replace />} />
            <Route path="/ai" element={user ? <AICounselor /> : <Navigate to="/" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
