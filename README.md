<div align="center">

# 💰 Gestor de Gastos

### Aplicativo completo e seguro para gerenciar suas finanças pessoais

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-success.svg)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Demo](https://seu-app.vercel.app) • [Documentação](./docs) • [Contribuir](#contribuindo)

</div>

---

## ✨ Funcionalidades

### 📊 Gestão Financeira
- ✅ Controle completo de receitas e despesas
- ✅ Categorização inteligente de transações
- ✅ Relatórios visuais com gráficos interativos
- ✅ Filtros avançados (mês, categoria, tipo)
- ✅ Exportação para CSV e PDF

### 🤖 Inteligência Artificial
- ✅ Previsão de gastos para próximos 7 dias
- ✅ Análise de padrões de consumo
- ✅ Sugestões personalizadas
- ✅ Busca semântica (opcional)

### 🏷️ Organização
- ✅ Tags personalizadas
- ✅ Notas e observações
- ✅ Comprovantes anexados
- ✅ Transações recorrentes

### 🔒 Segurança
- ✅ Autenticação com Supabase
- ✅ Row Level Security (RLS)
- ✅ Validação e sanitização de dados
- ✅ Proteção contra XSS e injection
- ✅ Rate limiting client-side
- ✅ Criptografia de dados sensíveis

### 📱 PWA (Progressive Web App)
- ✅ Instalável em desktop e mobile
- ✅ Funciona offline
- ✅ Sincronização automática
- ✅ Push notifications
- ✅ Cache inteligente

### 🎨 Interface Premium
- ✅ Design moderno e responsivo
- ✅ Modo escuro
- ✅ Animações fluidas
- ✅ Atalhos de teclado (Ctrl+K, Ctrl+E, etc)
- ✅ Modo compacto e modo foco

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ 
- Conta no Supabase (grátis com [GitHub Student Pack](https://education.github.com/pack))
- Git

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/gestor-de-gastos.git
cd gestor-de-gastos

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# 4. Execute em desenvolvimento
npm run dev
```

### Configuração do Supabase

Siga o guia completo em [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para:
- Criar tabelas e índices
- Configurar Row Level Security
- Setup de Storage para anexos
- Funções SQL e triggers
- Backup e monitoramento

---

## 📖 Uso

### Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+K` | Toggle modo foco |
| `Ctrl+E` | Exportar para CSV |
| `Ctrl+M` | Modo compacto |
| `Ctrl+P` | Toggle previsões IA |
| `Ctrl+N` | Nova transação |
| `?` | Mostrar atalhos |
| `Esc` | Fechar modais |

### Adicionando Transações

1. Clique em "+ Despesa" ou "+ Receita"
2. Preencha os campos (descrição, valor, categoria, data)
3. **(Opcional)** Adicione tags para organização
4. **(Opcional)** Anexe um comprovante
5. **(Opcional)** Adicione notas
6. Clique em "Adicionar Transação"

### Análise de Dados

- **Dashboard:** Visualize resumo financeiro, gráficos e estatísticas
- **Transações:** Lista detalhada com busca e filtros
- **IA Counselor:** Receba insights personalizados

---

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool rápido
- **Tailwind CSS** - Styling
- **Recharts** - Gráficos
- **Lucide React** - Ícones

### Backend & Infraestrutura
- **Supabase** - BaaS (Auth, Database, Storage)
- **PostgreSQL** - Banco de dados
- **Row Level Security** - Segurança de dados
- **Supabase Storage** - Armazenamento de arquivos

### PWA & Performance
- **Service Worker** - Cache offline
- **Workbox** - PWA tools
- **IndexedDB** - Storage local

### IA & ML
- **Google Gemini** - IA generativa
- **pgvector** - Busca semântica (opcional)

---

## 📁 Estrutura do Projeto

```
gestor-de-gastos/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── service-worker.js      # Service Worker
│   ├── offline.html           # Página offline
│   └── icons/                 # Ícones PWA
├── src/
│   ├── components/            # Componentes React
│   │   ├── Dashboard.tsx      # Dashboard principal
│   │   ├── TransactionForm.tsx
│   │   ├── AttachmentUploader.tsx
│   │   ├── TagInput.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── ...
│   ├── contexts/              # React Context
│   │   ├── AuthContext.tsx
│   │   ├── DataContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Bibliotecas
│   │   └── supabase.ts
│   ├── services/              # Serviços
│   │   ├── geminiService.ts
│   │   └── semanticSearch.ts
│   ├── utils/                 # Utilitários
│   │   ├── validation.ts      # Validação/sanitização
│   │   └── pwa.ts             # PWA helpers
│   ├── types.ts               # TypeScript types
│   └── main.tsx               # Entry point
├── SUPABASE_SETUP.md          # Guia de setup
└── README.md
```

---

## 🔐 Segurança

Este projeto implementa múltiplas camadas de segurança:

1. **Autenticação:** Supabase Auth com email verification
2. **Autorização:** Row Level Security no PostgreSQL
3. **Validação:** Validação client-side e server-side
4. **Sanitização:** Proteção contra XSS e SQL injection
5. **HTTPS:** Todas as comunicações criptografadas
6. **Rate Limiting:** Proteção contra abuso

Veja [SECURITY.md](./SECURITY.md) para mais detalhes.

---

## 🚀 Deploy

### Vercel (Recomendado)

```bash
npm run build
vercel --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Configurar variáveis de ambiente no serviço de deploy:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GEMINI_API_KEY=your_gemini_key
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Add: Nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

---

## 🆘 Suporte

- 📧 Email: seu-email@exemplo.com
- 💬 Discord: [Link do servidor]
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/gestor-de-gastos/issues)

---

## 🙏 Agradecimentos

- [Supabase](https://supabase.com/) - Backend as a Service
- [GitHub Student Pack](https://education.github.com/pack) - Recursos gratuitos
- [Vercel](https://vercel.com/) - Hosting
- Comunidade Open Source

---

<div align="center">

**Feito com ❤️ e muito ☕**

⭐ Se este projeto te ajudou, considere dar uma estrela!

</div>
