import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    const loan = await prisma.loan.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(loan);
  } catch (error) {
    console.error('Erro ao buscar empréstimo:', error);
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

    // Verificar se o empréstimo pertence ao usuário
    const existingLoan = await prisma.loan.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingLoan) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const loan = await prisma.loan.update({
      where: { id: id },
      data: {
        type: body.type,
        amount: body.amount ? parseFloat(body.amount) : undefined,
        person: body.person,
        description: body.description,
        status: body.status,
        paidAmount: body.paidAmount !== undefined ? parseFloat(body.paidAmount) : undefined,
        loanDate: body.loanDate ? new Date(body.loanDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        returnDate: body.returnDate ? new Date(body.returnDate) : undefined,
        notes: body.notes,
      },
      include: {
        payments: true,
      },
    });

    return NextResponse.json(loan);
  } catch (error) {
    console.error('Erro ao atualizar empréstimo:', error);
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

    // Verificar se o empréstimo pertence ao usuário
    const loan = await prisma.loan.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.loan.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar empréstimo:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
