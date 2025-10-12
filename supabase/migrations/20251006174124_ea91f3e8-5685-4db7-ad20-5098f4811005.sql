-- Adicionar coluna para armazenar hash do código
ALTER TABLE pei_family_tokens ADD COLUMN IF NOT EXISTS token_hash TEXT;

-- Criar tabela para controle de tentativas de acesso (rate limiting)
CREATE TABLE IF NOT EXISTS pei_access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para otimizar consultas de tentativas por IP
CREATE INDEX IF NOT EXISTS idx_access_attempts_ip_time ON pei_access_attempts(ip_address, attempted_at DESC);

-- Criar tabela para logs de acesso
CREATE TABLE IF NOT EXISTS pei_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pei_id UUID REFERENCES peis(id) ON DELETE CASCADE,
  token_used TEXT NOT NULL,
  ip_address TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  verified BOOLEAN DEFAULT FALSE
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE pei_access_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pei_access_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pei_access_attempts (apenas sistema pode inserir)
CREATE POLICY "Sistema pode inserir tentativas" ON pei_access_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Coordenadores podem visualizar tentativas" ON pei_access_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('coordinator', 'superadmin')
    )
  );

-- Políticas RLS para pei_access_logs
CREATE POLICY "Sistema pode inserir logs" ON pei_access_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Coordenadores podem visualizar logs do seu tenant" ON pei_access_logs
  FOR SELECT USING (
    pei_id IN (
      SELECT p.id FROM peis p
      JOIN profiles pr ON pr.tenant_id = p.tenant_id
      WHERE pr.id = auth.uid() 
      AND pr.role IN ('coordinator', 'superadmin')
    )
  );

-- Função para limpar tentativas antigas (mais de 1 hora)
CREATE OR REPLACE FUNCTION clean_old_access_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM pei_access_attempts 
  WHERE attempted_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Atualizar tempo de expiração para 24 horas nos novos tokens
ALTER TABLE pei_family_tokens 
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '24 hours');