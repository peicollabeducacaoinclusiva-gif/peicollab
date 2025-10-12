-- Tighten PEIs policies to authenticated role to satisfy security linter and avoid anonymous access
-- Drop current policies
DROP POLICY IF EXISTS teachers_can_view_own_peis ON public.peis;
DROP POLICY IF EXISTS aee_teachers_can_view_tenant_peis ON public.peis;
DROP POLICY IF EXISTS coordinators_can_view_tenant_peis ON public.peis;
DROP POLICY IF EXISTS superadmins_can_view_all_peis ON public.peis;
DROP POLICY IF EXISTS family_can_view_own_student_peis ON public.peis;
DROP POLICY IF EXISTS family_can_view_via_token ON public.peis;
DROP POLICY IF EXISTS users_can_insert_peis ON public.peis;
DROP POLICY IF EXISTS users_can_update_own_peis ON public.peis;
DROP POLICY IF EXISTS users_can_delete_own_peis ON public.peis;

-- Recreate with explicit TO authenticated
CREATE POLICY teachers_can_view_own_peis
ON public.peis
FOR SELECT
TO authenticated
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
TO authenticated
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
TO authenticated
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
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid() AND pr.role = 'superadmin'
  )
);

CREATE POLICY family_can_view_own_student_peis
ON public.peis
FOR SELECT
TO authenticated
USING (
  peis.student_id IN (
    SELECT sf.student_id FROM public.student_family sf
    WHERE sf.family_user_id = auth.uid()
  )
);

CREATE POLICY family_can_view_via_token
ON public.peis
FOR SELECT
TO authenticated
USING (
  peis.id IN (
    SELECT fat.pei_id
    FROM public.family_access_tokens fat
    WHERE fat.token_hash = public.hash_token(COALESCE(split_part((auth.jwt() ->> 'email'), '@', 1), ''))
      AND fat.expires_at > now()
  )
);

CREATE POLICY users_can_insert_peis
ON public.peis
FOR INSERT
TO authenticated
WITH CHECK (
  peis.created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid()
      AND pr.role IN ('teacher','aee_teacher','coordinator','school_manager','superadmin')
  )
);

CREATE POLICY users_can_update_own_peis
ON public.peis
FOR UPDATE
TO authenticated
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

CREATE POLICY users_can_delete_own_peis
ON public.peis
FOR DELETE
TO authenticated
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
