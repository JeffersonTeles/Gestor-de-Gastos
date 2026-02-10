# 📡 Documentação de API

## Base URL

```
http://localhost:3000/api
```

---

## Autenticação

Todas as rotas exigem token JWT (Supabase).
O token é enviado automaticamente via cookies.

---

## Transações

### GET /transactions
Listar transações do usuário.

**Query Params**:
```
?category=Alimentação
?type=expense|income
?page=1
?limit=50
```

**Response**:
```json
[
  {
    "id": "uuid",
    "userId": "user-id",
    "amount": 50.00,
    "currency": "BRL",
    "category": "Alimentação",
    "description": "Almoço no restaurante",
    "type": "expense",
    "date": "2026-02-09T12:00:00Z",
    "tags": ["lunch"],
    "notes": null,
    "createdAt": "2026-02-09T12:00:00Z",
    "updatedAt": "2026-02-09T12:00:00Z"
  }
]
```

---

### POST /transactions
Criar nova transação.

**Body**:
```json
{
  "amount": 50.00,
  "currency": "BRL",
  "category": "Alimentação",
  "description": "Almoço",
  "type": "expense",
  "date": "2026-02-09",
  "tags": ["lunch"],
  "notes": "Restaurante italiano"
}
```

**Response**: `201 Created`
```json
{
  "id": "new-uuid",
  ...
}
```

---

### GET /transactions/[id]
Obter uma transação específica.

**Response**: `200 OK`
```json
{
  "id": "uuid",
  ...
}
```

---

### PUT /transactions/[id]
Atualizar transação.

**Body**: Qualquer campo acima

**Response**: `200 OK`

---

### DELETE /transactions/[id]
Deletar transação.

**Response**: `200 OK`
```json
{
  "success": true
}
```

---

## Analytics

### GET /analytics
Obter estatísticas.

**Response**:
```json
{
  "totalTransactions": 42,
  "totalIncome": 5000.00,
  "totalExpense": 2500.00,
  "byCategory": {
    "Alimentação": { "income": 0, "expense": 500 },
    "Transporte": { "income": 0, "expense": 200 }
  },
  "byMonth": {
    "2026-02": { "income": 5000, "expense": 2500 },
    "2026-01": { "income": 4000, "expense": 2000 }
  }
}
```

---

## User

### POST /user/create-profile
Criar perfil do usuário (chamado automaticamente no signup).

**Body**:
```json
{
  "userId": "user-id-from-supabase",
  "email": "user@example.com",
  "name": "João"
}
```

**Response**: `201 Created`

---

## Tratamento de Erros

### Erros de Autenticação
```json
{
  "error": "Unauthorized",
  "status": 401
}
```

### Erros de Validação
```json
{
  "error": "Campos obrigatórios faltando",
  "status": 400
}
```

### Erros de Servidor
```json
{
  "error": "Internal Server Error",
  "status": 500
}
```

---

## Exemplo com cURL

```bash
# Login (cria token)
curl -X POST https://seu-projeto.supabase.co/auth/v1/token \
  -H "apikey: SEU_ANON_KEY" \
  -d '{"email":"user@example.com","password":"senha"}'

# Listar transações
curl -X GET http://localhost:3000/api/transactions \
  -H "Cookie: sb-token=..."

# Criar transação
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-token=..." \
  -d '{
    "amount": 50,
    "currency": "BRL",
    "category": "Alimentação",
    "description": "Almoço",
    "type": "expense",
    "date": "2026-02-09"
  }'
```
