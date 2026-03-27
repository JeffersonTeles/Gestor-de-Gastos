/**
 * Traduz erros técnicos em mensagens genéricas para o usuário
 * Previne information disclosure
 */

export function getUserFriendlyErrorMessage(error, context = "generic") {
  if (!error) return "Erro desconhecido. Tente novamente.";

  const message = String(error.message || "").toLowerCase();
  const code = error.code || "";

  // Categorizar por contexto
  switch (context) {
    case "auth":
      if (message.includes("invalid")) return "Credenciais inválidas.";
      if (code === "PGRST116") return "Usuário não encontrado.";
      if (message.includes("too many")) return "Muitas tentativas. Tente novamente em alguns minutos.";
      if (message.includes("timeout")) return "Conexão lenta. Tente novamente.";
      break;

    case "database":
      if (message.includes("permission denied") || code === "42501") return "Acesso negado.";
      if (message.includes("not found")) return "Dados não encontrados.";
      if (message.includes("timeout") || code === "PGRST301") return "Operação demorou muito. Tente novamente.";
      if (message.includes("constraint")) return "Dados inválidos para o banco de dados.";
      break;

    case "sync":
      if (message.includes("network") || message.includes("offline")) return "Sem conexão. Os dados serão sincronizados quando voltar online.";
      if (message.includes("timeout")) return "Conexão lenta. Tente novamente.";
      if (message.includes("unavailable")) return "Servidor indisponível no momento. Tente novamente.";
      break;

    case "import":
      if (message.includes("invalid")) return "Formato de arquivo inválido.";
      if (message.includes("parse")) return "Não foi possível ler o arquivo.";
      if (message.includes("empty")) return "Arquivo vazio.";
      break;

    case "file":
      if (message.includes("read")) return "Não foi possível ler o arquivo.";
      if (message.includes("format")) return "Formato não suportado.";
      break;
  }

  // Fallback genérico
  if (message.includes("network")) return "Erro de conexão. Tente novamente.";
  if (message.includes("timeout")) return "Operação demorou muito. Tente novamente.";
  if (message.includes("permission")) return "Acesso negado.";
  if (message.includes("not found")) return "Recurso não encontrado.";

  // Último recurso
  return "Erro ao processar. Tente novamente.";
}

export function logErrorForDevelopment(error, context) {
  if (typeof console !== "undefined" && console.error) {
    console.error(`[SECURITY:${context}]`, error.code || error.message, {
      timestamp: new Date().toISOString(),
      context,
      fullError: error
    });
  }
}
