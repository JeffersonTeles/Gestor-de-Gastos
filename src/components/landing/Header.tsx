'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export const LandingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
              G
            </div>
            <span className="text-xl font-bold text-[var(--ink)]">
              Gestor de Gastos
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <a
              href="#recursos"
              className="text-sm font-medium text-slate-600 hover:text-[var(--accent)] transition"
            >
              Recursos
            </a>
            <a
              href="#beneficios"
              className="text-sm font-medium text-slate-600 hover:text-[var(--accent)] transition"
            >
              Benefícios
            </a>
            <a
              href="#depoimentos"
              className="text-sm font-medium text-slate-600 hover:text-[var(--accent)] transition"
            >
              Depoimentos
            </a>
            <a
              href="#precos"
              className="text-sm font-medium text-slate-600 hover:text-[var(--accent)] transition"
            >
              Preços
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
            >
              Testar grátis
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-slate-200 pt-4 space-y-3">
            <a
              href="#recursos"
              className="block text-sm font-medium text-slate-600 hover:text-[var(--accent)] py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Recursos
            </a>
            <a
              href="#beneficios"
              className="block text-sm font-medium text-slate-600 hover:text-[var(--accent)] py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Benefícios
            </a>
            <a
              href="#depoimentos"
              className="block text-sm font-medium text-slate-600 hover:text-[var(--accent)] py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Depoimentos
            </a>
            <a
              href="#precos"
              className="block text-sm font-medium text-slate-600 hover:text-[var(--accent)] py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Preços
            </a>
            <div className="flex flex-col gap-2 pt-3">
              <Link
                href="/auth/login"
                className="text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-full px-4 py-2.5"
              >
                Entrar
              </Link>
              <Link
                href="/auth/signup"
                className="text-center text-sm font-semibold px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md"
              >
                Testar grátis
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
