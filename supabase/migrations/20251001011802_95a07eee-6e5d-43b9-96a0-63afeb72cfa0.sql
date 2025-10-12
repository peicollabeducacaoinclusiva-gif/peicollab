-- Fix token access policy for security definer functions

-- Remove the overly restrictive policy
DROP POLICY IF EXISTS "Only system functions can access tokens" ON public.pei_family_tokens;

-- Security definer functions will bypass RLS automatically
-- We just need to ensure regular users can't access tokens directly
-- But coordinators can still manage them through the existing policy

-- The "Coordinators can manage family tokens" policy already exists and handles coordinator access
-- Security definer functions (get_pei_for_family, approve_pei_family) will work correctly
-- because they run with elevated privileges and bypass RLS

-- No additional SELECT policy needed - this prevents direct token access by users
-- while allowing security definer functions to work properly