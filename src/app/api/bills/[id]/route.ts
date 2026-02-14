import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    const existingBill = await prisma.bill.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingBill) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const bill = await prisma.bill.update({
      where: { id: id },
      data: {
        type: body.type,
        amount: body.amount ? parseFloat(body.amount) : undefined,
        category: body.category,
        description: body.description,
        status: body.status,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        paidAt: body.paidAt ? new Date(body.paidAt) : undefined,
        notes: body.notes,
      },
    });

    if (
      existingBill.recurrenceId &&
      existingBill.status !== 'paid' &&
      bill.status === 'paid'
    ) {
      const recurrence = await prisma.billRecurrence.findFirst({
        where: {
          id: existingBill.recurrenceId,
          userId: user.id,
        },
      });

      if (recurrence && recurrence.status === 'active') {
        const nextDueDate = recurrence.nextDueDate;
        const endDate = recurrence.endDate;

        if (!endDate || nextDueDate <= endDate) {
          await prisma.bill.create({
            data: {
              userId: user.id,
              type: recurrence.type,
              amount: recurrence.amount,
              currency: recurrence.currency,
              category: recurrence.category,
              description: recurrence.description,
              status: 'open',
              dueDate: nextDueDate,
              notes: recurrence.notes,
              recurrenceId: recurrence.id,
            },
          });

          const updatedNextDueDate = addInterval(
            nextDueDate,
            recurrence.frequency,
            recurrence.interval
          );

          const shouldComplete = endDate && updatedNextDueDate > endDate;

          await prisma.billRecurrence.update({
            where: { id: recurrence.id },
            data: {
              nextDueDate: updatedNextDueDate,
              status: shouldComplete ? 'completed' : recurrence.status,
            },
          });
        } else {
          await prisma.billRecurrence.update({
            where: { id: recurrence.id },
            data: { status: 'completed' },
          });
        }
      }
    }

    return NextResponse.json({ ...bill, amount: Number(bill.amount) });
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
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

    const bill = await prisma.bill.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.bill.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
