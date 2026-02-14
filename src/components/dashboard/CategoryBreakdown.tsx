'use client';

import { useMemo } from 'react';

interface CategoryBreakdownProps {
  transactions: any[];
  type?: 'expense' | 'income';
  currentMonth?: boolean;
}

export const CategoryBreakdown = ({ 
  transactions, 
  type = 'expense',
  currentMonth = true
}: CategoryBreakdownProps) => {
  const chartData = useMemo(() => {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    
    const filtered = transactions.filter((tx: any) => {
      if (tx.type !== type) return false;
      if (currentMonth && !tx.date.startsWith(currentMonthStr)) return false;
      return true;
    });

    const categoryMap: Record<string, number> = {};
    let total = 0;

    filtered.forEach((tx: any) => {
      const amount = Number(tx.amount) || 0;
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + amount;
      total += amount;
    });

    const categories = Object.entries(categoryMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: (amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { categories, total };
  }, [transactions, type, currentMonth]);

  if (chartData.categories.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center text-slate-500">
        Sem {type === 'expense' ? 'despesas' : 'receitas'} para mostrar
      </div>
    );
  }

  const colors = [
    'from-red-500 to-rose-600',
    'from-orange-500 to-amber-600',
    'from-amber-500 to-yellow-600',
    'from-lime-500 to-green-600',
    'from-emerald-500 to-teal-600',
    'from-cyan-500 to-blue-600',
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-fuchsia-500 to-pink-600',
    'from-rose-500 to-red-600',
  ];

  const size = 300;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 120;
  const innerRadius = 70;

  let currentAngle = -90;

  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-[var(--ink)]">
          {type === 'expense' ? '💸 Onde foi meu dinheiro?' : '💰 De onde veio meu dinheiro?'}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Distribuição por categoria {currentMonth ? 'neste mês' : 'total'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        {/* Donut Chart */}
        <div className="flex justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            {chartData.categories.map((cat, index) => {
              const angle = (cat.percentage / 100) * 360;
              const endAngle = currentAngle + angle;
              
              const startRad = (currentAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const x1 = centerX + radius * Math.cos(startRad);
              const y1 = centerY + radius * Math.sin(startRad);
              const x2 = centerX + radius * Math.cos(endRad);
              const y2 = centerY + radius * Math.sin(endRad);

              const x3 = centerX + innerRadius * Math.cos(endRad);
              const y3 = centerY + innerRadius * Math.sin(endRad);
              const x4 = centerX + innerRadius * Math.cos(startRad);
              const y4 = centerY + innerRadius * Math.sin(startRad);

              const largeArc = angle > 180 ? 1 : 0;

              const pathData = [
                `M ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                `L ${x3} ${y3}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
                'Z',
              ].join(' ');

              const colorClass = colors[index % colors.length];
              // Mapear cores para valores hexadecimais
              const colorMap: Record<string, [string, string]> = {
                'from-red-500 to-rose-600': ['#ef4444', '#e11d48'],
                'from-orange-500 to-amber-600': ['#f97316', '#d97706'],
                'from-amber-500 to-yellow-600': ['#f59e0b', '#ca8a04'],
                'from-lime-500 to-green-600': ['#84cc16', '#16a34a'],
                'from-emerald-500 to-teal-600': ['#10b981', '#0d9488'],
                'from-cyan-500 to-blue-600': ['#06b6d4', '#2563eb'],
                'from-blue-500 to-indigo-600': ['#3b82f6', '#4f46e5'],
                'from-violet-500 to-purple-600': ['#8b5cf6', '#9333ea'],
                'from-fuchsia-500 to-pink-600': ['#d946ef', '#db2777'],
                'from-rose-500 to-red-600': ['#f43f5e', '#dc2626'],
              };
              
              const [fromColor, toColor] = colorMap[colorClass] || ['#3b82f6', '#2563eb'];
              
              currentAngle = endAngle;

              return (
                <g key={cat.name}>
                  <defs>
                    <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={fromColor} />
                      <stop offset="100%" stopColor={toColor} />
                    </linearGradient>
                  </defs>
                  <path
                    d={pathData}
                    fill={`url(#gradient-${index})`}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <title>{cat.name}: R$ {cat.amount.toFixed(2)} ({cat.percentage.toFixed(1)}%)</title>
                  </path>
                </g>
              );
            })}

            {/* Center circle with total */}
            <circle
              cx={centerX}
              cy={centerY}
              r={innerRadius}
              fill="white"
              className="drop-shadow-lg"
            />
            <text
              x={centerX}
              y={centerY - 10}
              textAnchor="middle"
              className="text-xs fill-slate-500 transform rotate-90"
              style={{ transformOrigin: `${centerX}px ${centerY}px` }}
            >
              Total
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              className="text-lg font-bold fill-slate-900 transform rotate-90"
              style={{ transformOrigin: `${centerX}px ${centerY}px` }}
            >
              R$ {chartData.total.toFixed(0)}
            </text>
          </svg>
        </div>

        {/* Category List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {chartData.categories.map((cat, index) => {
            const colorClass = colors[index % colors.length];
            return (
              <div
                key={cat.name}
                className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colorClass} flex-shrink-0`} />
                  <span className="text-sm font-medium text-[var(--ink)] truncate">
                    {cat.name}
                  </span>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-sm font-semibold text-slate-900">
                    R$ {cat.amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {cat.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      {chartData.categories.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div className="flex-1">
              <p className="text-sm text-slate-700">
                <strong>{chartData.categories[0].name}</strong> é sua maior categoria de{' '}
                {type === 'expense' ? 'despesas' : 'receitas'}, representando{' '}
                <strong>{chartData.categories[0].percentage.toFixed(1)}%</strong> do total
                {currentMonth && ' este mês'}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
