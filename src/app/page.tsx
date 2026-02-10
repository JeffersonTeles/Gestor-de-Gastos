import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Gestor de Gastos</h1>
        <p className="text-xl text-gray-600 mb-8">
          Organize suas finanças com facilidade
        </p>

        <div className="flex gap-4 justify-center flex-col sm:flex-row">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Entrar
          </Link>
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Cadastrar
          </Link>
        </div>
      </div>
    </div>
  );
}
