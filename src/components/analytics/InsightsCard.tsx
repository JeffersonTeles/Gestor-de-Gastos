'use client';

import { Insight } from '@/hooks/useInsights';

interface InsightsCardProps {
  insights: Insight[];
}

export const InsightsCard = ({ insights }: InsightsCardProps) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">💡 Insights Inteligentes</h3>
        <p className="text-sm text-neutral-500">Adicione mais transações para receber insights personalizados</p>
      </div>
    );
  }

  const typeStyles = {
    success: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800',
    warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800',
    danger: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800',
    info: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800',
  };

  const iconStyles = {
    success: 'text-success-600 dark:text-success-400',
    warning: 'text-warning-600 dark:text-warning-400',
    danger: 'text-danger-600 dark:text-danger-400',
    info: 'text-primary-600 dark:text-primary-400',
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">💡 Insights Automáticos</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`card p-4 border-2 ${typeStyles[insight.type]} transition-all hover:shadow-md animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start gap-3">
              <span className={`text-2xl ${iconStyles[insight.type]}`}>
                {insight.icon}
              </span>
              <div className="flex-1">
                <h4 className={`font-semibold mb-1 ${iconStyles[insight.type]}`}>
                  {insight.title}
                </h4>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {insight.message}
                </p>
                {insight.action && (
                  <button
                    onClick={insight.action.onClick}
                    className="mt-2 text-sm font-medium underline hover:no-underline"
                  >
                    {insight.action.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
