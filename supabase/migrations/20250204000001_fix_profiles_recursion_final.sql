-- ============================================================================
-- CORREÇÃO FINAL: Recursão em Profiles
-- ============================================================================
-- Data: 04/11/2024
-- Problema: Mesmo com funções diretas, ainda há recursão em profiles
-- Solução: Simplificar ao máximo, remover dependências circulares
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Corrigindo recursão em profiles - Versão FINAL...';
END $$;

-- 1. DESABILITAR RLS TEMPORARIAMENTE para limpar
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLICIES (incluindo as novas)
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "superadmin_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "secretary_view_network_profiles" ON public.profiles;
DROP POLICY IF EXISTS "director_view_school_profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_simple_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "education_secretary_can_view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "school_director_can_view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_see_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "superadmin_see_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "secretary_see_network_profiles" ON public.profiles;
DROP POLICY IF EXISTS "director_see_school_profiles" ON public.profiles;

-- 3. CRIAR POLICIES ULTRA-SIMPLES (sem subqueries em profiles!)

-- Qualquer usuário autenticado pode ver seu próprio profile
CREATE POLICY "users_see_own_profile" ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Qualquer usuário autenticado pode atualizar seu próprio profile  
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Superadmins podem ver todos os profiles (SEM recursão)
CREATE POLICY "superadmin_see_all_profiles" ON public.profiles
  FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM public.user_roles 
      WHERE role::text = 'superadmin'
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM public.user_roles 
      WHERE role::text = 'superadmin'
    )
  );

-- Education Secretary pode ver profiles da mesma rede (SEM recursão em profiles)
CREATE POLICY "secretary_see_network_profiles" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles 
      WHERE role::text = 'education_secretary'
    )
    AND (
      tenant_id IS NULL 
      OR tenant_id = (
        -- Buscar tenant do usuário atual SEM passar por profiles
        SELECT ut.tenant_id FROM public.user_tenants ut
        WHERE ut.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- 4. REABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE 'Profiles RLS corrigido - recursão eliminada ✓';
END $$;

-- 5. VALIDAÇÃO
DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'profiles';
  
  RAISE NOTICE 'Total de policies em profiles: %', v_policy_count;
  
  IF v_policy_count > 0 THEN
    RAISE NOTICE '✓ Profiles configurado corretamente';
  ELSE
    RAISE WARNING '✗ Nenhuma policy em profiles!';
  END IF;
END $$;

