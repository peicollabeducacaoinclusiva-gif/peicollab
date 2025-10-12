-- Add policy for superadmins to view all students
DROP POLICY IF EXISTS "Users can view students in their tenant" ON public.students;

-- Create separate policies for different roles
CREATE POLICY "Superadmins can view all students"
ON public.students
FOR SELECT
USING (get_user_role(auth.uid()) = 'superadmin'::user_role);

CREATE POLICY "Users can view students in their tenant"
ON public.students
FOR SELECT
USING (
  get_user_role(auth.uid()) != 'superadmin'::user_role 
  AND tenant_id = get_user_tenant(auth.uid())
);