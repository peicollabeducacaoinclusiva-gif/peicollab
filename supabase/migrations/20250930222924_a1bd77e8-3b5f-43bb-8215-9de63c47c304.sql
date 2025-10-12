-- Create a function for family to approve PEI
CREATE OR REPLACE FUNCTION approve_pei_family(pei_uuid UUID, access_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_valid BOOLEAN;
  result JSON;
BEGIN
  -- Check if token is valid
  SELECT EXISTS (
    SELECT 1 FROM pei_family_tokens
    WHERE pei_id = pei_uuid
    AND token = access_token
    AND expires_at > NOW()
  ) INTO token_valid;

  IF NOT token_valid THEN
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;

  -- Update PEI approval
  UPDATE peis
  SET 
    family_approved_at = NOW(),
    family_approved_by = 'Família (via código)'
  WHERE id = pei_uuid
  RETURNING json_build_object(
    'family_approved_at', family_approved_at,
    'family_approved_by', family_approved_by
  ) INTO result;

  RETURN result;
END;
$$;