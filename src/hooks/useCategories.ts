'use client';

import { useCallback, useEffect, useState } from 'react';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const DEFAULT_CATEGORIES: Category[] = [
    { id: 'exp-food', userId: 'demo', name: 'Alimentação', type: 'expense', icon: '🍔', color: '#ef4444', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'exp-transport', userId: 'demo', name: 'Transporte', type: 'expense', icon: '🚗', color: '#f97316', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'exp-health', userId: 'demo', name: 'Saúde', type: 'expense', icon: '🏥', color: '#ec4899', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'exp-edu', userId: 'demo', name: 'Educação', type: 'expense', icon: '📚', color: '#8b5cf6', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'exp-fun', userId: 'demo', name: 'Diversão', type: 'expense', icon: '🎮', color: '#6366f1', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'exp-shop', userId: 'demo', name: 'Shopping', type: 'expense', icon: '🛍️', color: '#06b6d4', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'exp-home', userId: 'demo', name: 'Casa', type: 'expense', icon: '🏠', color: '#14b8a6', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'exp-utils', userId: 'demo', name: 'Utilidades', type: 'expense', icon: '💡', color: '#10b981', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'exp-bills', userId: 'demo', name: 'Conta', type: 'expense', icon: '📄', color: '#84cc16', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'exp-other', userId: 'demo', name: 'Outro', type: 'expense', icon: '📌', color: '#64748b', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'inc-salary', userId: 'demo', name: 'Salário', type: 'income', icon: '💰', color: '#22c55e', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'inc-freelance', userId: 'demo', name: 'Freelance', type: 'income', icon: '💼', color: '#10b981', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'inc-invest', userId: 'demo', name: 'Investimento', type: 'income', icon: '📈', color: '#14b8a6', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'inc-refund', userId: 'demo', name: 'Devolução', type: 'income', icon: '🔄', color: '#06b6d4', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'inc-other', userId: 'demo', name: 'Outro', type: 'income', icon: '✨', color: '#64748b', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  ];

  // Buscar categorias
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured) {
        setCategories(DEFAULT_CATEGORIES);
        return;
      }

      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Erro ao buscar categorias');

      const data = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar categorias');
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar ao montar
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Adicionar categoria
  const addCategory = useCallback(
    async (category: Omit<Category, 'id' | 'userId' | 'isDefault' | 'createdAt' | 'updatedAt'>) => {
      try {
        setError(null);

        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(category),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar categoria');
        }

        const data = await response.json();
        setCategories(prev => [...prev, data]);
        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao adicionar categoria');
        throw err;
      }
    },
    []
  );

  // Deletar categoria
  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        setError(null);

        const response = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao deletar categoria');
        }

        setCategories(prev => prev.filter(c => c.id !== id));
      } catch (err: any) {
        setError(err.message || 'Erro ao deletar categoria');
        throw err;
      }
    },
    []
  );

  // Atualizar categoria
  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      try {
        setError(null);

        const response = await fetch(`/api/categories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar categoria');
        }

        const data = await response.json();
        setCategories(prev =>
          prev.map(c => (c.id === id ? data : c))
        );

        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao atualizar categoria');
        throw err;
      }
    },
    []
  );

  // Helpers
  const getCategoriesByType = (type: 'income' | 'expense') => {
    return categories.filter(c => c.type === type || c.type === 'both');
  };

  return {
    categories,
    loading,
    error,
    addCategory,
    deleteCategory,
    updateCategory,
    getCategoriesByType,
    refetch: fetchCategories,
  };
};
