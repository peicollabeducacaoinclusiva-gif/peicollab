-- Add SELECT policy to family_access_tokens to prevent enumeration
DROP POLICY IF EXISTS "Coordinators can view tokens in their tenant" ON family_access_tokens;

CREATE POLICY "Coordinators can view tokens in their tenant"
ON family_access_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM peis p
    JOIN profiles pr ON pr.tenant_id = p.tenant_id
    WHERE p.id = family_access_tokens.pei_id
    AND pr.id = auth.uid()
    AND pr.role IN ('coordinator', 'superadmin')
  )
);