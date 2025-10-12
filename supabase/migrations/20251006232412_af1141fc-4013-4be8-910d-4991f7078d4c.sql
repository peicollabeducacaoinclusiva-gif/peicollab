-- Fix infinite recursion in peis RLS caused by policy referencing family_access_tokens which references peis
-- 1) Drop the problematic policy
DROP POLICY IF EXISTS "family_can_view_via_token" ON public.peis;

-- 2) Create a SECURITY DEFINER function that checks token-based access without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.can_family_view_pei_via_token(_pei_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  email text;
  email_user text;
BEGIN
  -- Safely read JWT claims (email) from the request
  BEGIN
    claims := current_setting('request.jwt.claims', true)::jsonb;
    email := (claims->>'email');
  EXCEPTION WHEN others THEN
    email := NULL;
  END;

  IF email IS NULL THEN
    RETURN FALSE;
  END IF;

  email_user := split_part(email, '@', 1);

  -- Bypass RLS via SECURITY DEFINER and check token validity
  RETURN EXISTS (
    SELECT 1
    FROM public.family_access_tokens fat
    WHERE fat.pei_id = _pei_id
      AND fat.token_hash = public.hash_token(COALESCE(email_user, ''))
      AND fat.expires_at > now()
  );
END;
$$;

-- 3) Recreate the policy using the function, which avoids direct table references in policy
CREATE POLICY "family_can_view_via_token_v2"
ON public.peis
FOR SELECT
USING (public.can_family_view_pei_via_token(id));