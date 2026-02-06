import { GoogleGenerativeAI } from "@google/generative-ai";
import { Transaction } from "../types";

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("API Key do Gemini não encontrada");
    return "Erro de configuração: Chave da API (VITE_GEMINI_API_KEY) não encontrada. Verifique o arquivo .env";
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
    return "Desculpe, houve um erro ao processar sua análise financeira. Verifique se sua chave API está correta e se você tem saldo/cota disponível.";
  }
};
