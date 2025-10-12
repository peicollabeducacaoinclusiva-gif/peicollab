-- Allow coordinators to delete PEIs in their tenant
CREATE POLICY "Coordinators can delete peis in their tenant"
ON public.peis
FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'coordinator'::user_role
  )
);