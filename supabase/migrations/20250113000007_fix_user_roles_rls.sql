-- ============================================================================
-- CORREÇÃO DE RLS PARA USER_ROLES - RESOLVER RECURSÃO INFINITA
-- ============================================================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes que causam recursão
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON public.user_roles;
DROP POLICY IF EXISTS "Education secretary can view network roles" ON public.user_roles;
DROP POLICY IF EXISTS "School director can view school roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin can manage all roles" ON public.user_roles;

-- 3. Criar política simples e segura
CREATE POLICY "user_roles_simple_policy" ON public.user_roles
FOR ALL
USING (auth.uid() = user_id);

-- 4. Reabilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

