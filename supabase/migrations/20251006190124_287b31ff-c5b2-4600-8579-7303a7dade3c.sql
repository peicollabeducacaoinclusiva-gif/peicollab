-- Drop existing problematic policies
DROP POLICY IF EXISTS "Family can view student with valid token" ON students;
DROP POLICY IF EXISTS "Users can view students in their tenant" ON students;
DROP POLICY IF EXISTS "Superadmins can view all students" ON students;

-- Create security definer function to check if user can view student
CREATE OR REPLACE FUNCTION can_view_student(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- User can view if they are superadmin
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = _user_id
    AND role = 'superadmin'
  )
  OR
  -- Or if they are in the same tenant
  EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.tenant_id = s.tenant_id
    WHERE s.id = _student_id
    AND p.id = _user_id
  )
  OR
  -- Or if they have access via student_access table
  EXISTS (
    SELECT 1 FROM student_access
    WHERE student_id = _student_id
    AND user_id = _user_id
  );
$$;

-- Create new simplified SELECT policy
CREATE POLICY "Users can view accessible students"
ON students
FOR SELECT
USING (can_view_student(auth.uid(), id));