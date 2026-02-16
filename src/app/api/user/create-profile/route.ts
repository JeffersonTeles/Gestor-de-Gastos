import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: any) {
  try {
    const body = await request.json();

    if (!body.userId || !body.email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId: body.userId },
      update: {},
      create: {
        userId: body.userId,
        email: body.email,
        name: body.name || null,
        currency: body.currency || 'BRL',
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
