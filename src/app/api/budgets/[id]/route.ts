import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    // Verificar se o orçamento pertence ao usuário
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const budget = await prisma.budget.update({
      where: { id: id },
      data: {
        limit: body.limit ? parseFloat(body.limit) : undefined,
        category: body.category,
        month: body.month ? new Date(body.month) : undefined,
      },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
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

    // Verificar se o orçamento pertence ao usuário
    const budget = await prisma.budget.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.budget.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar orçamento:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
