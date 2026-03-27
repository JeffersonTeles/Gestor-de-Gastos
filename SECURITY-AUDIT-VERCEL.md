# Auditoria de Segurança - Gestor de Gastos em Produção

**Data:** 27 de março de 2026  
**Ambiente:** https://gestor-de-gastos-2gubwn59u.vercel.app/  
**Nível de Severidade:** 🔴 CRÍTICO (4 vulns altas + 1 informação sensível)

---

## 📋 Resumo Executivo

A aplicação foi analisada em detalhes e **5 brechas de segurança significativas** foram identificadas:

| # | Vulnerabilidade | Severidade | OWASP | Status |
|---|---|---|---|---|
| 1 | Information Disclosure via Error Messages | ALTA | A01:2021 | ❌ Não corrigido |
| 2 | Falta de Security Headers | ALTA | A05:2021 | ❌ Não corrigido |
| 3 | localStorage sem proteção (offline data) | MÉDIA | A02:2021 | ⚠️ Limitado |
| 4 | CORS não configurado explicitamente | MÉDIA | A07:2021 | ⚠️ Supabase default |
| 5 | Validação de .env ausente | MÉDIA | A01:2021 | ❌ Não corrigido |

---

## 🚨 Detalhes das Vulnerabilidades

### 1. Information Disclosure via Error Messages (CRÍTICA)

**Problema:** Mensagens de erro do servidor são exibidas diretamente ao usuário.

**Linhas Afetadas:** 643, 691, 747, 767, 873, 956, 1160, 1373, 1541, 1592, 1723, 1861, 2149, 2419, 2760, 2796, 2818, 2853, 2900, 2954

**Exemplo perigoso:**
```javascript
// Linha 643
setAuthMessage(`Erro ao recuperar sessao: ${error.message}`);
// Pode exibir: "Erro ao recuperar sessao: Invalid user ID format"
// Expõe detalhes internos do banco de dados!
```

**Riscos:**
- Exposição de estrutura interna do banco (names, formats)
- Informação ao atacante sobre tipos de erro
- Violação de OWASP A01:2021 (Broken Access Control)

**Solução:** Usar mensagens genéricas para o usuário, logs detalhados para desenvolvedores

---

### 2. Missing Security Headers (ALTA)

**Problema:** O `vercel.json` não configura headers HTTP de segurança.

**Headers faltantes:**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

**Riscos:**
- Sem CSP: XSS pode ser executado
- Sem X-Frame-Options: Clickjacking possível
- Sem HSTS: MITM attacks em HTTP

---

### 3. localStorage sem Encriptação (MÉDIA)

**Problema:** Transações financeiras são armazenadas em localStorage em texto simples.

**Dados expostos:**
- `fluxoforte.transactions.v1` - Descrições de transações
- `fluxoforte.goals.v1` - Metas financeiras
- `fluxoforte.categories.v1` - Categorias
- `fluxoforte.categoryBudgets.v1` - Orçamentos

**Riscos:**
- Compromisso do computador → exposição de dados
- Scripts maliciosos do mesmo origin acessam
- Sincope quando trocar dispositivos

**Mitigação(s) já aplicada(s):**
- ✅ Dados sensíveis não incluem credenciais
- ✅ Supabase Auth é protegido
- ✅ Rate limiting em importação

---

### 4. CORS não Configurado Explicitamente (MÉDIA)

**Análise:**
- Supabase define CORS por padrão (restritivo)
- Vercel.json não sobrescreve
- ✅ Não é vulnerabilidade imediata

**Recomendação:** Documentar CORS policy do Supabase

---

### 5. Validação de .env Incompleta (MÉDIA)

**Problema:** Script não valida se environment variables existem antes de usar.

**Linha 620-626:**
```javascript
const cfg = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
};

if (!cfg.url || !cfg.anonKey) {
  setAuthMessage("Configure o arquivo .env...");
  return;
}
```

**Riscos:**
- Se env var estiver vazio, undefined é passado
- Supabase client pode falhar silenciosamente
- Erro não é detectado no build time

---

## ✅ Implementações Existentes (Bem Feitas)

```javascript
// ✅ HTML Escaping implementado
escapeHtml(text) - Linha 112 app-utils.js

// ✅ XSS Detection implementado
detectXSS(str) - Valida pattern perigosos

// ✅ Rate Limiting implementado
loginRateLimiter (5 tentativas/5 minutos)

// ✅ Input Validation implementado
validateAndSanitizeTransaction()

// ✅ RLS no Supabase implementado
Todas as tabelas checam auth.uid()
```

---

## 🔧 Plano de Correção

### Prioridade 1: CRÍTICO (Implementar hoje)

**1.1 Corrigir Error Messages**

Padrão seguro:
```javascript
// ANTES (vulnerável)
setAuthMessage(`Erro ao recuperar sessao: ${error.message}`);

// DEPOIS (seguro)
const userMessage = error.code === 'PGRST116' 
  ? "Dados não encontrados."
  : error.message?.includes('timeout')
    ? "Conexão lenta. Tente novamente."
    : "Erro ao processar. Tente novamente.";
setAuthMessage(userMessage);
console.error('[ERROR]', error.message); // Log detalhado apenas no console
```

**Arquivos a modificar:** script.js (20+ linhas)

---

### Prioridade 2: ALTA (Implementar nos próximos 2 dias)

**2.1 Adicionar Security Headers**

Atualizar `vercel.json` com headers HTTP.

**2.2 Adicionar CSP Meta Tag** (fallback)

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com">
```

---

### Prioridade 3: MÉDIA (Implementar próxima semana)

**3.1 Audit Logging**

Rastrear ações sensíveis na tabela `usage_events`.

**3.2 Environment Variable Validation**

Adicionar validação em tempo de build.

**3.3 Documentação CORS**

Adicionar explicação de CORS policy.

---

## 📊 OWASP Top 10 Mapping

| OWASP | Categoria | Status |
|---|---|---|
| A01:2021 | Broken Access Control | ⚠️ Error messages expõem estrutura |
| A02:2021 | Cryptographic Failures | ✅ localStorage não tem dados críticos |
| A03:2021 | Injection | ✅ Supabase + input validation |
| A04:2021 | Insecure Design | ✅ RLS policies implementadas |
| A05:2021 | Security Misconfiguration | 🔴 Headers faltando |
| A06:2021 | Vulnerable Components | ✅ Dependencies atualizadas |
| A07:2021 | CORS | ⚠️ Não explicitamente configurado |
| A08:2021 | Software/Data Integrity | ✅ Sem CDN não-verificado |
| A09:2021 | Logging/Monitoring | ⚠️ Falta audit logging |
| A10:2021 | SSRF | ✅ Client-side only |

---

## 🔐 Próximas Ações

1. **Emergencial (hoje):** Corrigir error message disclosure
2. **Importante (2 dias):** Adicionar security headers
3. **Monitoramento:** Verificar logs do Vercel e Supabase
4. **Futuro:** Implementar 2FA, CSP strict, audit logging

---

## 📝 Notas

- ✅ Aplicação tem boa base de segurança
- ✅ Sanitização HTML implementada corretamente
- ✅ Rate limiting funciona
- ❌ Exposição de erros é o risco maior
- ❌ Headers HTTP ausentes reduzem defesa

**Recomendação:** Implementar as correções Prioridade 1 antes de processar dados financeiros de usuários reais.

