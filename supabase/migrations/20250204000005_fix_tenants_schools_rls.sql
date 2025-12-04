-- ============================================================================
-- FIX: Políticas RLS para TENANTS e SCHOOLS
-- Permite que usuários leiam seus próprios tenants e schools
-- ============================================================================

DO $$ BEGIN RAISE NOTICE '🔧 Corrigindo políticas RLS de tenants e schools...'; END $$;

-- ============================================================================
-- 1. REMOVER POLÍTICAS ANTIGAS
-- ============================================================================

DROP POLICY IF EXISTS "Allow all operations on tenants" ON public.tenants;
DROP POLICY IF EXISTS "Allow all operations on schools" ON public.schools;
DROP POLICY IF EXISTS "users_read_own_tenant" ON public.tenants;
DROP POLICY IF EXISTS "users_read_own_school" ON public.schools;

-- ============================================================================
-- 2. CRIAR POLÍTICAS PARA TENANTS
-- ============================================================================

-- Usuários podem ler seu próprio tenant (através de profiles.tenant_id)
CREATE POLICY "users_read_own_tenant" ON public.tenants
FOR SELECT
USING (
  -- Superadmin pode ver todos
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role::text = 'superadmin'
  )
  OR
  -- Usuários podem ver seu tenant
  id IN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
    AND tenant_id IS NOT NULL
  )
  OR
  -- Usuários podem ver tenant de suas escolas
  id IN (
    SELECT s.tenant_id FROM public.schools s
    INNER JOIN public.profiles p ON p.school_id = s.id
    WHERE p.id = auth.uid()
  )
  OR
  -- Usuários podem ver tenants vinculados em user_tenants
  id IN (
    SELECT tenant_id FROM public.user_tenants
    WHERE user_id = auth.uid()
  )
);

-- Superadmin pode gerenciar tenants
CREATE POLICY "superadmin_manage_tenants" ON public.tenants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role::text = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role::text = 'superadmin'
  )
);

-- ============================================================================
-- 3. CRIAR POLÍTICAS PARA SCHOOLS
-- ============================================================================

-- Usuários podem ler escolas do seu tenant
CREATE POLICY "users_read_tenant_schools" ON public.schools
FOR SELECT
USING (
  -- Superadmin pode ver todas
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role::text = 'superadmin'
  )
  OR
  -- Usuários podem ver sua própria escola
  id IN (
    SELECT school_id FROM public.profiles
    WHERE id = auth.uid()
    AND school_id IS NOT NULL
  )
  OR
  -- Usuários podem ver escolas do seu tenant
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
    AND tenant_id IS NOT NULL
  )
  OR
  -- Usuários podem ver escolas vinculadas em user_schools
  id IN (
    SELECT school_id FROM public.user_schools
    WHERE user_id = auth.uid()
  )
);

-- Superadmin e Education Secretary podem gerenciar schools
CREATE POLICY "admin_manage_schools" ON public.schools
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role::text IN ('superadmin', 'education_secretary')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role::text IN ('superadmin', 'education_secretary')
  )
);

-- ============================================================================
-- 4. VERIFICAÇÃO
-- ============================================================================

DO $$ BEGIN RAISE NOTICE '✅ Políticas RLS de tenants e schools corrigidas!'; END $$;

-- Listar políticas criadas
DO $$
DECLARE
  pol RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 Políticas de TENANTS:';
  FOR pol IN 
    SELECT policyname, cmd FROM pg_policies 
    WHERE tablename = 'tenants' AND schemaname = 'public'
  LOOP
    RAISE NOTICE '  ✓ % (%)', pol.policyname, pol.cmd;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 Políticas de SCHOOLS:';
  FOR pol IN 
    SELECT policyname, cmd FROM pg_policies 
    WHERE tablename = 'schools' AND schemaname = 'public'
  LOOP
    RAISE NOTICE '  ✓ % (%)', pol.policyname, pol.cmd;
  END LOOP;
END $$;

