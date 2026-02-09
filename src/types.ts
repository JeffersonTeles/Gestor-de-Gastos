
export type TransactionType = 'income' | 'expense';

export enum Category {
  Food = 'Alimentação',
  Transport = 'Transporte',
  Housing = 'Moradia',
  Leisure = 'Lazer',
  Salary = 'Salário',
  Health = 'Saúde',
  Education = 'Educação',
  Investment = 'Investimento',
  Loan = 'Empréstimo',
  Others = 'Outros'
}

export interface Transaction {
  id: string;
  description: string;
  value: number;
  type: TransactionType;
  category: Category;
  date: string;
  user_id?: string;
  embedding?: number[];
  source_rule_id?: string;
  dedupe_key?: string;
  tags?: string[]; // Tags personalizadas
  attachment_url?: string; // URL do comprovante no Supabase Storage
  notes?: string; // Notas adicionais
  is_recurring?: boolean; // Transação recorrente
  recurring_frequency?: 'monthly' | 'weekly' | 'yearly'; // Frequência
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}
