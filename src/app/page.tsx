'use client';

import { LandingFooter } from '@/components/landing/Footer';
import { LandingHeader } from '@/components/landing/Header';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se o usuário estiver logado, redireciona para dashboard
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Enquanto verifica o usuário, não mostra nada
  if (loading) {
    return null;
  }

  // Se usuário logado, não mostra landing (vai redirecionar)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8 fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-100 bg-teal-50 text-teal-800 text-xs font-semibold uppercase tracking-wider">
                ✨ Para Freelancers e Autônomos
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight">
                Gestão Financeira{' '}
                <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                  sem complicação
                </span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed">
                Saiba exatamente pra onde vai seu dinheiro. Visualize todo seu fluxo de caixa em tempo real.
                Sem planilhas chatas. Sem confusão.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="relative">
                  <Link
                    href="/auth/signup"
                    className="btn-interactive text-center px-8 py-4 rounded-full bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-lg shadow-[0_20px_40px_rgba(20,184,166,0.3)] hover:shadow-[0_25px_50px_rgba(20,184,166,0.4)] transition-all block"
                  >
                    Testar grátis por 7 dias
                  </Link>
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    Sem compromisso ✓
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="btn-interactive text-center px-8 py-4 rounded-full border-2 border-teal-200 text-teal-700 font-bold text-lg hover:border-teal-300 hover:bg-teal-50 transition-all"
                >
                  Ver demo ao vivo →
                </Link>
              </div>
              <div className="flex items-center gap-8 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Cancele quando quiser</span>
                </div>
              </div>
            </div>

            <div className="relative fade-in-delay-1">
              <div className="glass-panel rounded-[32px] p-8 space-y-6 shadow-[0_30px_60px_rgba(0,0,0,0.12)] card-interactive">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Saldo Atual</p>
                    <p className="text-4xl font-bold text-slate-900 mt-1">R$ 8.542,30</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-teal-100 text-teal-700 font-bold">
                    +24%
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Receitas do mês</span>
                    <span className="text-sm font-bold text-teal-600">+ R$ 12.400,00</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-[82%] bg-gradient-to-r from-teal-400 to-teal-600 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Despesas do mês</span>
                    <span className="text-sm font-bold text-amber-600">- R$ 3.857,70</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-[31%] bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
                  </div>
                </div>
                <div className="rounded-2xl border-2 border-slate-100 bg-gradient-to-br from-white to-slate-50 px-6 py-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Próxima meta</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">Viagem em família</p>
                      <p className="text-sm text-slate-500 mt-1">R$ 2.800 de R$ 5.000</p>
                    </div>
                    <div className="text-2xl">🎯</div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full w-[56%] bg-gradient-to-r from-teal-500 to-teal-600 rounded-full" />
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl opacity-20 blur-2xl"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-teal-400 to-teal-500 rounded-3xl opacity-20 blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 border-b border-slate-200 bg-white fade-in">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              18 pessoas começaram hoje
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-teal-600 mb-2">500+</div>
              <p className="text-slate-600 font-medium">Usuários ativos</p>
              <p className="text-xs text-slate-500 mt-1">e crescendo todos os dias</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-600 mb-2">4.7⭐</div>
              <p className="text-slate-600 font-medium">Avaliação média</p>
              <p className="text-xs text-slate-500 mt-1">de 143 usuários</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-600 mb-2">R$ 8M+</div>
              <p className="text-slate-600 font-medium">Gerenciado</p>
              <p className="text-xs text-slate-500 mt-1">em transações</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-semibold mb-6">
              💎 O que você consegue
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--ink)] mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Ferramentas poderosas e simples para ter controle total das suas finanças
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 fade-in">
            {[
              {
                icon: '📊',
                title: 'Dashboard Visual',
                description: 'Veja seu saldo, receitas e despesas em gráficos interativos. Atualizados em tempo real.'
              },
              {
                icon: '🏷️',
                title: 'Tags e Categorias',
                description: 'Crie categorias personalizadas. Saiba em 1 clique quanto você gasta com delivery, Uber, etc.'
              },
              {
                icon: '🔍',
                title: 'Busca Avançada',
                description: 'Encontre aquela despesa de 6 meses atrás em segundos. Filtre por data, valor, categoria.'
              },
              {
                icon: '🎯',
                title: 'Metas e Orçamentos',
                description: 'Defina quanto quer gastar por categoria. Receba alertas antes de estourar o limite.'
              },
              {
                icon: '📥',
                title: 'Importação CSV/OFX',
                description: 'Importe extrato do banco em 1 clique. Economize 2-3 horas de digitação manual todo mês.'
              },
              {
                icon: '📅',
                title: 'Revisão Semanal',
                description: 'Todo domingo você recebe um resumo: quanto entrou, quanto saiu, e onde você pode economizar.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-panel rounded-3xl p-8 card-interactive group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl font-bold text-[var(--ink)] mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-semibold mb-6">
              🚀 Simples assim
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--ink)] mb-4">
              3 passos pra ter controle total
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Em menos de 5 minutos você está pronto pra começar
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="glass-panel rounded-3xl p-8 card-interactive space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  1
                </div>
                <h3 className="text-2xl font-bold text-[var(--ink)]">Crie sua conta</h3>
                <p className="text-slate-600 leading-relaxed">
                  Leva 30 segundos. Só precisa de email. Sem cartão de crédito, sem pegadinhas.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-4xl text-teal-300">
                →
              </div>
            </div>

            <div className="relative">
              <div className="glass-panel rounded-3xl p-8 card-interactive space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  2
                </div>
                <h3 className="text-2xl font-bold text-[var(--ink)]">Adicione suas finanças</h3>
                <p className="text-slate-600 leading-relaxed">
                  Importe seu extrato bancário ou adicione manualmente. Configure categorias e metas.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-4xl text-teal-300">
                →
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-8 card-interactive space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold text-[var(--ink)]">Tenha clareza total</h3>
              <p className="text-slate-600 leading-relaxed">
                Veja gráficos, receba alertas, acompanhe metas. Tudo atualizado em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center fade-in">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm font-semibold mb-6 fade-in">
                ⚡ Por que escolher o Gestor de Gastos?
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-[var(--ink)] mb-6">
                Decisões financeiras mais inteligentes, todos os dias
              </h2>
              <p className="text-xl text-slate-600 mb-8">
                Não se trata apenas de registrar gastos. É sobre entender seus padrões, 
                identificar oportunidades e construir um futuro financeiro sólido.
              </p>
              <div className="space-y-6">
                {[
                  {
                    title: 'Alertas Inteligentes',
                    description: 'Seja avisado antes de estourar o orçamento. 87% dos usuários economizam em média R$ 320/mês.'
                  },
                  {
                    title: 'Análises Automáticas',
                    description: 'Descubra padrões de gasto que você nem sabia que existiam. Economize 2-3h/mês em planilhas.'
                  },
                  {
                    title: 'Segurança Total',
                    description: 'Criptografia SSL 256-bit, backup automático e 2FA. Seus dados 100% protegidos.'
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-[var(--ink)] mb-1">{benefit.title}</h4>
                      <p className="text-slate-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative fade-in-delay-1">
              <div className="glass-panel rounded-3xl p-8 space-y-6 card-interactive">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <h3 className="font-bold text-lg">Alertas Ativos</h3>
                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">2 novos</span>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-red-50 border-l-4 border-red-500">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🚨</span>
                      <div>
                        <p className="font-semibold text-red-900">Orçamento estourado</p>
                        <p className="text-sm text-red-700 mt-1">Alimentação: R$ 1.200 (limite: R$ 1.000)</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border-l-4 border-amber-500">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="font-semibold text-amber-900">Atenção ao orçamento</p>
                        <p className="text-sm text-amber-700 mt-1">Transporte: 85% do limite atingido</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border-l-4 border-blue-500">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <p className="font-semibold text-blue-900">Gastos altos hoje</p>
                        <p className="text-sm text-blue-700 mt-1">R$ 280 acima da média diária</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-semibold mb-6">
              💬 O que dizem nossos usuários
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--ink)] mb-4">
              Freelancers e autônomos que já tomaram controle
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Veja como outros profissionais melhoraram suas finanças
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Rafael M.',
                role: 'Designer Freelancer',
                image: '👨‍💼',
                text: 'Economizei R$ 400/mês só de saber onde estava vazando dinheiro. O alerta de orçamento me salvou 3x esse mês.'
              },
              {
                name: 'Juliana S.',
                role: 'Consultora Autônoma',
                image: '👩‍💼',
                text: 'Importar OFX me economiza 2h por semana. Já paguei a conta anual só com esse tempo que ganhei de volta.'
              },
              {
                name: 'Pedro L.',
                role: 'Dev Freelancer',
                image: '👨‍💻',
                text: 'Uso há 4 meses. Finalmente sei exatamente quanto preciso faturar pra cobrir todas as despesas + sobrar pra investir.'
              }
            ].map((testimonial, index) => (
              <div key={index} className="glass-panel rounded-3xl p-8 hover:shadow-xl transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center text-3xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[var(--ink)]">{testimonial.name}</h4>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed italic">"{testimonial.text}"</p>
                <div className="flex gap-1 mt-4 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold mb-6">
              ❓ Perguntas Frequentes
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--ink)] mb-4">
              Dúvidas? A gente responde
            </h2>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 card-interactive">
              <h3 className="text-lg font-bold text-[var(--ink)] mb-3">
                💳 Preciso cadastrar cartão de crédito?
              </h3>
              <p className="text-slate-600">
                Não! Você pode testar grátis por 7 dias sem cadastrar nenhum dado de pagamento. Só precisa de um email.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 card-interactive">
              <h3 className="text-lg font-bold text-[var(--ink)] mb-3">
                📱 Funciona no celular?
              </h3>
              <p className="text-slate-600">
                Sim! O Gestor de Gastos é totalmente responsivo e funciona perfeitamente em qualquer dispositivo. Até funciona offline.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 card-interactive">
              <h3 className="text-lg font-bold text-[var(--ink)] mb-3">
                🔒 Meus dados estão seguros?
              </h3>
              <p className="text-slate-600">
                Totalmente. Usamos criptografia SSL, autenticação em 2 fatores e somos 100% LGPD compliant. Seus dados nunca serão vendidos ou compartilhados.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 card-interactive">
              <h3 className="text-lg font-bold text-[var(--ink)] mb-3">
                ⏱️ Quanto tempo demora pra configurar?
              </h3>
              <p className="text-slate-600">
                Menos de 5 minutos. Crie a conta, importe seu extrato bancário (opcional) e pronto. Se preferir adicionar manualmente, leva cerca de 10-15 min.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 card-interactive">
              <h3 className="text-lg font-bold text-[var(--ink)] mb-3">
                💰 Quanto custa depois do período gratuito?
              </h3>
              <p className="text-slate-600">
                O plano básico custa R$ 19,90/mês ou R$ 179/ano (25% de desconto). Você pode cancelar a qualquer momento, sem multa ou burocracia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="precos" className="py-24 fade-in">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="glass-panel rounded-[40px] p-12 shadow-[0_40px_80px_rgba(0,0,0,0.12)] card-interactive">
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--ink)] mb-6">
              Pare de se perder com suas finanças
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Comece agora. Em 7 dias você terá total clareza de onde está seu dinheiro e pra onde ele vai. 
              Sem planilhas. Sem confusão.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <div className="relative inline-block">
                <Link
                  href="/auth/signup"
                  className="btn-interactive px-10 py-5 rounded-full bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-lg shadow-[0_20px_40px_rgba(20,184,166,0.3)] hover:shadow-[0_25px_50px_rgba(20,184,166,0.4)] transition-all block"
                >
                  Começar agora grátis →
                </Link>
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                  🔥 7 dias
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>7 dias grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cancele quando quiser</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap justify-center gap-8 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.707a1 1 0 010-1.414l.707-.707a1 1 0 011.414 0L10 8.586l2.586-2.586a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414L11.414 9.5l1.293 1.293a1 1 0 01-1.414 1.414l-.707-.707L10 11.414l-1.293-1.293a1 1 0 01-1.414 1.414l-.707-.707L8.586 10l-1.293-1.293a1 1 0 010-1.414z"/>
                </svg>
                <span>Criptografia SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.707a1 1 0 010-1.414l.707-.707a1 1 0 011.414 0L10 8.586l2.586-2.586a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414L11.414 9.5l1.293 1.293a1 1 0 01-1.414 1.414l-.707-.707L10 11.414l-1.293-1.293a1 1 0 01-1.414 1.414l-.707-.707L8.586 10l-1.293-1.293a1 1 0 010-1.414z"/>
                </svg>
                <span>2FA Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.707a1 1 0 010-1.414l.707-.707a1 1 0 011.414 0L10 8.586l2.586-2.586a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414L11.414 9.5l1.293 1.293a1 1 0 01-1.414 1.414l-.707-.707L10 11.414l-1.293-1.293a1 1 0 01-1.414 1.414l-.707-.707L8.586 10l-1.293-1.293a1 1 0 010-1.414z"/>
                </svg>
                <span>LGPD Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
