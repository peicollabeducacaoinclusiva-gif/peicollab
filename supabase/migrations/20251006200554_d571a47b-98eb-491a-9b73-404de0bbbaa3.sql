-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin view all" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin update all" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin delete all" ON public.profiles;
DROP POLICY IF EXISTS "Coordinator view tenant" ON public.profiles;
DROP POLICY IF EXISTS "School managers can view profiles in their tenant" ON public.profiles;

-- Recreate simple policies without recursion
-- Users can view their own profile (no recursion - direct auth.uid() check)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow profile creation
CREATE POLICY "Allow profile creation"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Superadmin can view all - check role directly on current row first
CREATE POLICY "Superadmin view all"
ON public.profiles
FOR SELECT
USING (role = 'superadmin');

-- Superadmin can update all
CREATE POLICY "Superadmin update all"
ON public.profiles
FOR UPDATE
USING (role = 'superadmin');

-- Superadmin can delete
CREATE POLICY "Superadmin delete all"
ON public.profiles
FOR DELETE
USING (role = 'superadmin');

-- Coordinators can view profiles in same tenant
CREATE POLICY "Coordinator view tenant"
ON public.profiles
FOR SELECT
USING (
  tenant_id IS NOT NULL AND 
  tenant_id IN (
    SELECT p.tenant_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'coordinator'
  )
);

-- School managers can view profiles in same tenant
CREATE POLICY "School managers can view profiles in their tenant"
ON public.profiles
FOR SELECT
USING (
  tenant_id IS NOT NULL AND
  tenant_id IN (
    SELECT p.tenant_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'school_manager'
  )
);