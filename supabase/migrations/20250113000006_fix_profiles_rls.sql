-- ============================================================================
-- CORREÇÃO DE RLS PARA PROFILES - RESOLVER RECURSÃO INFINITA
-- ============================================================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes que causam recursão
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "education_secretary_can_view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "school_director_can_view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "school_director_can_manage_profiles" ON public.profiles;

-- 3. Criar política simples e segura
CREATE POLICY "profiles_simple_policy" ON public.profiles
FOR ALL
USING (auth.uid() = id);

-- 4. Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

