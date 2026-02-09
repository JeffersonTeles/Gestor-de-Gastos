import { GoogleGenerativeAI } from "@google/generative-ai";
import { Transaction } from "../types";

const DEMO_ADVICE = `**Análise Financeira (Modo Demo)**

Baseado em suas transações, aqui estão as recomendações:

**1. Controle de Despesas**
Mantenha um registro detalhado de suas despesas por categoria para identificar padrões de gastos desnecessários.

**2. Criação de Fundo de Emergência**
Reserve pelo menos 3-6 meses de despesas mensais em uma conta poupança para lidar com imprevistos.

**3. Planejamento de Investimentos**
Depois de estabilizar seu orçamento, considere diversificar seus investimentos para crescimento a longo prazo.

*Nota: Esta é uma análise em modo demo. Para análises mais precisas, configure sua chave API do Gemini no arquivo .env*`;

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === "sua_chave_api_aqui") {
    console.warn("API Key do Gemini não encontrada. Usando modo demo.");
    return DEMO_ADVICE;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const transactionsContext = transactions.map(t =>
    `- ${t.date}: ${t.description} (${t.category}) = ${t.type === 'income' ? '+' : '-'}${t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
  ).join('\n');

  const prompt = `
    Aja como um consultor financeiro especialista. Analise o seguinte histórico de transações de um usuário e forneça 3 a 4 parágrafos de conselhos práticos e personalizados para melhorar a saúde financeira dele.
    
    Histórico:
    ${transactionsContext}
    
    Por favor, responda em Português do Brasil com um tom encorajador e profissional. Use formatação Markdown (negrito para pontos importantes).
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Não foi possível gerar uma análise no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    console.warn("Usando modo demo como fallback");
    return DEMO_ADVICE;
  }
};
