// Utilities para formatação e cálculos
import { MonthlyData, Transaction, TransactionType } from '@/types/index';

/**
 * Formata número como moeda BRL
 * Exemplo: 100.5 → "R$ 100,50"
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formata apenas o número com vírgula (sem "R$ ")
 * Exemplo: 100.5 → "100,50"
 */
export const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formata data para DD/MM/YYYY
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
};

/**
 * Formata data completa: "5 de fevereiro de 2026"
 */
export const formatDateLong = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Retorna a data local no formato YYYY-MM-DD (para inputs date)
 * Corrige problema de UTC que adiciona 1 dia
 */
export const getTodayLocalDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Retorna o mês atual no formato YYYY-MM (para inputs month)
 */
export const getCurrentMonthLocal = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Converte Date para formato local YYYY-MM-DD
 */
export const formatDateLocal = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calcula saldo total das transações
 */
export const calculateBalance = (transactions: Transaction[]): number => {
  return transactions.reduce((acc, tx) => {
    return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
  }, 0);
};

/**
 * Calcula total de receitas
 */
export const calculateTotalIncome = (transactions: Transaction[]): number => {
  return transactions
    .filter(tx => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0);
};

/**
 * Calcula total de despesas
 */
export const calculateTotalExpense = (transactions: Transaction[]): number => {
  return transactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0);
};

/**
 * Agrupa transações por mês
 */
export const groupByMonth = (transactions: Transaction[]): MonthlyData[] => {
  const grouped: Record<string, MonthlyData> = {};

  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const month = date.toISOString().slice(0, 7); // YYYY-MM

    if (!grouped[month]) {
      grouped[month] = {
        month,
        income: 0,
        expense: 0,
      };
    }

    if (tx.type === 'income') {
      grouped[month].income += tx.amount;
    } else {
      grouped[month].expense += tx.amount;
    }
  });

  return Object.values(grouped)
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
};

/**
 * Formata mês de YYYY-MM para "Fevereiro"
 */
export const formatMonth = (month: string): string => {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

/**
 * Retorna cor baseada no tipo de transação
 */
export const getTypeColor = (type: TransactionType): string => {
  return type === 'income' ? 'text-green-600' : 'text-red-600';
};

/**
 * Retorna emoji baseado na categoria
 */
export const getCategoryEmoji = (category: string): string => {
  const emojis: Record<string, string> = {
    alimentação: '🍔',
    transporte: '🚗',
    saúde: '🏥',
    educação: '📚',
    diversão: '🎬',
    shopping: '🛍️',
    casa: '🏠',
    utilidades: '🔌',
    conta: '💳',
    salário: '💰',
    freelance: '💻',
    investimento: '📈',
    devolução: '🔄',
    outro: '📌',
  };

  return emojis[category.toLowerCase()] || '📌';
};

/**
 * Valida valor (deve ser positivo)
 */
export const isValidAmount = (value: number): boolean => {
  return !isNaN(value) && value > 0 && value < 1000000;
};

/**
 * Filtra transações dos últimos N dias
 */
export const getLastNDays = (
  transactions: Transaction[],
  days: number
): Transaction[] => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return transactions.filter(tx => new Date(tx.date) >= cutoff);
};

/**
 * Exporta transações para CSV e faz download
 */
export const exportToCSV = (transactions: Transaction[]): void => {
  const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
  const rows = transactions.map(tx => [
    formatDate(tx.date),
    tx.description,
    tx.category,
    tx.type === 'income' ? 'Receita' : 'Despesa',
    formatCurrency(tx.amount),
  ]);

  // Adiciona cabeçalhos
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Cria blob e dispara download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `transacoes_${date}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
