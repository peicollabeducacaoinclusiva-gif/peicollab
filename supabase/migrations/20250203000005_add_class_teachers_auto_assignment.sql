-- Migration: Class Teachers and Auto Assignment to PEIs
-- Created: 2025-02-03
-- Description: 
--   1. Cria tabela de professores por turma
--   2. Atribui automaticamente professores ao PEI baseado na turma do aluno
--   3. Define professor principal por turma (geralmente Português)

-- ============================================================================
-- PARTE 1: PROFESSORES POR TURMA
-- ============================================================================

-- 1.1. Criar tabela de professores de turma
CREATE TABLE IF NOT EXISTS class_teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year INTEGER NOT NULL,                   -- Ano letivo
  grade VARCHAR(50) NOT NULL,                       -- Série (6º Ano, 7º Ano)
  class_name VARCHAR(10) NOT NULL,                  -- Turma (A, B, C)
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,                    -- Disciplina
  is_primary_subject BOOLEAN DEFAULT false,         -- Disciplina principal (ex: Português)
  workload_hours INTEGER DEFAULT 4,                 -- Carga horária semanal
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  -- Evitar duplicatas (mesmo professor, mesma disciplina, mesma turma)
  CONSTRAINT unique_class_teacher_subject 
    UNIQUE (school_id, academic_year, grade, class_name, teacher_id, subject)
);

-- 1.2. Índices
CREATE INDEX IF NOT EXISTS idx_class_teachers_school ON class_teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_year ON class_teachers(academic_year);
CREATE INDEX IF NOT EXISTS idx_class_teachers_grade ON class_teachers(grade, class_name);
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher ON class_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_primary ON class_teachers(school_id, academic_year, grade, class_name, is_primary_subject);

-- 1.3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_class_teachers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS class_teachers_updated_at_trigger ON class_teachers;
CREATE TRIGGER class_teachers_updated_at_trigger
  BEFORE UPDATE ON class_teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_class_teachers_updated_at();

-- 1.4. Garantir apenas 1 disciplina principal por turma
CREATE OR REPLACE FUNCTION ensure_single_primary_subject()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary_subject = true THEN
    UPDATE class_teachers 
    SET is_primary_subject = false
    WHERE school_id = NEW.school_id
      AND academic_year = NEW.academic_year
      AND grade = NEW.grade
      AND class_name = NEW.class_name
      AND id != NEW.id
      AND is_primary_subject = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_primary_subject_trigger ON class_teachers;
CREATE TRIGGER ensure_single_primary_subject_trigger
  BEFORE INSERT OR UPDATE ON class_teachers
  FOR EACH ROW
  WHEN (NEW.is_primary_subject = true)
  EXECUTE FUNCTION ensure_single_primary_subject();

-- ============================================================================
-- PARTE 2: ATRIBUIÇÃO AUTOMÁTICA DE PROFESSORES AO PEI
-- ============================================================================

-- 2.1. Função para obter professores de uma turma
CREATE OR REPLACE FUNCTION get_class_teachers(
  p_school_id UUID,
  p_academic_year INTEGER,
  p_grade VARCHAR(50),
  p_class_name VARCHAR(10)
)
RETURNS TABLE (
  teacher_id UUID,
  teacher_name TEXT,
  subject VARCHAR(100),
  is_primary_subject BOOLEAN,
  workload_hours INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.teacher_id,
    prof.full_name as teacher_name,
    ct.subject,
    ct.is_primary_subject,
    ct.workload_hours
  FROM class_teachers ct
  INNER JOIN profiles prof ON prof.id = ct.teacher_id
  WHERE ct.school_id = p_school_id
    AND ct.academic_year = p_academic_year
    AND ct.grade = p_grade
    AND ct.class_name = p_class_name
  ORDER BY ct.is_primary_subject DESC, ct.workload_hours DESC, prof.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2.2. Função para atribuir professores da turma ao PEI automaticamente
CREATE OR REPLACE FUNCTION auto_assign_teachers_to_pei()
RETURNS TRIGGER AS $$
DECLARE
  v_enrollment RECORD;
  v_class_teacher RECORD;
  v_current_year INTEGER;
BEGIN
  -- Obter ano letivo atual
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Buscar matrícula ativa do aluno
  SELECT e.* INTO v_enrollment
  FROM student_enrollments e
  WHERE e.student_id = NEW.student_id
    AND e.status = 'active'
    AND e.academic_year = v_current_year
  ORDER BY e.start_date DESC
  LIMIT 1;
  
  -- Se não encontrou matrícula, não faz nada
  IF NOT FOUND THEN
    RAISE NOTICE 'Aluno % não tem matrícula ativa em %', NEW.student_id, v_current_year;
    RETURN NEW;
  END IF;
  
  -- Buscar professores da turma e adicionar ao PEI
  FOR v_class_teacher IN 
    SELECT * FROM get_class_teachers(
      v_enrollment.school_id,
      v_enrollment.academic_year,
      v_enrollment.grade,
      v_enrollment.class_name
    )
  LOOP
    -- Adicionar professor ao PEI
    INSERT INTO pei_teachers (
      pei_id,
      teacher_id,
      is_primary,
      subject,
      can_edit_diagnosis,
      can_edit_planning,
      can_edit_evaluation
    ) VALUES (
      NEW.id,
      v_class_teacher.teacher_id,
      v_class_teacher.is_primary_subject,  -- Professor de disciplina principal é o responsável
      v_class_teacher.subject,
      v_class_teacher.is_primary_subject,  -- Só o principal edita diagnóstico
      true,                                 -- Todos editam planejamento
      true                                  -- Todos editam avaliação
    )
    ON CONFLICT (pei_id, teacher_id) DO NOTHING;
    
    -- Criar student_access
    INSERT INTO student_access (user_id, student_id)
    VALUES (v_class_teacher.teacher_id, NEW.student_id)
    ON CONFLICT (user_id, student_id) DO NOTHING;
    
    RAISE NOTICE 'Professor % (%) adicionado ao PEI', 
      v_class_teacher.teacher_name, 
      v_class_teacher.subject;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.3. Trigger para atribuir professores automaticamente ao criar PEI
DROP TRIGGER IF EXISTS auto_assign_teachers_to_pei_trigger ON peis;
CREATE TRIGGER auto_assign_teachers_to_pei_trigger
  AFTER INSERT ON peis
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_teachers_to_pei();

-- ============================================================================
-- PARTE 3: FUNÇÕES AUXILIARES
-- ============================================================================

-- 3.1. Função para adicionar professor a uma turma
CREATE OR REPLACE FUNCTION add_teacher_to_class(
  p_school_id UUID,
  p_academic_year INTEGER,
  p_grade VARCHAR(50),
  p_class_name VARCHAR(10),
  p_teacher_id UUID,
  p_subject VARCHAR(100),
  p_is_primary BOOLEAN DEFAULT false,
  p_workload_hours INTEGER DEFAULT 4
)
RETURNS UUID AS $$
DECLARE
  v_new_id UUID;
BEGIN
  INSERT INTO class_teachers (
    school_id,
    academic_year,
    grade,
    class_name,
    teacher_id,
    subject,
    is_primary_subject,
    workload_hours
  ) VALUES (
    p_school_id,
    p_academic_year,
    p_grade,
    p_class_name,
    p_teacher_id,
    p_subject,
    p_is_primary,
    p_workload_hours
  )
  ON CONFLICT (school_id, academic_year, grade, class_name, teacher_id, subject)
  DO UPDATE SET
    is_primary_subject = p_is_primary,
    workload_hours = p_workload_hours,
    updated_at = NOW()
  RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2. Função para remover professor de uma turma
CREATE OR REPLACE FUNCTION remove_teacher_from_class(
  p_class_teacher_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM class_teachers WHERE id = p_class_teacher_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3. Função para copiar professores de uma turma para outra
CREATE OR REPLACE FUNCTION copy_teachers_between_classes(
  p_from_school_id UUID,
  p_from_year INTEGER,
  p_from_grade VARCHAR(50),
  p_from_class VARCHAR(10),
  p_to_school_id UUID,
  p_to_year INTEGER,
  p_to_grade VARCHAR(50),
  p_to_class VARCHAR(10)
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO class_teachers (
    school_id,
    academic_year,
    grade,
    class_name,
    teacher_id,
    subject,
    is_primary_subject,
    workload_hours
  )
  SELECT 
    p_to_school_id,
    p_to_year,
    p_to_grade,
    p_to_class,
    teacher_id,
    subject,
    is_primary_subject,
    workload_hours
  FROM class_teachers
  WHERE school_id = p_from_school_id
    AND academic_year = p_from_year
    AND grade = p_from_grade
    AND class_name = p_from_class
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 4: VIEWS
-- ============================================================================

-- 4.1. View de turmas com contagem de professores
CREATE OR REPLACE VIEW classes_with_teacher_count AS
SELECT 
  ct.school_id,
  s.school_name,
  ct.academic_year,
  ct.grade,
  ct.class_name,
  COUNT(*) as total_teachers,
  COUNT(*) FILTER (WHERE ct.is_primary_subject = true) as has_primary_teacher,
  STRING_AGG(DISTINCT prof.full_name, ', ' ORDER BY prof.full_name) as teacher_names,
  STRING_AGG(DISTINCT ct.subject, ', ' ORDER BY ct.subject) as subjects
FROM class_teachers ct
INNER JOIN schools s ON s.id = ct.school_id
LEFT JOIN profiles prof ON prof.id = ct.teacher_id
GROUP BY ct.school_id, s.school_name, ct.academic_year, ct.grade, ct.class_name
ORDER BY ct.academic_year DESC, ct.grade, ct.class_name;

-- ============================================================================
-- PARTE 5: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to class_teachers" ON class_teachers;
CREATE POLICY "Superadmin full access to class_teachers"
  ON class_teachers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Coordenadores e diretores veem turmas da sua escola
DROP POLICY IF EXISTS "School staff can view class_teachers in their school" ON class_teachers;
CREATE POLICY "School staff can view class_teachers in their school"
  ON class_teachers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles prof
      INNER JOIN user_roles ur ON ur.user_id = prof.id
      WHERE prof.id = auth.uid()
      AND prof.school_id = class_teachers.school_id
      AND ur.role IN ('coordinator', 'school_director')
    )
  );

-- Coordenadores e diretores podem gerenciar professores de turmas da sua escola
DROP POLICY IF EXISTS "School staff can manage class_teachers in their school" ON class_teachers;
CREATE POLICY "School staff can manage class_teachers in their school"
  ON class_teachers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles prof
      INNER JOIN user_roles ur ON ur.user_id = prof.id
      WHERE prof.id = auth.uid()
      AND prof.school_id = class_teachers.school_id
      AND ur.role IN ('coordinator', 'school_director')
    )
  );

-- Professores veem suas próprias atribuições
DROP POLICY IF EXISTS "Teachers can view their own class assignments" ON class_teachers;
CREATE POLICY "Teachers can view their own class assignments"
  ON class_teachers FOR SELECT
  USING (teacher_id = auth.uid());

-- ============================================================================
-- PARTE 6: COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE class_teachers IS 
  'Mapeia professores para turmas e disciplinas. Usado para atribuição automática ao criar PEI.';

COMMENT ON COLUMN class_teachers.is_primary_subject IS 
  'Indica se esta é a disciplina principal da turma (geralmente Português). O professor desta disciplina será o responsável pelo PEI.';

COMMENT ON FUNCTION get_class_teachers(UUID, INTEGER, VARCHAR, VARCHAR) IS 
  'Retorna todos os professores de uma turma específica';

COMMENT ON FUNCTION auto_assign_teachers_to_pei() IS 
  'Trigger que automaticamente adiciona professores da turma ao PEI quando ele é criado';

COMMENT ON FUNCTION add_teacher_to_class(UUID, INTEGER, VARCHAR, VARCHAR, UUID, VARCHAR, BOOLEAN, INTEGER) IS 
  'Adiciona um professor a uma turma com disciplina específica';

COMMENT ON FUNCTION copy_teachers_between_classes(UUID, INTEGER, VARCHAR, VARCHAR, UUID, INTEGER, VARCHAR, VARCHAR) IS 
  'Copia professores de uma turma para outra (útil para criar turmas do novo ano)';

-- ============================================================================
-- LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de professores por turma concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Funcionalidades adicionadas:';
  RAISE NOTICE '  1. ✅ Tabela class_teachers criada';
  RAISE NOTICE '  2. ✅ Atribuição automática de professores ao PEI configurada';
  RAISE NOTICE '  3. ✅ Funções auxiliares criadas';
  RAISE NOTICE '  4. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Cadastrar professores nas turmas';
  RAISE NOTICE '  - Ao criar PEI, professores serão adicionados automaticamente!';
  RAISE NOTICE '';
  RAISE NOTICE '📖 Exemplo de uso:';
  RAISE NOTICE '  SELECT add_teacher_to_class(';
  RAISE NOTICE '    ''school-id'', 2024, ''6º Ano'', ''A'',';
  RAISE NOTICE '    ''teacher-id'', ''Português'', true, 5';
  RAISE NOTICE '  );';
END $$;

