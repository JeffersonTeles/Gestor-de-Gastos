# Troubleshooting - Login no Vercel

## Problema Reportado
**Sintoma:** Login não funciona no Vercel (app.fluxoforte.com)  
**Ambiente afetado:** Production (Vercel)  
**Ambiente local:** Funciona normalmente

## Causas Provável

### 1. **Variáveis de Ambiente Faltando** (MAIS PROVÁVEL)

O Vercel não consegue encontrar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

**Como verificar:**
1. Vá para https://vercel.com/dashboard/jefferson-teles-1e1e1fbf/gestor-de-gastos
2. Clique em "Settings"
3. Vá para "Environment Variables"
4. Procure por:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

**Se não existirem:**
1. Pegue os valores no seu projeto Supabase:
   - URL: https://seu-projeto.supabase.co
   - Anon Key: Vá em Settings → API → Anon public key

2. No Vercel, adicione as variáveis com os valores corretos

3. Clique em "Save" e redeploy o projeto

### 2. **Valores de Variáveis Incorretos**

Pode ser que os valores foram copiados errado ou mudaram no Supabase.

**Como verificar:**
1. Abra seu projeto no Supabase
2. Vá em Settings → API
3. Copie exatamente:
   - Project URL
   - anon public key

4. No Vercel, atualize com esses valores exatos

### 3. **Build não incluiu as variáveis**

Às vezes o Vercel faz cache do build anterior.

**Como forçar rebuild:**
1. No Vercel, vá para "Deployments"
2. Encontre o último deploy
3. Clique nos 3 pontos (•••)
4. Selecione "Redeploy"

## Checklist de Solução

- [ ] Verificar variáveis no Vercel
- [ ] Comparar com valores reais do Supabase
- [ ] Redeploy forçado
- [ ] Limpar cache do navegador (Ctrl+Shift+Del)
- [ ] Testar em navegador privado/incógnito
- [ ] Verificar DevTools Console (F12) para erros específicos

## Como Testar Localmente

Se quiser testar antes de deploy:

```bash
# 1. Clone o repo
cd ~/Gestor-de-Gastos

# 2. Configure .env com valores reais
cat > .env << EOF
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
EOF

# 3. Instale dependências
npm install

# 4. Rode localmente
npm run dev

# 5. Teste login em http://localhost:5173
```

## Erros Comuns no Console (F12)

### Erro: "supabaseClient is not initialized"
**Causa:** Variáveis de ambiente não foram definidas
**Solução:** Verificar VITE_SUPABASE_URL no .env

### Erro: "Invalid credentials"
**Causa:** Email/senha incorretos ou Supabase não acessível
**Solução:** 
- Verificar email/senha no Supabase
- Verificar se VITE_SUPABASE_ANON_KEY está correto

### Erro: "403 Forbidden" ou "401 Unauthorized"
**Causa:** Chave anon key inválida
**Solução:** Copiar novamente do Supabase Settings → API

### Erro: "CORS" ou "Access blocked"
**Causa:** Supabase URL não está nos allowed origins
**Solução:** 
1. No Supabase, vá em Settings → Auth
2. Verifique "Allowed Redirect URLs"
3. Adicione `https://app.fluxoforte.com` e todas suas variantes

## Próximos Passos

1. **Imediatamente:**
   - Verificar variáveis de ambiente no Vercel
   - Redeploy

2. **Se ainda não funcionar:**
   - Coletar erro exato do DevTools (F12)
   - Verificar Supabase Settings → Auth
   - Verificar logs do Supabase

3. **Se necessário:**
   - Contatar suporte do Vercel
   - Contatar suporte do Supabase com logs de erro

## Links Úteis

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Project Settings](https://app.supabase.com/)
- [Supabase Auth Setup](https://supabase.com/docs/guides/auth)
- [Troubleshooting Supabase Auth](https://supabase.com/docs/guides/auth/troubleshooting)

---

**Created:** março 2026  
**Updated:** durante security audit
