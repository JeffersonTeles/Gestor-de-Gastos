import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
    });

    // Calcular estatísticas
    const stats = {
      totalTransactions: transactions.length,
      totalIncome: 0,
      totalExpense: 0,
      byCategory: {} as Record<string, { income: number; expense: number }>,
      byMonth: {} as Record<string, { income: number; expense: number }>,
    };

    transactions.forEach((tx: any) => {
      const amount = parseFloat(tx.amount.toString());
      const month = tx.date.toISOString().slice(0, 7);

      // Total por tipo
      if (tx.type === 'income') {
        stats.totalIncome += amount;
      } else {
        stats.totalExpense += amount;
      }

      // Por categoria
      if (!stats.byCategory[tx.category]) {
        stats.byCategory[tx.category] = { income: 0, expense: 0 };
      }
      if (tx.type === 'income') {
        stats.byCategory[tx.category].income += amount;
      } else {
        stats.byCategory[tx.category].expense += amount;
      }

      // Por mês
      if (!stats.byMonth[month]) {
        stats.byMonth[month] = { income: 0, expense: 0 };
      }
      if (tx.type === 'income') {
        stats.byMonth[month].income += amount;
      } else {
        stats.byMonth[month].expense += amount;
      }
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao calcular analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
