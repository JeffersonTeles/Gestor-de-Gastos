// Goals/Metas Financeiras

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  goal_id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Report {
  id: string;
  user_id: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  period_start: string;
  period_end: string;
  generated_at: string;
  summary: {
    total_income: number;
    total_expense: number;
    net: number;
    by_category: Record<string, number>;
  };
}

export interface BackupData {
  id: string;
  user_id: string;
  data: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface TwoFactorSettings {
  user_id: string;
  enabled: boolean;
  method: 'totp' | 'sms';
  secret?: string;
  backup_codes: string[];
  phone?: string;
  verified_at?: string;
  created_at: string;
}
