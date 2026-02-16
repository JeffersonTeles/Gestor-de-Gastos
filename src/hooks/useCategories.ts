'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const CATEGORIES_QUERY_KEY = 'categories';

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
  const queryClient = useQueryClient();
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

  // Fetch com cache React Query (categorias mudam raramente, cache maior)
  const { data: categories = [], isLoading: loading, error } = useQuery({
    queryKey: [CATEGORIES_QUERY_KEY],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return DEFAULT_CATEGORIES;
      }

      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Erro ao buscar categorias');
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hora (categorias mudam pouco)
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
    retry: 1,
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'userId' | 'isDefault' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar categoria');
      }

      return response.json();
    },
    onSuccess: (newCategory) => {
      queryClient.setQueryData([CATEGORIES_QUERY_KEY], (old: Category[]) => 
        [...(old || []), newCategory]
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar categoria');
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData([CATEGORIES_QUERY_KEY], (old: Category[]) => 
        (old || []).filter(c => c.id !== id)
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar categoria');
      }

      return response.json();
    },
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData([CATEGORIES_QUERY_KEY], (old: Category[]) => 
        (old || []).map(c => c.id === updatedCategory.id ? updatedCategory : c)
      );
    },
  });

  // Helpers
  const getCategoriesByType = (type: 'income' | 'expense') => {
    return categories.filter((c: Category) => c.type === type || c.type === 'both');
  };

  return {
    categories,
    loading,
    error: error?.message || null,
    addCategory: addMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    updateCategory: (id: string, updates: Partial<Category>) => 
      updateMutation.mutateAsync({ id, updates }),
    getCategoriesByType,
    refetch: () => queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] }),
  };
};
