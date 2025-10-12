-- Policy to allow superadmins to view all PEIs
CREATE POLICY "Superadmins can view all peis"
ON public.peis
FOR SELECT
USING (get_user_role(auth.uid()) = 'superadmin'::user_role);