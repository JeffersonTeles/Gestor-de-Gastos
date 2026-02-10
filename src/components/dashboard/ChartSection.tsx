'use client';

import { Transaction } from '@/lib/types';
import { formatMonth, groupByMonth } from '@/lib/utils';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface ChartSectionProps {
  transactions: Transaction[];
}

export const ChartSection = ({ transactions }: ChartSectionProps) => {
  const monthlyData = groupByMonth(transactions);

  if (monthlyData.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Nenhum dado para exibir no gráfico</p>
      </div>
    );
  }

  // Formatar dados para o gráfico
  const chartData = monthlyData.map(item => ({
    month: formatMonth(item.month),
    Receitas: item.income,
    Despesas: item.expense,
  }));

  return (
    <div className="max-w-md mx-auto px-4 py-6 bg-white rounded-xl border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Histórico Mensal</h3>
      
      <div className="w-full h-80 -mx-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
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
              formatter={(value) => [`R$ ${(value as number).toFixed(2)}`, '']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="Receitas" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
