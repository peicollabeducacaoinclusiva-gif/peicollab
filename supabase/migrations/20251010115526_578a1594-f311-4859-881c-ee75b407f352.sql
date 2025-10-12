-- Fix infinite recursion in RLS policies

-- Drop problematic policies
DROP POLICY IF EXISTS "Coordinators can view tenant associations in their tenants" ON user_tenants;
DROP POLICY IF EXISTS "users_view_same_tenant" ON profiles;

-- Recreate Coordinators policy without recursion
-- This policy allows coordinators to see user-tenant associations in their own tenants
CREATE POLICY "Coordinators can view tenant associations in their tenants"
ON user_tenants
FOR SELECT
USING (
  has_role(auth.uid(), 'coordinator'::app_role) 
  AND tenant_id = get_user_tenant_safe(auth.uid())
);

-- Recreate profiles policy without recursion
CREATE POLICY "users_view_same_tenant"
ON profiles
FOR SELECT
USING (
  id = auth.uid()
  OR has_role(auth.uid(), 'superadmin'::app_role)
  OR (tenant_id IS NOT NULL AND tenant_id = get_user_tenant_safe(auth.uid()))
);