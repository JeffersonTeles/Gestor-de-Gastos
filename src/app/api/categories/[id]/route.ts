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

    // Verificar se a categoria pertence ao usuário
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Não permitir editar categorias padrão
    if (existingCategory.isDefault) {
      return NextResponse.json(
        { error: 'Não é possível editar categorias padrão' },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id: id },
      data: {
        name: body.name,
        type: body.type,
        icon: body.icon,
        color: body.color,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
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

    // Verificar se a categoria pertence ao usuário
    const category = await prisma.category.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Não permitir deletar categorias padrão
    if (category.isDefault) {
      return NextResponse.json(
        { error: 'Não é possível deletar categorias padrão' },
        { status: 400 }
      );
    }

    // Verificar se há transações usando esta categoria
    const transactionsCount = await prisma.transaction.count({
      where: {
        userId: user.id,
        category: category.name,
      },
    });

    if (transactionsCount > 0) {
      return NextResponse.json(
        { error: `Existem ${transactionsCount} transações usando esta categoria` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
