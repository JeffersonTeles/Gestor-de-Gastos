# 🏗️ Arquitetura do Projeto

## Visão Geral

Projeto SaaS de Gestor de Gastos com:
- ✅ Full-stack em Next.js
- ✅ Serverless (Vercel)
- ✅ Multi-tenant com Supabase RLS
- ✅ Custo zero

---

## Fluxo de Autenticação

```
1. Usuário acessa /auth/login ou /auth/signup
2. Cria conta no Supabase Auth
3. Profile criado no Prisma
4. AppProvider detecta usuário
5. Redireciona para /dashboard
```

---

## Camadas da Aplicação

### 1. **Presentation Layer** (`src/app/`)
- Páginas Next.js
- Roteamento automático
- Server/Client components

### 2. **Business Logic** (`src/lib/hooks.ts`)
- `useAuth()` - Autenticação
- `useTransactions()` - CRUD de transações
- `useTheme()` - Tema

### 3. **Data Access** (`src/lib/`)
- Supabase clients
- Prisma ORM
- Database queries

### 4. **UI Components** (`src/components/`)
- Componentes reutilizáveis (`ui/`)
- Componentes de negócio (`features/`)

---

## API Routes

### Transações
- `GET /api/transactions` - Listar
- `POST /api/transactions` - Criar
- `GET /api/transactions/[id]` - Detalhes
- `PUT /api/transactions/[id]` - Atualizar
- `DELETE /api/transactions/[id]` - Deletar

### Analytics
- `GET /api/analytics` - Estatísticas

### User
- `POST /api/user/create-profile` - Criar perfil

---

## Database Schema

### UserProfile
```sql
id: UUID
userId: String (FK do Supabase Auth)
email: String
name: String
currency: String (default: BRL)
createdAt: DateTime
updatedAt: DateTime
```

### Transaction
```sql
id: UUID
userId: String (FK)
amount: Decimal
category: String
description: String
type: 'income' | 'expense'
date: DateTime
tags: String[]
notes: String
createdAt: DateTime
updatedAt: DateTime
```

---

## Estado Global (AppProvider)

Consolidado em um único provider:

```typescript
{
  // Auth
  user: User | null
  loading: boolean
  signOut: () => Promise<void>

  // Theme
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // Notifications
  showNotification: (msg, type) => void
}
```

---

## Segurança

### Autenticação
- Supabase Auth (JWT)
- Next.js API routes verificam auth
- Middleware (opcional)

### Multi-tenant
- RLS policies no Supabase
- Cada usuário vê só seus dados
- Campo `userId` em todas as queries

### Validação
- Zod para schemas (quando necessário)
- Validação no servidor (API routes)
- Validação no cliente (UX)

---

## Deploy (Vercel)

```bash
git init
git add .
git commit -m "Initial commit"
git push origin main

# Vercel detecta automaticamente
# Configure env vars no Vercel dashboard
# Deploy automático em cada push
```

Custo: **R$ 0,00** (free tier: 100K req/mês)
