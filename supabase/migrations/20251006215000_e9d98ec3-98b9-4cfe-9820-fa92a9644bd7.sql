-- Fix infinite recursion in RLS policies

-- Drop ALL existing policies on peis to start fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'peis' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.peis', r.policyname);
    END LOOP;
END$$;

-- Drop ALL existing policies on students
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'students' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.students', r.policyname);
    END LOOP;
END$$;

-- Create security definer function to check PEI access without recursion
CREATE OR REPLACE FUNCTION public.can_access_pei(_user_id uuid, _pei_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.peis p
    INNER JOIN public.profiles pr ON pr.id = _user_id
    WHERE p.id = _pei_id
    AND (
      pr.role = 'superadmin'
      OR (pr.role = 'teacher' AND (p.assigned_teacher_id = _user_id OR p.created_by = _user_id))
      OR (pr.role = 'aee_teacher' AND p.tenant_id = pr.tenant_id)
      OR (pr.role = 'coordinator' AND p.tenant_id = pr.tenant_id)
      OR (pr.role = 'school_manager' AND p.tenant_id = pr.tenant_id)
    )
  )
$$;

-- Create new PEI policies
CREATE POLICY "pei_select_policy"
ON public.peis FOR SELECT TO authenticated
USING (
  public.can_access_pei(auth.uid(), id)
  OR id IN (
    SELECT pei_id FROM family_access_tokens
    WHERE token_hash = hash_token(COALESCE(split_part((auth.jwt() ->> 'email'), '@', 1), ''))
    AND expires_at > now()
  )
  OR student_id IN (
    SELECT student_id FROM student_family WHERE family_user_id = auth.uid()
  )
);

CREATE POLICY "pei_insert_policy"
ON public.peis FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'aee_teacher', 'coordinator', 'school_manager', 'superadmin')
  )
);

CREATE POLICY "pei_update_policy"
ON public.peis FOR UPDATE TO authenticated
USING (public.can_access_pei(auth.uid(), id))
WITH CHECK (public.can_access_pei(auth.uid(), id));

CREATE POLICY "pei_delete_policy"
ON public.peis FOR DELETE TO authenticated
USING (public.can_access_pei(auth.uid(), id));

-- Create new students policies
CREATE POLICY "students_select_policy"
ON public.students FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      role = 'superadmin'
      OR (role IN ('coordinator', 'school_manager', 'teacher', 'aee_teacher') AND tenant_id = students.tenant_id)
    )
  )
  OR can_view_student(auth.uid(), id)
);

CREATE POLICY "students_insert_policy"
ON public.students FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'coordinator', 'school_manager')
  )
);

CREATE POLICY "students_update_policy"
ON public.students FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      role = 'superadmin'
      OR (role IN ('coordinator', 'school_manager') AND tenant_id = students.tenant_id)
    )
  )
);

CREATE POLICY "students_delete_policy"
ON public.students FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      role = 'superadmin'
      OR (role IN ('coordinator', 'school_manager') AND tenant_id = students.tenant_id)
    )
  )
);