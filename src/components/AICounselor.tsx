
import React, { useState } from 'react';
import { Sparkles, Loader2, BrainCircuit, Lightbulb, Target } from 'lucide-react';
import { Transaction } from '../types';
import { getFinancialAdvice } from '../services/geminiService';

interface AICounselorProps {
  transactions: Transaction[];
}

const AICounselor: React.FC<AICounselorProps> = ({ transactions }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAdvice = async () => {
    setError(null);
    if (transactions.length === 0) {
      setError("Adicione algumas transações primeiro para que a IA possa analisar seu perfil!");
      return;
    }
    setLoading(true);
    try {
      const result = await getFinancialAdvice(transactions);
      setAdvice(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar análise';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 transition-colors">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-zinc-900 p-8 md:p-12 rounded-[2rem] text-white shadow-xl shadow-indigo-200 dark:shadow-none border dark:border-zinc-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl mb-6 ring-1 ring-white/30">
            <Sparkles size={40} className="text-yellow-300 fill-yellow-300" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">Análise Inteligente Gemini</h2>
          <p className="text-indigo-100 dark:text-zinc-300 text-lg max-w-2xl mb-8 leading-relaxed">
            IA especializada em finanças que analisa seus hábitos de consumo mensais e recorrentes para otimizar seu dinheiro.
          </p>
          
          <button
            onClick={handleGenerateAdvice}
            disabled={loading}
            className="group relative flex items-center gap-3 bg-white dark:bg-indigo-500 text-indigo-600 dark:text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-indigo-500/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Analisando dados...
              </>
            ) : (
              <>
                <BrainCircuit size={24} className="group-hover:rotate-12 transition-transform" />
                Gerar Insights Financeiros
              </>
            )}
          </button>
        </div>
      </div>

      {error && !loading && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-6 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-rose-700 dark:text-rose-400 mb-1">Aviso</h4>
            <p className="text-sm text-rose-600 dark:text-rose-400/80">{error}</p>
          </div>
        </div>
      )}

      {advice && !loading && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-8 duration-700 transition-colors">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Target size={24} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Seu Plano de Ação</h3>
               <p className="text-slate-500 dark:text-zinc-500 text-sm">Personalizado para seu perfil de gastos</p>
             </div>
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {advice.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-4">
                   {paragraph.split('**').map((part, j) => (
                     j % 2 === 1 ? <strong key={j} className="text-indigo-600 dark:text-indigo-400 font-bold">{part}</strong> : part
                   ))}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                  <Lightbulb size={18} />
                  Dica de Ouro
                </div>
                <p className="text-emerald-600 dark:text-emerald-400/80 text-sm">Mantenha seus empréstimos marcados como recorrentes para ter uma visão clara do seu compromisso financeiro futuro.</p>
             </div>
             <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/10">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold mb-1 text-sm uppercase tracking-wider">
                  IA em constante aprendizado
                </div>
                <p className="text-amber-600 dark:text-amber-400/80 text-sm italic">Consulte sempre um profissional antes de tomar decisões críticas de investimento.</p>
             </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="flex gap-2">
            <div className="w-4 h-4 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-4 h-4 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"></div>
          </div>
          <p className="text-slate-400 dark:text-zinc-600 font-medium">O Gemini está gerando seu relatório...</p>
        </div>
      )}
    </div>
  );
};

export default AICounselor;
