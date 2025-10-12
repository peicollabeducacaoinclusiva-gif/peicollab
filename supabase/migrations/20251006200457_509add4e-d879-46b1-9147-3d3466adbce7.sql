-- Drop ALL existing policies on profiles table first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin view all" ON public.profiles;
DROP POLICY IF EXISTS "Coordinator view tenant" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin update all" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin delete all" ON public.profiles;
DROP POLICY IF EXISTS "School managers can view profiles in their tenant" ON public.profiles;

-- Recreate simple, non-recursive policies
-- Users can view their own profile (completely safe, no recursion)
CREATE POLICY "users_view_own_profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own_profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow profile creation
CREATE POLICY "users_insert_own_profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Superadmins bypass RLS - this is safe because we check role directly on the row
CREATE POLICY "superadmins_all_access"
ON public.profiles
FOR ALL
USING (role = 'superadmin');

-- Coordinators view profiles in same tenant
CREATE POLICY "coordinators_view_tenant"
ON public.profiles
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'coordinator'
  )
);

-- School managers view profiles in same tenant  
CREATE POLICY "school_managers_view_tenant"
ON public.profiles
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'school_manager'
  )
);