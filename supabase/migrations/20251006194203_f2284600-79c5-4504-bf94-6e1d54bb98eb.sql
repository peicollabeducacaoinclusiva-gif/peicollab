-- Políticas RLS para Gestor Escolar (herda privilégios do superadmin para visualização)
-- Tenants - Gestor pode visualizar seu próprio tenant
CREATE POLICY "School managers can view their tenant" ON tenants
FOR SELECT USING (
  id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = 'school_manager'
  )
);

-- Students - Gestor pode visualizar e gerenciar alunos do seu tenant
CREATE POLICY "School managers can view students" ON students
FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = 'school_manager'
  )
);

CREATE POLICY "School managers can insert students" ON students
FOR INSERT WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = 'school_manager'
  )
);

CREATE POLICY "School managers can update students" ON students
FOR UPDATE USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = 'school_manager'
  )
);

CREATE POLICY "School managers can delete students" ON students
FOR DELETE USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = 'school_manager'
  )
);

-- PEIs - Gestor pode visualizar e gerenciar PEIs do seu tenant
CREATE POLICY "School managers can view PEIs" ON peis
FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = 'school_manager'
  )
);

CREATE POLICY "School managers can update PEIs" ON peis
FOR UPDATE USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = 'school_manager'
  )
);

CREATE POLICY "School managers can delete PEIs" ON peis
FOR DELETE USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = 'school_manager'
  )
);

-- Profiles - Gestor pode visualizar perfis do seu tenant (mas não editar)
CREATE POLICY "School managers can view profiles in their tenant" ON profiles
FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = 'school_manager'
  )
);

-- Políticas RLS para Professor de AEE
-- PEIs - Professor de AEE pode visualizar PEIs do seu tenant
CREATE POLICY "AEE teachers can view PEIs in their tenant" ON peis
FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = 'aee_teacher'
  )
);

-- Comentários - Professor de AEE pode comentar em PEIs
CREATE POLICY "AEE teachers can insert comments" ON pei_comments
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN students s ON s.tenant_id = p.tenant_id
    WHERE p.id = auth.uid() 
    AND p.role = 'aee_teacher'
    AND s.id = pei_comments.student_id
  )
);

-- Students - Professor de AEE pode visualizar alunos do seu tenant
CREATE POLICY "AEE teachers can view students in their tenant" ON students
FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = 'aee_teacher'
  )
);