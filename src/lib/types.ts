// Tipos da aplicação
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface DashboardStats {
  total_balance: number;
  total_income: number;
  total_expense: number;
  transactions_count: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}
