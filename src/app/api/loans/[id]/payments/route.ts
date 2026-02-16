import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
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
    const loan = await prisma.loan.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    // Validar dados
    if (!body.amount || !body.paymentDate) {
      return NextResponse.json(
        { error: 'Amount and paymentDate are required' },
        { status: 400 }
      );
    }

    const paymentAmount = parseFloat(body.amount);

    // Criar o pagamento
    const payment = await prisma.loanPayment.create({
      data: {
        loanId: id,
        amount: paymentAmount,
        paymentDate: new Date(body.paymentDate),
        notes: body.notes || null,
      },
    });

    // Atualizar o empréstimo
    const newPaidAmount = Number(loan.paidAmount) + paymentAmount;
    const totalAmount = Number(loan.amount);
    let newStatus: 'pending' | 'partial' | 'paid' = 'pending';

    if (newPaidAmount >= totalAmount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        returnDate: newStatus === 'paid' ? new Date() : null,
      },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    return NextResponse.json({ payment, loan: updatedLoan }, { status: 201 });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
