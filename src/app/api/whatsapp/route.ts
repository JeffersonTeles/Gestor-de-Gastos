import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface ParsedCommand {
  type: 'expense' | 'income' | 'balance' | 'unknown';
  amount?: number;
  description?: string;
}

// Parser de comandos do WhatsApp
function parseCommand(message: string): ParsedCommand {
  const lowerMessage = message.toLowerCase().trim();
  
  // Comandos de despesa: "despesa 50 mercado", "gasto 50 mercado", "paguei 50 mercado"
  const expensePatterns = [
    /(?:despesa|gasto|paguei|gastei)\s+(\d+(?:[.,]\d+)?)\s+(.+)/i,
    /(\d+(?:[.,]\d+)?)\s+(?:em|para|no|na)\s+(.+)/i
  ];
  
  for (const pattern of expensePatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        type: 'expense',
        amount: parseFloat(match[1].replace(',', '.')),
        description: match[2].trim()
      };
    }
  }
  
  // Comandos de receita: "receita 1000 salário", "recebi 1000 salário"
  const incomePatterns = [
    /(?:receita|recebi|ganho|ganhei)\s+(\d+(?:[.,]\d+)?)\s+(.+)/i
  ];
  
  for (const pattern of incomePatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        type: 'income',
        amount: parseFloat(match[1].replace(',', '.')),
        description: match[2].trim()
      };
    }
  }
  
  // Comando de saldo
  if (lowerMessage.includes('saldo') || lowerMessage.includes('balanço') || lowerMessage.includes('quanto')) {
    return { type: 'balance' };
  }
  
  return { type: 'unknown' };
}

// Formatar resposta de saldo
function formatBalanceResponse(income: number, expenses: number): string {
  const balance = income - expenses;
  const emoji = balance >= 0 ? '💰' : '⚠️';
  
  return `${emoji} *Resumo Financeiro*\n\n` +
    `💵 Receitas: R$ ${income.toFixed(2)}\n` +
    `💸 Despesas: R$ ${expenses.toFixed(2)}\n` +
    `${balance >= 0 ? '✅' : '❌'} Saldo: R$ ${balance.toFixed(2)}`;
}

// Webhook do WhatsApp (simulado)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId } = body as { message: string; userId: string };
    
    if (!message || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Criar cliente Supabase (em produção, usar variáveis de ambiente)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    const command = parseCommand(message);
    
    let responseMessage = '';
    
    switch (command.type) {
      case 'expense':
        // Adicionar despesa
        const { error: expenseError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'expense',
            amount: command.amount,
            description: command.description,
            category_id: null, // Pode ser melhorado com IA para categorizar
            date: new Date().toISOString(),
            source: 'whatsapp'
          })
          .select()
          .single();
        
        if (expenseError) throw expenseError;
        
        responseMessage = `✅ *Despesa registrada!*\n\n` +
          `💸 Valor: R$ ${command.amount?.toFixed(2)}\n` +
          `📝 Descrição: ${command.description}\n` +
          `📅 Data: ${new Date().toLocaleDateString('pt-BR')}`;
        break;
      
      case 'income':
        // Adicionar receita
        const { error: incomeError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'income',
            amount: command.amount,
            description: command.description,
            category_id: null,
            date: new Date().toISOString(),
            source: 'whatsapp'
          })
          .select()
          .single();
        
        if (incomeError) throw incomeError;
        
        responseMessage = `✅ *Receita registrada!*\n\n` +
          `💵 Valor: R$ ${command.amount?.toFixed(2)}\n` +
          `📝 Descrição: ${command.description}\n` +
          `📅 Data: ${new Date().toLocaleDateString('pt-BR')}`;
        break;
      
      case 'balance':
        // Calcular saldo
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { data: transactions, error: balanceError } = await supabase
          .from('transactions')
          .select('type, amount')
          .eq('user_id', userId)
          .gte('date', startOfMonth.toISOString());
        
        if (balanceError) throw balanceError;
        
        const income = transactions
          ?.filter((t: any) => t.type === 'income')
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0;
        
        const expenses = transactions
          ?.filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0;
        
        responseMessage = formatBalanceResponse(income, expenses);
        break;
      
      default:
        responseMessage = `❓ *Comando não reconhecido*\n\n` +
          `Tente:\n` +
          `• \`despesa 50 mercado\` - Para registrar despesa\n` +
          `• \`receita 1000 salário\` - Para registrar receita\n` +
          `• \`saldo\` - Para ver o resumo do mês`;
    }
    
    // Retornar resposta (em produção, enviaria via WhatsApp API)
    return NextResponse.json({
      success: true,
      response: responseMessage,
      command: command.type
    });
    
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Verificação do webhook (usado pelo WhatsApp Business API)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  
  // Token de verificação (configurar nas variáveis de ambiente)
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'gestor_gastos_2024';
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
