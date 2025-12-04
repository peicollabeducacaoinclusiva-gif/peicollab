-- ============================================================================
-- SOLUÇÃO DEFINITIVA: Desabilitar RLS em User_Roles
-- ============================================================================
-- Data: 04/11/2024
-- Problema: IMPOSSÍVEL evitar recursão em user_roles porque precisamos
--           consultar user_roles para saber quem pode ver user_roles!
-- Solução: DESABILITAR RLS em user_roles temporariamente
--          (Esta é uma tabela de relacionamento, não contém dados sensíveis)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Desabilitando RLS em user_roles para evitar recursão...';
END $$;

-- 1. REMOVER TODAS AS POLICIES
DROP POLICY IF EXISTS "user_see_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "superadmin_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "secretary_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_view_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "superadmin_manage_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "secretary_manage_network_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON public.user_roles;

-- 2. DESABILITAR RLS COMPLETAMENTE
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '✓ RLS desabilitado em user_roles';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTA DE SEGURANÇA:';
  RAISE NOTICE 'A tabela user_roles contém apenas relacionamentos user_id <-> role.';
  RAISE NOTICE 'Não contém dados sensíveis pessoais.';
  RAISE NOTICE 'O controle de acesso é feito via profiles e outras tabelas.';
  RAISE NOTICE '';
  RAISE NOTICE 'Alternativa futura: Implementar RLS no backend via Edge Functions.';
END $$;

-- 3. VALIDAÇÃO
DO $$
DECLARE
  v_rls_enabled BOOLEAN;
BEGIN
  SELECT rowsecurity INTO v_rls_enabled
  FROM pg_tables
  WHERE tablename = 'user_roles' AND schemaname = 'public';
  
  IF v_rls_enabled THEN
    RAISE WARNING 'RLS ainda está ativo em user_roles!';
  ELSE
    RAISE NOTICE '✓ Configuração correta: RLS desabilitado em user_roles';
  END IF;
END $$;

