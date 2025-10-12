-- ============================================
-- CRITICAL SECURITY FIXES - CORRECTED
-- ============================================

-- 1. Create app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('superadmin', 'coordinator', 'school_manager', 'aee_teacher', 'teacher', 'family');
  END IF;
END $$;

-- 2. Create user_roles table (prevents privilege escalation)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::app_role 
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role::text
    WHEN 'superadmin' THEN 1
    WHEN 'coordinator' THEN 2
    WHEN 'school_manager' THEN 3
    WHEN 'aee_teacher' THEN 4
    WHEN 'teacher' THEN 5
    WHEN 'family' THEN 6
  END
  LIMIT 1
$$;

-- 6. RLS policies for user_roles table
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;
CREATE POLICY "Superadmins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- 7. Secure pei_access_logs - only service role can insert
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.pei_access_logs;
CREATE POLICY "Service role can insert logs"
ON public.pei_access_logs FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Coordenadores podem visualizar logs do seu tenant" ON public.pei_access_logs;
CREATE POLICY "Superadmins can view logs"
ON public.pei_access_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- 8. Secure pei_access_attempts - only service role can insert
DROP POLICY IF EXISTS "Sistema pode inserir tentativas" ON public.pei_access_attempts;
CREATE POLICY "Service role can insert attempts"
ON public.pei_access_attempts FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Coordenadores podem visualizar tentativas" ON public.pei_access_attempts;
CREATE POLICY "Superadmins can view attempts"
ON public.pei_access_attempts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- 9. Update profiles RLS policies to use has_role function
DROP POLICY IF EXISTS "superadmin_view_all" ON public.profiles;
CREATE POLICY "superadmin_view_all"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "superadmin_update_all" ON public.profiles;
CREATE POLICY "superadmin_update_all"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "superadmin_delete_all" ON public.profiles;
CREATE POLICY "superadmin_delete_all"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "coordinator_view_tenant" ON public.profiles;
CREATE POLICY "coordinator_view_tenant"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coordinator')
  AND tenant_id = get_user_tenant_safe(auth.uid())
  AND tenant_id IS NOT NULL
);

DROP POLICY IF EXISTS "school_manager_view_tenant" ON public.profiles;
CREATE POLICY "school_manager_view_tenant"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'school_manager')
  AND tenant_id = get_user_tenant_safe(auth.uid())
  AND tenant_id IS NOT NULL
);

DROP POLICY IF EXISTS "aee_teacher_view_tenant" ON public.profiles;
CREATE POLICY "aee_teacher_view_tenant"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'aee_teacher')
  AND tenant_id = get_user_tenant_safe(auth.uid())
  AND tenant_id IS NOT NULL
);

-- 10. Update students RLS to use has_role
DROP POLICY IF EXISTS "students_select_policy" ON public.students;
CREATE POLICY "students_select_policy"
ON public.students FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin')
  OR (
    (public.has_role(auth.uid(), 'coordinator') 
     OR public.has_role(auth.uid(), 'school_manager')
     OR public.has_role(auth.uid(), 'teacher')
     OR public.has_role(auth.uid(), 'aee_teacher'))
    AND tenant_id = get_user_tenant_safe(auth.uid())
  )
  OR can_view_student(auth.uid(), id)
);

DROP POLICY IF EXISTS "students_insert_policy" ON public.students;
CREATE POLICY "students_insert_policy"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin')
  OR public.has_role(auth.uid(), 'coordinator')
  OR public.has_role(auth.uid(), 'school_manager')
);

DROP POLICY IF EXISTS "students_update_policy" ON public.students;
CREATE POLICY "students_update_policy"
ON public.students FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin')
  OR (
    (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'school_manager'))
    AND tenant_id = get_user_tenant_safe(auth.uid())
  )
);

DROP POLICY IF EXISTS "students_delete_policy" ON public.students;
CREATE POLICY "students_delete_policy"
ON public.students FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin')
  OR (
    (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'school_manager'))
    AND tenant_id = get_user_tenant_safe(auth.uid())
  )
);

-- 11. Update PEIs RLS policies
DROP POLICY IF EXISTS "superadmins_can_view_all_peis" ON public.peis;
CREATE POLICY "superadmins_can_view_all_peis"
ON public.peis FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "coordinators_can_view_tenant_peis" ON public.peis;
CREATE POLICY "coordinators_can_view_tenant_peis"
ON public.peis FOR SELECT
TO authenticated
USING (
  (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'school_manager'))
  AND tenant_id = get_user_tenant_safe(auth.uid())
);

DROP POLICY IF EXISTS "aee_teachers_can_view_tenant_peis" ON public.peis;
CREATE POLICY "aee_teachers_can_view_tenant_peis"
ON public.peis FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'aee_teacher')
  AND tenant_id = get_user_tenant_safe(auth.uid())
);

DROP POLICY IF EXISTS "teachers_can_view_own_peis" ON public.peis;
CREATE POLICY "teachers_can_view_own_peis"
ON public.peis FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher')
  AND (assigned_teacher_id = auth.uid() OR created_by = auth.uid())
);

DROP POLICY IF EXISTS "users_can_insert_peis" ON public.peis;
CREATE POLICY "users_can_insert_peis"
ON public.peis FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'teacher')
    OR public.has_role(auth.uid(), 'aee_teacher')
    OR public.has_role(auth.uid(), 'coordinator')
    OR public.has_role(auth.uid(), 'school_manager')
    OR public.has_role(auth.uid(), 'superadmin')
  )
);

DROP POLICY IF EXISTS "users_can_update_own_peis" ON public.peis;
CREATE POLICY "users_can_update_own_peis"
ON public.peis FOR UPDATE
TO authenticated
USING (
  assigned_teacher_id = auth.uid()
  OR created_by = auth.uid()
  OR (
    (public.has_role(auth.uid(), 'coordinator') 
     OR public.has_role(auth.uid(), 'school_manager')
     OR public.has_role(auth.uid(), 'superadmin'))
    AND tenant_id = get_user_tenant_safe(auth.uid())
  )
);

DROP POLICY IF EXISTS "users_can_delete_own_peis" ON public.peis;
CREATE POLICY "users_can_delete_own_peis"
ON public.peis FOR DELETE
TO authenticated
USING (
  assigned_teacher_id = auth.uid()
  OR created_by = auth.uid()
  OR (
    (public.has_role(auth.uid(), 'coordinator') 
     OR public.has_role(auth.uid(), 'school_manager')
     OR public.has_role(auth.uid(), 'superadmin'))
    AND tenant_id = get_user_tenant_safe(auth.uid())
  )
);

-- 12. Remove plaintext token column from family_access_tokens (keep only hash)
ALTER TABLE public.family_access_tokens DROP COLUMN IF EXISTS token;

-- 13. Update family_access_tokens RLS to use has_role
DROP POLICY IF EXISTS "Coordinators can manage tokens in their tenant" ON public.family_access_tokens;
CREATE POLICY "Coordinators can manage tokens in their tenant"
ON public.family_access_tokens FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM peis p
    JOIN profiles pr ON pr.tenant_id = p.tenant_id
    WHERE p.id = family_access_tokens.pei_id
    AND pr.id = auth.uid()
    AND (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'superadmin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM peis p
    JOIN profiles pr ON pr.tenant_id = p.tenant_id
    WHERE p.id = family_access_tokens.pei_id
    AND pr.id = auth.uid()
    AND (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'superadmin'))
  )
);

DROP POLICY IF EXISTS "Coordinators can view tokens in their tenant" ON public.family_access_tokens;

-- 14. Update handle_new_user trigger to use user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    (NEW.raw_user_meta_data->>'tenant_id')::UUID
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::text::app_role, 'teacher'::app_role)
  );
  
  RETURN NEW;
END;
$$;

-- 15. Drop and recreate get_user_role_safe with new return type
DROP FUNCTION IF EXISTS public.get_user_role_safe(uuid);

CREATE OR REPLACE FUNCTION public.get_user_role_safe(_user_id UUID)
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_result app_role;
BEGIN
  SELECT role INTO user_role_result
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role::text
    WHEN 'superadmin' THEN 1
    WHEN 'coordinator' THEN 2
    WHEN 'school_manager' THEN 3
    WHEN 'aee_teacher' THEN 4
    WHEN 'teacher' THEN 5
    WHEN 'family' THEN 6
  END
  LIMIT 1;
  
  RETURN user_role_result;
END;
$$;