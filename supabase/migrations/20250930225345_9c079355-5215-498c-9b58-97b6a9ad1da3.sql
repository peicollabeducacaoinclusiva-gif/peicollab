-- Drop existing problematic policies
DROP POLICY IF EXISTS "Coordinators can insert students" ON public.students;
DROP POLICY IF EXISTS "Users can view students in their tenant" ON public.students;
DROP POLICY IF EXISTS "Family can view their own students" ON public.students;

-- Recreate policies with simpler, non-recursive checks
CREATE POLICY "Users can view students in their tenant"
ON public.students FOR SELECT
USING (
  tenant_id = public.get_user_tenant(auth.uid())
);

CREATE POLICY "Superadmins and coordinators can insert students"
ON public.students FOR INSERT
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('superadmin', 'coordinator')
);

CREATE POLICY "Superadmins and coordinators can update students"
ON public.students FOR UPDATE
USING (
  public.get_user_role(auth.uid()) IN ('superadmin', 'coordinator')
);

CREATE POLICY "Superadmins can delete students"
ON public.students FOR DELETE
USING (
  public.get_user_role(auth.uid()) = 'superadmin'
);