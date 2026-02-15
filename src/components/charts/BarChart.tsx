'use client';

import { formatPrice } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface BarChartData {
  label: string;
  income: number;
  expense: number;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  className?: string;
}

export const BarChart = ({ data, title, className = '' }: BarChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (data.length === 0) return;

    // Validar e garantir que todos os valores são números
    const validData = data.map(d => ({
      ...d,
      income: Number(d.income) || 0,
      expense: Number(d.expense) || 0
    }));

    const maxValue = Math.max(...validData.map(d => Math.max(d.income, d.expense)), 1); // Evitar divisão por zero
    const barWidth = (chartWidth / validData.length) * 0.8;
    const barSpacing = (chartWidth / validData.length) * 0.2;

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();

      // Y-axis labels
      const value = maxValue - (maxValue / 5) * i;
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`R$ ${value.toFixed(0)}`, padding - 10, y + 4);
    }

    // Draw bars
    validData.forEach((item, index) => {
      const x = padding + (chartWidth / validData.length) * index + barSpacing / 2;
      const incomeHeight = (item.income / maxValue) * chartHeight;
      const expenseHeight = (item.expense / maxValue) * chartHeight;

      const isHovered = hoveredIndex === index;
      const opacity = isHovered ? 1 : 0.8;

      // Income bar
      ctx.fillStyle = `rgba(34, 197, 94, ${opacity})`;
      ctx.fillRect(
        x,
        padding + chartHeight - incomeHeight,
        barWidth / 2 - 2,
        incomeHeight
      );

      // Expense bar
      ctx.fillStyle = `rgba(239, 68, 68, ${opacity})`;
      ctx.fillRect(
        x + barWidth / 2 + 2,
        padding + chartHeight - expenseHeight,
        barWidth / 2 - 2,
        expenseHeight
      );

      // X-axis labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, canvas.height - padding + 20);
    });

  }, [data, hoveredIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const barGroupWidth = chartWidth / data.length;

    const index = Math.floor((x - padding) / barGroupWidth);
    if (index >= 0 && index < data.length) {
      setHoveredIndex(index);
    } else {
      setHoveredIndex(null);
    }
  };

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        {title && <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{title}</h3>}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success-500 rounded"></div>
            <span className="text-neutral-600 dark:text-neutral-400">Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-danger-500 rounded"></div>
            <span className="text-neutral-600 dark:text-neutral-400">Despesas</span>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          className="w-full cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        />
        
        {hoveredIndex !== null && (
          <div className="absolute bg-neutral-900 dark:bg-neutral-700 text-white px-4 py-3 rounded-lg shadow-lg text-sm"
            style={{
              left: `${((hoveredIndex + 0.5) / data.length) * 100}%`,
              top: '20px',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-semibold mb-2">{data[hoveredIndex].label}</div>
            <div className="flex gap-4">
              <div>
                <div className="text-xs text-neutral-400">Receitas</div>
                <div className="text-success-400 font-bold">R$ {formatPrice(Number(data[hoveredIndex].income))}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Despesas</div>
                <div className="text-danger-400 font-bold">R$ {formatPrice(Number(data[hoveredIndex].expense))}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
