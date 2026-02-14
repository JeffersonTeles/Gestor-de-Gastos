// Exemplo de implementação completa com Twilio WhatsApp API
// Coloque este arquivo em: src/lib/whatsapp-twilio.ts

import { createClient } from '@supabase/supabase-js';

// Cliente Twilio
const twilioClient = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Envia mensagem via WhatsApp usando Twilio
 */
export async function sendWhatsAppMessage(to: string, message: string) {
  try {
    const response = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER, // Ex: whatsapp:+14155238886
      to: `whatsapp:${to}`,
      body: message
    });
    
    return {
      success: true,
      messageId: response.sid
    };
  } catch (error: any) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Processa mensagem recebida do webhook Twilio
 */
export async function processIncomingMessage(webhookData: any) {
  const from = webhookData.From?.replace('whatsapp:', ''); // Remove prefixo whatsapp:
  const messageBody = webhookData.Body;
  const messageSid = webhookData.MessageSid;
  
  // Buscar usuário pelo número
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_id, email')
    .eq('whatsapp_number', from)
    .single();
  
  if (!profile) {
    // Usuário não cadastrado
    await sendWhatsAppMessage(from, 
      '⚠️ *Número não cadastrado*\n\n' +
      'Para usar este bot, primeiro conecte seu WhatsApp no app:\n' +
      '1. Acesse o Dashboard\n' +
      '2. Role até "Integração WhatsApp"\n' +
      '3. Adicione este número: ' + from
    );
    return null;
  }
  
  return {
    userId: profile.user_id,
    phoneNumber: from,
    message: messageBody,
    messageSid
  };
}

/**
 * Registra transação vinda do WhatsApp
 */
export async function recordTransactionFromWhatsApp(
  userId: string,
  type: 'income' | 'expense',
  amount: number,
  description: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: type,
      amount: amount,
      description: description,
      category: 'WhatsApp', // Ou usar IA para categorizar
      date: new Date().toISOString(),
      source: 'whatsapp',
      currency: 'BRL'
    })
    .select()
    .single();
  
  if (error) {
    throw new Error('Erro ao salvar transação: ' + error.message);
  }
  
  return data;
}

/**
 * Busca resumo financeiro do mês
 */
export async function getMonthSummary(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .gte('date', startOfMonth.toISOString());
  
  const income = transactions
    ?.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) || 0;
  
  const expenses = transactions
    ?.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) || 0;
  
  return {
    income,
    expenses,
    balance: income - expenses,
    transactionCount: transactions?.length || 0
  };
}

/**
 * Formata mensagem de confirmação
 */
export function formatConfirmationMessage(
  type: 'income' | 'expense',
  amount: number,
  description: string
): string {
  const emoji = type === 'income' ? '💰' : '💸';
  const typeLabel = type === 'income' ? 'Receita' : 'Despesa';
  
  return `✅ *${typeLabel} registrada!*\n\n` +
    `${emoji} Valor: R$ ${amount.toFixed(2)}\n` +
    `📝 Descrição: ${description}\n` +
    `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\n` +
    `Digite "saldo" para ver o resumo do mês.`;
}

/**
 * Formata mensagem de saldo
 */
export function formatBalanceMessage(summary: {
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
}): string {
  const emoji = summary.balance >= 0 ? '💰' : '⚠️';
  const balanceStatus = summary.balance >= 0 ? '✅ Positivo' : '❌ Negativo';
  
  return `${emoji} *Resumo Financeiro - ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}*\n\n` +
    `💵 Receitas: R$ ${summary.income.toFixed(2)}\n` +
    `💸 Despesas: R$ ${summary.expenses.toFixed(2)}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `${balanceStatus}: R$ ${Math.abs(summary.balance).toFixed(2)}\n\n` +
    `📊 Total de transações: ${summary.transactionCount}`;
}

/**
 * Formata mensagem de erro
 */
export function formatErrorMessage(): string {
  return `❓ *Comando não reconhecido*\n\n` +
    `📱 *Comandos disponíveis:*\n\n` +
    `*Para registrar despesa:*\n` +
    `• despesa 50 mercado\n` +
    `• gastei 30 uber\n` +
    `• paguei 100 luz\n\n` +
    `*Para registrar receita:*\n` +
    `• receita 1000 salário\n` +
    `• recebi 200 freelance\n\n` +
    `*Para ver saldo:*\n` +
    `• saldo\n` +
    `• balanço\n` +
    `• quanto tenho\n\n` +
    `💡 Dica: Use valores sem vírgulas (ex: 50 em vez de 50,00)`;
}
