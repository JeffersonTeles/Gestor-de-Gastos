'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, className = '', ...props }, ref) => {
    const baseStyles =
      'font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-offset-2';

    const variants = {
      primary:
        'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500 text-white shadow-[0_16px_28px_rgba(13,148,136,0.35)] hover:translate-y-[-1px] hover:shadow-[0_18px_32px_rgba(13,148,136,0.4)]',
      secondary:
        'bg-white text-slate-700 border border-slate-200 shadow-[0_12px_26px_rgba(15,23,42,0.08)] hover:border-slate-300 hover:text-slate-900',
      danger:
        'bg-red-600 text-white shadow-[0_14px_26px_rgba(220,38,38,0.25)] hover:bg-red-700',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? '...' : props.children}
      </button>
    );
  }
);

Button.displayName = 'Button';
