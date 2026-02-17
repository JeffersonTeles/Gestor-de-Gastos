'use client';

import { mockAuth } from '@/lib/mockAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Tentar mock auth diretamente (modo offline)
      const authResult = await mockAuth.signIn(email, password);
      
      if (authResult.error) {
        setError(authResult.error.message);
        setLoading(false);
        return;
      }

      // Sucesso
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary-50 to-primary-100">
        <div>
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              G
            </div>
            <span className="text-xl font-bold text-neutral-900">Gestor de Gastos</span>
          </Link>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-primary-700 text-xs font-semibold uppercase tracking-wider">
              ✨ Gestão Financeira Inteligente
            </div>
            <h1 className="text-5xl font-bold leading-tight text-neutral-900">
              Bem-vindo de volta
            </h1>
            <p className="text-xl text-neutral-600 max-w-lg leading-relaxed">
              Dashboards elegantes, insights automáticos e controle total das suas finanças em um só lugar.
            </p>
          </div>
        </div>
        <div className="glass-panel rounded-3xl p-6 max-w-md shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Acesso Demo</p>
              <p className="text-sm font-bold text-[var(--ink)] mt-0.5">Teste sem compromisso</p>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600"><span className="font-semibold">Email:</span> demo@example.com</p>
            <p className="text-sm text-slate-600 mt-1"><span className="font-semibold">Senha:</span> demo123</p>
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
              <h2 className="text-3xl font-bold text-[var(--ink)]">Entrar na conta</h2>
              <p className="text-slate-600 mt-2">Acesse seu painel financeiro ou use as credenciais demo</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
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
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
              <p className="text-sm text-neutral-600">
                Ainda não tem conta?{' '}
                <Link href="/auth/signup" className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
                  Criar agora
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
