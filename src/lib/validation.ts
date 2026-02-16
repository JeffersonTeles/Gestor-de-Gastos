/**
 * Sistema de Validação Avançado com Zod
 * Previne dados inválidos antes de enviar ao Supabase
 */

import { z } from 'zod';

// Schema para Transaction
export const TransactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Tipo deve ser "income" ou "expense"' }),
  }),
  amount: z
    .number({
      required_error: 'Valor é obrigatório',
      invalid_type_error: 'Valor deve ser um número',
    })
    .positive('Valor deve ser maior que zero')
    .max(999999999, 'Valor muito alto (máximo R$ 999.999.999)'),
  category: z
    .string({
      required_error: 'Categoria é obrigatória',
    })
    .min(1, 'Categoria não pode estar vazia')
    .max(50, 'Categoria muito longa'),
  description: z
    .string({
      required_error: 'Descrição é obrigatória',
    })
    .min(3, 'Descrição muito curta (mínimo 3 caracteres)')
    .max(255, 'Descrição muito longa (máximo 255 caracteres)')
    .transform((val) => val.trim()), // Remove espaços extras
  date: z
    .string({
      required_error: 'Data é obrigatória',
    })
    .datetime({ message: 'Data inválida' })
    .refine(
      (date) => {
        const d = new Date(date);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 5);
        const oneYearFuture = new Date();
        oneYearFuture.setFullYear(oneYearFuture.getFullYear() + 1);
        return d >= oneYearAgo && d <= oneYearFuture;
      },
      { message: 'Data deve estar entre 5 anos atrás e 1 ano no futuro' }
    ),
  tags: z
    .array(z.string().max(30, 'Tag muito longa'))
    .max(10, 'Máximo 10 tags')
    .optional(),
  notes: z
    .string()
    .max(500, 'Notas muito longas (máximo 500 caracteres)')
    .optional()
    .transform((val) => val?.trim() || null),
});

export type TransactionInput = z.infer<typeof TransactionSchema>;

// Schema para Budget
export const BudgetSchema = z.object({
  category: z.string().min(1, 'Categoria é obrigatória'),
  limit: z
    .number()
    .positive('Limite deve ser maior que zero')
    .max(999999999, 'Limite muito alto'),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  alertThreshold: z
    .number()
    .min(0, 'Alerta deve ser no mínimo 0%')
    .max(100, 'Alerta deve ser no máximo 100%')
    .optional(),
});

// Schema para Bill
export const BillSchema = z.object({
  name: z.string().min(3, 'Nome muito curto').max(100, 'Nome muito longo'),
  amount: z.number().positive('Valor deve ser maior que zero'),
  dueDate: z.string().datetime(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  isPaid: z.boolean().default(false),
  recurrence: z.enum(['none', 'monthly', 'yearly']).optional(),
});

// Função helper para validação com mensagens customizadas
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => err.message);
      return { success: false, errors };
    }
    return { success: false, errors: ['Erro de validação desconhecido'] };
  }
};

// Sanitização para prevenir XSS
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/[<>\"']/g, (char) => {
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
      };
      return map[char];
    })
    .trim();
};

// Validação de email
export const EmailSchema = z
  .string()
  .email('Email inválido')
  .max(255, 'Email muito longo');

// Validação de senha forte
export const PasswordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial');
