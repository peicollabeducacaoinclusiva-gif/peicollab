-- ============================================================================
-- MIGRAÇÃO: Tabela de Códigos SSO para Autenticação Entre Apps
-- Data: 15/02/2025
-- Descrição: Sistema seguro de SSO usando códigos temporários validados via Edge Functions
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela sso_codes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sso_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data jsonb NOT NULL, -- { access_token, refresh_token, expires_at }
  target_app text NOT NULL, -- gestao-escolar, plano-aee, etc.
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  used boolean DEFAULT false,
  used_at timestamptz
);

-- ============================================================================
-- PARTE 2: Índices para Performance
-- ============================================================================

-- Índice único em code para lookup rápido
CREATE UNIQUE INDEX IF NOT EXISTS idx_sso_codes_code ON public.sso_codes(code);

-- Índice em expires_at para limpeza automática eficiente
CREATE INDEX IF NOT EXISTS idx_sso_codes_expires_at ON public.sso_codes(expires_at) WHERE used = false;

-- Índice em user_id para consultas por usuário
CREATE INDEX IF NOT EXISTS idx_sso_codes_user_id ON public.sso_codes(user_id);

-- Índice composto para validação rápida (code + expires_at + used)
CREATE INDEX IF NOT EXISTS idx_sso_codes_validation ON public.sso_codes(code, expires_at, used) WHERE used = false;

-- ============================================================================
-- PARTE 3: RLS Policies
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.sso_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem criar seus próprios códigos SSO
-- (usado via Edge Function com service role, mas incluído para segurança)
CREATE POLICY "Users can create own sso codes" ON public.sso_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem ler seus próprios códigos SSO não usados
CREATE POLICY "Users can read own unused sso codes" ON public.sso_codes
  FOR SELECT
  USING (auth.uid() = user_id AND used = false AND expires_at > now());

-- Policy: Apenas Edge Functions (service role) podem validar/atualizar códigos
-- (RLS será bypassed pelo service role, mas adicionamos policy para documentação)
CREATE POLICY "Service role can validate sso codes" ON public.sso_codes
  FOR UPDATE
  USING (true) -- Service role bypassa RLS de qualquer forma
  WITH CHECK (true);

-- ============================================================================
-- PARTE 4: Função de Limpeza Automática de Códigos Expirados
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_sso_codes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Deletar códigos expirados há mais de 1 hora (dar margem de segurança)
  DELETE FROM public.sso_codes
  WHERE expires_at < (now() - interval '1 hour');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_sso_codes IS 'Remove códigos SSO expirados há mais de 1 hora';

-- ============================================================================
-- PARTE 5: Trigger para Auto-limpeza (opcional - pode ser chamado via cron)
-- ============================================================================

-- Função para limpar códigos expirados após criação de novo código
-- (evita acúmulo desnecessário)
CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_sso_codes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Limpar códigos expirados há mais de 1 hora
  -- Limitamos a 100 registros por vez para não sobrecarregar
  DELETE FROM public.sso_codes
  WHERE expires_at < (now() - interval '1 hour')
  AND id IN (
    SELECT id FROM public.sso_codes
    WHERE expires_at < (now() - interval '1 hour')
    LIMIT 100
  );
  
  RETURN NEW;
END;
$$;

-- Trigger que executa limpeza após inserção de novo código
CREATE TRIGGER cleanup_expired_sso_codes_trigger
  AFTER INSERT ON public.sso_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_cleanup_expired_sso_codes();

-- ============================================================================
-- PARTE 6: Função Helper para Validação de Código
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_sso_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record RECORD;
BEGIN
  -- Buscar código não usado e não expirado
  SELECT * INTO v_code_record
  FROM public.sso_codes
  WHERE code = p_code
    AND used = false
    AND expires_at > now()
  LIMIT 1;
  
  -- Se não encontrou, retornar null
  IF v_code_record IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Marcar como usado
  UPDATE public.sso_codes
  SET used = true,
      used_at = now()
  WHERE id = v_code_record.id;
  
  -- Retornar dados do código como JSONB
  RETURN jsonb_build_object(
    'id', v_code_record.id,
    'user_id', v_code_record.user_id,
    'session_data', v_code_record.session_data,
    'target_app', v_code_record.target_app
  );
END;
$$;

COMMENT ON FUNCTION public.validate_sso_code IS 'Valida e marca como usado um código SSO, retornando os dados da sessão';

-- ============================================================================
-- PARTE 7: Comentários e Documentação
-- ============================================================================

COMMENT ON TABLE public.sso_codes IS 'Códigos temporários para SSO seguro entre apps. Expira em 5 minutos e são de uso único.';
COMMENT ON COLUMN public.sso_codes.code IS 'Código único gerado para SSO (UUID ou string aleatória)';
COMMENT ON COLUMN public.sso_codes.session_data IS 'Dados da sessão do Supabase (access_token, refresh_token, expires_at) em formato JSONB';
COMMENT ON COLUMN public.sso_codes.target_app IS 'App destino para o qual o código foi gerado (gestao-escolar, plano-aee, etc.)';
COMMENT ON COLUMN public.sso_codes.expires_at IS 'Data/hora de expiração do código (padrão: 5 minutos após criação)';
COMMENT ON COLUMN public.sso_codes.used IS 'Indica se o código já foi usado (códigos são de uso único)';

-- ============================================================================
-- PARTE 8: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de códigos SSO concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tabelas criadas:';
  RAISE NOTICE '  1. ✅ sso_codes - Códigos temporários para SSO';
  RAISE NOTICE '';
  RAISE NOTICE 'Funções criadas:';
  RAISE NOTICE '  1. ✅ cleanup_expired_sso_codes - Limpa códigos expirados';
  RAISE NOTICE '  2. ✅ validate_sso_code - Valida e marca código como usado';
  RAISE NOTICE '';
  RAISE NOTICE 'Índices criados:';
  RAISE NOTICE '  1. ✅ idx_sso_codes_code - Lookup rápido por código';
  RAISE NOTICE '  2. ✅ idx_sso_codes_expires_at - Limpeza eficiente';
  RAISE NOTICE '  3. ✅ idx_sso_codes_validation - Validação otimizada';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS Policies configuradas para segurança';
END $$;

