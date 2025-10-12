-- Allow public read access to comments (they will still need valid PEI access)
CREATE POLICY "Public can view comments"
ON public.pei_comments
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anonymous users to insert comments (for family access)
CREATE POLICY "Anonymous can insert comments"
ON public.pei_comments
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);