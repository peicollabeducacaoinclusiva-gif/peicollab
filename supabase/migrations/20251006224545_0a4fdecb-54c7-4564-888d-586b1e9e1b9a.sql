-- Fix recursive RLS on peis by recreating non-recursive policies
-- 1) Ensure RLS is enabled
ALTER TABLE public.peis ENABLE ROW LEVEL SECURITY;

-- 2) Drop existing policies that might be recursive or conflicting
DROP POLICY IF EXISTS aee_teachers_can_view_tenant_peis ON public.peis;
DROP POLICY IF EXISTS coordinators_can_view_tenant_peis ON public.peis;
DROP POLICY IF EXISTS family_can_view_own_student_peis ON public.peis;
DROP POLICY IF EXISTS family_can_view_via_token ON public.peis;
DROP POLICY IF EXISTS superadmins_can_view_all_peis ON public.peis;
DROP POLICY IF EXISTS teachers_can_view_own_peis ON public.peis;
DROP POLICY IF EXISTS users_can_delete_own_peis ON public.peis;
DROP POLICY IF EXISTS users_can_insert_peis ON public.peis;
DROP POLICY IF EXISTS users_can_update_own_peis ON public.peis;
-- Also drop any legacy generic policies if they exist
DROP POLICY IF EXISTS pei_select_policy ON public.peis;
DROP POLICY IF EXISTS pei_insert_policy ON public.peis;
DROP POLICY IF EXISTS pei_update_policy ON public.peis;
DROP POLICY IF EXISTS pei_delete_policy ON public.peis;

-- 3) Recreate clean, non-recursive SELECT policies
CREATE POLICY teachers_can_view_own_peis
ON public.peis
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid()
      AND pr.role = 'teacher'
      AND (peis.assigned_teacher_id = auth.uid() OR peis.created_by = auth.uid())
  )
);

CREATE POLICY aee_teachers_can_view_tenant_peis
ON public.peis
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid()
      AND pr.role = 'aee_teacher'
      AND pr.tenant_id = peis.tenant_id
  )
);

CREATE POLICY coordinators_can_view_tenant_peis
ON public.peis
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid()
      AND pr.role IN ('coordinator','school_manager')
      AND pr.tenant_id = peis.tenant_id
  )
);

CREATE POLICY superadmins_can_view_all_peis
ON public.peis
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid() AND pr.role = 'superadmin'
  )
);

-- Families: view own students' PEIs
CREATE POLICY family_can_view_own_student_peis
ON public.peis
FOR SELECT
USING (
  peis.student_id IN (
    SELECT sf.student_id FROM public.student_family sf
    WHERE sf.family_user_id = auth.uid()
  )
);

-- Families: view via access token linked to email local-part (no recursion)
CREATE POLICY family_can_view_via_token
ON public.peis
FOR SELECT
USING (
  peis.id IN (
    SELECT fat.pei_id
    FROM public.family_access_tokens fat
    WHERE fat.token_hash = public.hash_token(COALESCE(split_part((auth.jwt() ->> 'email'), '@', 1), ''))
      AND fat.expires_at > now()
  )
);

-- 4) INSERT policy
CREATE POLICY users_can_insert_peis
ON public.peis
FOR INSERT
WITH CHECK (
  peis.created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid()
      AND pr.role IN ('teacher','aee_teacher','coordinator','school_manager','superadmin')
  )
);

-- 5) UPDATE policy
CREATE POLICY users_can_update_own_peis
ON public.peis
FOR UPDATE
USING (
  peis.assigned_teacher_id = auth.uid()
  OR peis.created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid()
      AND pr.role IN ('coordinator','school_manager','superadmin')
      AND pr.tenant_id = peis.tenant_id
  )
)
WITH CHECK (
  peis.assigned_teacher_id = auth.uid()
  OR peis.created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid()
      AND pr.role IN ('coordinator','school_manager','superadmin')
      AND pr.tenant_id = peis.tenant_id
  )
);

-- 6) DELETE policy
CREATE POLICY users_can_delete_own_peis
ON public.peis
FOR DELETE
USING (
  peis.assigned_teacher_id = auth.uid()
  OR peis.created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid()
      AND pr.role IN ('coordinator','school_manager','superadmin')
      AND pr.tenant_id = peis.tenant_id
  )
);
