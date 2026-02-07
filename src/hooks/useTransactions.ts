import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction, AuthSession } from '../types';

export const useTransactions = (session: AuthSession | null) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSynced, setIsSynced] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [dbError, setDbError] = useState<string | null>(null);

    const initAppData = useCallback(async (userId: string) => {
        const cached = localStorage.getItem(`gestor_mesmo_cache_${userId}`);
        if (cached) {
            try {
                setTransactions(JSON.parse(cached));
            } catch (e) {
                console.error("Cache local corrompido");
            }
        }
        await fetchData(userId);
    }, []);

    const fetchData = useCallback(async (userId: string) => {
        setIsRefreshing(true);
        setDbError(null);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false });

            if (error) throw error;

            if (data) {
                setTransactions(data);
                localStorage.setItem(`gestor_mesmo_cache_${userId}`, JSON.stringify(data));
                setIsSynced(true);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            console.error("Erro ao buscar dados do Supabase:", err);
            setDbError(`Falha na conexão: ${errorMessage}`);
            setIsSynced(false);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (session?.user) {
            initAppData(session.user.id);
        } else {
            setTransactions([]);
            setLoading(false);
        }
    }, [session, initAppData]);

    const prepareForDB = (t: Partial<Transaction>, userId: string) => {
        return {
            id: t.id || crypto.randomUUID(),
            user_id: userId,
            date: t.date,
            description: String(t.description),
            category: t.category,
            value: Number(t.value),
            type: t.type,
            source_rule_id: t.source_rule_id || null,
            dedupe_key: t.dedupe_key || null
        };
    };

    const sync = async () => {
        if (!session?.user || transactions.length === 0) return;
        setIsRefreshing(true);
        setDbError(null);
        try {
            const sanitizedData = transactions.map(t => prepareForDB(t, session.user.id));
            const { error } = await supabase
                .from('transactions')
                .upsert(sanitizedData, { onConflict: 'id' });

            if (error) throw error;

            setIsSynced(true);
            await fetchData(session.user.id);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            console.error("Erro na sincronização:", err);
            setDbError(`Erro ao sincronizar: ${errorMessage}`);
        } finally {
            setIsRefreshing(false);
        }
    };

    const addTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
        if (!session?.user) return;

        const tempId = crypto.randomUUID();
        const transactionToSave = {
            ...newTransaction,
            id: tempId,
            user_id: session.user.id
        } as Transaction;

        setTransactions(prev => [transactionToSave, ...prev]);
        setIsSynced(false);

        try {
            const dbPayload = prepareForDB(transactionToSave, session.user.id);
            const { data, error } = await supabase
                .from('transactions')
                .insert([dbPayload])
                .select();

            if (error) throw error;

            if (data) {
                setTransactions(prev => prev.map(t => t.id === tempId ? data[0] : t));
                setIsSynced(true);
                const updatedList = [data[0], ...transactions.filter(t => t.id !== tempId)];
                localStorage.setItem(`gestor_mesmo_cache_${session.user.id}`, JSON.stringify(updatedList));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            console.error("Erro ao salvar no banco:", errorMessage);
            setDbError(`Erro ao salvar: ${errorMessage}`);
        }
    };

    const updateTransaction = async (updated: Transaction) => {
        if (!session?.user) return;

        setIsSynced(false);
        setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));

        try {
            const dbPayload = prepareForDB(updated, session.user.id);
            const { error } = await supabase
                .from('transactions')
                .update(dbPayload)
                .eq('id', updated.id)
                .eq('user_id', session.user.id);

            if (error) throw error;
            setIsSynced(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            console.error("Erro ao atualizar:", errorMessage);
            setDbError(`Erro ao atualizar: ${errorMessage}`);
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!session?.user) return;

        setIsSynced(false);
        const previousTransactions = [...transactions];
        setTransactions(prev => prev.filter(t => t.id !== id));

        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)
                .eq('user_id', session.user.id);

            if (error) throw error;
            setIsSynced(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            console.error("Erro ao deletar:", errorMessage);
            setTransactions(previousTransactions);
            setDbError(`Erro ao deletar: ${errorMessage}`);
        }
    };

    return {
        transactions,
        loading,
        isSynced,
        isRefreshing,
        dbError,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        refresh: () => fetchData(session.user.id),
        sync
    };
};
