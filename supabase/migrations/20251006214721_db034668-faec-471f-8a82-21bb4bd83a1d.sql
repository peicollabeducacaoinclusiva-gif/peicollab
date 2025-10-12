-- Fix infinite recursion in RLS policies by using security definer functions

-- Drop existing problematic policies on peis
DROP POLICY IF EXISTS "Teachers can view assigned PEIs" ON public.peis;
DROP POLICY IF EXISTS "AEE teachers can view PEIs in their tenant" ON public.peis;
DROP POLICY IF EXISTS "Coordinators can view PEIs in their tenant" ON public.peis;
DROP POLICY IF EXISTS "School managers can view PEIs" ON public.peis;
DROP POLICY IF EXISTS "Teachers can update their PEIs" ON public.peis;
DROP POLICY IF EXISTS "Teachers can delete their own PEIs" ON public.peis;
DROP POLICY IF EXISTS "Coordinators can update PEIs in their tenant" ON public.peis;
DROP POLICY IF EXISTS "Coordinators can delete peis in their tenant" ON public.peis;
DROP POLICY IF EXISTS "School managers can update PEIs" ON public.peis;
DROP POLICY IF EXISTS "School managers can delete PEIs" ON public.peis;
DROP POLICY IF EXISTS "Teachers can insert PEIs" ON public.peis;
DROP POLICY IF EXISTS "Coordinators can insert peis in their tenant" ON public.peis;
DROP POLICY IF EXISTS "Family can view PEI with valid token" ON public.peis;
DROP POLICY IF EXISTS "Family can view their student's PEIs" ON public.peis;

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
      -- Superadmin can access all
      pr.role = 'superadmin'
      -- Teachers can access their assigned or created PEIs
      OR (pr.role = 'teacher' AND (p.assigned_teacher_id = _user_id OR p.created_by = _user_id))
      -- AEE teachers can access PEIs in their tenant
      OR (pr.role = 'aee_teacher' AND p.tenant_id = pr.tenant_id)
      -- Coordinators can access PEIs in their tenant
      OR (pr.role = 'coordinator' AND p.tenant_id = pr.tenant_id)
      -- School managers can access PEIs in their tenant
      OR (pr.role = 'school_manager' AND p.tenant_id = pr.tenant_id)
    )
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view accessible PEIs"
ON public.peis
FOR SELECT
TO authenticated
USING (public.can_access_pei(auth.uid(), id));

CREATE POLICY "Authorized users can create PEIs"
ON public.peis
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'aee_teacher', 'coordinator', 'school_manager', 'superadmin')
    AND (
      role = 'superadmin' 
      OR tenant_id = tenant_id
    )
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update accessible PEIs"
ON public.peis
FOR UPDATE
TO authenticated
USING (public.can_access_pei(auth.uid(), id))
WITH CHECK (public.can_access_pei(auth.uid(), id));

CREATE POLICY "Users can delete accessible PEIs"
ON public.peis
FOR DELETE
TO authenticated
USING (public.can_access_pei(auth.uid(), id));

-- Add family access policies
CREATE POLICY "Family can view PEI with valid token"
ON public.peis
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT pei_id FROM family_access_tokens
    WHERE token_hash = hash_token(COALESCE(split_part((auth.jwt() ->> 'email'), '@', 1), ''))
    AND expires_at > now()
  )
);

CREATE POLICY "Family can view their student PEIs"
ON public.peis
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT student_id FROM student_family
    WHERE family_user_id = auth.uid()
  )
);

-- Fix students table policies - remove conflicting ones
DROP POLICY IF EXISTS "Coordinators can view students in tenant" ON public.students;
DROP POLICY IF EXISTS "School managers can view students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students in tenant" ON public.students;
DROP POLICY IF EXISTS "Users can view accessible students" ON public.students;
DROP POLICY IF EXISTS "AEE teachers can view students in their tenant" ON public.students;
DROP POLICY IF EXISTS "School managers can insert students" ON public.students;
DROP POLICY IF EXISTS "School managers can update students" ON public.students;
DROP POLICY IF EXISTS "School managers can delete students" ON public.students;

-- Create simplified students policies
CREATE POLICY "Users can view accessible students"
ON public.students
FOR SELECT
TO authenticated
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

CREATE POLICY "Authorized users can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'coordinator', 'school_manager')
  )
);

CREATE POLICY "Authorized users can update students"
ON public.students
FOR UPDATE
TO authenticated
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

CREATE POLICY "Authorized users can delete students"
ON public.students
FOR DELETE
TO authenticated
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