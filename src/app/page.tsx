import { LandingFooter } from '@/components/landing/Footer';
import { LandingHeader } from '@/components/landing/Header';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                ✨ Gestão financeira inteligente
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                Controle suas finanças com{' '}
                <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  clareza total
                </span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed">
                Organize receitas, despesas e metas em um painel visual e intuitivo. 
                Tenha insights automáticos e tome decisões financeiras mais inteligentes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/signup"
                  className="text-center px-8 py-4 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-bold text-lg shadow-[0_20px_40px_rgba(13,148,136,0.3)] hover:shadow-[0_25px_50px_rgba(13,148,136,0.4)] hover:translate-y-[-2px] transition-all"
                >
                  Testar grátis por 7 dias
                </Link>
                <Link
                  href="/dashboard"
                  className="text-center px-8 py-4 rounded-full border-2 border-slate-300 text-slate-700 font-bold text-lg hover:border-slate-400 hover:bg-slate-50 transition-all"
                >
                  Ver demonstração
                </Link>
              </div>
              <div className="flex items-center gap-8 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Cancele quando quiser</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="glass-panel rounded-[32px] p-8 space-y-6 shadow-[0_30px_60px_rgba(0,0,0,0.12)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Saldo Atual</p>
                    <p className="text-4xl font-bold text-slate-900 mt-1">R$ 8.542,30</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                    +24%
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Receitas do mês</span>
                    <span className="text-sm font-bold text-emerald-600">+ R$ 12.400,00</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-[82%] bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
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
                    <div className="h-full w-[56%] bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" />
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl opacity-20 blur-2xl"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-3xl opacity-20 blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-semibold mb-6">
              💎 Recursos principais
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--ink)] mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Ferramentas poderosas e simples para você ter controle total das suas finanças
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '📊',
                title: 'Dashboard Visual',
                description: 'Gráficos e estatísticas em tempo real para acompanhar seu progresso financeiro'
              },
              {
                icon: '🏷️',
                title: 'Tags e Categorias',
                description: 'Organize suas transações com tags personalizadas e categorias inteligentes'
              },
              {
                icon: '🔍',
                title: 'Busca Avançada',
                description: 'Encontre qualquer transação rapidamente com filtros poderosos'
              },
              {
                icon: '🎯',
                title: 'Metas e Orçamentos',
                description: 'Defina objetivos financeiros e receba alertas quando se aproximar dos limites'
              },
              {
                icon: '📥',
                title: 'Importação CSV/OFX',
                description: 'Importe extratos bancários automaticamente e economize tempo'
              },
              {
                icon: '📅',
                title: 'Revisão Semanal',
                description: 'Acompanhe seus gastos com relatórios semanais personalizados'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-panel rounded-3xl p-8 hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl font-bold text-[var(--ink)] mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-6">
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
                    description: 'Receba notificações quando estiver perto de estourar o orçamento'
                  },
                  {
                    title: 'Análises Automáticas',
                    description: 'Insights sobre seus hábitos de consumo sem esforço manual'
                  },
                  {
                    title: 'Segurança Total',
                    description: 'Seus dados criptografados e protegidos com as melhores práticas'
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center text-white font-bold">
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
            <div className="relative">
              <div className="glass-panel rounded-3xl p-8 space-y-6">
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
              💬 Depoimentos
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--ink)] mb-4">
              Milhares de pessoas já transformaram suas finanças
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Ana Paula Silva',
                role: 'Designer',
                image: '👩‍💼',
                text: 'Finalmente consegui organizar minhas finanças! O dashboard visual me ajuda a ver exatamente onde estou gastando demais. Recomendo muito!'
              },
              {
                name: 'Carlos Eduardo',
                role: 'Empreendedor',
                image: '👨‍💼',
                text: 'A importação de OFX economiza horas do meu mês. Os alertas inteligentes me salvaram de estourar o orçamento várias vezes.'
              },
              {
                name: 'Mariana Costa',
                role: 'Professora',
                image: '👩‍🏫',
                text: 'Interface linda e fácil de usar. A revisão semanal me ajuda a manter o foco nos meus objetivos financeiros. Simplesmente perfeito!'
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

      {/* CTA Section */}
      <section id="precos" className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="glass-panel rounded-[40px] p-12 shadow-[0_40px_80px_rgba(0,0,0,0.12)]">
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--ink)] mb-6">
              Comece hoje mesmo, gratuitamente
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Teste todas as funcionalidades por 7 dias sem compromisso. 
              Cancele quando quiser, sem burocracia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/auth/signup"
                className="px-10 py-5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-bold text-lg shadow-[0_20px_40px_rgba(13,148,136,0.3)] hover:shadow-[0_25px_50px_rgba(13,148,136,0.4)] hover:translate-y-[-2px] transition-all"
              >
                Começar agora grátis →
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>7 dias grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
