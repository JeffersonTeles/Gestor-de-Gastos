# Configuração do Supabase - Gestor de Gastos

Este documento contém as instruções completas para configurar o Supabase com todos os recursos de segurança e funcionalidades avançadas do sistema.

## 📋 Índice
1. [Estrutura de Tabelas](#estrutura-de-tabelas)
2. [Row Level Security (RLS)](#row-level-security)
3. [Storage para Anexos](#storage-para-anexos)
4. [Funções SQL](#funções-sql)
5. [Triggers](#triggers)
6. [Índices](#índices)

---

## 1. Estrutura de Tabelas

### Tabela: transactions

```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) > 0 AND char_length(description) <= 255),
  value DECIMAL(15, 2) NOT NULL CHECK (value >= 0 AND value <= 999999999),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  date DATE NOT NULL,
  embedding vector(1536), -- Para busca semântica (opcional)
  source_rule_id UUID,
  dedupe_key TEXT,
  tags TEXT[] DEFAULT '{}', -- Array de tags
  attachment_url TEXT, -- URL do comprovante
  notes TEXT, -- Notas adicionais
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'weekly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT unique_dedupe_key UNIQUE (user_id, dedupe_key)
);

-- Índices para performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Índice para busca semântica (se usar embeddings)
CREATE INDEX idx_transactions_embedding ON transactions 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### Tabela: user_preferences (opcional)

```sql
CREATE TABLE user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  currency TEXT DEFAULT 'BRL',
  language TEXT DEFAULT 'pt-BR',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  budget_alerts BOOLEAN DEFAULT TRUE,
  category_targets JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2. Row Level Security (RLS)

### Ativar RLS nas tabelas

```sql
-- Ativar RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
```

### Políticas para transactions

```sql
-- Política: Usuários podem visualizar apenas suas próprias transações
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir apenas em sua própria conta
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas suas próprias transações
CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas suas próprias transações
CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Políticas para user_preferences

```sql
-- Políticas similares para preferências
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## 3. Storage para Anexos

### Criar Bucket

No painel do Supabase, vá em Storage > Create Bucket:

- **Nome:** `transaction-attachments`
- **Public:** ✅ Sim (para URLs públicas)

### Políticas de Storage

```sql
-- Permitir usuários fazer upload de seus próprios arquivos
CREATE POLICY "Users can upload own attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'transaction-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir usuários visualizar seus próprios arquivos
CREATE POLICY "Users can view own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'transaction-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir usuários deletar seus próprios arquivos
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'transaction-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 4. Funções SQL

### Função: Busca Semântica (opcional, requer extensão pgvector)

```sql
-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Função para buscar transações similares
CREATE OR REPLACE FUNCTION match_transactions(
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  description text,
  value decimal,
  type text,
  category text,
  date date,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.description,
    t.value,
    t.type,
    t.category,
    t.date,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM transactions t
  WHERE 
    (user_id IS NULL OR t.user_id = user_id) AND
    t.embedding IS NOT NULL
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Função: Estatísticas do usuário

```sql
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id uuid, p_start_date date, p_end_date date)
RETURNS TABLE (
  total_income decimal,
  total_expense decimal,
  total_balance decimal,
  transaction_count bigint,
  avg_transaction decimal,
  top_category text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN value ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN value ELSE 0 END), 0) AS total_expense,
    COALESCE(SUM(CASE WHEN type = 'income' THEN value ELSE -value END), 0) AS total_balance,
    COUNT(*)::bigint AS transaction_count,
    COALESCE(AVG(value), 0) AS avg_transaction,
    (
      SELECT category
      FROM transactions
      WHERE user_id = p_user_id
        AND date BETWEEN p_start_date AND p_end_date
        AND type = 'expense'
      GROUP BY category
      ORDER BY SUM(value) DESC
      LIMIT 1
    ) AS top_category
  FROM transactions
  WHERE user_id = p_user_id
    AND date BETWEEN p_start_date AND p_end_date;
END;
$$;
```

---

## 5. Triggers

### Trigger: Atualizar timestamp automaticamente

```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para transactions
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para user_preferences
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Trigger: Validação de dados

```sql
CREATE OR REPLACE FUNCTION validate_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar valor
  IF NEW.value < 0 OR NEW.value > 999999999 THEN
    RAISE EXCEPTION 'Valor inválido: deve estar entre 0 e 999.999.999';
  END IF;
  
  -- Validar descrição
  IF LENGTH(TRIM(NEW.description)) = 0 OR LENGTH(NEW.description) > 255 THEN
    RAISE EXCEPTION 'Descrição inválida: deve ter entre 1 e 255 caracteres';
  END IF;
  
  -- Sanitizar descrição (remover tags HTML básicas)
  NEW.description = REGEXP_REPLACE(NEW.description, '<[^>]*>', '', 'g');
  
  -- Validar data (não muito no futuro)
  IF NEW.date > CURRENT_DATE + INTERVAL '1 year' THEN
    RAISE EXCEPTION 'Data não pode ser mais de 1 ano no futuro';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_transaction_before_insert
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_transaction();
```

---

## 6. Índices Adicionais

```sql
-- Índice composto para queries comuns
CREATE INDEX idx_transactions_user_date_type ON transactions(user_id, date DESC, type);

-- Índice para busca por tags
CREATE INDEX idx_transactions_tags_gin ON transactions USING GIN(tags);

-- Índice para full-text search na descrição
CREATE INDEX idx_transactions_description_fts ON transactions 
  USING GIN(to_tsvector('portuguese', description));
```

---

## 7. Configuração de Autenticação

### No painel do Supabase (Authentication > Settings):

1. **Enable Email Confirmations:** ✅ Ativado
2. **Secure Password Requirements:** ✅ Ativado
3. **Enable Email OTP:** Opcional
4. **Enable Magic Link:** Opcional

### Configurar providers OAuth (opcional):

- Google OAuth
- GitHub OAuth
- Microsoft OAuth (via Azure AD - disponível no GitHub Student Pack)

---

## 8. Políticas de Rate Limiting

No arquivo `.env`:

```env
# Rate Limiting (se usar Supabase Pro)
SUPABASE_RATE_LIMIT_REQUESTS_PER_SECOND=10
```

---

## 9. Backup e Recuperação

### Configurar backups automáticos (Supabase Pro):

1. Vá em Settings > Database
2. Enable automated backups
3. Configure retention period (recomendado: 7 dias)

### Script de backup manual:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer backup do banco
supabase db dump --file backup.sql
```

---

## 10. Monitoramento

### Configurar alertas:

1. Dashboard > Monitoring
2. Configure alertas para:
   - CPU > 80%
   - Memória > 80%
   - Conexões > 90%
   - Storage > 80%

---

## 🔒 Checklist de Segurança

- [ ] RLS ativado em todas as tabelas
- [ ] Políticas de acesso configuradas
- [ ] Validação de dados nos triggers
- [ ] Storage policies configuradas
- [ ] Email confirmation ativado
- [ ] Senha forte obrigatória
- [ ] Rate limiting configurado
- [ ] Backups automáticos ativados
- [ ] Logs de auditoria habilitados

---

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [GitHub Student Pack](https://education.github.com/pack)
- [Supabase Pro (grátis com Student Pack)](https://supabase.com/partners/integrations/github-student-developer-pack)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no painel do Supabase
2. Consulte a documentação oficial
3. Abra uma issue no repositório
