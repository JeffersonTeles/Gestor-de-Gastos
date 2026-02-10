'use client';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Transaction } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    income: 0,
    expense: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
      return;
    }

    const loadData = async () => {
      try {
        const response = await fetch('/api/transactions');
        if (response.ok) {
          const data: any[] = await response.json();
          setTransactions(data);

          // Calcular stats
          let income = 0;
          let expense = 0;
          data.forEach((tx: any) => {
            const amount = Number(tx.amount) || 0;
            if (tx.type === 'income') {
              income += amount;
            } else {
              expense += amount;
            }
          });

          setStats({
            total: income - expense,
            income,
            expense,
          });
        }
      } catch (error) {
        console.error('Erro ao buscar transações:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="mb-4">Você precisa entrar para acessar o dashboard.</p>
          <Link href="/auth/login">
            <Button variant="primary" size="sm">Ir para login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestor de Gastos</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button onClick={handleLogout} variant="danger" size="sm">
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">
          Bem-vindo, {user.email}!
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Saldo Total</div>
            <div className={`text-3xl font-bold ${stats.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {Math.abs(stats.total).toFixed(2)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Receitas</div>
            <div className="text-3xl font-bold text-green-600">
              R$ {stats.income.toFixed(2)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Despesas</div>
            <div className="text-3xl font-bold text-red-600">
              R$ {stats.expense.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Transações Recentes</h3>
              <Link href="/dashboard/transactions/new">
                <Button variant="primary" size="sm">
                  Nova Transação
                </Button>
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">Descrição</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Categoria</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Tipo</th>
                  <th className="px-6 py-3 text-right text-sm font-medium">Valor</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma transação ainda
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 10).map((tx: any) => (
                    <tr key={tx.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3">{tx.description}</td>
                      <td className="px-6 py-3">{tx.category}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            tx.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.type === 'income' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium">
                        {tx.type === 'income' ? '+' : '-'}R$ {Math.abs(Number(tx.amount) || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(tx.date).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
