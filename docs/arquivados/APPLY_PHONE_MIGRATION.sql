-- ============================================================================
-- MIGRAÇÃO RÁPIDA: Adicionar campo phone aos perfis
-- ============================================================================
-- Execute este arquivo no Supabase Dashboard → SQL Editor
-- Tempo estimado: ~5 segundos

-- Adicionar coluna phone se não existir
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Comentário
COMMENT ON COLUMN profiles.phone IS 'Telefone de contato do usuário';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Campo phone adicionado à tabela profiles!';
  RAISE NOTICE 'Próximo passo: Recarregar a aplicação (F5)';
END $$;

