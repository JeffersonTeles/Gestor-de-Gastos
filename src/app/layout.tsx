import { AppProvider } from '@/contexts/AppContext';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gestor de Gastos',
  description: 'Aplicação profissional para gerenciar suas finanças',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
