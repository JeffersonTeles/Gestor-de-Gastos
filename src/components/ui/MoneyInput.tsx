'use client';

import { useState } from 'react';

interface MoneyInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const MoneyInput = ({
  value,
  onChange,
  label = 'Valor',
  error,
  disabled,
  autoFocus,
}: MoneyInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const formatMoney = (val: string): string => {
    // Remove tudo exceto números
    const numbers = val.replace(/\D/g, '');
    if (!numbers) return '';

    // Converte para centavos
    const cents = parseInt(numbers, 10);
    const reais = (cents / 100).toFixed(2);

    // Formata com separadores
    return reais.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatMoney(rawValue);
    onChange(formatted);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 text-lg font-semibold">
          R$
        </span>
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder="0,00"
          className={`w-full pl-14 pr-4 py-4 text-2xl font-bold rounded-xl border-2 transition-all ${
            error
              ? 'border-danger-300 focus:border-danger-500 bg-danger-50'
              : isFocused
              ? 'border-primary-500 bg-white dark:bg-neutral-800'
              : 'border-neutral-200 bg-neutral-50 dark:bg-neutral-700 dark:border-neutral-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {error && (
          <p className="mt-2 text-sm text-danger-600 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
