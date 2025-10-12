-- Fix search_path for security
DROP FUNCTION IF EXISTS generate_pei_access_token();

CREATE OR REPLACE FUNCTION generate_pei_access_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a random 8-character alphanumeric token
  token := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  RETURN token;
END;
$$;