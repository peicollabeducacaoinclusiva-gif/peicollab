-- Migration: Adicionar mais políticas RLS para tabela students
-- Permite que coordenadores, professores e outros papéis vejam alunos

-- Coordinator pode ver alunos da sua escola
CREATE POLICY IF NOT EXISTS "coordinator_can_view_students" ON public.students
  FOR SELECT USING (
    is_coordinator(auth.uid()) AND 
    school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

-- Teacher pode ver alunos que têm PEI vinculado a ele
CREATE POLICY IF NOT EXISTS "teacher_can_view_own_students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'teacher') AND 
    id IN (
      SELECT student_id FROM public.peis 
      WHERE id IN (
        SELECT pei_id FROM public.pei_teachers 
        WHERE teacher_id = auth.uid()
      )
    )
  );

-- AEE Teacher pode ver alunos com PEI que ele acompanha
CREATE POLICY IF NOT EXISTS "aee_teacher_can_view_students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'aee_teacher') AND 
    school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

-- Support Professional pode ver alunos que acompanha
CREATE POLICY IF NOT EXISTS "support_professional_can_view_students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'support_professional') AND 
    id IN (
      SELECT student_id FROM public.support_professional_students 
      WHERE professional_id = auth.uid()
    )
  );

-- Specialist pode ver alunos da sua rede
CREATE POLICY IF NOT EXISTS "specialist_can_view_students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'specialist') AND 
    school_id IN (
      SELECT id FROM public.schools 
      WHERE tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- POLÍTICAS TEMPORÁRIAS PARA DESENVOLVIMENTO (REMOVER EM PRODUÇÃO)
-- Permite que qualquer usuário autenticado veja alunos do seu tenant
-- COMENTAR/REMOVER estas políticas em produção para maior segurança

CREATE POLICY IF NOT EXISTS "authenticated_users_can_view_tenant_students" ON public.students
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    school_id IN (
      SELECT id FROM public.schools 
      WHERE tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Log de auditoria
COMMENT ON POLICY "coordinator_can_view_students" ON public.students IS 
  'Coordenadores podem ver alunos da sua escola';
  
COMMENT ON POLICY "teacher_can_view_own_students" ON public.students IS 
  'Professores veem apenas alunos que têm PEI vinculado a eles';
  
COMMENT ON POLICY "aee_teacher_can_view_students" ON public.students IS 
  'Professores AEE veem todos os alunos da sua escola';
  
COMMENT ON POLICY "authenticated_users_can_view_tenant_students" ON public.students IS 
  'TEMPORÁRIO: Qualquer usuário autenticado vê alunos do seu tenant (REMOVER EM PRODUÇÃO)';

