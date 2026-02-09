import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
    transactions: Transaction[];
    loading: boolean;
    isSynced: boolean;
    addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
    updateTransaction: (t: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
    sync: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isDemo } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSynced, setIsSynced] = useState(true);

    const loadData = useCallback(async () => {
        if (!user) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        if (isDemo) {
            const stored = localStorage.getItem('demo_transactions');
            if (stored) {
                setTransactions(JSON.parse(stored));
            } else {
                // Initial demo data
                const initial: Transaction[] = [
                    { id: '1', description: 'Salário', value: 5000, type: 'income', category: 'Salário', date: new Date().toISOString().split('T')[0] } as any,
                    { id: '2', description: 'Aluguel', value: 1200, type: 'expense', category: 'Moradia', date: new Date().toISOString().split('T')[0] } as any,
                ];
                setTransactions(initial);
                localStorage.setItem('demo_transactions', JSON.stringify(initial));
            }
            setLoading(false);
            return;
        }

        // Real Supabase Data
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) throw error;
            if (data) setTransactions(data);
        } catch (err) {
            console.error('Error loading Supabase data', err);
        } finally {
            setLoading(false);
        }
    }, [user, isDemo]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addTransaction = async (t: Omit<Transaction, 'id'>) => {
        const newTx = { ...t, id: crypto.randomUUID(), user_id: user?.id } as Transaction;

        if (isDemo) {
            const updated = [newTx, ...transactions];
            setTransactions(updated);
            localStorage.setItem('demo_transactions', JSON.stringify(updated));
            return;
        }

        // Optimistic Update
        setTransactions(prev => [newTx, ...prev]);
        setIsSynced(false);

        if (supabase && user) {
            const { error } = await supabase.from('transactions').insert([{
                ...newTx,
                source_rule_id: undefined, // Cleanup if undefined
                dedupe_key: undefined
            }]);
            if (!error) setIsSynced(true);
            else console.error(error);
        }
    };

    const updateTransaction = async (t: Transaction) => {
        if (isDemo) {
            const updated = transactions.map(tr => tr.id === t.id ? t : tr);
            setTransactions(updated);
            localStorage.setItem('demo_transactions', JSON.stringify(updated));
            return;
        }

        setTransactions(prev => prev.map(tr => tr.id === t.id ? t : tr));
        setIsSynced(false);

        if (supabase && user) {
            const { error } = await supabase.from('transactions').update({
                description: t.description,
                value: t.value,
                category: t.category,
                type: t.type,
                date: t.date
            }).eq('id', t.id);
            if (!error) setIsSynced(true);
        }
    };

    const deleteTransaction = async (id: string) => {
        if (isDemo) {
            const updated = transactions.filter(tr => tr.id !== id);
            setTransactions(updated);
            localStorage.setItem('demo_transactions', JSON.stringify(updated));
            return;
        }

        setTransactions(prev => prev.filter(tr => tr.id !== id));
        setIsSynced(false);

        if (supabase && user) {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (!error) setIsSynced(true);
        }
    };

    return (
        <DataContext.Provider value={{ transactions, loading, isSynced, addTransaction, updateTransaction, deleteTransaction, refresh: loadData, sync: loadData }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("useData must be used within DataProvider");
    return context;
};
