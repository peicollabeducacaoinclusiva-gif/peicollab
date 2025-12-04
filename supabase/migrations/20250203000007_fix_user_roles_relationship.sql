-- Migration: Fix user_roles relationship with profiles
-- Created: 2025-02-03
-- Description: Garante que a foreign key entre user_roles e profiles está correta

-- ============================================================================
-- VERIFICAR E CORRIGIR RELACIONAMENTO
-- ============================================================================

-- 1. Garantir que a foreign key existe
DO $$
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_user_id_fkey'
    AND table_name = 'user_roles'
  ) THEN
    -- Adicionar foreign key se não existir
    ALTER TABLE user_roles
      ADD CONSTRAINT user_roles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key user_roles_user_id_fkey criada';
  ELSE
    RAISE NOTICE 'Foreign key user_roles_user_id_fkey já existe';
  END IF;
END $$;

-- 2. Verificar integridade dos dados
DO $$
DECLARE
  v_orphan_count INTEGER;
BEGIN
  -- Contar user_roles órfãos (sem profile correspondente)
  SELECT COUNT(*) INTO v_orphan_count
  FROM user_roles ur
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = ur.user_id
  );
  
  IF v_orphan_count > 0 THEN
    RAISE WARNING 'Encontrados % registros órfãos em user_roles', v_orphan_count;
    
    -- Opcionalmente, remover órfãos (comentado por segurança)
    -- DELETE FROM user_roles
    -- WHERE NOT EXISTS (
    --   SELECT 1 FROM profiles p WHERE p.id = user_roles.user_id
    -- );
  ELSE
    RAISE NOTICE 'Nenhum registro órfão encontrado em user_roles';
  END IF;
END $$;

-- 3. Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- 4. Forçar refresh do schema cache do Supabase
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- LOG
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Relacionamento user_roles ↔ profiles verificado!';
  RAISE NOTICE 'Próximo passo: Recarregar a página para limpar cache do cliente';
END $$;

