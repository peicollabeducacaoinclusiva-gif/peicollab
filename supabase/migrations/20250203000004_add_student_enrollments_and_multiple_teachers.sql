-- Migration: Student Enrollments and Multiple Teachers Support
-- Created: 2025-02-03 (Refatorado)
-- Description: 
--   1. Cria tabela de matrículas (enrollments) para registrar série/turma/ano letivo
--   2. Permite múltiplos professores colaborarem em um PEI
--   3. Mantém histórico escolar completo do aluno

-- ============================================================================
-- PARTE 1: MATRÍCULAS (ENROLLMENTS) - SÉRIE, TURMA, ANO LETIVO
-- ============================================================================

-- 1.1. Criar tabela de matrículas
CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Informações acadêmicas
  academic_year INTEGER NOT NULL,                   -- Ano letivo (ex: 2024, 2025)
  grade VARCHAR(50) NOT NULL,                       -- Série (ex: "6º Ano", "7º Ano")
  class_name VARCHAR(10) NOT NULL,                  -- Turma (ex: "A", "B", "6A")
  shift VARCHAR(20) NOT NULL,                       -- Turno (Manhã, Tarde, Noite, Integral)
  
  -- Informações de matrícula
  enrollment_number VARCHAR(50),                    -- Número de matrícula
  enrollment_date DATE DEFAULT CURRENT_DATE,        -- Data da matrícula
  
  -- Status da matrícula
  status VARCHAR(20) DEFAULT 'active',              -- active, transferred, completed, dropped
  start_date DATE DEFAULT CURRENT_DATE,             -- Início da matrícula
  end_date DATE,                                    -- Fim da matrícula (se aplicável)
  
  -- Metadados
  notes TEXT,                                       -- Observações
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- 1.2. Índice único parcial para garantir apenas 1 matrícula ativa por aluno/ano
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_enrollment_idx
  ON student_enrollments(student_id, school_id, academic_year)
  WHERE status = 'active';

-- 1.3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_school ON student_enrollments(school_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_academic_year ON student_enrollments(academic_year);
CREATE INDEX IF NOT EXISTS idx_enrollments_grade ON student_enrollments(grade);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON student_enrollments(class_name);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON student_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_school_year_grade ON student_enrollments(school_id, academic_year, grade, class_name);

-- 1.4. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollments_updated_at_trigger ON student_enrollments;
CREATE TRIGGER enrollments_updated_at_trigger
  BEFORE UPDATE ON student_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollments_updated_at();

-- 1.5. Função para obter matrícula ativa de um aluno
CREATE OR REPLACE FUNCTION get_active_enrollment(p_student_id UUID, p_academic_year INTEGER DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  grade VARCHAR(50),
  class_name VARCHAR(10),
  shift VARCHAR(20),
  enrollment_number VARCHAR(50),
  school_id UUID,
  school_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.grade,
    e.class_name,
    e.shift,
    e.enrollment_number,
    e.school_id,
    s.school_name
  FROM student_enrollments e
  LEFT JOIN schools s ON s.id = e.school_id
  WHERE e.student_id = p_student_id
  AND e.status = 'active'
  AND (p_academic_year IS NULL OR e.academic_year = p_academic_year)
  ORDER BY e.academic_year DESC, e.start_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.6. Função para criar nova matrícula
CREATE OR REPLACE FUNCTION create_student_enrollment(
  p_student_id UUID,
  p_school_id UUID,
  p_academic_year INTEGER,
  p_grade VARCHAR(50),
  p_class_name VARCHAR(10),
  p_shift VARCHAR(20),
  p_enrollment_number VARCHAR(50) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_new_enrollment_id UUID;
BEGIN
  -- Desativar matrículas anteriores do mesmo ano letivo
  UPDATE student_enrollments
  SET 
    status = 'completed',
    end_date = CURRENT_DATE
  WHERE student_id = p_student_id
  AND academic_year = p_academic_year
  AND status = 'active';
  
  -- Criar nova matrícula
  INSERT INTO student_enrollments (
    student_id,
    school_id,
    academic_year,
    grade,
    class_name,
    shift,
    enrollment_number,
    status,
    start_date
  ) VALUES (
    p_student_id,
    p_school_id,
    p_academic_year,
    p_grade,
    p_class_name,
    p_shift,
    p_enrollment_number,
    'active',
    CURRENT_DATE
  )
  RETURNING id INTO v_new_enrollment_id;
  
  RETURN v_new_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.7. Comentários
COMMENT ON TABLE student_enrollments IS 
  'Histórico de matrículas dos alunos. Registra série, turma e ano letivo, permitindo rastrear mudanças ao longo do tempo.';

COMMENT ON COLUMN student_enrollments.academic_year IS 
  'Ano letivo da matrícula (ex: 2024, 2025)';

COMMENT ON COLUMN student_enrollments.status IS 
  'Status da matrícula: active (ativa), transferred (transferido), completed (concluída), dropped (cancelada)';

COMMENT ON FUNCTION get_active_enrollment(UUID, INTEGER) IS 
  'Retorna a matrícula ativa de um aluno para um ano letivo específico ou o mais recente';

COMMENT ON FUNCTION create_student_enrollment(UUID, UUID, INTEGER, VARCHAR, VARCHAR, VARCHAR, VARCHAR) IS 
  'Cria nova matrícula, desativando automaticamente matrículas anteriores do mesmo ano';

-- ============================================================================
-- PARTE 2: MÚLTIPLOS PROFESSORES POR PEI
-- ============================================================================

-- 2.1. Remover tabela antiga se existir (para evitar conflitos)
DROP TABLE IF EXISTS pei_teachers CASCADE;

-- 2.2. Criar tabela de professores do PEI (many-to-many)
CREATE TABLE pei_teachers (
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

-- 2.3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_pei_teachers_pei ON pei_teachers(pei_id);
CREATE INDEX IF NOT EXISTS idx_pei_teachers_teacher ON pei_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_pei_teachers_primary ON pei_teachers(pei_id, is_primary);

-- 2.4. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_pei_teachers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pei_teachers_updated_at_trigger ON pei_teachers;
CREATE TRIGGER pei_teachers_updated_at_trigger
  BEFORE UPDATE ON pei_teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_pei_teachers_updated_at();

-- 2.5. Garantir apenas 1 professor principal por PEI
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

DROP TRIGGER IF EXISTS ensure_single_primary_teacher_trigger ON pei_teachers;
CREATE TRIGGER ensure_single_primary_teacher_trigger
  BEFORE INSERT OR UPDATE ON pei_teachers
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_teacher();

-- 2.6. Sincronizar pei_teachers com assigned_teacher_id (retrocompatibilidade)
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

DROP TRIGGER IF EXISTS sync_pei_primary_teacher_trigger ON peis;
CREATE TRIGGER sync_pei_primary_teacher_trigger
  AFTER INSERT OR UPDATE OF assigned_teacher_id ON peis
  FOR EACH ROW
  WHEN (NEW.assigned_teacher_id IS NOT NULL)
  EXECUTE FUNCTION sync_pei_primary_teacher();

-- 2.7. Backfill: Migrar professores existentes para pei_teachers
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

-- 2.8. Atualizar student_access para incluir professores complementares
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

DROP TRIGGER IF EXISTS sync_student_access_from_pei_teachers_trigger ON pei_teachers;
CREATE TRIGGER sync_student_access_from_pei_teachers_trigger
  AFTER INSERT ON pei_teachers
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_access_from_pei_teachers();

-- ============================================================================
-- PARTE 3: VIEWS E FUNÇÕES AUXILIARES
-- ============================================================================

-- 3.1. View para PEIs com informações completas (incluindo matrícula)
CREATE OR REPLACE VIEW peis_with_full_info AS
SELECT 
  p.*,
  s.name as student_name,
  s.date_of_birth,
  sch.school_name,
  t.network_name,
  -- Informações da matrícula ativa
  e.grade,
  e.class_name,
  e.shift,
  e.enrollment_number,
  e.academic_year,
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
-- Join com matrícula ativa mais recente
LEFT JOIN LATERAL (
  SELECT * FROM student_enrollments
  WHERE student_id = s.id
  AND status = 'active'
  ORDER BY academic_year DESC, start_date DESC
  LIMIT 1
) e ON true
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

-- 4.1. Habilitar RLS
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pei_teachers ENABLE ROW LEVEL SECURITY;

-- 4.2. Políticas para student_enrollments
-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to enrollments" ON student_enrollments;
CREATE POLICY "Superadmin full access to enrollments"
  ON student_enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Educadores veem matrículas da sua escola
DROP POLICY IF EXISTS "School staff can view enrollments in their school" ON student_enrollments;
CREATE POLICY "School staff can view enrollments in their school"
  ON student_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles prof
      INNER JOIN user_roles ur ON ur.user_id = prof.id
      WHERE prof.id = auth.uid()
      AND prof.school_id = student_enrollments.school_id
      AND ur.role IN ('coordinator', 'school_director', 'teacher')
    )
  );

-- Coordenadores podem gerenciar matrículas da sua escola
DROP POLICY IF EXISTS "Coordinator can manage enrollments in their school" ON student_enrollments;
CREATE POLICY "Coordinator can manage enrollments in their school"
  ON student_enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles prof
      INNER JOIN user_roles ur ON ur.user_id = prof.id
      WHERE prof.id = auth.uid()
      AND prof.school_id = student_enrollments.school_id
      AND ur.role IN ('coordinator', 'school_director')
    )
  );

-- 4.3. Políticas para pei_teachers
-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to pei_teachers" ON pei_teachers;
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
DROP POLICY IF EXISTS "Coordinator can view pei_teachers in their school" ON pei_teachers;
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
DROP POLICY IF EXISTS "Coordinator can manage pei_teachers in their school" ON pei_teachers;
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
DROP POLICY IF EXISTS "Teachers can view their own pei assignments" ON pei_teachers;
CREATE POLICY "Teachers can view their own pei assignments"
  ON pei_teachers FOR SELECT
  USING (teacher_id = auth.uid());

-- ============================================================================
-- PARTE 5: DADOS DE EXEMPLO (OPCIONAL)
-- ============================================================================

-- Migrar dados existentes (se houver campos antigos)
-- ATENÇÃO: Comentar em produção se já tiver dados reais
/*
DO $$
DECLARE
  v_current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  v_student RECORD;
  v_enrollment_id UUID;
BEGIN
  -- Se students tiver os campos antigos, migrar para enrollments
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'students' AND column_name = 'grade') THEN
    
    FOR v_student IN 
      SELECT id, school_id, grade, class_name, shift
      FROM students
      WHERE grade IS NOT NULL
    LOOP
      -- Criar matrícula para o ano atual
      SELECT create_student_enrollment(
        v_student.id,
        v_student.school_id,
        v_current_year,
        v_student.grade,
        COALESCE(v_student.class_name, 'A'),
        COALESCE(v_student.shift, 'Manhã')
      ) INTO v_enrollment_id;
    END LOOP;
    
    RAISE NOTICE 'Matrículas migradas com sucesso!';
  END IF;
END $$;
*/

-- ============================================================================
-- LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração concluída com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela student_enrollments (matrículas)';
  RAISE NOTICE '  2. ✅ Criada tabela pei_teachers (múltiplos professores)';
  RAISE NOTICE '  3. ✅ Professores existentes migrados para pei_teachers';
  RAISE NOTICE '  4. ✅ Triggers de sincronização configurados';
  RAISE NOTICE '  5. ✅ RLS policies aplicadas';
  RAISE NOTICE '  6. ✅ Funções auxiliares criadas';
  RAISE NOTICE '  7. ✅ View peis_with_full_info criada';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Criar interface para gerenciar matrículas';
  RAISE NOTICE '  - Adicionar professores complementares aos PEIs';
  RAISE NOTICE '  - Atualizar relatórios para usar dados de matrícula';
END $$;

