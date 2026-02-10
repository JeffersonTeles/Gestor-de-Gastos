import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const month = searchParams.get('month'); // formato: YYYY-MM

    const where: any = {
      userId: user.id,
    };

    if (category) where.category = category;
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
      where.month = {
        gte: startDate,
        lte: endDate,
      };
    }

    const budgets = await prisma.budget.findMany({
      where,
      orderBy: { month: 'desc' },
    });

    // Para cada orçamento, calcular gastos do mês
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const monthStart = new Date(budget.month);
        const monthEnd = new Date(
          monthStart.getFullYear(),
          monthStart.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        const transactions = await prisma.transaction.findMany({
          where: {
            userId: user.id,
            category: budget.category,
            type: 'expense',
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        });

        const spent = transactions.reduce(
          (sum, tx) => sum + Number(tx.amount),
          0
        );

        return {
          ...budget,
          spent,
          limit: Number(budget.limit),
          percentage: (spent / Number(budget.limit)) * 100,
        };
      })
    );

    return NextResponse.json(budgetsWithSpent);
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validar dados
    if (!body.category || !body.limit || !body.month) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Verificar se já existe orçamento para essa categoria e mês
    const existing = await prisma.budget.findFirst({
      where: {
        userId: user.id,
        category: body.category,
        month: new Date(body.month),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um orçamento para esta categoria neste mês' },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        category: body.category,
        limit: parseFloat(body.limit),
        month: new Date(body.month),
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
