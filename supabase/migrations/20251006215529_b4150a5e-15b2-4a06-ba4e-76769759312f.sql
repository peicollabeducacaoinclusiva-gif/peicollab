-- Drop existing school_manager policy on profiles
DROP POLICY IF EXISTS "school_manager_view_tenant" ON public.profiles;

-- Create improved policy for school_manager to view users in their tenant
CREATE POLICY "school_manager_view_tenant"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'school_manager'
    AND p.tenant_id = profiles.tenant_id
    AND p.tenant_id IS NOT NULL
  )
);