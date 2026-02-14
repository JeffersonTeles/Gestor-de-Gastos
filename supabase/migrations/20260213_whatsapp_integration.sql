-- ============================================
-- MIGRATIONS SQL PARA INTEGRAÇÃO WHATSAPP
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Adicionar campo whatsapp_number na tabela de perfis
-- ============================================

-- Verificar se a tabela user_profiles existe
-- Se não existir, criar
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna whatsapp_number se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN whatsapp_number VARCHAR(20) UNIQUE;
  END IF;
END $$;

-- Adicionar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_user_profiles_whatsapp 
ON user_profiles(whatsapp_number);

-- Comentários
COMMENT ON COLUMN user_profiles.whatsapp_number IS 
'Número de WhatsApp do usuário no formato internacional sem + (ex: 5511999999999)';


-- 2. Adicionar campo source nas transações
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'source'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN source VARCHAR(50) DEFAULT 'manual';
  END IF;
END $$;

-- Índice para filtrar por fonte
CREATE INDEX IF NOT EXISTS idx_transactions_source 
ON transactions(source);

COMMENT ON COLUMN transactions.source IS 
'Origem da transação: manual, whatsapp, import, api';


-- 3. Criar tabela de logs de mensagens WhatsApp (opcional, para auditoria)
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message_text TEXT,
  message_sid VARCHAR(100), -- ID da mensagem no provedor (Twilio, Meta, etc)
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
  metadata JSONB, -- Dados extras como comando parseado, erro, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user 
ON whatsapp_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone 
ON whatsapp_messages(phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created 
ON whatsapp_messages(created_at DESC);

COMMENT ON TABLE whatsapp_messages IS 
'Registro de todas as mensagens WhatsApp recebidas e enviadas';


-- 4. Criar função para buscar usuário por número WhatsApp
-- ============================================

CREATE OR REPLACE FUNCTION get_user_by_whatsapp(phone VARCHAR)
RETURNS TABLE (
  user_id UUID,
  email VARCHAR,
  full_name VARCHAR,
  whatsapp_number VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    p.whatsapp_number
  FROM user_profiles p
  WHERE p.whatsapp_number = phone
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;


-- 5. Criar trigger para atualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 6. Row Level Security (RLS) Policies
-- ============================================

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários podem atualizar apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Usuários podem ver apenas suas mensagens
DROP POLICY IF EXISTS "Users can view own messages" ON whatsapp_messages;
CREATE POLICY "Users can view own messages"
  ON whatsapp_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role pode fazer tudo (para webhook)
DROP POLICY IF EXISTS "Service role can do everything on profiles" ON user_profiles;
CREATE POLICY "Service role can do everything on profiles"
  ON user_profiles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can do everything on messages" ON whatsapp_messages;
CREATE POLICY "Service role can do everything on messages"
  ON whatsapp_messages FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- 7. Seed de dados de exemplo (DESENVOLVIMENTO APENAS)
-- ============================================

-- ATENÇÃO: Comentar esta seção em produção!
-- Apenas para testes

/*
-- Inserir perfil de exemplo
INSERT INTO user_profiles (user_id, email, full_name, whatsapp_number)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- UUID de teste
  'teste@example.com',
  'Usuário Teste',
  '5511999999999' -- Formato: código país + código área + número
) ON CONFLICT (whatsapp_number) DO NOTHING;

-- Mensagem de teste
INSERT INTO whatsapp_messages (
  user_id, 
  phone_number, 
  direction, 
  message_text, 
  status,
  metadata
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '5511999999999',
  'incoming',
  'despesa 50 almoço',
  'processed',
  '{"command": "expense", "amount": 50, "description": "almoço"}'::jsonb
);
*/


-- 8. Views úteis (opcional)
-- ============================================

-- View para estatísticas de uso do WhatsApp
CREATE OR REPLACE VIEW whatsapp_stats AS
SELECT 
  u.email,
  p.whatsapp_number,
  COUNT(CASE WHEN m.direction = 'incoming' THEN 1 END) as messages_received,
  COUNT(CASE WHEN m.direction = 'outgoing' THEN 1 END) as messages_sent,
  COUNT(CASE WHEN m.status = 'failed' THEN 1 END) as failed_messages,
  MAX(m.created_at) as last_message_at
FROM user_profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
LEFT JOIN whatsapp_messages m ON m.user_id = p.user_id
WHERE p.whatsapp_number IS NOT NULL
GROUP BY u.email, p.whatsapp_number;


-- 9. Função de limpeza (manutenção)
-- ============================================

-- Remove mensagens antigas (manter apenas 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_messages()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM whatsapp_messages
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Para executar manualmente:
-- SELECT cleanup_old_whatsapp_messages();


-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se tudo foi criado corretamente
DO $$
DECLARE
  result TEXT;
BEGIN
  -- Verificar tabelas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    RAISE NOTICE '✅ Tabela user_profiles existe';
  ELSE
    RAISE WARNING '❌ Tabela user_profiles NÃO existe';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_messages') THEN
    RAISE NOTICE '✅ Tabela whatsapp_messages existe';
  ELSE
    RAISE WARNING '❌ Tabela whatsapp_messages NÃO existe';
  END IF;
  
  -- Verificar colunas
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'whatsapp_number'
  ) THEN
    RAISE NOTICE '✅ Coluna whatsapp_number existe';
  ELSE
    RAISE WARNING '❌ Coluna whatsapp_number NÃO existe';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'source'
  ) THEN
    RAISE NOTICE '✅ Coluna source existe em transactions';
  ELSE
    RAISE WARNING '❌ Coluna source NÃO existe em transactions';
  END IF;
  
  RAISE NOTICE '🎉 Verificação concluída!';
END $$;
