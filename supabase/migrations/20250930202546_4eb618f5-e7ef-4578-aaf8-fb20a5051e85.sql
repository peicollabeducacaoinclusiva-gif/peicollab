-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('superadmin', 'coordinator', 'teacher', 'family');

-- Create enum for PEI status
CREATE TYPE pei_status AS ENUM ('draft', 'pending', 'returned', 'approved');

-- Create tenants (schools) table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_family table (many-to-many relationship)
CREATE TABLE student_family (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  family_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, family_user_id)
);

-- Create PEIs table
CREATE TABLE peis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  assigned_teacher_id UUID REFERENCES profiles(id),
  status pei_status DEFAULT 'draft' NOT NULL,
  diagnosis_data JSONB,
  planning_data JSONB,
  evaluation_data JSONB,
  is_synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timeline/comments table
CREATE TABLE pei_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pei_id UUID REFERENCES peis(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE peis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pei_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants
CREATE POLICY "Superadmins can view all tenants"
  ON tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Superadmins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
    )
  );

CREATE POLICY "Coordinators can view profiles in their tenant"
  ON profiles FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coordinator', 'teacher')
    )
  );

-- RLS Policies for students
CREATE POLICY "Users can view students in their tenant"
  ON students FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Family can view their own students"
  ON students FOR SELECT
  USING (
    id IN (
      SELECT student_id FROM student_family
      WHERE family_user_id = auth.uid()
    )
  );

CREATE POLICY "Coordinators can insert students"
  ON students FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid()
      AND role = 'coordinator'
    )
  );

-- RLS Policies for student_family
CREATE POLICY "Users can view their student relationships"
  ON student_family FOR SELECT
  USING (
    family_user_id = auth.uid()
    OR
    student_id IN (
      SELECT id FROM students
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles
        WHERE id = auth.uid()
        AND role IN ('coordinator', 'superadmin')
      )
    )
  );

-- RLS Policies for peis
CREATE POLICY "Teachers can view assigned PEIs"
  ON peis FOR SELECT
  USING (
    assigned_teacher_id = auth.uid()
    OR
    created_by = auth.uid()
  );

CREATE POLICY "Coordinators can view PEIs in their tenant"
  ON peis FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coordinator', 'superadmin')
    )
  );

CREATE POLICY "Family can view their student's PEIs"
  ON peis FOR SELECT
  USING (
    student_id IN (
      SELECT student_id FROM student_family
      WHERE family_user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert PEIs"
  ON peis FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update their PEIs"
  ON peis FOR UPDATE
  USING (
    assigned_teacher_id = auth.uid()
    OR
    created_by = auth.uid()
  );

CREATE POLICY "Coordinators can update PEIs in their tenant"
  ON peis FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid()
      AND role = 'coordinator'
    )
  );

-- RLS Policies for pei_comments
CREATE POLICY "Users can view comments on accessible PEIs"
  ON pei_comments FOR SELECT
  USING (
    pei_id IN (
      SELECT id FROM peis
      WHERE assigned_teacher_id = auth.uid()
      OR created_by = auth.uid()
      OR tenant_id IN (
        SELECT tenant_id FROM profiles
        WHERE id = auth.uid()
      )
      OR student_id IN (
        SELECT student_id FROM student_family
        WHERE family_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert comments on accessible PEIs"
  ON pei_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND
    pei_id IN (
      SELECT id FROM peis
      WHERE assigned_teacher_id = auth.uid()
      OR created_by = auth.uid()
      OR tenant_id IN (
        SELECT tenant_id FROM profiles
        WHERE id = auth.uid()
      )
      OR student_id IN (
        SELECT student_id FROM student_family
        WHERE family_user_id = auth.uid()
      )
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'teacher'),
    (NEW.raw_user_meta_data->>'tenant_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX idx_students_tenant_id ON students(tenant_id);
CREATE INDEX idx_peis_student_id ON peis(student_id);
CREATE INDEX idx_peis_tenant_id ON peis(tenant_id);
CREATE INDEX idx_peis_assigned_teacher ON peis(assigned_teacher_id);
CREATE INDEX idx_pei_comments_pei_id ON pei_comments(pei_id);