-- Migration: Fix CRITICAL RLS Security Issues
-- Created: 2025-02-03
-- Description: Remove políticas permissivas que permitem acesso total a todos os dados
--              e adiciona políticas restritivas baseadas em roles e tenants

-- ============================================================================
-- ATENÇÃO: CORREÇÃO CRÍTICA DE SEGURANÇA
-- ============================================================================
-- As policies "Allow all operations" permitiam que QUALQUER usuário autenticado
-- acessasse TODOS os dados de TODOS os tenants. Isso viola completamente o
-- isolamento multitenancy e precisa ser corrigido IMEDIATAMENTE.

-- 1. REMOVER POLICIES PERMISSIVAS PERIGOSAS
DROP POLICY IF EXISTS "Allow all operations on students" ON public.students;
DROP POLICY IF EXISTS "Allow all operations on peis" ON public.peis;

-- 2. CRIAR FUNÇÕES AUXILIARES PARA RLS

-- Verificar se usuário tem acesso ao aluno (via student_access)
CREATE OR REPLACE FUNCTION has_student_access(p_student_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.student_access
    WHERE student_id = p_student_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verificar se usuário é professor/AEE do PEI
CREATE OR REPLACE FUNCTION is_pei_teacher(p_pei_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.peis
    WHERE id = p_pei_id
    AND (assigned_teacher_id = auth.uid() OR created_by = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. POLICIES PARA STUDENTS - Restritivas e baseadas em tenant/escola

-- Professores podem ver APENAS alunos que têm acesso explícito (via student_access)
CREATE POLICY "teachers_view_assigned_students" ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('teacher', 'aee_teacher')
    )
    AND has_student_access(id)
  );

-- Coordenadores podem ver alunos da sua escola
CREATE POLICY "coordinators_view_school_students" ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'coordinator'
    )
    AND school_id = (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Gestores escolares podem gerenciar alunos da sua escola
CREATE POLICY "school_managers_manage_students" ON public.students
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('school_director', 'school_manager')
    )
    AND school_id = (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Secretários de educação podem ver todos os alunos da rede (tenant)
CREATE POLICY "education_secretary_view_tenant_students" ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'education_secretary'
    )
    AND school_id IN (
      SELECT s.id FROM public.schools s
      INNER JOIN public.profiles p ON p.tenant_id = s.tenant_id
      WHERE p.id = auth.uid()
    )
  );

-- Superadmins podem ver tudo (mas devem usar funções RPC para operações sensíveis)
CREATE POLICY "superadmin_view_all_students" ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- 4. POLICIES PARA PEIS - Restritivas e baseadas em permissões

-- Professores podem ver APENAS PEIs que criaram ou foram atribuídos a eles
CREATE POLICY "teachers_view_assigned_peis" ON public.peis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('teacher', 'aee_teacher')
    )
    AND (
      assigned_teacher_id = auth.uid() 
      OR created_by = auth.uid()
    )
  );

-- Professores podem criar PEIs apenas para alunos que têm acesso
CREATE POLICY "teachers_create_peis" ON public.peis
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('teacher', 'aee_teacher')
    )
    AND has_student_access(student_id)
    AND created_by = auth.uid()
  );

-- Professores podem atualizar APENAS PEIs que criaram ou foram atribuídos a eles
CREATE POLICY "teachers_update_assigned_peis" ON public.peis
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('teacher', 'aee_teacher')
    )
    AND (
      assigned_teacher_id = auth.uid() 
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (
    assigned_teacher_id = auth.uid() 
    OR created_by = auth.uid()
  );

-- Professores podem deletar APENAS PEIs que criaram
CREATE POLICY "teachers_delete_own_peis" ON public.peis
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('teacher', 'aee_teacher')
    )
    AND created_by = auth.uid()
  );

-- Coordenadores podem ver e gerenciar PEIs da sua escola
CREATE POLICY "coordinators_manage_school_peis" ON public.peis
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'coordinator'
    )
    AND school_id = (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Gestores escolares podem ver todos os PEIs da sua escola
CREATE POLICY "school_managers_view_school_peis" ON public.peis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('school_director', 'school_manager')
    )
    AND school_id = (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Secretários de educação podem ver todos os PEIs da rede (tenant)
CREATE POLICY "education_secretary_view_tenant_peis" ON public.peis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'education_secretary'
    )
    AND school_id IN (
      SELECT s.id FROM public.schools s
      INNER JOIN public.profiles p ON p.tenant_id = s.tenant_id
      WHERE p.id = auth.uid()
    )
  );

-- Superadmins podem ver tudo (mas devem usar funções RPC para operações sensíveis)
CREATE POLICY "superadmin_view_all_peis" ON public.peis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- 5. POLICIES PARA PEI_HISTORY

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "Allow all to view history" ON public.pei_history;

-- Usuários podem ver histórico dos PEIs que têm acesso
CREATE POLICY "users_view_accessible_pei_history" ON public.pei_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.peis p
      WHERE p.id = pei_history.pei_id
      -- Reusar a lógica de acesso dos PEIs
      AND (
        -- Teachers com acesso
        (
          EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('teacher', 'aee_teacher')
          )
          AND (p.assigned_teacher_id = auth.uid() OR p.created_by = auth.uid())
        )
        OR
        -- Coordenadores da escola
        (
          EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'coordinator'
          )
          AND p.school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
        )
        OR
        -- Gestores escolares
        (
          EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('school_director', 'school_manager')
          )
          AND p.school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
        )
        OR
        -- Secretários de educação
        (
          EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'education_secretary'
          )
          AND p.school_id IN (
            SELECT s.id FROM public.schools s
            INNER JOIN public.profiles prof ON prof.tenant_id = s.tenant_id
            WHERE prof.id = auth.uid()
          )
        )
        OR
        -- Superadmins
        (
          EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'superadmin'
          )
        )
      )
    )
  );

-- 6. COMENTÁRIOS E DOCUMENTAÇÃO
COMMENT ON POLICY "teachers_view_assigned_students" ON public.students IS 
  'Professores podem ver apenas alunos com acesso explícito via student_access';

COMMENT ON POLICY "teachers_view_assigned_peis" ON public.peis IS 
  'Professores podem ver apenas PEIs que criaram ou foram atribuídos a eles';

COMMENT ON POLICY "teachers_create_peis" ON public.peis IS 
  'Professores podem criar PEIs apenas para alunos que têm acesso';

COMMENT ON FUNCTION has_student_access(UUID) IS 
  'Verifica se o usuário atual tem acesso ao aluno via student_access';

COMMENT ON FUNCTION is_pei_teacher(UUID) IS 
  'Verifica se o usuário atual é professor ou criador do PEI';

-- 7. GARANTIR QUE RLS ESTÁ HABILITADO
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pei_history ENABLE ROW LEVEL SECURITY;

-- 8. AUDITORIA: Registrar correção de segurança
DO $$
BEGIN
  RAISE NOTICE 'CORREÇÃO DE SEGURANÇA CRÍTICA APLICADA: Policies permissivas removidas e substituídas por políticas restritivas baseadas em roles e tenants';
END $$;


