'use client';

import { useEffect, useRef, useState } from 'react';

interface LineChartData {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartData[];
  title?: string;
  color?: string;
  className?: string;
}

export const LineChart = ({ data, title, color = '#3b82f6', className = '' }: LineChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (data.length === 0) return;

    // Validar e garantir que todos os valores são números
    const validData = data.map(d => ({
      ...d,
      value: Number(d.value) || 0
    }));

    const maxValue = Math.max(...validData.map(d => d.value), 0);
    const minValue = Math.min(...validData.map(d => d.value), 0);
    const valueRange = Math.max(maxValue - minValue, 1); // Evitar divisão por zero

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
      const value = maxValue - (valueRange / 5) * i;
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`R$ ${value.toFixed(0)}`, padding - 10, y + 4);
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();

    validData.forEach((point, index) => {
      const x = padding + (chartWidth / (validData.length - 1)) * index;
      const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw gradient fill
    ctx.lineTo(canvas.width - padding, padding + chartHeight);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw points
    validData.forEach((point, index) => {
      const x = padding + (chartWidth / (validData.length - 1)) * index;
      const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, hoveredIndex === index ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // X-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    validData.forEach((point, index) => {
      const x = padding + (chartWidth / (validData.length - 1)) * index;
      ctx.fillText(point.label, x, canvas.height - padding + 20);
    });

  }, [data, color, hoveredIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const segmentWidth = chartWidth / (data.length - 1);

    const index = Math.round((x - padding) / segmentWidth);
    if (index >= 0 && index < data.length) {
      setHoveredIndex(index);
    } else {
      setHoveredIndex(null);
    }
  };

  return (
    <div className={`card p-6 ${className}`}>
      {title && <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">{title}</h3>}
      
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
          <div className="absolute bg-neutral-900 dark:bg-neutral-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm"
            style={{
              left: `${((hoveredIndex / (data.length - 1)) * 100)}%`,
              top: '20px',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-semibold">{data[hoveredIndex].label}</div>
            <div className="text-xs">R$ {data[hoveredIndex].value.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  );
};
