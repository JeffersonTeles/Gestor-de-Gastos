# 🚀 Setup Rápido - Integração WhatsApp

## ⚡ Guia de 5 Minutos (Twilio Sandbox)

### Passo 1: Criar conta Twilio (2 min)

1. Acesse: https://www.twilio.com/try-twilio
2. Crie conta gratuita
3. Verifique email e telefone

### Passo 2: Ativar WhatsApp Sandbox (1 min)

1. No dashboard Twilio, acesse: **Messaging** → **Try it Out** → **Send a WhatsApp message**
2. Copie o código que aparece (ex: `join happy-cat`)
3. No seu WhatsApp, envie para `+1 415 523 8886` a mensagem copiada
4. Aguarde confirmação

### Passo 3: Configurar Variáveis (1 min)

1. Ainda no Twilio, vá em **Account** → **API keys & tokens**
2. Copie:
   - **Account SID**
   - **Auth Token**

3. Crie arquivo `.env.local`:

```bash
# No terminal
cp .env.example .env.local
```

4. Edite `.env.local` e adicione:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=seu_token_aqui
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
WHATSAPP_VERIFY_TOKEN=meu_token_secreto_123
```

### Passo 4: Expor Webhook Local (1 min)

```bash
# Terminal 1: Iniciar app
npm run dev

# Terminal 2: Expor via ngrok
npx ngrok http 3000
```

Copie a URL HTTPS gerada (ex: `https://abc123.ngrok.io`)

### Passo 5: Configurar Webhook no Twilio (30 seg)

1. No Twilio: **Messaging** → **Settings** → **WhatsApp sandbox settings**
2. Em **When a message comes in**, cole:
   ```
   https://abc123.ngrok.io/api/whatsapp
   ```
3. Clique **Save**

### ✅ Pronto! Teste agora:

Envie no WhatsApp para `+1 415 523 8886`:
- `despesa 50 almoço`
- `receita 1000 salário`
- `saldo`

---

## 🏢 Setup Produção (WhatsApp Business)

### Requisitos
- Número de telefone business (não pode ser pessoal)
- Empresa verificada no Facebook Business Manager
- ~2-3 dias para aprovação

### Passo a Passo

#### 1. Facebook Business Manager

1. Acesse: https://business.facebook.com
2. Crie Business Manager (se não tiver)
3. Adicione informações da empresa
4. Aguarde verificação (~24h)

#### 2. Criar App WhatsApp Business

1. Acesse: https://developers.facebook.com/apps
2. Clique **Create App**
3. Escolha **Business** como tipo
4. Preencha informações básicas
5. Adicione produto **WhatsApp**

#### 3. Configurar Número

1. No app criado, vá em **WhatsApp** → **Getting Started**
2. Clique **Add phone number**
3. Siga processo de verificação
4. Aguarde aprovação (~1-3 dias)

#### 4. Gerar Token Permanente

1. Em **WhatsApp** → **Getting Started**
2. Gere **System User Token**
3. Selecione permissões:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Copie token (nunca expira se não revogar)

#### 5. Deploy da Aplicação

**Opção A: Vercel (Recomendado)**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Seguir prompts e adicionar variáveis de ambiente
```

Ou via dashboard:
1. Acesse: https://vercel.com
2. Importe repositório GitHub
3. Configure variáveis de ambiente
4. Deploy!

**Opção B: Outras plataformas**
- Netlify
- Railway
- Heroku
- AWS/Azure/GCP

#### 6. Configurar Webhook

1. No Facebook Developers, vá em **WhatsApp** → **Configuration**
2. Em **Webhook**, clique **Edit**
3. Cole URL: `https://seu-dominio.vercel.app/api/whatsapp`
4. Cole **Verify Token** (o mesmo do .env)
5. Selecione campo: `messages`
6. Clique **Verify and save**

#### 7. Testar

Envie mensagem do seu WhatsApp para o número configurado:
```
despesa 100 mercado
```

Deve receber resposta automática confirmando!

---

## 🔍 Troubleshooting

### Erro: "Webhook verification failed"
- Verifique se WHATSAPP_VERIFY_TOKEN no .env está correto
- Confirme que a URL está acessível publicamente
- Teste manualmente: `GET https://sua-url/api/whatsapp?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=1234`
- Deve retornar `1234`

### Erro: "Message not being received"
- Verifique logs no Twilio/Meta dashboard
- Confirme que webhook está configurado corretamente
- Teste com `curl` direto na sua API
- Verifique se o número está conectado no app

### Erro: "Failed to send message"
- Verifique credenciais (SID, Auth Token)
- Confirme que número está no formato correto
- Para Twilio: verifique se está no sandbox registrado
- Para Meta: confirme que número enviou join/optou in

### Webhook não recebe POST
- Confirme que app está rodando
- Para ngrok: URL muda toda vez que reinicia
- Para produção: verifique se deploy foi bem-sucedido
- Teste endpoint manualmente com Postman

### Transações não aparecem no app
- Verifique se usuário conectou WhatsApp no dashboard
- Confirme que número está salvo no campo `whatsapp_number` do perfil
- Veja logs da API para erros do Supabase
- Execute migration SQL se não fez

---

## 📊 Monitoramento

### Logs em Desenvolvimento
```bash
# Terminal onde roda npm run dev
# Verá logs de:
# - Mensagens recebidas
# - Comandos parseados
# - Transações criadas
# - Erros (se houver)
```

### Logs em Produção (Vercel)
1. Acesse dashboard Vercel
2. Vá em **Logs** do projeto
3. Filtre por `/api/whatsapp`

### Twilio Console
- **Monitor** → **Logs** → **WhatsApp**
- Veja todas mensagens enviadas/recebidas
- Status de entrega
- Erros

### Meta Business Manager
- **WhatsApp Manager** → **Insights**
- Volume de mensagens
- Taxa de resposta
- Métricas de uso

---

## 💡 Dicas de Produção

### Segurança
```typescript
// Valide webhook signature (Twilio)
import { validateRequest } from 'twilio';

const signature = request.headers.get('x-twilio-signature');
const url = 'https://seu-dominio.com/api/whatsapp';
const params = await request.json();

const isValid = validateRequest(
  process.env.TWILIO_AUTH_TOKEN!,
  signature!,
  url,
  params
);

if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
}
```

### Rate Limiting
```typescript
// Limitar mensagens por usuário
const redis = new Redis(process.env.REDIS_URL);
const key = `whatsapp:${phoneNumber}`;
const count = await redis.incr(key);

if (count === 1) {
  await redis.expire(key, 60); // 1 minuto
}

if (count > 10) {
  await sendWhatsAppMessage(phoneNumber, 
    '⚠️ Muitas mensagens. Aguarde um momento.'
  );
  return;
}
```

### Retry Logic
```typescript
// Retry em caso de falha
async function sendWithRetry(to: string, text: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await sendWhatsAppMessage(to, text);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

### Queue (para alto volume)
```typescript
// Use BullMQ ou similar
import { Queue } from 'bullmq';

const whatsappQueue = new Queue('whatsapp', {
  connection: { host: 'localhost', port: 6379 }
});

// Adicionar à fila
await whatsappQueue.add('send-message', {
  to: phoneNumber,
  text: responseMessage
});

// Worker processa em background
```

---

## 📝 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Migration SQL executada no Supabase
- [ ] App deployado em produção
- [ ] Webhook configurado e verificado
- [ ] Número WhatsApp conectado
- [ ] Teste de ponta a ponta realizado
- [ ] Logs configurados e funcionando
- [ ] Monitoramento de erros (Sentry)
- [ ] Rate limiting implementado
- [ ] Documentação atualizada
- [ ] Equipe treinada em comandos

---

## 🎯 Próximos Passos

1. **IA para Categorização**
   - Integrar OpenAI para categorizar automaticamente
   - Ex: "50 uber" → categoria "Transporte"

2. **Mensagens Proativas**
   - Lembretes: "Você tem 3 contas vencendo hoje"
   - Summaries: "Resumo da semana: ..."

3. **Comandos Avançados**
   - `editar ultima` - Editar última transação
   - `deletar 45 almoço` - Deletar específica
   - `recorrente 100 netflix mensal` - Despesa recorrente

4. **Mídia**
   - Receber foto de nota fiscal
   - OCR para extrair valores
   - Salvar comprovante

5. **Botões Interativos**
   - Confirmar antes de salvar
   - Escolher categoria
   - Ver opções de saldo

---

**Criado em:** 13/02/2026  
**Versão:** 1.0  
**Suporte:** Consulte documentação completa em WHATSAPP_INTEGRATION.md
