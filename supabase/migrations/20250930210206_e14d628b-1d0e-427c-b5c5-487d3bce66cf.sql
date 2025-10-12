-- Fix infinite recursion in profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coordination can view profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "Coordinators can view profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Create a security definer function to get user tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant(_user_id uuid)
RETURNS uuid
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Create simple, non-recursive policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile  
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Superadmin can view all profiles
CREATE POLICY "Superadmin view all"
  ON public.profiles FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'superadmin');

-- Superadmin can update all profiles
CREATE POLICY "Superadmin update all"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'superadmin');

-- Superadmin can delete profiles
CREATE POLICY "Superadmin delete all"
  ON public.profiles FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'superadmin');

-- Coordinator can view profiles in their tenant
CREATE POLICY "Coordinator view tenant"
  ON public.profiles FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'coordinator'
    AND tenant_id = public.get_user_tenant(auth.uid())
  );

-- Allow profile creation during signup
CREATE POLICY "Allow profile creation"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);