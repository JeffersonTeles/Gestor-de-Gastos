/**
 * Utilitários de validação e sanitização para segurança de dados
 */

import { Category, Transaction } from '../types';

// Sanitização de strings para prevenir XSS
export const sanitizeString = (input: string): string => {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < e > para prevenir tags HTML
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers (onclick=, onerror=, etc)
    .slice(0, 255); // Limita tamanho
};

// Validação de email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validação de valor monetário
export const isValidMoneyValue = (value: number): boolean => {
  return (
    typeof value === 'number' &&
    !isNaN(value) &&
    isFinite(value) &&
    value >= 0 &&
    value <= 999999999 // Limite máximo razoável
  );
};

// Validação de data
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// Validação de categoria
export const isValidCategory = (category: string): boolean => {
  return Object.values(Category).includes(category as Category);
};

// Validação de tipo de transação
export const isValidTransactionType = (type: string): boolean => {
  return type === 'income' || type === 'expense';
};

// Validação completa de transação
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const validateTransaction = (
  transaction: Partial<Transaction>
): ValidationResult => {
  const errors: string[] = [];

  // Descrição
  if (!transaction.description || transaction.description.trim().length === 0) {
    errors.push('Descrição é obrigatória');
  } else if (transaction.description.length > 255) {
    errors.push('Descrição muito longa (máximo 255 caracteres)');
  }

  // Valor
  if (transaction.value === undefined || transaction.value === null) {
    errors.push('Valor é obrigatório');
  } else if (!isValidMoneyValue(transaction.value)) {
    errors.push('Valor inválido (deve ser positivo e menor que R$ 999.999.999)');
  }

  // Tipo
  if (!transaction.type) {
    errors.push('Tipo é obrigatório');
  } else if (!isValidTransactionType(transaction.type)) {
    errors.push('Tipo inválido (deve ser "income" ou "expense")');
  }

  // Categoria
  if (!transaction.category) {
    errors.push('Categoria é obrigatória');
  } else if (!isValidCategory(transaction.category)) {
    errors.push('Categoria inválida');
  }

  // Data
  if (!transaction.date) {
    errors.push('Data é obrigatória');
  } else if (!isValidDate(transaction.date)) {
    errors.push('Data inválida');
  } else {
    // Verificar se data não está muito no futuro (mais de 1 ano)
    const date = new Date(transaction.date);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (date > oneYearFromNow) {
      errors.push('Data não pode ser mais de 1 ano no futuro');
    }

    // Verificar se data não está muito no passado (mais de 10 anos)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    
    if (date < tenYearsAgo) {
      errors.push('Data não pode ser mais de 10 anos no passado');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Sanitizar transação completa
export const sanitizeTransaction = (
  transaction: Partial<Transaction>
): Partial<Transaction> => {
  return {
    ...transaction,
    description: transaction.description
      ? sanitizeString(transaction.description)
      : '',
    value: transaction.value ? Math.abs(Number(transaction.value)) : 0,
    category: transaction.category || Category.Others,
    type: transaction.type || 'expense',
    date: transaction.date || new Date().toISOString().split('T')[0],
  };
};

// Rate limiting simples (client-side)
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  check(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remover tentativas antigas
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false; // Bloqueado
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true; // Permitido
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Validação de senha (para futuros recursos)
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// Detecção de padrões suspeitos
export const detectSuspiciousPatterns = (text: string): boolean => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /eval\(/i,
    /expression\(/i,
    /import\s+/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(text));
};

// Formatação segura de números
export const formatSafeNumber = (value: number): string => {
  if (!isValidMoneyValue(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
