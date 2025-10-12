-- Fix students table RLS policy to prevent unauthorized access to student PII

-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "students_select_policy" ON students;

-- Create a more restrictive policy that:
-- 1. Superadmins can see all students
-- 2. Coordinators and school managers can see all students in their tenant (they manage the school)
-- 3. Teachers and AEE teachers can ONLY see students they have explicit access to
CREATE POLICY "students_select_policy"
ON students
FOR SELECT
USING (
  -- Superadmins can see everything
  has_role(auth.uid(), 'superadmin'::app_role)
  OR
  -- Coordinators and school managers can see all students in their tenant
  (
    (has_role(auth.uid(), 'coordinator'::app_role) OR has_role(auth.uid(), 'school_manager'::app_role))
    AND EXISTS (
      SELECT 1 FROM user_tenants ut
      WHERE ut.user_id = auth.uid() AND ut.tenant_id = students.tenant_id
    )
  )
  OR
  -- Teachers and AEE teachers can only see students they have explicit access to via:
  -- a) student_access table (direct assignment)
  -- b) PEIs they are teaching (assigned via pei_teachers)
  (
    (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'aee_teacher'::app_role))
    AND (
      -- Direct access via student_access table
      EXISTS (
        SELECT 1 FROM student_access sa
        WHERE sa.student_id = students.id AND sa.user_id = auth.uid()
      )
      OR
      -- Access via assigned PEIs
      EXISTS (
        SELECT 1 FROM peis p
        INNER JOIN pei_teachers pt ON pt.pei_id = p.id
        WHERE p.student_id = students.id AND pt.teacher_id = auth.uid()
      )
      OR
      -- Access via created PEIs
      EXISTS (
        SELECT 1 FROM peis p
        WHERE p.student_id = students.id AND p.created_by = auth.uid()
      )
    )
  )
);