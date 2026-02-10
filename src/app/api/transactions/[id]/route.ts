import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  _: unknown,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: any,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se a transação pertence ao usuário
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const transaction = await prisma.transaction.update({
      where: { id: id },
      data: {
        amount: body.amount ? parseFloat(body.amount) : undefined,
        category: body.category,
        description: body.description,
        type: body.type,
        date: body.date ? new Date(body.date) : undefined,
        tags: body.tags,
        notes: body.notes,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: unknown,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se a transação pertence ao usuário
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
