-- Create a function to get PEI data for family access (bypass RLS)
CREATE OR REPLACE FUNCTION get_pei_for_family(pei_uuid UUID, access_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  token_valid BOOLEAN;
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

  -- Get PEI data with student and tenant info
  SELECT json_build_object(
    'id', p.id,
    'status', p.status,
    'diagnosis_data', p.diagnosis_data,
    'planning_data', p.planning_data,
    'evaluation_data', p.evaluation_data,
    'family_approved_at', p.family_approved_at,
    'family_approved_by', p.family_approved_by,
    'created_at', p.created_at,
    'updated_at', p.updated_at,
    'student', json_build_object(
      'name', s.name,
      'date_of_birth', s.date_of_birth
    ),
    'tenant', json_build_object(
      'name', t.name
    )
  )
  INTO result
  FROM peis p
  LEFT JOIN students s ON s.id = p.student_id
  LEFT JOIN tenants t ON t.id = p.tenant_id
  WHERE p.id = pei_uuid;

  RETURN result;
END;
$$;