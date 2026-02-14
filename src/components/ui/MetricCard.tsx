'use client';

import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'danger' | 'warning';
  className?: string;
}

export const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'primary',
  className = '' 
}: MetricCardProps) => {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600 text-primary-600',
    success: 'from-success-500 to-success-600 text-success-600',
    danger: 'from-danger-500 to-danger-600 text-danger-600',
    warning: 'from-warning-500 to-warning-600 text-warning-600',
  };

  return (
    <div className={`card p-6 hover-lift transition-all-smooth ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-neutral-900 dark:text-white">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-2">
          <span className={`flex items-center text-sm font-medium ${trend.isPositive ? 'text-success-600' : 'text-danger-600'}`}>
            {trend.isPositive ? (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-sm text-neutral-500">vs mês anterior</span>
        </div>
      )}
    </div>
  );
};
