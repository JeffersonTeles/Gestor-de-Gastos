import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifySync } from 'otplib';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }
  
  return createClient(url, key);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, secret, code } = body;

    const verifyResult = verifySync({ token: code, secret });
    const isValidToken = verifyResult.valid === true;

    if (!isValidToken) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('two_factor_settings')
      .update({
        enabled: true,
        verified_at: new Date().toISOString(),
      })
      .eq('user_id', user_id);

    if (error) throw error;

    return NextResponse.json({ message: '2FA ativado com sucesso' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
