'use client';

import { useMemo } from 'react';

interface MonthData {
  month: string;
  income: number;
  expense: number;
}

interface MonthComparisonChartProps {
  transactions: any[];
  monthsToShow?: number;
}

export const MonthComparisonChart = ({ 
  transactions, 
  monthsToShow = 6 
}: MonthComparisonChartProps) => {
  const chartData = useMemo(() => {
    const monthMap: Record<string, { income: number; expense: number }> = {};

    transactions.forEach((tx: any) => {
      const month = tx.date.substring(0, 7); // YYYY-MM
      if (!monthMap[month]) {
        monthMap[month] = { income: 0, expense: 0 };
      }
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        monthMap[month].income += amount;
      } else {
        monthMap[month].expense += amount;
      }
    });

    const months = Object.keys(monthMap).sort().slice(-monthsToShow);
    const data: MonthData[] = months.map((month) => ({
      month,
      income: monthMap[month].income,
      expense: monthMap[month].expense,
    }));

    return data;
  }, [transactions, monthsToShow]);

  if (chartData.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center text-slate-500">
        Sem dados suficientes para gerar o gráfico
      </div>
    );
  }

  const maxValue = Math.max(
    ...chartData.flatMap((d) => [d.income, d.expense]),
    100
  );

  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 60, left: 60 };
  const barWidth = (chartWidth - padding.left - padding.right) / (chartData.length * 2.5);
  const barGap = barWidth * 0.5;

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
  };

  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-[var(--ink)]">
          📊 Comparativo Mensal
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Receitas vs Despesas nos últimos {monthsToShow} meses
        </p>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="w-full h-auto"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((percent) => {
            const y = padding.top + (chartHeight - padding.top - padding.bottom) * (1 - percent);
            return (
              <g key={percent}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-slate-500"
                >
                  R$ {(maxValue * percent).toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {chartData.map((data, index) => {
            const x = padding.left + index * (barWidth * 2 + barGap);
            const incomeHeight = ((data.income / maxValue) * (chartHeight - padding.top - padding.bottom));
            const expenseHeight = ((data.expense / maxValue) * (chartHeight - padding.top - padding.bottom));

            return (
              <g key={data.month}>
                {/* Income bar */}
                <rect
                  x={x}
                  y={chartHeight - padding.bottom - incomeHeight}
                  width={barWidth}
                  height={incomeHeight}
                  className="fill-emerald-500 hover:fill-emerald-600 transition-colors cursor-pointer"
                  rx="4"
                >
                  <title>Receitas: R$ {data.income.toFixed(2)}</title>
                </rect>

                {/* Expense bar */}
                <rect
                  x={x + barWidth + 4}
                  y={chartHeight - padding.bottom - expenseHeight}
                  width={barWidth}
                  height={expenseHeight}
                  className="fill-amber-500 hover:fill-amber-600 transition-colors cursor-pointer"
                  rx="4"
                >
                  <title>Despesas: R$ {data.expense.toFixed(2)}</title>
                </rect>

                {/* Month label */}
                <text
                  x={x + barWidth}
                  y={chartHeight - padding.bottom + 20}
                  textAnchor="middle"
                  className="text-xs fill-slate-600 font-medium"
                >
                  {formatMonth(data.month)}
                </text>

                {/* Net value */}
                <text
                  x={x + barWidth}
                  y={chartHeight - padding.bottom + 35}
                  textAnchor="middle"
                  className={`text-xs font-semibold ${
                    data.income - data.expense >= 0 ? 'fill-emerald-700' : 'fill-red-600'
                  }`}
                >
                  {data.income - data.expense >= 0 ? '+' : ''}
                  {(data.income - data.expense).toFixed(0)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500"></div>
          <span className="text-sm text-slate-600">Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span className="text-sm text-slate-600">Despesas</span>
        </div>
      </div>
    </div>
  );
};
