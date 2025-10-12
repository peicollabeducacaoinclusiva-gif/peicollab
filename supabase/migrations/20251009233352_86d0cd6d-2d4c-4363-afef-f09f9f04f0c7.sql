-- Criar tabela de relacionamento entre usuários (coordenadores) e tenants
CREATE TABLE public.user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- Criar tabela de relacionamento entre PEIs e professores
CREATE TABLE public.pei_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pei_id UUID NOT NULL REFERENCES public.peis(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(pei_id, teacher_id)
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pei_teachers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_tenants
CREATE POLICY "Users can view their own tenant associations"
ON public.user_tenants
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Coordinators can view tenant associations in their tenants"
ON public.user_tenants
FOR SELECT
USING (
  has_role(auth.uid(), 'coordinator'::app_role) 
  AND tenant_id IN (
    SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Superadmins can manage all tenant associations"
ON public.user_tenants
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Políticas RLS para pei_teachers
CREATE POLICY "Teachers can view their PEI assignments"
ON public.pei_teachers
FOR SELECT
USING (teacher_id = auth.uid());

CREATE POLICY "Coordinators can view PEI teachers in their tenants"
ON public.pei_teachers
FOR SELECT
USING (
  pei_id IN (
    SELECT p.id FROM public.peis p
    JOIN public.user_tenants ut ON ut.tenant_id = p.tenant_id
    WHERE ut.user_id = auth.uid()
    AND has_role(auth.uid(), 'coordinator'::app_role)
  )
);

CREATE POLICY "Coordinators can manage PEI teachers in their tenants"
ON public.pei_teachers
FOR ALL
USING (
  pei_id IN (
    SELECT p.id FROM public.peis p
    JOIN public.user_tenants ut ON ut.tenant_id = p.tenant_id
    WHERE ut.user_id = auth.uid()
    AND (has_role(auth.uid(), 'coordinator'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
  )
);

-- Migrar dados existentes: coordenadores com tenant_id para user_tenants
INSERT INTO public.user_tenants (user_id, tenant_id)
SELECT p.id, p.tenant_id
FROM public.profiles p
WHERE p.tenant_id IS NOT NULL
AND p.role IN ('coordinator', 'school_manager', 'teacher', 'aee_teacher')
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Migrar dados existentes: assigned_teacher_id para pei_teachers
INSERT INTO public.pei_teachers (pei_id, teacher_id, assigned_by)
SELECT id, assigned_teacher_id, created_by
FROM public.peis
WHERE assigned_teacher_id IS NOT NULL
ON CONFLICT (pei_id, teacher_id) DO NOTHING;

-- Criar função helper para verificar se usuário tem acesso ao tenant
CREATE OR REPLACE FUNCTION public.user_has_tenant_access(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_tenants
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  )
  OR has_role(_user_id, 'superadmin'::app_role);
$$;

-- Criar função helper para verificar se usuário tem acesso ao PEI
CREATE OR REPLACE FUNCTION public.user_can_access_pei(_user_id UUID, _pei_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Superadmin pode acessar tudo
    SELECT 1 WHERE has_role(_user_id, 'superadmin'::app_role)
  )
  OR EXISTS (
    -- Professor designado para o PEI
    SELECT 1 FROM public.pei_teachers pt
    WHERE pt.pei_id = _pei_id AND pt.teacher_id = _user_id
  )
  OR EXISTS (
    -- Criador do PEI
    SELECT 1 FROM public.peis p
    WHERE p.id = _pei_id AND p.created_by = _user_id
  )
  OR EXISTS (
    -- Coordenador/gestor do tenant
    SELECT 1 FROM public.peis p
    JOIN public.user_tenants ut ON ut.tenant_id = p.tenant_id
    WHERE p.id = _pei_id 
    AND ut.user_id = _user_id
    AND (
      has_role(_user_id, 'coordinator'::app_role) 
      OR has_role(_user_id, 'school_manager'::app_role)
      OR has_role(_user_id, 'aee_teacher'::app_role)
    )
  );
$$;

-- Atualizar políticas RLS da tabela peis para usar as novas funções
DROP POLICY IF EXISTS "teachers_can_view_own_peis" ON public.peis;
DROP POLICY IF EXISTS "coordinators_can_view_tenant_peis" ON public.peis;
DROP POLICY IF EXISTS "aee_teachers_can_view_tenant_peis" ON public.peis;
DROP POLICY IF EXISTS "users_can_update_own_peis" ON public.peis;
DROP POLICY IF EXISTS "users_can_delete_own_peis" ON public.peis;

CREATE POLICY "users_can_view_accessible_peis"
ON public.peis
FOR SELECT
USING (user_can_access_pei(auth.uid(), id));

CREATE POLICY "users_can_update_accessible_peis"
ON public.peis
FOR UPDATE
USING (user_can_access_pei(auth.uid(), id));

CREATE POLICY "users_can_delete_accessible_peis"
ON public.peis
FOR DELETE
USING (user_can_access_pei(auth.uid(), id));

-- Atualizar função get_user_tenant_safe para retornar o primeiro tenant do usuário
CREATE OR REPLACE FUNCTION public.get_user_tenant_safe(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tenant_result UUID;
BEGIN
  -- Primeiro tenta pegar do profiles (retrocompatibilidade)
  SELECT tenant_id INTO user_tenant_result
  FROM public.profiles
  WHERE id = _user_id AND tenant_id IS NOT NULL
  LIMIT 1;
  
  -- Se não encontrou, pega o primeiro da tabela user_tenants
  IF user_tenant_result IS NULL THEN
    SELECT tenant_id INTO user_tenant_result
    FROM public.user_tenants
    WHERE user_id = _user_id
    LIMIT 1;
  END IF;
  
  RETURN user_tenant_result;
END;
$$;

-- Atualizar políticas de students para usar user_tenants
DROP POLICY IF EXISTS "students_select_policy" ON public.students;

CREATE POLICY "students_select_policy"
ON public.students
FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid()
    AND ut.tenant_id = students.tenant_id
    AND (
      has_role(auth.uid(), 'coordinator'::app_role)
      OR has_role(auth.uid(), 'school_manager'::app_role)
      OR has_role(auth.uid(), 'teacher'::app_role)
      OR has_role(auth.uid(), 'aee_teacher'::app_role)
    )
  )
  OR can_view_student(auth.uid(), id)
);

-- Atualizar políticas de profiles para usar user_tenants
DROP POLICY IF EXISTS "coordinator_view_tenant" ON public.profiles;
DROP POLICY IF EXISTS "aee_teacher_view_tenant" ON public.profiles;
DROP POLICY IF EXISTS "school_manager_view_tenant" ON public.profiles;

CREATE POLICY "users_view_same_tenant"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR has_role(auth.uid(), 'superadmin'::app_role)
  OR (
    tenant_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.tenant_id = profiles.tenant_id
    )
  )
);

-- Criar trigger para adicionar professor ao pei_teachers quando PEI é atualizado
CREATE OR REPLACE FUNCTION public.sync_pei_teacher_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se assigned_teacher_id foi definido, adicionar à tabela pei_teachers
  IF NEW.assigned_teacher_id IS NOT NULL THEN
    INSERT INTO public.pei_teachers (pei_id, teacher_id, assigned_by)
    VALUES (NEW.id, NEW.assigned_teacher_id, COALESCE(auth.uid(), NEW.created_by))
    ON CONFLICT (pei_id, teacher_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_pei_teacher_on_insert_update
AFTER INSERT OR UPDATE ON public.peis
FOR EACH ROW
EXECUTE FUNCTION public.sync_pei_teacher_assignment();