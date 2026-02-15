'use client';

import { formatPrice } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  className?: string;
}

export const PieChart = ({ data, title, className = '' }: PieChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Cores padrão caso não sejam fornecidas
  const defaultColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ];

  // Adicionar cores aos dados se não tiverem
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length]
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return; // Não desenhar se não houver dados

    let currentAngle = -Math.PI / 2;

    chartData.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const isHovered = hoveredIndex === index;
      const drawRadius = isHovered ? radius + 10 : radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, drawRadius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Central circle (donut effect)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

  }, [chartData, hoveredIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = Math.min(centerX, centerY) - 20;

    if (distance <= radius && distance >= radius * 0.6) {
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += 2 * Math.PI;
      angle += Math.PI / 2;

      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      if (total === 0) return;

      let currentAngle = 0;

      for (let i = 0; i < chartData.length; i++) {
        const sliceAngle = (chartData[i].value / total) * 2 * Math.PI;
        if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
          setHoveredIndex(i);
          return;
        }
        currentAngle += sliceAngle;
      }
    }
    setHoveredIndex(null);
  };

  return (
    <div className={`card p-6 ${className}`}>
      {title && <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">{title}</h3>}
      
      <div className="flex flex-col md:flex-row items-center gap-6">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        />
        
        <div className="flex-1 space-y-2">
          {chartData.map((item, index) => (
            <div
              key={item.name}
              className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                hoveredIndex === index ? 'bg-neutral-100 dark:bg-neutral-700' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-neutral-900 dark:text-white">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-neutral-900 dark:text-white">
                  R$ {formatPrice(Number(item.value))}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {((item.value / chartData.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
