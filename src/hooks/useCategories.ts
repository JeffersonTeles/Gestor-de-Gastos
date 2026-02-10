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

  // Buscar categorias
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Erro ao buscar categorias');

      const data = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar categorias');
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
