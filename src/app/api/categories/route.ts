import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Categorias padrão
const DEFAULT_CATEGORIES = [
  // Despesas
  { name: 'Alimentação', type: 'expense', icon: '🍔', color: '#ef4444', isDefault: true },
  { name: 'Transporte', type: 'expense', icon: '🚗', color: '#f97316', isDefault: true },
  { name: 'Saúde', type: 'expense', icon: '🏥', color: '#ec4899', isDefault: true },
  { name: 'Educação', type: 'expense', icon: '📚', color: '#8b5cf6', isDefault: true },
  { name: 'Diversão', type: 'expense', icon: '🎮', color: '#6366f1', isDefault: true },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#06b6d4', isDefault: true },
  { name: 'Casa', type: 'expense', icon: '🏠', color: '#14b8a6', isDefault: true },
  { name: 'Utilidades', type: 'expense', icon: '💡', color: '#10b981', isDefault: true },
  { name: 'Conta', type: 'expense', icon: '📄', color: '#84cc16', isDefault: true },
  { name: 'Outro', type: 'expense', icon: '📌', color: '#64748b', isDefault: true },
  // Receitas
  { name: 'Salário', type: 'income', icon: '💰', color: '#22c55e', isDefault: true },
  { name: 'Freelance', type: 'income', icon: '💼', color: '#10b981', isDefault: true },
  { name: 'Investimento', type: 'income', icon: '📈', color: '#14b8a6', isDefault: true },
  { name: 'Devolução', type: 'income', icon: '🔄', color: '#06b6d4', isDefault: true },
  { name: 'Outro', type: 'income', icon: '✨', color: '#64748b', isDefault: true },
];

export async function GET() {
  try {
    // Se Supabase não está configurado, retornar categorias padrão
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json([
        { id: 'exp-food', userId: 'demo', name: 'Alimentação', type: 'expense', icon: '🍔', color: '#ef4444', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'exp-transport', userId: 'demo', name: 'Transporte', type: 'expense', icon: '🚗', color: '#f97316', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'inc-salary', userId: 'demo', name: 'Salário', type: 'income', icon: '💰', color: '#22c55e', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
      ]);
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar categorias do usuário
    let categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    // Se não houver categorias, criar as padrão
    if (categories.length === 0) {
      const categoriesToCreate = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        userId: user.id,
      }));

      await prisma.category.createMany({
        data: categoriesToCreate,
      });

      categories = await prisma.category.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
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
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Nome e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se já existe categoria com esse nome
    const existing = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: body.name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Categoria já existe' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        userId: user.id,
        name: body.name,
        type: body.type,
        icon: body.icon || '📌',
        color: body.color || '#64748b',
        isDefault: false,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
