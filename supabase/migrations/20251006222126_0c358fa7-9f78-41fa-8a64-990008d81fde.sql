-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "pei_select_policy" ON public.peis;
DROP POLICY IF EXISTS "pei_insert_policy" ON public.peis;
DROP POLICY IF EXISTS "pei_update_policy" ON public.peis;
DROP POLICY IF EXISTS "pei_delete_policy" ON public.peis;

-- Create non-recursive SELECT policy for teachers
CREATE POLICY "teachers_can_view_own_peis"
ON public.peis FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'teacher'
    AND (peis.assigned_teacher_id = auth.uid() OR peis.created_by = auth.uid())
  )
);

-- Create SELECT policy for coordinators and school managers
CREATE POLICY "coordinators_can_view_tenant_peis"
ON public.peis FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('coordinator', 'school_manager')
    AND profiles.tenant_id = peis.tenant_id
  )
);

-- Create SELECT policy for AEE teachers
CREATE POLICY "aee_teachers_can_view_tenant_peis"
ON public.peis FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aee_teacher'
    AND profiles.tenant_id = peis.tenant_id
  )
);

-- Create SELECT policy for superadmins
CREATE POLICY "superadmins_can_view_all_peis"
ON public.peis FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'superadmin'
  )
);

-- Create SELECT policy for family access via tokens
CREATE POLICY "family_can_view_via_token"
ON public.peis FOR SELECT
USING (
  peis.id IN (
    SELECT family_access_tokens.pei_id 
    FROM family_access_tokens 
    WHERE family_access_tokens.token_hash = hash_token(COALESCE(split_part((auth.jwt() ->> 'email'::text), '@'::text, 1), ''::text))
    AND family_access_tokens.expires_at > now()
  )
);

-- Create SELECT policy for family members
CREATE POLICY "family_can_view_own_student_peis"
ON public.peis FOR SELECT
USING (
  peis.student_id IN (
    SELECT student_family.student_id 
    FROM student_family 
    WHERE student_family.family_user_id = auth.uid()
  )
);

-- Recreate INSERT policy
CREATE POLICY "users_can_insert_peis"
ON public.peis FOR INSERT
WITH CHECK (
  created_by = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'aee_teacher', 'coordinator', 'school_manager', 'superadmin')
  )
);

-- Recreate UPDATE policy
CREATE POLICY "users_can_update_own_peis"
ON public.peis FOR UPDATE
USING (
  assigned_teacher_id = auth.uid() 
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('coordinator', 'school_manager', 'superadmin')
    AND profiles.tenant_id = peis.tenant_id
  )
);

-- Recreate DELETE policy
CREATE POLICY "users_can_delete_own_peis"
ON public.peis FOR DELETE
USING (
  assigned_teacher_id = auth.uid() 
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('coordinator', 'school_manager', 'superadmin')
    AND profiles.tenant_id = peis.tenant_id
  )
);