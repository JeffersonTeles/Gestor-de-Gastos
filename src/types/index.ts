// User Types
export interface User {
  id: string;
  email: string;
  name?: string;
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
