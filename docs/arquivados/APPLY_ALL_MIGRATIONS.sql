-- ============================================================================
-- MIGRAÇÕES COMBINADAS - PEI COLLAB
-- Gerado automaticamente em: 03/11/2025, 00:10:51
-- ============================================================================
--
-- Este arquivo contém 5 migrações:
--   1. Sistema de Versionamento de PEIs
--   2. Matrículas e Múltiplos Professores
--   3. Professores por Turma
--   4. Avatars com Emojis
--   5. Correção de Relacionamento
--
-- INSTRUÇÕES:
--   1. Abra Supabase Dashboard → SQL Editor
--   2. Cole TODO este arquivo
--   3. Clique em RUN
--   4. Aguarde ~30 segundos
--   5. Recarregue a aplicação (F5)
--
-- ============================================================================



-- ============================================================================
-- MIGRAÇÃO 1/5: SISTEMA DE VERSIONAMENTO DE PEIS
-- Arquivo: 20250203000003_enforce_single_active_pei.sql
-- ============================================================================

-- Migration: Enforce Single Active PEI per Student
-- Created: 2025-02-03
-- Description: Garante que apenas 1 PEI ativo existe por aluno e 
--              previne criação de múltiplos PEIs concorrentes

-- 1. Corrigir dados existentes - Marcar apenas o mais recente como ativo
DO $$
DECLARE
  v_student RECORD;
  v_latest_pei UUID;
  v_affected INTEGER := 0;
BEGIN
  -- Para cada aluno
  FOR v_student IN 
    SELECT DISTINCT student_id FROM peis
  LOOP
    -- Encontrar o PEI mais recente do aluno
    SELECT id INTO v_latest_pei
    FROM peis
    WHERE student_id = v_student.student_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Desativar todos os PEIs deste aluno
    UPDATE peis
    SET is_active_version = false
    WHERE student_id = v_student.student_id;
    
    -- Ativar apenas o mais recente
    UPDATE peis
    SET is_active_version = true
    WHERE id = v_latest_pei;
    
    GET DIAGNOSTICS v_affected = ROW_COUNT;
  END LOOP;
  
  RAISE NOTICE 'Correção aplicada: PEIs duplicados limpos para % alunos', 
    (SELECT COUNT(DISTINCT student_id) FROM peis);
END $$;

-- 2. Garantir que o trigger exists e funciona corretamente
DROP TRIGGER IF EXISTS ensure_single_active_pei_trigger ON peis;

CREATE TRIGGER ensure_single_active_pei_trigger
  BEFORE INSERT OR UPDATE ON peis
  FOR EACH ROW
  WHEN (NEW.is_active_version = true)
  EXECUTE FUNCTION ensure_single_active_pei();

-- 3. Criar função para verificar se aluno já tem PEI ativo
CREATE OR REPLACE FUNCTION has_active_pei(p_student_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM peis
    WHERE student_id = p_student_id
    AND is_active_version = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Criar função para obter PEI ativo de um aluno
CREATE OR REPLACE FUNCTION get_active_pei(p_student_id UUID)
RETURNS TABLE (
  id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  assigned_teacher_id UUID,
  version_number INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.status::TEXT,
    p.created_at,
    p.updated_at,
    p.assigned_teacher_id,
    p.version_number
  FROM peis p
  WHERE p.student_id = p_student_id
  AND p.is_active_version = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Criar função para criar nova versão de PEI (arquivando a anterior)
CREATE OR REPLACE FUNCTION create_new_pei_version(
  p_student_id UUID,
  p_teacher_id UUID,
  p_school_id UUID,
  p_tenant_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_old_pei_id UUID;
  v_new_pei_id UUID;
  v_next_version INTEGER := 1;
BEGIN
  -- Verificar se já existe PEI ativo
  SELECT id INTO v_old_pei_id
  FROM peis
  WHERE student_id = p_student_id
  AND is_active_version = true;
  
  -- Se existe, obter próximo número de versão
  IF v_old_pei_id IS NOT NULL THEN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
    FROM peis
    WHERE student_id = p_student_id;
    
    -- Desativar versão antiga
    UPDATE peis
    SET is_active_version = false
    WHERE id = v_old_pei_id;
  END IF;
  
  -- Criar nova versão
  INSERT INTO peis (
    student_id,
    school_id,
    tenant_id,
    assigned_teacher_id,
    created_by,
    status,
    version_number,
    is_active_version,
    diagnosis_data,
    planning_data,
    evaluation_data
  ) VALUES (
    p_student_id,
    p_school_id,
    p_tenant_id,
    p_teacher_id,
    p_teacher_id,
    'draft',
    v_next_version,
    true,
    '{}',
    '{}',
    '{}'
  )
  RETURNING id INTO v_new_pei_id;
  
  RETURN v_new_pei_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. View para listar apenas PEIs ativos (facilita queries)
CREATE OR REPLACE VIEW active_peis AS
SELECT 
  p.*,
  s.name as student_name,
  s.date_of_birth,
  sch.school_name,
  t.network_name
FROM peis p
INNER JOIN students s ON s.id = p.student_id
LEFT JOIN schools sch ON sch.id = p.school_id
LEFT JOIN tenants t ON t.id = p.tenant_id
WHERE p.is_active_version = true;

-- 7. Comentários
COMMENT ON FUNCTION has_active_pei(UUID) IS 
  'Verifica se um aluno já possui um PEI ativo';

COMMENT ON FUNCTION get_active_pei(UUID) IS 
  'Retorna o PEI ativo de um aluno (apenas 1 por aluno)';

COMMENT ON FUNCTION create_new_pei_version(UUID, UUID, UUID, UUID) IS 
  'Cria uma nova versão de PEI, arquivando automaticamente a versão anterior';

COMMENT ON VIEW active_peis IS 
  'View que mostra apenas PEIs ativos (is_active_version = true) com dados relacionados';

-- 8. Garantir que todas as inserções são com is_active_version = true por padrão
ALTER TABLE peis ALTER COLUMN is_active_version SET DEFAULT true;

-- 9. Log de correção
DO $$
DECLARE
  v_total_peis INTEGER;
  v_active_peis INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_peis FROM peis;
  SELECT COUNT(*) INTO v_active_peis FROM peis WHERE is_active_version = true;
  
  RAISE NOTICE 'Sistema de versionamento configurado:';
  RAISE NOTICE '  Total de PEIs no sistema: %', v_total_peis;
  RAISE NOTICE '  PEIs ativos (1 por aluno): %', v_active_peis;
  RAISE NOTICE '  PEIs arquivados (versões antigas): %', v_total_peis - v_active_peis;
END $$;



-- ============================================================================
-- MIGRAÇÃO 2/5: MATRÍCULAS E MÚLTIPLOS PROFESSORES
-- Arquivo: 20250203000004_add_student_enrollments_and_multiple_teachers.sql
-- ============================================================================

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



-- ============================================================================
-- MIGRAÇÃO 3/5: PROFESSORES POR TURMA
-- Arquivo: 20250203000005_add_class_teachers_auto_assignment.sql
-- ============================================================================

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



-- ============================================================================
-- MIGRAÇÃO 4/5: AVATARS COM EMOJIS
-- Arquivo: 20250203000006_add_profile_avatars.sql
-- ============================================================================

-- Migration: Add Profile Avatars with Emojis
-- Created: 2025-02-03
-- Description: Adiciona campo de emoji/avatar aos perfis de usuário

-- ============================================================================
-- ADICIONAR CAMPO DE AVATAR
-- ============================================================================

-- Adicionar coluna de emoji à tabela profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS avatar_emoji VARCHAR(10) DEFAULT '👤';

-- Adicionar coluna de cor de fundo do avatar
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(20) DEFAULT 'blue';

-- Índice para busca (opcional)
CREATE INDEX IF NOT EXISTS idx_profiles_avatar ON profiles(avatar_emoji);

-- ============================================================================
-- FUNÇÃO PARA ATUALIZAR AVATAR
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_avatar(
  p_user_id UUID,
  p_emoji VARCHAR(10),
  p_color VARCHAR(20) DEFAULT 'blue'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET 
    avatar_emoji = p_emoji,
    avatar_color = p_color,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- EMOJIS PADRÃO POR ROLE
-- ============================================================================

-- Função para definir emoji padrão baseado no role
CREATE OR REPLACE FUNCTION set_default_avatar_by_role()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_emoji VARCHAR(10);
  v_color VARCHAR(20);
BEGIN
  -- Obter o role principal do usuário
  SELECT ur.role INTO v_role
  FROM user_roles ur
  WHERE ur.user_id = NEW.id
  ORDER BY 
    CASE ur.role
      WHEN 'superadmin' THEN 1
      WHEN 'education_secretary' THEN 2
      WHEN 'school_director' THEN 3
      WHEN 'coordinator' THEN 4
      WHEN 'teacher' THEN 5
      ELSE 6
    END
  LIMIT 1;
  
  -- Definir emoji e cor padrão baseado no role
  CASE v_role
    WHEN 'superadmin' THEN
      v_emoji := '👑';
      v_color := 'purple';
    WHEN 'education_secretary' THEN
      v_emoji := '🎓';
      v_color := 'indigo';
    WHEN 'school_director' THEN
      v_emoji := '🏫';
      v_color := 'blue';
    WHEN 'coordinator' THEN
      v_emoji := '📋';
      v_color := 'green';
    WHEN 'teacher' THEN
      v_emoji := '👨‍🏫';
      v_color := 'teal';
    WHEN 'aee_teacher' THEN
      v_emoji := '♿';
      v_color := 'cyan';
    WHEN 'specialist' THEN
      v_emoji := '🩺';
      v_color := 'pink';
    WHEN 'family' THEN
      v_emoji := '👨‍👩‍👧';
      v_color := 'orange';
    ELSE
      v_emoji := '👤';
      v_color := 'gray';
  END CASE;
  
  -- Atualizar apenas se ainda não tem emoji personalizado
  IF NEW.avatar_emoji IS NULL OR NEW.avatar_emoji = '👤' THEN
    NEW.avatar_emoji := v_emoji;
    NEW.avatar_color := v_color;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger apenas em INSERT (novos usuários)
DROP TRIGGER IF EXISTS set_default_avatar_trigger ON profiles;
CREATE TRIGGER set_default_avatar_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_default_avatar_by_role();

-- ============================================================================
-- ATUALIZAR USUÁRIOS EXISTENTES
-- ============================================================================

-- Atualizar emojis padrão para usuários existentes baseado no role
DO $$
DECLARE
  v_profile RECORD;
  v_role TEXT;
  v_emoji VARCHAR(10);
  v_color VARCHAR(20);
BEGIN
  FOR v_profile IN SELECT id FROM profiles WHERE avatar_emoji IS NULL OR avatar_emoji = '👤'
  LOOP
    -- Obter role principal
    SELECT ur.role INTO v_role
    FROM user_roles ur
    WHERE ur.user_id = v_profile.id
    ORDER BY 
      CASE ur.role
        WHEN 'superadmin' THEN 1
        WHEN 'education_secretary' THEN 2
        WHEN 'school_director' THEN 3
        WHEN 'coordinator' THEN 4
        WHEN 'teacher' THEN 5
        ELSE 6
      END
    LIMIT 1;
    
    -- Definir emoji
    CASE v_role
      WHEN 'superadmin' THEN
        v_emoji := '👑'; v_color := 'purple';
      WHEN 'education_secretary' THEN
        v_emoji := '🎓'; v_color := 'indigo';
      WHEN 'school_director' THEN
        v_emoji := '🏫'; v_color := 'blue';
      WHEN 'coordinator' THEN
        v_emoji := '📋'; v_color := 'green';
      WHEN 'teacher' THEN
        v_emoji := '👨‍🏫'; v_color := 'teal';
      WHEN 'aee_teacher' THEN
        v_emoji := '♿'; v_color := 'cyan';
      WHEN 'specialist' THEN
        v_emoji := '🩺'; v_color := 'pink';
      WHEN 'family' THEN
        v_emoji := '👨‍👩‍👧'; v_color := 'orange';
      ELSE
        v_emoji := '👤'; v_color := 'gray';
    END CASE;
    
    -- Atualizar
    UPDATE profiles
    SET 
      avatar_emoji = v_emoji,
      avatar_color = v_color
    WHERE id = v_profile.id;
  END LOOP;
  
  RAISE NOTICE '✅ Avatares padrão configurados para usuários existentes';
END $$;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN profiles.avatar_emoji IS 
  'Emoji usado como avatar do usuário (ex: 👨‍🏫, 👩‍🏫, 📋, 🎓)';

COMMENT ON COLUMN profiles.avatar_color IS 
  'Cor de fundo do avatar (blue, green, purple, orange, etc.)';

COMMENT ON FUNCTION update_user_avatar(UUID, VARCHAR, VARCHAR) IS 
  'Atualiza o emoji e cor do avatar do usuário';

-- ============================================================================
-- LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de avatares concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações:';
  RAISE NOTICE '  1. ✅ Campo avatar_emoji adicionado';
  RAISE NOTICE '  2. ✅ Campo avatar_color adicionado';
  RAISE NOTICE '  3. ✅ Emojis padrão configurados por role:';
  RAISE NOTICE '      👑 Superadmin (purple)';
  RAISE NOTICE '      🎓 Secretário de Educação (indigo)';
  RAISE NOTICE '      🏫 Diretor Escolar (blue)';
  RAISE NOTICE '      📋 Coordenador (green)';
  RAISE NOTICE '      👨‍🏫 Professor (teal)';
  RAISE NOTICE '      ♿ Professor AEE (cyan)';
  RAISE NOTICE '      🩺 Especialista (pink)';
  RAISE NOTICE '      👨‍👩‍👧 Família (orange)';
  RAISE NOTICE '  4. ✅ Usuários existentes atualizados';
  RAISE NOTICE '  5. ✅ Trigger para novos usuários configurado';
END $$;



-- ============================================================================
-- MIGRAÇÃO 5/5: CORREÇÃO DE RELACIONAMENTO
-- Arquivo: 20250203000007_fix_user_roles_relationship.sql
-- ============================================================================

-- Migration: Fix user_roles relationship with profiles
-- Created: 2025-02-03
-- Description: Garante que a foreign key entre user_roles e profiles está correta

-- ============================================================================
-- VERIFICAR E CORRIGIR RELACIONAMENTO
-- ============================================================================

-- 1. Garantir que a foreign key existe
DO $$
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_user_id_fkey'
    AND table_name = 'user_roles'
  ) THEN
    -- Adicionar foreign key se não existir
    ALTER TABLE user_roles
      ADD CONSTRAINT user_roles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key user_roles_user_id_fkey criada';
  ELSE
    RAISE NOTICE 'Foreign key user_roles_user_id_fkey já existe';
  END IF;
END $$;

-- 2. Verificar integridade dos dados
DO $$
DECLARE
  v_orphan_count INTEGER;
BEGIN
  -- Contar user_roles órfãos (sem profile correspondente)
  SELECT COUNT(*) INTO v_orphan_count
  FROM user_roles ur
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = ur.user_id
  );
  
  IF v_orphan_count > 0 THEN
    RAISE WARNING 'Encontrados % registros órfãos em user_roles', v_orphan_count;
    
    -- Opcionalmente, remover órfãos (comentado por segurança)
    -- DELETE FROM user_roles
    -- WHERE NOT EXISTS (
    --   SELECT 1 FROM profiles p WHERE p.id = user_roles.user_id
    -- );
  ELSE
    RAISE NOTICE 'Nenhum registro órfão encontrado em user_roles';
  END IF;
END $$;

-- 3. Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- 4. Forçar refresh do schema cache do Supabase
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- LOG
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Relacionamento user_roles ↔ profiles verificado!';
  RAISE NOTICE 'Próximo passo: Recarregar a página para limpar cache do cliente';
END $$;



-- ============================================================================
-- FIM DAS MIGRAÇÕES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║     🎉 TODAS AS MIGRAÇÕES FORAM APLICADAS!             ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Funcionalidades ativadas:';
  RAISE NOTICE '  ✅ Sistema de versionamento de PEIs';
  RAISE NOTICE '  ✅ Matrículas (série, turma, turno)';
  RAISE NOTICE '  ✅ Múltiplos professores por PEI';
  RAISE NOTICE '  ✅ Atribuição automática de professores';
  RAISE NOTICE '  ✅ Avatars personalizados com emojis';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  1. Recarregar a aplicação (F5)';
  RAISE NOTICE '  2. Fazer logout e login novamente';
  RAISE NOTICE '  3. Testar as novas funcionalidades!';
  RAISE NOTICE '';
END $$;
