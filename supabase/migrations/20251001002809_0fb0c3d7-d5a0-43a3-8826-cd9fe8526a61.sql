-- Allow coordinators to insert PEIs in their tenant
CREATE POLICY "Coordinators can insert peis in their tenant"
ON public.peis
FOR INSERT
WITH CHECK (
  created_by = auth.uid() 
  AND tenant_id IN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'coordinator'::user_role
  )
);