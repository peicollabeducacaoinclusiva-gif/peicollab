-- ============================================================================
-- CORREÇÃO EMERGENCIAL DE SEGURANÇA - PEI COLLAB
-- ============================================================================
-- Data: 04/11/2024
-- Autor: Equipe de Segurança
-- Descrição: Aplicação consolidada de todas as correções críticas de segurança
--            identificadas na auditoria automática
-- 
-- VULNERABILIDADES CORRIGIDAS:
-- 1. RLS Policies Permissivas (CRÍTICO)
-- 2. RLS Desabilitado em tabelas sensíveis (CRÍTICO)
-- 3. Recursão infinita em profiles RLS (CRÍTICO)
-- ============================================================================

-- ============================================================================
-- PARTE 1: DIAGNÓSTICO E BACKUP
-- ============================================================================

-- Criar tabela de backup das policies atuais
CREATE TABLE IF NOT EXISTS backup_policies_emergency_20241104 AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public';

-- Verificar estado atual do RLS
DO $$
DECLARE
  v_table TEXT;
  v_rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNÓSTICO DE SEGURANÇA';
  RAISE NOTICE '========================================';
  
  FOR v_table, v_rls_enabled IN 
    SELECT tablename, rowsecurity
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('students', 'user_roles', 'peis', 'profiles', 'schools', 'tenants')
    ORDER BY tablename
  LOOP
    IF v_rls_enabled THEN
      RAISE NOTICE 'Tabela %: RLS ATIVO ✓', v_table;
    ELSE
      RAISE NOTICE 'Tabela %: RLS DESABILITADO ✗ (VULNERÁVEL!)', v_table;
    END IF;
  END LOOP;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PARTE 2: REMOVER POLICIES PERMISSIVAS PERIGOSAS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Removendo policies permissivas perigosas...';
END $$;

-- Remover policies "Allow all operations" que são EXTREMAMENTE PERIGOSAS
DROP POLICY IF EXISTS "Allow all operations on tenants" ON public.tenants;
DROP POLICY IF EXISTS "Allow all operations on schools" ON public.schools;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations on user_schools" ON public.user_schools;
DROP POLICY IF EXISTS "Allow all operations on user_tenants" ON public.user_tenants;
DROP POLICY IF EXISTS "Allow all operations on students" ON public.students;
DROP POLICY IF EXISTS "Allow all operations on peis" ON public.peis;
DROP POLICY IF EXISTS "Allow all operations on pei_history" ON public.pei_history;
DROP POLICY IF EXISTS "Allow all to view history" ON public.pei_history;

DO $$
BEGIN
  RAISE NOTICE 'Policies permissivas removidas ✓';
END $$;

-- ============================================================================
-- PARTE 3: HABILITAR RLS EM TODAS AS TABELAS CRÍTICAS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Habilitando RLS em todas as tabelas críticas...';
END $$;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pei_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pei_teachers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE 'RLS habilitado em todas as tabelas ✓';
END $$;

-- ============================================================================
-- PARTE 4: CRIAR FUNÇÕES AUXILIARES PARA RLS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Criando funções auxiliares para RLS...';
END $$;

-- Função: Verificar se usuário tem acesso ao aluno
CREATE OR REPLACE FUNCTION public.has_student_access(p_student_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.student_access
    WHERE student_id = p_student_id
      AND user_id = auth.uid()
  );
END;
$$;

-- Função: Verificar se usuário é professor/AEE do PEI
CREATE OR REPLACE FUNCTION public.is_pei_teacher(p_pei_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.peis
    WHERE id = p_pei_id
      AND (assigned_teacher_id = auth.uid() OR created_by = auth.uid())
  );
END;
$$;

-- Função: Verificar role do usuário (otimizada, sem recursão)
CREATE OR REPLACE FUNCTION public.has_role_direct(p_role TEXT)
RETURNS BOOLEAN 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = p_role
  );
$$;

-- Função: Obter school_id do usuário (otimizada, sem recursão)
CREATE OR REPLACE FUNCTION public.get_user_school_direct()
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Função: Obter tenant_id do usuário (otimizada, sem recursão)
CREATE OR REPLACE FUNCTION public.get_user_tenant_direct()
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

DO $$
BEGIN
  RAISE NOTICE 'Funções auxiliares criadas ✓';
END $$;

-- ============================================================================
-- PARTE 5: POLICIES PARA PROFILES (Corrigir Recursão)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Aplicando policies para PROFILES (sem recursão)...';
END $$;

-- Remover TODAS as policies antigas que causam recursão
DROP POLICY IF EXISTS "profiles_simple_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "education_secretary_can_view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "school_director_can_view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "superadmin_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "secretary_view_network_profiles" ON public.profiles;
DROP POLICY IF EXISTS "director_view_school_profiles" ON public.profiles;

-- Policy simples: Usuário pode ver e editar apenas seu próprio perfil
CREATE POLICY "users_own_profile" ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Superadmins podem ver todos os profiles
CREATE POLICY "superadmin_view_all_profiles" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'superadmin'
    )
  );

-- Secretários podem ver profiles da sua rede
CREATE POLICY "secretary_view_network_profiles" ON public.profiles
  FOR SELECT
  USING (
    has_role_direct('education_secretary')
    AND tenant_id = get_user_tenant_direct()
  );

-- Diretores podem ver profiles da sua escola
CREATE POLICY "director_view_school_profiles" ON public.profiles
  FOR SELECT
  USING (
    has_role_direct('school_director')
    AND school_id = get_user_school_direct()
  );

DO $$
BEGIN
  RAISE NOTICE 'Policies para PROFILES aplicadas ✓';
END $$;

-- ============================================================================
-- PARTE 6: POLICIES PARA USER_ROLES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Aplicando policies para USER_ROLES...';
END $$;

-- Remover policies antigas
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_view_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "superadmin_manage_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "secretary_manage_network_roles" ON public.user_roles;

-- Usuários podem ver apenas seus próprios roles
CREATE POLICY "users_view_own_roles" ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Superadmins podem gerenciar todos os roles
CREATE POLICY "superadmin_manage_all_roles" ON public.user_roles
  FOR ALL
  USING (has_role_direct('superadmin'));

-- Secretários podem gerenciar roles da sua rede
CREATE POLICY "secretary_manage_network_roles" ON public.user_roles
  FOR ALL
  USING (
    has_role_direct('education_secretary')
    AND user_id IN (
      SELECT id FROM public.profiles 
      WHERE tenant_id = get_user_tenant_direct()
    )
  );

DO $$
BEGIN
  RAISE NOTICE 'Policies para USER_ROLES aplicadas ✓';
END $$;

-- ============================================================================
-- PARTE 7: POLICIES PARA STUDENTS (Restritivas)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Aplicando policies para STUDENTS...';
END $$;

-- Remover policies antigas primeiro
DROP POLICY IF EXISTS "teachers_view_assigned_students" ON public.students;
DROP POLICY IF EXISTS "coordinators_view_school_students" ON public.students;
DROP POLICY IF EXISTS "school_managers_manage_students" ON public.students;
DROP POLICY IF EXISTS "education_secretary_view_tenant_students" ON public.students;
DROP POLICY IF EXISTS "superadmin_view_all_students" ON public.students;

-- Professores veem apenas alunos com acesso explícito
CREATE POLICY "teachers_view_assigned_students" ON public.students
  FOR SELECT
  USING (
    (has_role_direct('teacher') OR has_role_direct('aee_teacher'))
    AND has_student_access(id)
  );

-- Coordenadores veem alunos da sua escola
CREATE POLICY "coordinators_view_school_students" ON public.students
  FOR SELECT
  USING (
    has_role_direct('coordinator')
    AND school_id = get_user_school_direct()
  );

-- Gestores escolares gerenciam alunos da sua escola
CREATE POLICY "school_managers_manage_students" ON public.students
  FOR ALL
  USING (
    has_role_direct('school_director')
    AND school_id = get_user_school_direct()
  );

-- Secretários veem todos os alunos da rede
CREATE POLICY "education_secretary_view_tenant_students" ON public.students
  FOR SELECT
  USING (
    has_role_direct('education_secretary')
    AND school_id IN (
      SELECT id FROM public.schools 
      WHERE tenant_id = get_user_tenant_direct()
    )
  );

-- Superadmins veem todos os alunos
CREATE POLICY "superadmin_view_all_students" ON public.students
  FOR SELECT
  USING (has_role_direct('superadmin'));

DO $$
BEGIN
  RAISE NOTICE 'Policies para STUDENTS aplicadas ✓';
END $$;

-- ============================================================================
-- PARTE 8: POLICIES PARA PEIS (Restritivas)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Aplicando policies para PEIS...';
END $$;

-- Remover policies antigas primeiro
DROP POLICY IF EXISTS "teachers_view_assigned_peis" ON public.peis;
DROP POLICY IF EXISTS "teachers_create_peis" ON public.peis;
DROP POLICY IF EXISTS "teachers_update_assigned_peis" ON public.peis;
DROP POLICY IF EXISTS "teachers_delete_own_peis" ON public.peis;
DROP POLICY IF EXISTS "coordinators_manage_school_peis" ON public.peis;
DROP POLICY IF EXISTS "school_managers_view_school_peis" ON public.peis;
DROP POLICY IF EXISTS "education_secretary_view_tenant_peis" ON public.peis;
DROP POLICY IF EXISTS "superadmin_view_all_peis" ON public.peis;

-- Professores veem PEIs atribuídos a eles
CREATE POLICY "teachers_view_assigned_peis" ON public.peis
  FOR SELECT
  USING (
    (has_role_direct('teacher') OR has_role_direct('aee_teacher'))
    AND (assigned_teacher_id = auth.uid() OR created_by = auth.uid())
  );

-- Professores criam PEIs apenas para alunos com acesso
CREATE POLICY "teachers_create_peis" ON public.peis
  FOR INSERT
  WITH CHECK (
    (has_role_direct('teacher') OR has_role_direct('aee_teacher'))
    AND has_student_access(student_id)
    AND created_by = auth.uid()
  );

-- Professores atualizam apenas PEIs atribuídos
CREATE POLICY "teachers_update_assigned_peis" ON public.peis
  FOR UPDATE
  USING (
    (has_role_direct('teacher') OR has_role_direct('aee_teacher'))
    AND (assigned_teacher_id = auth.uid() OR created_by = auth.uid())
  )
  WITH CHECK (
    assigned_teacher_id = auth.uid() OR created_by = auth.uid()
  );

-- Professores deletam apenas PEIs que criaram
CREATE POLICY "teachers_delete_own_peis" ON public.peis
  FOR DELETE
  USING (
    (has_role_direct('teacher') OR has_role_direct('aee_teacher'))
    AND created_by = auth.uid()
  );

-- Coordenadores gerenciam PEIs da sua escola
CREATE POLICY "coordinators_manage_school_peis" ON public.peis
  FOR ALL
  USING (
    has_role_direct('coordinator')
    AND school_id = get_user_school_direct()
  );

-- Gestores escolares veem PEIs da sua escola
CREATE POLICY "school_managers_view_school_peis" ON public.peis
  FOR SELECT
  USING (
    has_role_direct('school_director')
    AND school_id = get_user_school_direct()
  );

-- Secretários veem todos os PEIs da rede
CREATE POLICY "education_secretary_view_tenant_peis" ON public.peis
  FOR SELECT
  USING (
    has_role_direct('education_secretary')
    AND school_id IN (
      SELECT id FROM public.schools 
      WHERE tenant_id = get_user_tenant_direct()
    )
  );

-- Superadmins veem todos os PEIs
CREATE POLICY "superadmin_view_all_peis" ON public.peis
  FOR SELECT
  USING (has_role_direct('superadmin'));

DO $$
BEGIN
  RAISE NOTICE 'Policies para PEIS aplicadas ✓';
END $$;

-- ============================================================================
-- PARTE 9: ADICIONAR COMENTÁRIOS PARA AUDITORIA
-- ============================================================================

COMMENT ON FUNCTION public.has_student_access(UUID) IS 
  'Verifica se o usuário atual tem acesso ao aluno via student_access';

COMMENT ON FUNCTION public.is_pei_teacher(UUID) IS 
  'Verifica se o usuário atual é professor ou criador do PEI';

COMMENT ON FUNCTION public.has_role_direct(TEXT) IS 
  'Verifica role do usuário sem recursão - otimizada para RLS';

COMMENT ON FUNCTION public.get_user_school_direct() IS 
  'Retorna school_id do usuário atual sem recursão - otimizada para RLS';

COMMENT ON FUNCTION public.get_user_tenant_direct() IS 
  'Retorna tenant_id do usuário atual sem recursão - otimizada para RLS';

-- ============================================================================
-- PARTE 10: VALIDAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  v_table TEXT;
  v_rls_enabled BOOLEAN;
  v_policy_count INTEGER;
  v_all_secure BOOLEAN := true;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO PÓS-CORREÇÃO';
  RAISE NOTICE '========================================';
  
  -- Verificar RLS
  FOR v_table, v_rls_enabled IN 
    SELECT tablename, rowsecurity
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('students', 'user_roles', 'peis', 'profiles')
    ORDER BY tablename
  LOOP
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE tablename = v_table;
    
    IF v_rls_enabled AND v_policy_count > 0 THEN
      RAISE NOTICE 'Tabela %: RLS ATIVO ✓ (% policies)', v_table, v_policy_count;
    ELSIF NOT v_rls_enabled THEN
      RAISE NOTICE 'Tabela %: RLS DESABILITADO ✗ (FALHA!)', v_table;
      v_all_secure := false;
    ELSIF v_policy_count = 0 THEN
      RAISE NOTICE 'Tabela %: SEM POLICIES ✗ (FALHA!)', v_table;
      v_all_secure := false;
    END IF;
  END LOOP;
  
  RAISE NOTICE '========================================';
  
  IF v_all_secure THEN
    RAISE NOTICE 'SUCESSO: Todas as correções foram aplicadas corretamente! ✓';
  ELSE
    RAISE WARNING 'ATENÇÃO: Algumas correções falharam! Revisar manualmente!';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORREÇÃO DE SEGURANÇA EMERGENCIAL CONCLUÍDA';
  RAISE NOTICE 'Data: %', NOW();
  RAISE NOTICE 'Backup das policies: backup_policies_emergency_20241104';
  RAISE NOTICE '========================================';
END $$;

