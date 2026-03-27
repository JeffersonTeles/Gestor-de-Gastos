/**
 * Utilitários de Segurança
 * Protege contra XSS, injection, CSRF etc
 */

/**
 * Sanitiza HTML para evitar XSS
 * @param {string} html - HTML a sanitizar
 * @returns {string} HTML seguro
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== "string") return "";
  
  const tempDiv = document.createElement("div");
  tempDiv.textContent = html;
  return tempDiv.innerHTML;
}

/**
 * Escapa caracteres especiais para evitar XSS em atributos
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
export function escapeAttribute(text) {
  if (!text || typeof text !== "string") return "";
  
  const entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;"
  };
  
  return text.replace(/[&<>"'\/]/g, (s) => entityMap[s]);
}

/**
 * Valida email básico
 * @param {string} email - Email a validar
 * @returns {boolean} True se válido
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valida senha (mínimo 8 caracteres, 1 maiúscula, 1 número)
 * @param {string} password - Senha a validar
 * @returns {object} {valid: boolean, errors: string[]}
 */
export function validatePassword(password) {
  const errors = [];
  
  if (!password || typeof password !== "string") {
    errors.push("Senha é obrigatória");
  } else {
    if (password.length < 8) errors.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(password)) errors.push("Precisa de letra maiúscula");
    if (!/[0-9]/.test(password)) errors.push("Precisa de número");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitiza input de número
 * @param {string} input - Input a sanitizar
 * @returns {number} Número válido ou 0
 */
export function sanitizeNumber(input) {
  if (!input) return 0;
  
  const num = parseFloat(String(input).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

/**
 * Sanitiza input de data
 * @param {string} dateStr - Data a sanitizar
 * @returns {string} Data válida ou empty string
 */
export function sanitizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";
  
  // Formato esperado: YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return "";
  
  // Validar se é data real
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return "";
  
  // Não aceitar datas >1 ano no futuro ou muito antigas (<1900)
  const now = new Date();
  const maxFuture = new Date();
  maxFuture.setFullYear(maxFuture.getFullYear() + 1);
  const minPast = new Date("1900-01-01");
  
  if (date > maxFuture || date < minPast) return "";
  
  return dateStr;
}

/**
 * Sanitiza categoria (apenas alfanumérico + espaço)
 * @param {string} category - Categoria a sanitizar
 * @returns {string} Categoria sanitizada
 */
export function sanitizeCategory(category) {
  if (!category || typeof category !== "string") return "";
  
  // Remove caracteres perigosos, mantém alfanumérico + espaço + ç/ã/é etc
  return category
    .replace(/[<>\"'`;]/g, "")
    .trim()
    .substring(0, 60);
}

/**
 * Sanitiza descrição/nome
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
export function sanitizeDescription(text) {
  if (!text || typeof text !== "string") return "";
  
  return text
    .replace(/[<>\"'`;]/g, "")
    .trim()
    .substring(0, 255);
}

/**
 * Rate limiter simples em memória
 * @typedef {Object} RateLimiter
 * @property {Function} check - (key: string) => boolean
 * @property {Function} clear - () => void
 */
export function createRateLimiter(maxRequests = 5, windowMs = 60000) {
  const requests = new Map();
  
  return {
    check(key) {
      const now = Date.now();
      const userRequests = requests.get(key) || [];
      
      // Remove requisições fora da janela de tempo
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      // Se excedeu limite, rejeita
      if (validRequests.length >= maxRequests) {
        return false;
      }
      
      // Adiciona nova requisição
      validRequests.push(now);
      requests.set(key, validRequests);
      return true;
    },
    
    clear() {
      requests.clear();
    }
  };
}

/**
 * Valida CSRF token
 * @param {string} token - Token a validar
 * @returns {boolean} True se token parece válido
 */
export function isValidCSRFToken(token) {
  if (!token || typeof token !== "string") return false;
  
  // Token deve ter pelo menos 32 caracteres (256 bits em base64)
  return token.length >= 32 && /^[A-Za-z0-9+/=-]+$/.test(token);
}

/**
 * Gera CSRF token
 * @returns {string} CSRF token aleatório
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Valida formato de UUID
 * @param {string} uuid - UUID a validar
 * @returns {boolean} True se válido
 */
export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== "string") return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitiza qualquer string de entrada
 * @param {string} input - Input a sanitizar
 * @param {number} maxLength - Comprimento máximo
 * @returns {string} String sanitizada
 */
export function sanitizeInput(input, maxLength = 255) {
  if (!input || typeof input !== "string") return "";
  
  return input
    .replace(/[<>\"'`;]/g, "") // Remove caracteres perigosos
    .trim()
    .substring(0, maxLength);
}

/**
 * Valida se string é safe para usar em URL
 * @param {string} str - String a validar
 * @returns {boolean} True se seguro
 */
export function isSafeForURL(str) {
  if (!str || typeof str !== "string") return false;
  
  // Não aceita script tags, event handlers, etc
  const unsafePatterns = [
    /javascript:/i,
    /on\w+\s*=/i,
    /<script/i,
    /data:/i
  ];
  
  return !unsafePatterns.some(pattern => pattern.test(str));
}

/**
 * Detecta potencial XSS em string
 * @param {string} str - String a verificar
 * @returns {boolean} True se detectou XSS
 */
export function detectXSS(str) {
  if (!str || typeof str !== "string") return false;
  
  const xssPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi,
    /eval\(/gi,
    /expression\(/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(str));
}

/**
 * Sanitiza objeto de dados (recursivo)
 * @param {*} obj - Objeto a sanitizar
 * @returns {*} Objeto sanitizado
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === "string") {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeInput(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Cria headers de segurança para HTML
 * @returns {string} Meta tags de segurança
 */
export function getSecurityHeaders() {
  return `
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.github.com https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self';">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="DENY">
    <meta http-equiv="X-XSS-Protection" content="1; mode=block">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  `;
}

/**
 * Valida e sanitiza todo o objeto de transação
 * @param {Object} transaction - Transação a validar
 * @returns {Object} {valid: boolean, data: Object, errors: string[]}
 */
export function validateAndSanitizeTransaction(transaction) {
  const errors = [];
  const sanitized = {};
  
  // Validar ID (UUID)
  if (!transaction.id || !isValidUUID(transaction.id)) {
    errors.push("ID inválido");
  } else {
    sanitized.id = transaction.id;
  }
  
  // Validar descrição
  const description = sanitizeDescription(transaction.description);
  if (!description) {
    errors.push("Descrição é obrigatória");
  } else {
    sanitized.description = description;
  }
  
  // Validar valor
  const amount = sanitizeNumber(transaction.amount);
  if (amount <= 0) {
    errors.push("Valor deve ser maior que zero");
  } else {
    sanitized.amount = amount;
  }
  
  // Validar data
  const date = sanitizeDate(transaction.date);
  if (!date) {
    errors.push("Data inválida");
  } else {
    sanitized.date = date;
  }
  
  // Validar tipo
  const validTypes = ["income", "expense"];
  if (!validTypes.includes(transaction.type)) {
    errors.push("Tipo inválido");
  } else {
    sanitized.type = transaction.type;
  }
  
  // Validar categoria
  const category = sanitizeCategory(transaction.category);
  if (!category) {
    errors.push("Categoria é obrigatória");
  } else {
    sanitized.category = category;
  }
  
  // Campos opcionais
  if (transaction.source_bank) {
    sanitized.source_bank = sanitizeInput(transaction.source_bank, 40);
  }
  
  return {
    valid: errors.length === 0,
    data: sanitized,
    errors
  };
}

// Exportar rate limiter padrão
export const loginRateLimiter = createRateLimiter(5, 300000); // 5 tentativas a cada 5 min
export const importRateLimiter = createRateLimiter(3, 60000);  // 3 imports por minuto
