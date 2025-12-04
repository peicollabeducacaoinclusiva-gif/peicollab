-- ============================================================================
-- FIX DEFINITIVO: Políticas RLS para permitir embedded resources
-- ============================================================================

DO $$ BEGIN RAISE NOTICE '🔧 Corrigindo RLS para embedded resources...'; END $$;

-- ============================================================================
-- 1. REMOVER TODAS AS POLÍTICAS DE TENANTS E SCHOOLS
-- ============================================================================

DO $$ 
BEGIN
  -- Dropar todas as políticas de tenants
  DROP POLICY IF EXISTS "Allow all operations on tenants" ON public.tenants;
  DROP POLICY IF EXISTS "users_read_own_tenant" ON public.tenants;
  DROP POLICY IF EXISTS "superadmin_manage_tenants" ON public.tenants;
  
  -- Dropar todas as políticas de schools
  DROP POLICY IF EXISTS "Allow all operations on schools" ON public.schools;
  DROP POLICY IF EXISTS "users_read_own_school" ON public.schools;
  DROP POLICY IF EXISTS "users_read_tenant_schools" ON public.schools;
  DROP POLICY IF EXISTS "admin_manage_schools" ON public.schools;
  
  RAISE NOTICE '✓ Políticas antigas removidas';
END $$;

-- ============================================================================
-- 2. CRIAR POLÍTICAS SIMPLES E EFETIVAS
-- ============================================================================

-- TENANTS: Usuários autenticados podem ler tenants relacionados a eles
CREATE POLICY "authenticated_read_tenants" ON public.tenants
FOR SELECT
TO authenticated
USING (true); -- Permite leitura de todos os tenants para usuários autenticados
-- A segurança real é aplicada em profiles, não em tenants

-- TENANTS: Apenas superadmin pode modificar
CREATE POLICY "superadmin_write_tenants" ON public.tenants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role::text = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role::text = 'superadmin'
  )
);

-- SCHOOLS: Usuários autenticados podem ler schools
CREATE POLICY "authenticated_read_schools" ON public.schools
FOR SELECT
TO authenticated
USING (true); -- Permite leitura de todas as schools para usuários autenticados
-- A segurança real é aplicada em profiles e students, não em schools

-- SCHOOLS: Superadmin e Education Secretary podem modificar
CREATE POLICY "admin_write_schools" ON public.schools
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role::text IN ('superadmin', 'education_secretary')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role::text IN ('superadmin', 'education_secretary')
  )
);

-- ============================================================================
-- 3. VERIFICAÇÃO
-- ============================================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Políticas RLS simplificadas aplicadas!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Políticas de TENANTS:';
  FOR pol IN 
    SELECT policyname, cmd, qual, with_check FROM pg_policies 
    WHERE tablename = 'tenants' AND schemaname = 'public'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  ✓ % (%)', pol.policyname, pol.cmd;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 Políticas de SCHOOLS:';
  FOR pol IN 
    SELECT policyname, cmd, qual, with_check FROM pg_policies 
    WHERE tablename = 'schools' AND schemaname = 'public'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  ✓ % (%)', pol.policyname, pol.cmd;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 NOTA IMPORTANTE:';
  RAISE NOTICE '   A segurança multi-tenant é aplicada principalmente nas tabelas:';
  RAISE NOTICE '   - profiles (restringem acesso por tenant_id/school_id)';
  RAISE NOTICE '   - students (RLS por tenant e escola)';
  RAISE NOTICE '   - peis (RLS por tenant e escola)';
  RAISE NOTICE '   ';
  RAISE NOTICE '   Tenants e Schools são tabelas de referência que precisam';
  RAISE NOTICE '   ser legíveis para permitir embedded resources no PostgREST.';
END $$;

