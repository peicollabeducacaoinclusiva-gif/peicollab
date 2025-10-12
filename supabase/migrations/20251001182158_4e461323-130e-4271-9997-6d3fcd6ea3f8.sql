-- Allow teachers to delete their own PEIs
CREATE POLICY "Teachers can delete their own PEIs"
ON public.peis
FOR DELETE
USING (created_by = auth.uid() AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'teacher'
));