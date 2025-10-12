-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Coordinator view tenant" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "School managers can view profiles in their tenant" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Superadmin delete all" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Superadmin update all" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Superadmin view all" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "coordinators_view_tenant" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "school_managers_view_tenant" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "superadmins_all_access" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "users_view_own_profile" ON public.profiles CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_tenant(uuid) CASCADE;

-- Create security definer function to get user role (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_user_role_safe(_user_id uuid)
RETURNS user_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
  
  RETURN user_role_result;
END;
$$;

-- Create security definer function to get user tenant (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_user_tenant_safe(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tenant_result uuid;
BEGIN
  SELECT tenant_id INTO user_tenant_result
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
  
  RETURN user_tenant_result;
END;
$$;

-- Create simple, non-recursive policies

-- Users can always view their own profile
CREATE POLICY "users_own_profile_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "users_own_profile_insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "users_own_profile_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Superadmins can view all profiles
CREATE POLICY "superadmin_view_all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  get_user_role_safe(auth.uid()) = 'superadmin'
);

-- Superadmins can update all profiles
CREATE POLICY "superadmin_update_all"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  get_user_role_safe(auth.uid()) = 'superadmin'
);

-- Superadmins can delete all profiles
CREATE POLICY "superadmin_delete_all"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  get_user_role_safe(auth.uid()) = 'superadmin'
);

-- Coordinators can view profiles in their tenant
CREATE POLICY "coordinator_view_tenant"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  get_user_role_safe(auth.uid()) = 'coordinator'
  AND tenant_id = get_user_tenant_safe(auth.uid())
  AND tenant_id IS NOT NULL
);

-- School managers can view profiles in their tenant
CREATE POLICY "school_manager_view_tenant"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  get_user_role_safe(auth.uid()) = 'school_manager'
  AND tenant_id = get_user_tenant_safe(auth.uid())
  AND tenant_id IS NOT NULL
);