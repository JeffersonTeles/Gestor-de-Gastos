'use client';

import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/hooks/useAuth';
import { useGoals } from '@/hooks/useGoals';
import { Goal } from '@/types/features';
import { useState } from 'react';

export default function GoalsPage() {
  const { user } = useAuth();
  const { goals, addGoal, deleteGoal, getGoalPercentage } = useGoals(user?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addGoal({
        user_id: user?.id,
        title,
        target_amount: Number(targetAmount),
        target_date: targetDate,
        priority,
        status: 'active',
        current_amount: 0,
      });
      setTitle('');
      setTargetAmount('');
      setTargetDate('');
      setPriority('medium');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar meta:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    };
    return colors[priority as keyof typeof colors];
  };

  return (
    <>
      <Topbar
        title="Metas Financeiras"
        subtitle="Estabeleça e acompanhe seus objetivos financeiros"
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary text-sm"
          >
            + Nova Meta
          </button>
        }
      />

      <div className="app-content bg-neutral-50 dark:bg-neutral-900 flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal: Goal) => {
            const percentage = getGoalPercentage(goal);
            const daysLeft = Math.ceil(
              (new Date(goal.target_date).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900 dark:text-white">
                      {goal.title}
                    </h3>
                    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mt-2 ${getPriorityColor(goal.priority)}`}>
                      {goal.priority === 'low' ? 'Baixa' : goal.priority === 'medium' ? 'Média' : 'Alta'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600 dark:text-neutral-400">Progresso</span>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-neutral-600 dark:text-neutral-400 text-xs">Atual</p>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        R$ {goal.current_amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-600 dark:text-neutral-400 text-xs">Meta</p>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        R$ {goal.target_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {daysLeft > 0
                        ? `${daysLeft} dias restantes`
                        : 'Prazo vencido'}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="flex-1 text-sm px-3 py-2 bg-danger-50 dark:bg-danger-900/30 text-danger-600 rounded-lg hover:bg-danger-100 dark:hover:bg-danger-900/50 transition-colors"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {goals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Nenhuma meta criada ainda
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
            >
              Criar primeira meta
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-neutral-900 dark:text-white">
              Nova Meta Financeira
            </h2>

            <form onSubmit={handleAddGoal} className="space-y-4">
              <input
                type="text"
                placeholder="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                required
              />

              <input
                type="number"
                placeholder="Valor alvo (R$)"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                required
              />

              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                required
              />

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              >
                <option value="low">Baixa prioridade</option>
                <option value="medium">Média prioridade</option>
                <option value="high">Alta prioridade</option>
              </select>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
