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

    // Pegar query params para filtros
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Construir where clause
    const where: any = {
      userId: user.id,
    };

    if (status) where.status = status;
    if (type) where.type = type;

    const loans = await prisma.loan.findMany({
      where,
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { loanDate: 'desc' },
    });

    return NextResponse.json(loans);
  } catch (error) {
    console.error('Erro ao buscar empréstimos:', error);
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
    if (!body.type || !body.amount || !body.person || !body.loanDate) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const loan = await prisma.loan.create({
      data: {
        userId: user.id,
        type: body.type,
        amount: parseFloat(body.amount),
        currency: body.currency || 'BRL',
        person: body.person,
        description: body.description || null,
        status: 'pending',
        paidAmount: 0,
        loanDate: new Date(body.loanDate),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes || null,
      },
      include: {
        payments: true,
      },
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar empréstimo:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
