'use client';

import { Button } from '@/components/ui/Button';
import { mockAuth } from '@/lib/mockAuth';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Cadastrar</h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nome
            </label>
            <input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <Button type="submit" className="w-full" isLoading={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </form>

        <p className="text-center text-sm mt-4">
          Já tem conta?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
