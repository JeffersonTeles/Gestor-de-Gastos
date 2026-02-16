'use client';

import { Goal, GoalProgress } from '@/types/features';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useGoals(userId?: string) {
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/goals?user_id=${userId}`);
      if (!response.ok) throw new Error('Erro ao buscar metas');
      return response.json();
    },
    enabled: !!userId,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['goals-progress', userId],
    queryFn: async () => {
      const response = await fetch(`/api/goals/progress?user_id=${userId}`);
      if (!response.ok) throw new Error('Erro ao buscar progresso');
      return response.json();
    },
    enabled: !!userId,
  });

  const addGoal = useMutation({
    mutationFn: async (data: Partial<Goal>) => {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao criar meta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Goal> & { id: string }) => {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao atualizar meta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao deletar meta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const addProgress = useMutation({
    mutationFn: async (data: GoalProgress) => {
      const response = await fetch('/api/goals/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao registrar progresso');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-progress'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const getGoalProgress = (goalId: string) => {
    return progress.filter((p: GoalProgress) => p.goal_id === goalId);
  };

  const getGoalPercentage = (goal: Goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getGoalsNearDeadline = (days: number = 7) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return goals.filter((g: Goal) => {
      const targetDate = new Date(g.target_date);
      return targetDate <= futureDate && g.status === 'active';
    });
  };

  return {
    goals,
    progress,
    isLoading,
    addGoal: addGoal.mutateAsync,
    updateGoal: updateGoal.mutateAsync,
    deleteGoal: deleteGoal.mutateAsync,
    addProgress: addProgress.mutateAsync,
    getGoalProgress,
    getGoalPercentage,
    getGoalsNearDeadline,
  };
}
