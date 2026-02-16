'use client';

import { Transaction } from '@/types/index';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface TrendChartProps {
  transactions: Transaction[];
  period?: 'week' | 'month' | 'year';
}

export const TrendChart = ({ transactions, period = 'month' }: TrendChartProps) => {
  // Agrupar transações por período
  const groupedData = transactions.reduce((acc, tx) => {
    const date = new Date(tx.date);
    let key: string;

    if (period === 'week') {
      // Agrupar por dia
      key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else if (period === 'month') {
      // Agrupar por semana
      const weekNumber = Math.ceil(date.getDate() / 7);
      key = `Sem ${weekNumber}`;
    } else {
      // Agrupar por mês
      key = date.toLocaleDateString('pt-BR', { month: 'short' });
    }

    if (!acc[key]) {
      acc[key] = { income: 0, expense: 0 };
    }

    const amount = Number(tx.amount);
    if (tx.type === 'income') {
      acc[key].income += amount;
    } else {
      acc[key].expense += amount;
    }

    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  // Converter para array
  const chartData = Object.entries(groupedData).map(([period, data]) => ({
    period,
    Receitas: data.income,
    Despesas: data.expense,
    Saldo: data.income - data.expense,
  }));

  if (chartData.length === 0) {
    return (
      <div className="max-w-full sm:max-w-md mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Sem dados para o gráfico. Adicione transações para começar.</p>
      </div>
    );
  }

  return (
    <div className="max-w-full sm:max-w-md mx-auto px-4 py-6 bg-white rounded-xl border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Evolução Financeira</h3>
      
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="period"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={value => `R$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => {
                const numericValue = typeof value === 'number' ? value : Number(value || 0);
                return [`R$ ${numericValue.toFixed(2)}`, ''];
              }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Receitas"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Despesas"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Saldo"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
