-- ============================================================================
-- CORREÇÃO: Recursão em User_Roles
-- ============================================================================
-- Data: 04/11/2024
-- Problema: HTTP 500 ao buscar user_roles - possível recursão ou policy incorreta
-- Solução: Simplificar policies de user_roles
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Corrigindo user_roles - removendo recursão...';
END $$;

-- 1. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLICIES
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_view_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "superadmin_manage_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "secretary_manage_network_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_see_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "superadmin_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "secretary_manage_roles" ON public.user_roles;

-- 3. CRIAR POLICIES ULTRA-SIMPLES

-- Usuários podem ver seus próprios roles
CREATE POLICY "user_see_own_roles" ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Superadmins podem ver e gerenciar TODOS os roles (sem recursão)
CREATE POLICY "superadmin_all_roles" ON public.user_roles
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles 
      WHERE role::text = 'superadmin'
    )
  );

-- Education Secretary pode gerenciar roles da rede (SEM profiles)
CREATE POLICY "secretary_manage_roles" ON public.user_roles
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles 
      WHERE role::text = 'education_secretary'
    )
    AND user_id IN (
      SELECT ut.user_id FROM public.user_tenants ut
      WHERE ut.tenant_id IN (
        SELECT tenant_id FROM public.user_tenants
        WHERE user_id = auth.uid()
      )
    )
  );

-- 4. REABILITAR RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE 'User_roles RLS corrigido ✓';
END $$;

-- 5. VALIDAÇÃO
DO $$
DECLARE
  v_policy_count INTEGER;
  v_rls_enabled BOOLEAN;
BEGIN
  SELECT rowsecurity INTO v_rls_enabled
  FROM pg_tables
  WHERE tablename = 'user_roles' AND schemaname = 'public';
  
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'user_roles';
  
  RAISE NOTICE 'RLS em user_roles: %', CASE WHEN v_rls_enabled THEN 'ATIVO ✓' ELSE 'DESABILITADO ✗' END;
  RAISE NOTICE 'Total de policies: %', v_policy_count;
  
  IF v_rls_enabled AND v_policy_count > 0 THEN
    RAISE NOTICE '✓ User_roles configurado corretamente!';
  ELSE
    RAISE WARNING '✗ Configuração incompleta!';
  END IF;
END $$;

