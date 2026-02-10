'use client';

import { Transaction } from '@/lib/types';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryChartProps {
  transactions: Transaction[];
  type?: 'income' | 'expense' | 'all';
}

export const CategoryChart = ({ transactions, type = 'all' }: CategoryChartProps) => {
  // Filtrar por tipo se necessário
  const filteredTransactions = type === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === type);

  // Agrupar por categoria
  const categoryData = filteredTransactions.reduce((acc, tx) => {
    const amount = Math.abs(Number(tx.amount));
    if (!acc[tx.category]) {
      acc[tx.category] = 0;
    }
    acc[tx.category] += amount;
    return acc;
  }, {} as Record<string, number>);

  // Converter para array e ordenar
  const chartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 categorias

  if (chartData.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Sem dados para o gráfico. Adicione transações para começar.</p>
      </div>
    );
  }

  // Cores para o gráfico
  const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16', // lime
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="max-w-md mx-auto px-4 py-6 bg-white rounded-xl border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {type === 'income' ? 'Receitas' : type === 'expense' ? 'Despesas' : 'Transações'} por Categoria
      </h3>
      
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent ? percent * 100 : 0).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const numericValue = typeof value === 'number' ? value : Number(value || 0);
                return [
                  `R$ ${numericValue.toFixed(2)} (${((numericValue / total) * 100).toFixed(1)}%)`,
                  '',
                ];
              }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Lista detalhada */}
      <div className="mt-6 space-y-2">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">
                R$ {item.value.toFixed(2)}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                ({((item.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">Total</span>
          <span className="text-lg font-bold text-gray-900">
            R$ {total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
