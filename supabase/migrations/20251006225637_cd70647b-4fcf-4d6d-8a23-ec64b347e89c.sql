-- Allow AEE teachers to view profiles in their tenant (needed for AEETeacherDashboard nested select)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'aee_teacher_view_tenant'
  ) THEN
    CREATE POLICY aee_teacher_view_tenant
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
      get_user_role_safe(auth.uid()) = 'aee_teacher'::user_role
      AND tenant_id = get_user_tenant_safe(auth.uid())
      AND tenant_id IS NOT NULL
    );
  END IF;
END $$;