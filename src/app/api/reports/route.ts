import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }
  
  return createClient(url, key);
};

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, period_start, period_end, user_id } = body;

    const supabase = getSupabaseClient();
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
      .gte('date', period_start)
      .lte('date', period_end);

    if (txError) throw txError;

    const summary = {
      total_income: 0,
      total_expense: 0,
      net: 0,
      by_category: {} as Record<string, number>,
    };

    transactions?.forEach((tx: any) => {
      const amount = Number(tx.amount);
      if (tx.type === 'income') {
        summary.total_income += amount;
      } else {
        summary.total_expense += amount;
      }

      const category = tx.category || 'Outros';
      if (!summary.by_category[category]) {
        summary.by_category[category] = 0;
      }
      summary.by_category[category] += amount;
    });

    summary.net = summary.total_income - summary.total_expense;

    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          user_id,
          type,
          period_start,
          period_end,
          summary,
          generated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
