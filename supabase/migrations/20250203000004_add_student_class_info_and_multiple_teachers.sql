-- Migration: Add Student Class Info and Multiple Teachers Support
-- Created: 2025-02-03
-- Description: 
--   1. Adiciona série, turma e turno aos alunos
--   2. Permite múltiplos professores colaborarem em um PEI
--   3. Define professor principal e professores complementares por disciplina

-- ============================================================================
-- PARTE 1: SÉRIE, TURMA E TURNO
-- ============================================================================

-- 1.1. Adicionar campos de turma aos alunos
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS grade VARCHAR(50),           -- Série (ex: "6º Ano", "7º Ano")
  ADD COLUMN IF NOT EXISTS class_name VARCHAR(10),      -- Turma (ex: "A", "B", "6A")
  ADD COLUMN IF NOT EXISTS shift VARCHAR(20),           -- Turno (manhã, tarde, noite, integral)
  ADD COLUMN IF NOT EXISTS enrollment_number VARCHAR(50); -- Matrícula

-- 1.2. Criar enum para turnos (opcional, mas melhora integridade)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_type') THEN
    CREATE TYPE shift_type AS ENUM ('Manhã', 'Tarde', 'Noite', 'Integral');
  END IF;
END $$;

-- 1.3. Índices para melhorar buscas
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_students_shift ON students(shift);
CREATE INDEX IF NOT EXISTS idx_students_school_class ON students(school_id, grade, class_name);

-- 1.4. Comentários
COMMENT ON COLUMN students.grade IS 'Série/ano escolar do aluno (ex: 6º Ano, 1º Ano)';
COMMENT ON COLUMN students.class_name IS 'Turma do aluno (ex: A, B, 6A)';
COMMENT ON COLUMN students.shift IS 'Turno escolar (Manhã, Tarde, Noite, Integral)';
COMMENT ON COLUMN students.enrollment_number IS 'Número de matrícula do aluno';

-- ============================================================================
-- PARTE 2: MÚLTIPLOS PROFESSORES POR PEI
-- ============================================================================

-- 2.1. Criar tabela de professores do PEI (many-to-many)
CREATE TABLE IF NOT EXISTS pei_teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pei_id UUID NOT NULL REFERENCES peis(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,                    -- Professor principal (responsável)
  subject VARCHAR(100),                                 -- Disciplina do professor
  can_edit_diagnosis BOOLEAN DEFAULT false,             -- Pode editar diagnóstico
  can_edit_planning BOOLEAN DEFAULT true,               -- Pode editar planejamento
  can_edit_evaluation BOOLEAN DEFAULT true,             -- Pode editar avaliação
  notes TEXT,                                           -- Observações específicas do professor
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  -- Garantir que não haja duplicatas
  CONSTRAINT unique_pei_teacher UNIQUE (pei_id, teacher_id)
);

-- 2.2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_pei_teachers_pei ON pei_teachers(pei_id);
CREATE INDEX IF NOT EXISTS idx_pei_teachers_teacher ON pei_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_pei_teachers_primary ON pei_teachers(pei_id, is_primary);

-- 2.3. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_pei_teachers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pei_teachers_updated_at_trigger
  BEFORE UPDATE ON pei_teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_pei_teachers_updated_at();

-- 2.4. Garantir apenas 1 professor principal por PEI
CREATE OR REPLACE FUNCTION ensure_single_primary_teacher()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Desmarcar outros professores como primários deste PEI
    UPDATE pei_teachers 
    SET is_primary = false
    WHERE pei_id = NEW.pei_id 
      AND id != NEW.id 
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_teacher_trigger
  BEFORE INSERT OR UPDATE ON pei_teachers
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_teacher();

-- 2.5. Sincronizar pei_teachers com assigned_teacher_id (retrocompatibilidade)
CREATE OR REPLACE FUNCTION sync_pei_primary_teacher()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando assigned_teacher_id é definido no PEI, criar entrada em pei_teachers
  IF NEW.assigned_teacher_id IS NOT NULL THEN
    INSERT INTO pei_teachers (pei_id, teacher_id, is_primary, can_edit_diagnosis, can_edit_planning, can_edit_evaluation)
    VALUES (NEW.id, NEW.assigned_teacher_id, true, true, true, true)
    ON CONFLICT (pei_id, teacher_id) 
    DO UPDATE SET is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_pei_primary_teacher_trigger
  AFTER INSERT OR UPDATE OF assigned_teacher_id ON peis
  FOR EACH ROW
  WHEN (NEW.assigned_teacher_id IS NOT NULL)
  EXECUTE FUNCTION sync_pei_primary_teacher();

-- 2.6. Backfill: Migrar professores existentes para pei_teachers
INSERT INTO pei_teachers (pei_id, teacher_id, is_primary, can_edit_diagnosis, can_edit_planning, can_edit_evaluation)
SELECT 
  id as pei_id,
  assigned_teacher_id as teacher_id,
  true as is_primary,
  true as can_edit_diagnosis,
  true as can_edit_planning,
  true as can_edit_evaluation
FROM peis
WHERE assigned_teacher_id IS NOT NULL
ON CONFLICT (pei_id, teacher_id) DO NOTHING;

-- 2.7. Atualizar student_access para incluir professores complementares
CREATE OR REPLACE FUNCTION sync_student_access_from_pei_teachers()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um professor é adicionado ao PEI, dar acesso ao aluno
  IF TG_OP = 'INSERT' THEN
    INSERT INTO student_access (user_id, student_id)
    SELECT NEW.teacher_id, p.student_id
    FROM peis p
    WHERE p.id = NEW.pei_id
    ON CONFLICT (user_id, student_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_student_access_from_pei_teachers_trigger
  AFTER INSERT ON pei_teachers
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_access_from_pei_teachers();

-- ============================================================================
-- PARTE 3: VIEWS E FUNÇÕES AUXILIARES
-- ============================================================================

-- 3.1. View para PEIs com informações completas de professores
CREATE OR REPLACE VIEW peis_with_teachers AS
SELECT 
  p.*,
  s.name as student_name,
  s.date_of_birth,
  s.grade,
  s.class_name,
  s.shift,
  s.enrollment_number,
  sch.school_name,
  t.network_name,
  -- Professor principal
  pp.full_name as primary_teacher_name,
  pt_primary.subject as primary_teacher_subject,
  -- Contagem de professores
  (SELECT COUNT(*) FROM pei_teachers WHERE pei_id = p.id) as total_teachers,
  (SELECT COUNT(*) FROM pei_teachers WHERE pei_id = p.id AND is_primary = false) as complementary_teachers_count
FROM peis p
INNER JOIN students s ON s.id = p.student_id
LEFT JOIN schools sch ON sch.id = p.school_id
LEFT JOIN tenants t ON t.id = p.tenant_id
LEFT JOIN pei_teachers pt_primary ON pt_primary.pei_id = p.id AND pt_primary.is_primary = true
LEFT JOIN profiles pp ON pp.id = pt_primary.teacher_id;

-- 3.2. Função para obter todos os professores de um PEI
CREATE OR REPLACE FUNCTION get_pei_teachers(p_pei_id UUID)
RETURNS TABLE (
  teacher_id UUID,
  teacher_name TEXT,
  is_primary BOOLEAN,
  subject VARCHAR(100),
  can_edit_diagnosis BOOLEAN,
  can_edit_planning BOOLEAN,
  can_edit_evaluation BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.teacher_id,
    prof.full_name as teacher_name,
    pt.is_primary,
    pt.subject,
    pt.can_edit_diagnosis,
    pt.can_edit_planning,
    pt.can_edit_evaluation
  FROM pei_teachers pt
  INNER JOIN profiles prof ON prof.id = pt.teacher_id
  WHERE pt.pei_id = p_pei_id
  ORDER BY pt.is_primary DESC, prof.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3.3. Função para adicionar professor complementar ao PEI
CREATE OR REPLACE FUNCTION add_teacher_to_pei(
  p_pei_id UUID,
  p_teacher_id UUID,
  p_subject VARCHAR(100),
  p_is_primary BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_new_pei_teacher_id UUID;
  v_student_id UUID;
BEGIN
  -- Obter student_id do PEI
  SELECT student_id INTO v_student_id FROM peis WHERE id = p_pei_id;
  
  -- Inserir professor no PEI
  INSERT INTO pei_teachers (
    pei_id, 
    teacher_id, 
    is_primary, 
    subject,
    can_edit_diagnosis,
    can_edit_planning,
    can_edit_evaluation
  ) VALUES (
    p_pei_id,
    p_teacher_id,
    p_is_primary,
    p_subject,
    p_is_primary, -- Professor principal pode editar diagnóstico
    true,         -- Todos podem editar planejamento
    true          -- Todos podem editar avaliação
  )
  RETURNING id INTO v_new_pei_teacher_id;
  
  -- Criar student_access
  INSERT INTO student_access (user_id, student_id)
  VALUES (p_teacher_id, v_student_id)
  ON CONFLICT (user_id, student_id) DO NOTHING;
  
  RETURN v_new_pei_teacher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4. Função para remover professor do PEI
CREATE OR REPLACE FUNCTION remove_teacher_from_pei(
  p_pei_teacher_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_primary BOOLEAN;
BEGIN
  -- Verificar se é professor principal
  SELECT is_primary INTO v_is_primary FROM pei_teachers WHERE id = p_pei_teacher_id;
  
  IF v_is_primary THEN
    RAISE EXCEPTION 'Não é possível remover o professor principal. Atribua outro professor como principal primeiro.';
  END IF;
  
  DELETE FROM pei_teachers WHERE id = p_pei_teacher_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 4: RLS (Row Level Security)
-- ============================================================================

-- 4.1. Habilitar RLS na tabela pei_teachers
ALTER TABLE pei_teachers ENABLE ROW LEVEL SECURITY;

-- 4.2. Políticas de acesso
-- Superadmin vê tudo
CREATE POLICY "Superadmin full access to pei_teachers"
  ON pei_teachers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Coordenadores veem professores dos PEIs da sua escola
CREATE POLICY "Coordinator can view pei_teachers in their school"
  ON pei_teachers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM peis p
      INNER JOIN user_roles ur ON ur.user_id = auth.uid()
      INNER JOIN profiles prof ON prof.id = auth.uid()
      WHERE p.id = pei_teachers.pei_id
      AND ur.role = 'coordinator'
      AND p.school_id = prof.school_id
    )
  );

-- Coordenadores podem adicionar/remover professores dos PEIs da sua escola
CREATE POLICY "Coordinator can manage pei_teachers in their school"
  ON pei_teachers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM peis p
      INNER JOIN user_roles ur ON ur.user_id = auth.uid()
      INNER JOIN profiles prof ON prof.id = auth.uid()
      WHERE p.id = pei_teachers.pei_id
      AND ur.role = 'coordinator'
      AND p.school_id = prof.school_id
    )
  );

-- Professores veem suas próprias atribuições
CREATE POLICY "Teachers can view their own pei assignments"
  ON pei_teachers FOR SELECT
  USING (teacher_id = auth.uid());

-- ============================================================================
-- PARTE 5: COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE pei_teachers IS 
  'Relacionamento many-to-many entre PEIs e professores. Permite múltiplos professores colaborarem em um PEI, com um professor principal responsável.';

COMMENT ON COLUMN pei_teachers.is_primary IS 
  'Indica se este é o professor principal/responsável pelo PEI. Apenas 1 por PEI.';

COMMENT ON COLUMN pei_teachers.subject IS 
  'Disciplina/área de atuação do professor (ex: Matemática, Português, Ciências)';

COMMENT ON COLUMN pei_teachers.can_edit_diagnosis IS 
  'Permissão para editar seção de diagnóstico (geralmente apenas professor principal)';

COMMENT ON COLUMN pei_teachers.can_edit_planning IS 
  'Permissão para editar planejamento e metas (todos os professores)';

COMMENT ON COLUMN pei_teachers.can_edit_evaluation IS 
  'Permissão para editar avaliações e encaminhamentos';

COMMENT ON FUNCTION add_teacher_to_pei(UUID, UUID, VARCHAR, BOOLEAN) IS 
  'Adiciona um professor ao PEI, criando automaticamente student_access';

COMMENT ON FUNCTION remove_teacher_from_pei(UUID) IS 
  'Remove um professor do PEI (exceto se for o professor principal)';

-- ============================================================================
-- PARTE 6: DADOS DE EXEMPLO (OPCIONAL - COMENTAR EM PRODUÇÃO)
-- ============================================================================

-- Atualizar alguns alunos com informações de turma (exemplo)
-- UNCOMMENT para testar:
/*
UPDATE students 
SET 
  grade = '6º Ano',
  class_name = 'A',
  shift = 'Manhã',
  enrollment_number = '2024' || LPAD(CAST(random() * 9999 AS TEXT), 4, '0')
WHERE id IN (SELECT id FROM students LIMIT 5);
*/

-- ============================================================================
-- LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração concluída com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Adicionados campos: grade, class_name, shift, enrollment_number em students';
  RAISE NOTICE '  2. ✅ Criada tabela pei_teachers para múltiplos professores por PEI';
  RAISE NOTICE '  3. ✅ Professores existentes migrados para pei_teachers como principais';
  RAISE NOTICE '  4. ✅ Triggers de sincronização configurados';
  RAISE NOTICE '  5. ✅ RLS policies aplicadas';
  RAISE NOTICE '  6. ✅ Funções auxiliares criadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Atualizar frontend para mostrar série/turma/turno';
  RAISE NOTICE '  - Criar interface para adicionar professores complementares';
  RAISE NOTICE '  - Atualizar formulário de edição de alunos';
END $$;

