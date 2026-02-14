'use client';

import { Prediction } from '@/hooks/usePredictions';

interface PredictionsCardProps {
  predictions: Prediction[];
}

export const PredictionsCard = ({ predictions }: PredictionsCardProps) => {
  if (!predictions || predictions.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">🔮 Previsões</h3>
        <p className="text-sm text-neutral-500">Adicione transações de pelo menos 2 meses para gerar previsões</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">🔮 Previsões Futuras</h3>
        <span className="text-xs text-neutral-500">Baseado nos últimos 3 meses</span>
      </div>
      
      <div className="space-y-4">
        {predictions.map((pred, index) => {
          const balance = pred.predictedIncome - pred.predictedExpense;
          const isPositive = balance >= 0;

          return (
            <div
              key={pred.month}
              className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 animate-slide-in-right"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-white capitalize">
                    {pred.month}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    pred.confidence >= 80 
                      ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' 
                      : 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400'
                  }`}>
                    {pred.confidence}% confiança
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Receitas</div>
                  <div className="text-sm font-bold text-success-600 dark:text-success-400">
                    R$ {pred.predictedIncome.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Despesas</div>
                  <div className="text-sm font-bold text-danger-600 dark:text-danger-400">
                    R$ {pred.predictedExpense.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Saldo</div>
                  <div className={`text-sm font-bold ${
                    isPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                  }`}>
                    {isPositive ? '+' : '-'}R$ {Math.abs(balance).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Barra de progresso visual */}
              <div className="mt-3 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-success-500 to-danger-500 transition-all"
                  style={{ 
                    width: `${Math.min(100, (pred.predictedExpense / pred.predictedIncome) * 100)}%` 
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
        <p className="text-xs text-primary-700 dark:text-primary-400">
          💡 <strong>Dica:</strong> As previsões são baseadas em seu histórico recente e podem variar conforme seus hábitos de consumo.
        </p>
      </div>
    </div>
  );
};
