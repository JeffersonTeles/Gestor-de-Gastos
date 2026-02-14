# 📱 Guia de Integração WhatsApp

## 📋 Status Atual

**✅ Implementado:**
- Interface visual de conexão no dashboard
- API webhook endpoint (`/api/whatsapp`)
- Parser de comandos inteligente
- Sistema de resposta automática
- Comandos suportados: despesa, receita, saldo

**⚠️ Demonstração:**
- Atualmente funcionando em modo **simulação**
- Não envia/recebe mensagens reais do WhatsApp
- Interface mostra exemplos de uso

---

## 🔧 O que precisa ser feito para Produção

### 1️⃣ **Criar Conta WhatsApp Business API**

#### Opções disponíveis:

**A) Meta for Developers (Oficial - Grátis/Pago)**
- Acesse: https://developers.facebook.com/
- Crie um app de negócios
- Adicione o produto "WhatsApp"
- Configure o número de telefone business

**B) Twilio WhatsApp API (Recomendado para MVP)**
- Acesse: https://www.twilio.com/whatsapp
- Crie conta Twilio
- Ative WhatsApp API
- Mais simples de configurar
- Sandbox gratuito para testes

**C) 360Dialog, MessageBird, ou outros provedores**
- Alternativas com diferentes planos

---

### 2️⃣ **Configurar Variáveis de Ambiente**

Adicione no arquivo `.env.local`:

```env
# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=seu_token_seguro_aqui_123xyz
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id_aqui
WHATSAPP_BUSINESS_ACCOUNT_ID=seu_account_id

# Meta/Facebook (se usar API oficial)
WHATSAPP_ACCESS_TOKEN=seu_access_token_meta
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret

# OU Twilio (se usar Twilio)
TWILIO_ACCOUNT_SID=seu_account_sid
TWILIO_AUTH_TOKEN=seu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

### 3️⃣ **Configurar Webhook**

#### Passo 1: Expor aplicação publicamente
Para desenvolvimento/testes, use:
- **ngrok**: `npx ngrok http 3000`
- **localtunnel**: `npx localtunnel --port 3000`

Para produção, faça deploy em:
- Vercel (recomendado)
- Netlify
- AWS/Azure/Google Cloud

#### Passo 2: Registrar URL do Webhook

**URL do Webhook:** `https://seu-dominio.com/api/whatsapp`

No painel do WhatsApp Business API:
1. Vá em "Configurações de Webhook"
2. Cole a URL: `https://seu-dominio.com/api/whatsapp`
3. Cole o token de verificação (o mesmo do .env)
4. Selecione eventos: `messages`
5. Clique em "Verificar e Salvar"

---

### 4️⃣ **Atualizar Código da API**

Modifique `/src/app/api/whatsapp/route.ts` para receber mensagens reais:

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Estrutura varia por provedor. Exemplo Meta/Facebook:
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    
    if (!message) {
      return NextResponse.json({ success: true });
    }
    
    const from = message.from; // Número do remetente
    const messageText = message.text?.body;
    
    // Buscar userId pelo número de telefone
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('whatsapp_number', from)
      .single();
    
    if (!userProfile) {
      // Enviar mensagem pedindo cadastro
      await sendWhatsAppMessage(from, 
        '⚠️ Número não cadastrado. Acesse o app para conectar seu WhatsApp.'
      );
      return NextResponse.json({ success: true });
    }
    
    const userId = userProfile.user_id;
    const command = parseCommand(messageText);
    
    // ... resto do código (adicionar transação, etc)
    
    // Enviar resposta via WhatsApp
    await sendWhatsAppMessage(from, responseMessage);
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 5️⃣ **Implementar Função de Envio de Mensagens**

Crie `/src/lib/whatsapp.ts`:

```typescript
// Exemplo para Meta/Facebook API
export async function sendWhatsAppMessage(to: string, text: string) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send WhatsApp message: ${response.statusText}`);
  }
  
  return response.json();
}

// Exemplo para Twilio
export async function sendWhatsAppMessageTwilio(to: string, text: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);
  
  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: `whatsapp:${to}`,
    body: text
  });
}
```

---

### 6️⃣ **Adicionar Campo no Banco de Dados**

Execute migration no Supabase:

```sql
-- Adicionar campo whatsapp_number na tabela de perfis
ALTER TABLE user_profiles 
ADD COLUMN whatsapp_number VARCHAR(20) UNIQUE;

-- Criar índice para consultas rápidas
CREATE INDEX idx_user_profiles_whatsapp 
ON user_profiles(whatsapp_number);
```

---

### 7️⃣ **Atualizar Interface de Conexão**

Modifique `/src/components/integrations/WhatsAppIntegration.tsx`:

```typescript
const handleConnect = async () => {
  if (!phoneNumber) return;
  
  try {
    // Salvar número no perfil do usuário
    const response = await fetch('/api/user/update-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phoneNumber: phoneNumber.replace(/\D/g, '') 
      })
    });
    
    if (response.ok) {
      setIsConnected(true);
      // Enviar mensagem de boas-vindas via WhatsApp
    }
  } catch (error) {
    console.error('Erro ao conectar WhatsApp:', error);
  }
};
```

---

## 🧪 Como Testar

### Testes Locais (Sandbox)

1. **Com Twilio Sandbox:**
```bash
# Envie no seu WhatsApp:
join <código-do-sandbox>

# Depois teste comandos:
despesa 50 almoço
receita 1000 salário
saldo
```

2. **Com ngrok:**
```bash
# Terminal 1
npm run dev

# Terminal 2
npx ngrok http 3000

# Use a URL gerada no webhook
```

---

## 📊 Comandos Suportados

| Comando | Exemplos | Ação |
|---------|----------|------|
| **Despesa** | `despesa 50 mercado`<br>`gastei 30 uber`<br>`paguei 100 luz` | Registra despesa |
| **Receita** | `receita 1000 salário`<br>`recebi 200 freelance` | Registra receita |
| **Saldo** | `saldo`<br>`quanto tenho`<br>`balanço` | Mostra resumo do mês |

---

## 💰 Custos Estimados

### Meta/Facebook (Oficial)
- 1.000 conversas/mês: **Grátis**
- Acima disso: ~$0.005-0.009 por conversa
- Conversa = janela de 24h com usuário

### Twilio
- Mensagens recebidas: **Grátis**
- Mensagens enviadas: ~$0.005 por mensagem
- Sandbox: **Grátis** (limitado)

### Alternativas
- 360Dialog: A partir de €49/mês
- MessageBird: Pay-as-you-go

---

## 🔐 Segurança

### ✅ Checklist de Segurança:

- [ ] Validar webhook com token secreto
- [ ] Verificar origem das mensagens
- [ ] Rate limiting para evitar spam
- [ ] Sanitizar input do usuário
- [ ] Não expor tokens no código
- [ ] Usar HTTPS obrigatoriamente
- [ ] Implementar autenticação de 2 fatores
- [ ] Log de todas as transações via WhatsApp

---

## 🚀 Próximos Passos Recomendados

1. **Escolher provedor** (recomendo Twilio para começar)
2. **Fazer deploy da aplicação** (Vercel é ideal para Next.js)
3. **Configurar webhook** no provedor escolhido
4. **Testar no sandbox** antes de ir para produção
5. **Adicionar recursos avançados:**
   - Confirmação antes de registrar (botões interativos)
   - Categorização automática com IA
   - Notificações proativas (lembretes de contas)
   - Suporte a imagens de notas fiscais (OCR)
   - Comandos de voz

---

## 📚 Recursos Úteis

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Twilio WhatsApp Quickstart](https://www.twilio.com/docs/whatsapp/quickstart)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Webhook de WhatsApp](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)

---

## ❓ Dúvidas Frequentes

**Q: Posso usar meu número pessoal do WhatsApp?**  
A: Não. É necessário um número business dedicado verificado pela Meta.

**Q: Funciona com WhatsApp normal?**  
A: Sim! Os usuários usam WhatsApp normal, apenas o backend precisa da API Business.

**Q: Quanto tempo leva para configurar?**  
A: Com Twilio sandbox: 30 minutos. Com Meta oficial: 1-3 dias (verificação).

**Q: Preciso de servidor próprio?**  
A: Não. Funciona em serverless (Vercel, Netlify, etc).

---

## 🎯 Resumo Executivo

**Status:** Pronto para desenvolvimento, precisa de configuração para produção  
**Complexidade:** Média  
**Tempo estimado:** 2-4 horas (com Twilio) ou 1-2 dias (com Meta)  
**Custo mensal:** Grátis até 1k conversas, depois ~$5-10/mês  
**ROI:** Alto - Facilita muito o registro de gastos para usuários

---

**Desenvolvido para:** Gestor de Gastos  
**Última atualização:** 13/02/2026  
**Versão:** 1.0
