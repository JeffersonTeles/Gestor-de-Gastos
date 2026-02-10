# 📖 Documentação de Setup

## Início Rápido

### 1. Variáveis de Ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database
DATABASE_URL=postgresql://postgres:senha@db.seu-projeto.supabase.co:5432/postgres

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Banco de Dados

```bash
# Criar tabelas
npx prisma db push

# Ou, se precisar criar migration:
npx prisma migrate dev --name init
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Rodar Projeto

```bash
npm run dev
# Abra http://localhost:3000
```

---

## Estrutura do Projeto

```
src/
├── app/                    ← Next.js App Router
│   ├── (auth)/            ← Layout auth
│   ├── (dashboard)/       ← Layout dashboard
│   └── api/               ← Rotas API
├── components/
│   ├── ui/                ← Componentes reutilizáveis
│   └── features/          ← Componentes de negócio
├── lib/
│   ├── supabase/          ← Clientes Supabase
│   ├── db.ts              ← Prisma singleton
│   └── hooks.ts           ← Custom hooks
├── types/                 ← TypeScript types
├── providers.tsx          ← App Provider unificado
└── globals.css            ← Estilos globais
```

---

## Stack Técnico

- **Framework**: Next.js 16
- **Banco de Dados**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **Estilos**: TailwindCSS
- **Estado**: React Context (unificado)
- **Validação**: Zod (quando necessário)

---

## Commands Úteis

```bash
# Dev
npm run dev

# Build
npm run build

# Start (produção)
npm start

# Lint
npm run lint

# Prisma
npx prisma studio     # Abrir admin do banco
npx prisma generate   # Regenerar Prisma Client
```

---

## Próximas Fases

1. **Criar página de Nova Transação** (`/dashboard/transactions/new`)
2. **Adicionar gráficos** com Chart.js ou ECharts
3. **Deploy no Vercel** (conectar GitHub e fazer push)
