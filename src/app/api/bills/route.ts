import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

const addInterval = (date: Date, frequency: string, interval: number) => {
  const next = new Date(date);

  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7 * interval);
    return next;
  }

  if (frequency === 'yearly') {
    next.setFullYear(next.getFullYear() + interval);
    return next;
  }

  next.setMonth(next.getMonth() + interval);
  return next;
};

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
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const month = searchParams.get('month'); // formato: YYYY-MM

    const where: any = {
      userId: user.id,
    };

    if (status) where.status = status;
    if (type) where.type = type;

    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
      where.dueDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const bills = await prisma.bill.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const enriched = bills.map((bill) => {
      const isOverdue = bill.status === 'open' && bill.dueDate < now;
      return {
        ...bill,
        status: isOverdue ? 'overdue' : bill.status,
        amount: Number(bill.amount),
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
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

    if (!body.type || !body.amount || !body.category || !body.description || !body.dueDate) {
      return NextResponse.json(
        { error: 'Campos obrigatorios faltando' },
        { status: 400 }
      );
    }

    const recurrenceInput = body.recurrence;
    let recurrenceId: string | undefined;

    if (recurrenceInput?.frequency) {
      const allowedFrequencies = ['weekly', 'monthly', 'yearly'];
      if (!allowedFrequencies.includes(recurrenceInput.frequency)) {
        return NextResponse.json(
          { error: 'Frequencia invalida' },
          { status: 400 }
        );
      }

      const interval = Math.max(1, Number(recurrenceInput.interval) || 1);
      const startDate = new Date(body.dueDate);
      const nextDueDate = addInterval(startDate, recurrenceInput.frequency, interval);
      const endDate = recurrenceInput.endDate ? new Date(recurrenceInput.endDate) : null;

      const recurrence = await prisma.billRecurrence.create({
        data: {
          userId: user.id,
          type: body.type,
          amount: parseFloat(body.amount),
          currency: body.currency || 'BRL',
          category: body.category,
          description: body.description,
          notes: body.notes || null,
          frequency: recurrenceInput.frequency,
          interval,
          startDate,
          nextDueDate,
          endDate,
          status: 'active',
        },
      });

      recurrenceId = recurrence.id;
    }

    const bill = await prisma.bill.create({
      data: {
        userId: user.id,
        type: body.type,
        amount: parseFloat(body.amount),
        currency: body.currency || 'BRL',
        category: body.category,
        description: body.description,
        status: body.status || 'open',
        dueDate: new Date(body.dueDate),
        paidAt: body.paidAt ? new Date(body.paidAt) : null,
        notes: body.notes || null,
        recurrenceId,
      },
    });

    return NextResponse.json({ ...bill, amount: Number(bill.amount) }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
