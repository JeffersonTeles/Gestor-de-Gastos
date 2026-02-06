
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
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}
