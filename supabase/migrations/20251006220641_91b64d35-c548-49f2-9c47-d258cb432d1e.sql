-- Fix infinite recursion in school_manager_view_tenant policy
DROP POLICY IF EXISTS "school_manager_view_tenant" ON public.profiles;

-- Create corrected policy using security definer functions
CREATE POLICY "school_manager_view_tenant"
ON public.profiles FOR SELECT
USING (
  (get_user_role_safe(auth.uid()) = 'school_manager') 
  AND (tenant_id = get_user_tenant_safe(auth.uid())) 
  AND (tenant_id IS NOT NULL)
);