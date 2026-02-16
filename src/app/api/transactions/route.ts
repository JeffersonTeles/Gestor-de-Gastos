import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

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
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construir where clause
    const where: any = {
      userId: user.id,
    };

    if (category) where.category = category;
    if (type) where.type = type;

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: any) {
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
    if (!body.amount || !body.category || !body.description || !body.type || !body.date) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: parseFloat(body.amount),
        currency: body.currency || 'BRL',
        category: body.category,
        description: body.description,
        type: body.type,
        date: new Date(body.date),
        tags: body.tags || [],
        notes: body.notes || null,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
