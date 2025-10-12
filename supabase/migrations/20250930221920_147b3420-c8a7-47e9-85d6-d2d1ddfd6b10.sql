-- Create table for family access tokens
CREATE TABLE pei_family_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pei_id UUID REFERENCES peis(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
);

-- Add family approval fields to peis table
ALTER TABLE peis 
ADD COLUMN family_approved_at TIMESTAMPTZ,
ADD COLUMN family_approved_by TEXT;

-- Enable RLS on pei_family_tokens
ALTER TABLE pei_family_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can view tokens (for validation)
CREATE POLICY "Anyone can view valid tokens"
ON pei_family_tokens
FOR SELECT
USING (expires_at > NOW());

-- Only coordinators can create tokens
CREATE POLICY "Coordinators can create tokens"
ON pei_family_tokens
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM peis p
    INNER JOIN profiles pr ON pr.tenant_id = p.tenant_id
    WHERE p.id = pei_id 
    AND pr.id = auth.uid()
    AND pr.role = 'coordinator'::user_role
  )
);

-- Create index for faster token lookups
CREATE INDEX idx_pei_family_tokens_token ON pei_family_tokens(token);
CREATE INDEX idx_pei_family_tokens_expires ON pei_family_tokens(expires_at);

-- Function to generate random token
CREATE OR REPLACE FUNCTION generate_pei_access_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a random 8-character alphanumeric token
  token := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  RETURN token;
END;
$$;