-- Fix Critical Security Issues

-- 1. Remove public access to comments
DROP POLICY IF EXISTS "Public can view comments" ON public.pei_comments;
DROP POLICY IF EXISTS "Anonymous can insert comments" ON public.pei_comments;

-- 2. Remove public access to family tokens
DROP POLICY IF EXISTS "Anyone can view valid tokens" ON public.pei_family_tokens;

-- 3. Create secure policy for family tokens (only accessible via security definer functions)
CREATE POLICY "Only system functions can access tokens"
ON public.pei_family_tokens
FOR SELECT
USING (false);

-- 4. Add policy for coordinators to manage tokens
CREATE POLICY "Coordinators can manage family tokens"
ON public.pei_family_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM peis p
    JOIN profiles pr ON pr.tenant_id = p.tenant_id
    WHERE p.id = pei_family_tokens.pei_id
    AND pr.id = auth.uid()
    AND pr.role = 'coordinator'
  )
);