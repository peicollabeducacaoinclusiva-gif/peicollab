-- Add student_id column to pei_comments
ALTER TABLE pei_comments ADD COLUMN student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Populate student_id from peis relationship
UPDATE pei_comments 
SET student_id = (
  SELECT student_id FROM peis WHERE peis.id = pei_comments.pei_id
);

-- Make student_id NOT NULL after populating
ALTER TABLE pei_comments ALTER COLUMN student_id SET NOT NULL;

-- Create student_access table
CREATE TABLE public.student_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, user_id)
);

-- Enable RLS on student_access
ALTER TABLE student_access ENABLE ROW LEVEL SECURITY;

-- Coordinators and superadmins can manage student access in their tenant
CREATE POLICY "Coordinators can manage student access"
ON student_access
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('coordinator', 'superadmin')
    AND profiles.tenant_id = (SELECT tenant_id FROM students WHERE students.id = student_access.student_id)
  )
);

-- Users can view their own student access
CREATE POLICY "Users can view own student access"
ON student_access
FOR SELECT
USING (user_id = auth.uid());

-- Populate student_access with existing relationships
-- Add assigned teachers
INSERT INTO student_access (student_id, user_id, role)
SELECT DISTINCT p.student_id, p.assigned_teacher_id, 'teacher'
FROM peis p
WHERE p.assigned_teacher_id IS NOT NULL
ON CONFLICT (student_id, user_id) DO NOTHING;

-- Add PEI creators
INSERT INTO student_access (student_id, user_id, role)
SELECT DISTINCT p.student_id, p.created_by, 'creator'
FROM peis p
ON CONFLICT (student_id, user_id) DO NOTHING;

-- Add coordinators from same tenant
INSERT INTO student_access (student_id, user_id, role)
SELECT DISTINCT s.id, pr.id, 'coordinator'
FROM students s
JOIN profiles pr ON pr.tenant_id = s.tenant_id
WHERE pr.role IN ('coordinator', 'superadmin')
ON CONFLICT (student_id, user_id) DO NOTHING;

-- Add family members if they exist
INSERT INTO student_access (student_id, user_id, role)
SELECT DISTINCT sf.student_id, sf.family_user_id, 'family'
FROM student_family sf
ON CONFLICT (student_id, user_id) DO NOTHING;

-- Drop old complex RLS policies
DROP POLICY IF EXISTS "Users can view comments on accessible PEIs" ON pei_comments;
DROP POLICY IF EXISTS "Users can insert comments on accessible PEIs" ON pei_comments;

-- Create new simplified RLS policies
CREATE POLICY "Users can view comments on accessible students"
ON pei_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_access
    WHERE student_access.student_id = pei_comments.student_id
    AND student_access.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert comments on accessible students"
ON pei_comments
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM student_access
    WHERE student_access.student_id = pei_comments.student_id
    AND student_access.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own comments"
ON pei_comments
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON pei_comments
FOR DELETE
USING (user_id = auth.uid());

-- Enable FORCE ROW LEVEL SECURITY
ALTER TABLE pei_comments FORCE ROW LEVEL SECURITY;

-- Create trigger function to maintain student_access when PEIs change
CREATE OR REPLACE FUNCTION update_student_access_on_pei()
RETURNS TRIGGER AS $$
BEGIN
  -- Add assigned teacher
  IF NEW.assigned_teacher_id IS NOT NULL THEN
    INSERT INTO student_access (student_id, user_id, role)
    VALUES (NEW.student_id, NEW.assigned_teacher_id, 'teacher')
    ON CONFLICT (student_id, user_id) DO NOTHING;
  END IF;
  
  -- Add creator
  INSERT INTO student_access (student_id, user_id, role)
  VALUES (NEW.student_id, NEW.created_by, 'creator')
  ON CONFLICT (student_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on peis table
CREATE TRIGGER maintain_student_access
AFTER INSERT OR UPDATE ON peis
FOR EACH ROW
EXECUTE FUNCTION update_student_access_on_pei();

-- Create trigger function to add coordinators to student_access
CREATE OR REPLACE FUNCTION add_coordinator_student_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('coordinator', 'superadmin') AND NEW.tenant_id IS NOT NULL THEN
    INSERT INTO student_access (student_id, user_id, role)
    SELECT s.id, NEW.id, 'coordinator'
    FROM students s
    WHERE s.tenant_id = NEW.tenant_id
    ON CONFLICT (student_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table
CREATE TRIGGER maintain_coordinator_access
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION add_coordinator_student_access();