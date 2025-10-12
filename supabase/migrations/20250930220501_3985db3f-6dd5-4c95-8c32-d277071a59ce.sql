-- Allow superadmins to insert tenants
CREATE POLICY "Superadmins can insert tenants"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) = 'superadmin'::user_role
);

-- Allow superadmins to update tenants
CREATE POLICY "Superadmins can update tenants"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  get_user_role(auth.uid()) = 'superadmin'::user_role
);

-- Allow superadmins to delete tenants
CREATE POLICY "Superadmins can delete tenants"
ON public.tenants
FOR DELETE
TO authenticated
USING (
  get_user_role(auth.uid()) = 'superadmin'::user_role
);