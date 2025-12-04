-- ============================================================================
-- MIGRAÇÃO: Diário de Classe Digital Completo
-- Data: 15/02/2025
-- Descrição: 
--   1. Expandir tabela attendance com campos adicionais
--   2. Criar tabela class_diary (Diário de Classe)
--   3. Criar tabela lesson_plans (Planejamentos de Aula)
--   4. Criar tabela evaluations (Avaliações)
--   5. Criar RPCs para gerenciar diário
-- ============================================================================

-- ============================================================================
-- PARTE 1: EXPANDIR TABELA attendance
-- ============================================================================

-- Adicionar campos de justificativa expandidos
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS justificativa_tipo text CHECK (justificativa_tipo IN ('medico', 'familiar', 'outro')),
  ADD COLUMN IF NOT EXISTS documento_justificativa_url text;

COMMENT ON COLUMN attendance.justificativa_tipo IS 
  'Tipo de justificativa: medico (atestado médico), familiar (motivo familiar), outro';

COMMENT ON COLUMN attendance.documento_justificativa_url IS 
  'URL do documento de justificativa (ex: atestado médico escaneado)';

-- ============================================================================
-- PARTE 2: TABELA class_diary (Diário de Classe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_diary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academic_year integer NOT NULL,
  
  -- Data da aula
  date date NOT NULL,
  lesson_number integer, -- Número da aula (1, 2, 3...)
  
  -- Conteúdo da aula
  lesson_topic text NOT NULL, -- Tema/tópico da aula
  content_taught text, -- Conteúdo ministrado
  activities jsonb DEFAULT '[]'::jsonb, -- [{type, description, duration}]
  homework_assigned text, -- Tarefas de casa
  observations text, -- Observações gerais
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  
  -- Índice único: uma aula por turma/disciplina/data
  UNIQUE(class_id, subject_id, date, lesson_number)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_class_diary_class ON class_diary(class_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_class_diary_subject ON class_diary(subject_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_class_diary_teacher ON class_diary(teacher_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_class_diary_date ON class_diary(date DESC);
CREATE INDEX IF NOT EXISTS idx_class_diary_academic_year ON class_diary(academic_year, date DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_class_diary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS class_diary_updated_at_trigger ON class_diary;
CREATE TRIGGER class_diary_updated_at_trigger
  BEFORE UPDATE ON class_diary
  FOR EACH ROW
  EXECUTE FUNCTION update_class_diary_updated_at();

-- Comentários
COMMENT ON TABLE class_diary IS 
  'Registro diário de aulas ministradas. Permite que professores registrem conteúdo, atividades e observações de cada aula.';

COMMENT ON COLUMN class_diary.activities IS 
  'Array de atividades realizadas: [{type: "exposicao", description: "...", duration: 20}]';

-- ============================================================================
-- PARTE 3: TABELA lesson_plans (Planejamentos de Aula)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academic_year integer NOT NULL,
  
  -- Período
  bimester integer CHECK (bimester BETWEEN 1 AND 4),
  week_number integer, -- Semana do bimestre
  
  -- Planejamento estruturado
  lesson_plan_data jsonb DEFAULT '{}'::jsonb, -- Estrutura completa do planejamento
  
  -- BNCC
  bncc_codes text[], -- Códigos da BNCC relacionados
  
  -- Objetivos e metodologia
  objectives text[], -- Objetivos de aprendizagem
  methodology text, -- Metodologia de ensino
  resources text, -- Recursos didáticos
  evaluation_method text, -- Método de avaliação
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lesson_plans_class ON lesson_plans(class_id, academic_year, bimester);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_subject ON lesson_plans(subject_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher ON lesson_plans(teacher_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_bimester ON lesson_plans(academic_year, bimester);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_lesson_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lesson_plans_updated_at_trigger ON lesson_plans;
CREATE TRIGGER lesson_plans_updated_at_trigger
  BEFORE UPDATE ON lesson_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_plans_updated_at();

-- Comentários
COMMENT ON TABLE lesson_plans IS 
  'Planejamentos de aula estruturados. Permite que professores planejem aulas com objetivos, metodologia e recursos.';

COMMENT ON COLUMN lesson_plans.lesson_plan_data IS 
  'Estrutura completa do planejamento em JSON: {introducao, desenvolvimento, conclusao, avaliacao}';

COMMENT ON COLUMN lesson_plans.bncc_codes IS 
  'Array de códigos da BNCC (Base Nacional Comum Curricular) relacionados ao planejamento';

-- ============================================================================
-- PARTE 4: TABELA evaluations (Avaliações)
-- ============================================================================

CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academic_year integer NOT NULL,
  
  -- Tipo e descrição
  evaluation_type text NOT NULL CHECK (evaluation_type IN ('prova', 'trabalho', 'projeto', 'participacao', 'outro')),
  title text NOT NULL,
  description text,
  
  -- Data e peso
  date date NOT NULL,
  weight numeric(5,2) DEFAULT 1.0, -- Peso da avaliação (ex: 2.0 = vale o dobro)
  max_score numeric(5,2) DEFAULT 10.0, -- Nota máxima
  
  -- Dados estruturados
  evaluation_data jsonb DEFAULT '{}'::jsonb, -- Questões, critérios, etc.
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_evaluations_class ON evaluations(class_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_subject ON evaluations(subject_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_teacher ON evaluations(teacher_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(date DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_type ON evaluations(evaluation_type);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS evaluations_updated_at_trigger ON evaluations;
CREATE TRIGGER evaluations_updated_at_trigger
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluations_updated_at();

-- Comentários
COMMENT ON TABLE evaluations IS 
  'Avaliações aplicadas aos alunos. Permite que professores registrem provas, trabalhos, projetos e outras formas de avaliação.';

COMMENT ON COLUMN evaluations.evaluation_data IS 
  'Dados estruturados da avaliação: {questions: [...], criteria: [...], rubric: {...}}';

-- ============================================================================
-- PARTE 5: RPCs PARA GERENCIAR DIÁRIO
-- ============================================================================

-- 5.1. Criar registro de diário
CREATE OR REPLACE FUNCTION create_class_diary_entry(
  p_class_id uuid,
  p_subject_id uuid,
  p_teacher_id uuid,
  p_academic_year integer,
  p_date date,
  p_lesson_number integer DEFAULT NULL,
  p_lesson_topic text,
  p_content_taught text DEFAULT NULL,
  p_activities jsonb DEFAULT '[]'::jsonb,
  p_homework_assigned text DEFAULT NULL,
  p_observations text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_diary_id uuid;
BEGIN
  INSERT INTO class_diary (
    class_id,
    subject_id,
    teacher_id,
    academic_year,
    date,
    lesson_number,
    lesson_topic,
    content_taught,
    activities,
    homework_assigned,
    observations,
    created_by
  ) VALUES (
    p_class_id,
    p_subject_id,
    p_teacher_id,
    p_academic_year,
    p_date,
    p_lesson_number,
    p_lesson_topic,
    p_content_taught,
    p_activities,
    p_homework_assigned,
    p_observations,
    auth.uid()
  )
  ON CONFLICT (class_id, subject_id, date, lesson_number) 
  DO UPDATE SET
    lesson_topic = EXCLUDED.lesson_topic,
    content_taught = EXCLUDED.content_taught,
    activities = EXCLUDED.activities,
    homework_assigned = EXCLUDED.homework_assigned,
    observations = EXCLUDED.observations,
    updated_at = NOW()
  RETURNING id INTO v_diary_id;
  
  RETURN v_diary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2. Listar registros de diário
CREATE OR REPLACE FUNCTION get_class_diary_entries(
  p_class_id uuid DEFAULT NULL,
  p_subject_id uuid DEFAULT NULL,
  p_teacher_id uuid DEFAULT NULL,
  p_academic_year integer DEFAULT NULL,
  p_date_start date DEFAULT NULL,
  p_date_end date DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  class_id uuid,
  class_name text,
  subject_id uuid,
  subject_name text,
  teacher_id uuid,
  teacher_name text,
  academic_year integer,
  date date,
  lesson_number integer,
  lesson_topic text,
  content_taught text,
  activities jsonb,
  homework_assigned text,
  observations text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.id,
    cd.class_id,
    c.class_name,
    cd.subject_id,
    s.subject_name,
    cd.teacher_id,
    p.full_name as teacher_name,
    cd.academic_year,
    cd.date,
    cd.lesson_number,
    cd.lesson_topic,
    cd.content_taught,
    cd.activities,
    cd.homework_assigned,
    cd.observations,
    cd.created_at,
    cd.updated_at
  FROM class_diary cd
  LEFT JOIN classes c ON c.id = cd.class_id
  LEFT JOIN subjects s ON s.id = cd.subject_id
  LEFT JOIN profiles p ON p.id = cd.teacher_id
  WHERE 
    (p_class_id IS NULL OR cd.class_id = p_class_id)
    AND (p_subject_id IS NULL OR cd.subject_id = p_subject_id)
    AND (p_teacher_id IS NULL OR cd.teacher_id = p_teacher_id)
    AND (p_academic_year IS NULL OR cd.academic_year = p_academic_year)
    AND (p_date_start IS NULL OR cd.date >= p_date_start)
    AND (p_date_end IS NULL OR cd.date <= p_date_end)
  ORDER BY cd.date DESC, cd.lesson_number DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.3. Criar planejamento de aula
CREATE OR REPLACE FUNCTION create_lesson_plan(
  p_class_id uuid,
  p_subject_id uuid,
  p_teacher_id uuid,
  p_academic_year integer,
  p_bimester integer,
  p_week_number integer DEFAULT NULL,
  p_lesson_plan_data jsonb DEFAULT '{}'::jsonb,
  p_bncc_codes text[] DEFAULT ARRAY[]::text[],
  p_objectives text[] DEFAULT ARRAY[]::text[],
  p_methodology text DEFAULT NULL,
  p_resources text DEFAULT NULL,
  p_evaluation_method text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_plan_id uuid;
BEGIN
  INSERT INTO lesson_plans (
    class_id,
    subject_id,
    teacher_id,
    academic_year,
    bimester,
    week_number,
    lesson_plan_data,
    bncc_codes,
    objectives,
    methodology,
    resources,
    evaluation_method,
    created_by
  ) VALUES (
    p_class_id,
    p_subject_id,
    p_teacher_id,
    p_academic_year,
    p_bimester,
    p_week_number,
    p_lesson_plan_data,
    p_bncc_codes,
    p_objectives,
    p_methodology,
    p_resources,
    p_evaluation_method,
    auth.uid()
  )
  RETURNING id INTO v_plan_id;
  
  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4. Criar avaliação
CREATE OR REPLACE FUNCTION create_evaluation(
  p_class_id uuid,
  p_subject_id uuid,
  p_teacher_id uuid,
  p_academic_year integer,
  p_evaluation_type text,
  p_title text,
  p_description text DEFAULT NULL,
  p_date date,
  p_weight numeric DEFAULT 1.0,
  p_max_score numeric DEFAULT 10.0,
  p_evaluation_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_evaluation_id uuid;
BEGIN
  INSERT INTO evaluations (
    class_id,
    subject_id,
    teacher_id,
    academic_year,
    evaluation_type,
    title,
    description,
    date,
    weight,
    max_score,
    evaluation_data,
    created_by
  ) VALUES (
    p_class_id,
    p_subject_id,
    p_teacher_id,
    p_academic_year,
    p_evaluation_type,
    p_title,
    p_description,
    p_date,
    p_weight,
    p_max_score,
    p_evaluation_data,
    auth.uid()
  )
  RETURNING id INTO v_evaluation_id;
  
  RETURN v_evaluation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 6: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE class_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to class_diary" ON class_diary;
CREATE POLICY "Superadmin full access to class_diary"
  ON class_diary FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Superadmin full access to lesson_plans" ON lesson_plans;
CREATE POLICY "Superadmin full access to lesson_plans"
  ON lesson_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Superadmin full access to evaluations" ON evaluations;
CREATE POLICY "Superadmin full access to evaluations"
  ON evaluations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Professores veem e gerenciam seus próprios registros
DROP POLICY IF EXISTS "Teachers can manage their own diary entries" ON class_diary;
CREATE POLICY "Teachers can manage their own diary entries"
  ON class_diary FOR ALL
  USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can manage their own lesson plans" ON lesson_plans;
CREATE POLICY "Teachers can manage their own lesson plans"
  ON lesson_plans FOR ALL
  USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can manage their own evaluations" ON evaluations;
CREATE POLICY "Teachers can manage their own evaluations"
  ON evaluations FOR ALL
  USING (teacher_id = auth.uid());

-- Coordenadores e diretores veem registros das suas escolas
DROP POLICY IF EXISTS "School staff can view diary entries in their school" ON class_diary;
CREATE POLICY "School staff can view diary entries in their school"
  ON class_diary FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      INNER JOIN profiles p ON p.school_id = c.school_id
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE c.id = class_diary.class_id
      AND p.id = auth.uid()
      AND ur.role IN ('coordinator', 'school_director', 'school_manager')
    )
  );

DROP POLICY IF EXISTS "School staff can view lesson plans in their school" ON lesson_plans;
CREATE POLICY "School staff can view lesson plans in their school"
  ON lesson_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      INNER JOIN profiles p ON p.school_id = c.school_id
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE c.id = lesson_plans.class_id
      AND p.id = auth.uid()
      AND ur.role IN ('coordinator', 'school_director', 'school_manager')
    )
  );

DROP POLICY IF EXISTS "School staff can view evaluations in their school" ON evaluations;
CREATE POLICY "School staff can view evaluations in their school"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      INNER JOIN profiles p ON p.school_id = c.school_id
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE c.id = evaluations.class_id
      AND p.id = auth.uid()
      AND ur.role IN ('coordinator', 'school_director', 'school_manager')
    )
  );

-- ============================================================================
-- PARTE 7: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de diário de classe digital completo concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Tabela attendance expandida (justificativa_tipo, documento_justificativa_url)';
  RAISE NOTICE '  2. ✅ Criada tabela class_diary (registro de aulas)';
  RAISE NOTICE '  3. ✅ Criada tabela lesson_plans (planejamentos)';
  RAISE NOTICE '  4. ✅ Criada tabela evaluations (avaliações)';
  RAISE NOTICE '  5. ✅ Criados RPCs para gerenciar diário';
  RAISE NOTICE '  6. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Criar interface no app Gestão Escolar (/diary)';
  RAISE NOTICE '  - Implementar funcionalidades offline';
  RAISE NOTICE '  - Adicionar relatórios de diário (PDF)';
END $$;

