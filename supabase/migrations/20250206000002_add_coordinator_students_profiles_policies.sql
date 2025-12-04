-- =====================================================
-- Migração: Adicionar Policies RLS para Coordenadores
--           acessarem Students e Profiles
-- Data: 06/11/2024
-- Descrição: Permite que coordenadores vejam students
--            e profiles necessários para exibir tokens
-- =====================================================

-- =====================================================
-- 1. POLICIES PARA STUDENTS
-- =====================================================

-- Habilitar RLS se ainda não estiver
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Remover policy se já existir
DROP POLICY IF EXISTS "coordinator_can_view_students" ON public.students;

-- Criar policy para coordenadores verem students da sua escola
CREATE POLICY "coordinator_can_view_students" 
ON public.students
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'coordinator'
      AND students.school_id = p.school_id
  )
);

COMMENT ON POLICY "coordinator_can_view_students" ON public.students IS 
'Permite que coordenadores vejam alunos da sua escola (necessário para exibir tokens)';

-- =====================================================
-- 2. POLICIES PARA PROFILES
-- =====================================================

-- Habilitar RLS se ainda não estiver
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover policy se já existir
DROP POLICY IF EXISTS "coordinator_can_view_profiles" ON public.profiles;

-- Criar policy para coordenadores verem profiles da sua escola
CREATE POLICY "coordinator_can_view_profiles" 
ON public.profiles
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'coordinator'
      AND (
        -- Ver perfis da mesma escola
        profiles.school_id = (
          SELECT school_id FROM public.profiles WHERE id = auth.uid()
        )
        -- Ou ver o próprio perfil
        OR profiles.id = auth.uid()
      )
  )
);

COMMENT ON POLICY "coordinator_can_view_profiles" ON public.profiles IS 
'Permite que coordenadores vejam perfis da sua escola (necessário para exibir criadores de tokens)';

-- =====================================================
-- 3. VERIFICAÇÃO DAS POLICIES
-- =====================================================

-- Verificar se as policies foram criadas
DO $$
DECLARE
  v_students_policy_exists BOOLEAN;
  v_profiles_policy_exists BOOLEAN;
BEGIN
  -- Verificar policy de students
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' 
      AND policyname = 'coordinator_can_view_students'
  ) INTO v_students_policy_exists;

  -- Verificar policy de profiles
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
      AND policyname = 'coordinator_can_view_profiles'
  ) INTO v_profiles_policy_exists;

  -- Mensagens de sucesso
  IF v_students_policy_exists THEN
    RAISE NOTICE '✅ Policy para students criada com sucesso!';
  ELSE
    RAISE WARNING '❌ Falha ao criar policy para students';
  END IF;

  IF v_profiles_policy_exists THEN
    RAISE NOTICE '✅ Policy para profiles criada com sucesso!';
  ELSE
    RAISE WARNING '❌ Falha ao criar policy para profiles';
  END IF;

  -- Mensagem final
  IF v_students_policy_exists AND v_profiles_policy_exists THEN
    RAISE NOTICE '🎉 Coordenadores agora podem ver alunos e perfis da sua escola!';
    RAISE NOTICE '📋 Os tokens devem aparecer na aba "Tokens" do dashboard.';
  END IF;
END;
$$;

-- =====================================================
-- 4. ÍNDICES PARA PERFORMANCE (OPCIONAL)
-- =====================================================

-- Índice para melhorar performance da policy de students
CREATE INDEX IF NOT EXISTS idx_students_school_id 
ON public.students(school_id) 
WHERE is_active = true;

-- Índice para melhorar performance da policy de profiles
CREATE INDEX IF NOT EXISTS idx_profiles_school_id 
ON public.profiles(school_id);

-- Índice para melhorar performance de user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role 
ON public.user_roles(user_id, role);

RAISE NOTICE '📊 Índices criados para melhorar performance das queries.';
































