// User Types
export interface User {
  id: string;
  email: string;
  name?: string;
}

// Type aliases
export type TransactionType = 'income' | 'expense';

// Monthly Data for charts
export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

// Category Types
export interface Category {
  id: string;
  userId: string;
  name: string;
  type: string; // "income" | "expense" | "both"
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Loan Types
export interface Loan {
  id: string;
  userId: string;
  type: 'lent' | 'borrowed';
  amount: number;
  currency: string;
  person: string;
  description?: string;
  status: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  loanDate: Date;
  dueDate?: Date;
  returnDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  payments?: LoanPayment[];
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  paymentDate: Date;
  notes?: string;
  createdAt: Date;
}

// Bills Types
export interface Bill {
  id: string;
  userId: string;
  type: 'payable' | 'receivable';
  amount: number;
  currency: string;
  category: string;
  description: string;
  status: 'open' | 'paid' | 'overdue' | 'canceled';
  dueDate: Date;
  paidAt?: Date | null;
  notes?: string;
  recurrenceId?: string | null;
  recurrence?: BillRecurrence;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillRecurrence {
  id: string;
  userId: string;
  type: 'payable' | 'receivable';
  amount: number;
  currency: string;
  category: string;
  description: string;
  notes?: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  interval: number;
  startDate: Date;
  nextDueDate: Date;
  endDate?: Date | null;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export interface BillPayload {
  id?: string;
  type?: 'payable' | 'receivable';
  amount?: number;
  currency?: string;
  category?: string;
  description?: string;
  status?: 'open' | 'paid' | 'overdue' | 'canceled';
  dueDate?: Date | string;
  paidAt?: Date | null;
  notes?: string;
  recurrenceId?: string | null;
  recurrence?: {
    frequency: 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    endDate?: string;
  };
}

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  type: 'income' | 'expense';
  date: Date;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Budget Types
export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  month: Date;
}

// Analytics Types
export interface TransactionStats {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  byCategory: Record<string, { income: number; expense: number }>;
  byMonth: Record<string, { income: number; expense: number }>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Filter Types
export interface TransactionFilter {
  category?: string;
  type?: 'income' | 'expense';
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}
