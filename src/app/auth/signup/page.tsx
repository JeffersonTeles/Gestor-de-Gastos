'use client';

import { mockAuth } from '@/lib/mockAuth';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!supabase) {
        setError('Supabase não configurado');
        setLoading(false);
        return;
      }

      // Tentar Supabase real primeiro
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        // Se Supabase falhar, tenta mock auth como fallback
        const authResult = await mockAuth.signUp(email, password);
        if (authResult.error) {
          setError(authResult.error.message);
          setLoading(false);
          return;
        }
      }

      // Cadastro bem-sucedido
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-success-50 to-success-100">
        <div>
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              G
            </div>
            <span className="text-xl font-bold text-neutral-900">Gestor de Gastos</span>
          </Link>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-success-700 text-xs font-semibold uppercase tracking-wider">
              🚀 Comece Grátis
            </div>
            <h1 className="text-5xl font-bold leading-tight text-neutral-900">
              Crie um painel que conversa com a sua vida
            </h1>
            <p className="text-xl text-neutral-600 max-w-lg leading-relaxed">
              Defina metas, acompanhe categorias e veja tudo com a clareza que você sempre quis.
            </p>
          </div>
        </div>
        <div className="glass-panel rounded-3xl p-6 max-w-md shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-2xl">
              ⚡
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Setup Rápido</p>
              <p className="text-sm font-bold text-[var(--ink)] mt-0.5">Menos de 2 minutos</p>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200">
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Sem cartão de crédito
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Acesso completo por 7 dias
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Cancele quando quiser
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                G
              </div>
              <span className="text-xl font-bold text-[var(--ink)]">Gestor de Gastos</span>
            </Link>
          </div>
          
          <div className="glass-panel rounded-[32px] p-8 shadow-xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-[var(--ink)]">Criar conta</h2>
              <p className="text-slate-600 mt-2">Comece sua jornada financeira gratuitamente</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2 text-slate-700">
                  Nome
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition-shadow hover:shadow-md"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2 text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition-shadow hover:shadow-md"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2 text-slate-700">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition-shadow hover:shadow-md"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Cadastrando...' : 'Criar minha conta grátis'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
              <p className="text-sm text-neutral-600">
                Já tem conta?{' '}
                <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
