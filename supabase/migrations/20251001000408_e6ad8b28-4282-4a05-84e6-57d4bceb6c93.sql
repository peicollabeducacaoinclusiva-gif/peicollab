-- Allow superadmins to delete PEIs
CREATE POLICY "Superadmins can delete peis"
ON public.peis
FOR DELETE
USING (get_user_role(auth.uid()) = 'superadmin'::user_role);