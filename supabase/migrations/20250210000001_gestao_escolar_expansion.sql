-- ============================================================================
-- MIGRAÇÃO: Expansão do Gestão Escolar
-- Data: 10/02/2025
-- Descrição: Expandir tabelas existentes e criar novas para o app Gestão Escolar
-- ============================================================================

-- ============================================================================
-- PARTE 1: EXPANSÃO DE TABELAS EXISTENTES
-- ============================================================================

-- 1.1 EXPANDIR TABELA students
-- ============================================================================
ALTER TABLE students 
  -- Identificação Completa
  ADD COLUMN IF NOT EXISTS codigo_identificador text UNIQUE,
  ADD COLUMN IF NOT EXISTS numero_ficha text,
  ADD COLUMN IF NOT EXISTS nome_social text,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS rg text,
  
  -- Dados Pessoais
  ADD COLUMN IF NOT EXISTS sexo text CHECK (sexo IN ('M', 'F', 'Outro')),
  ADD COLUMN IF NOT EXISTS raca_cor text,
  ADD COLUMN IF NOT EXISTS naturalidade text,
  ADD COLUMN IF NOT EXISTS tipo_sanguineo text,
  ADD COLUMN IF NOT EXISTS cartao_sus text,
  
  -- Endereço Completo
  ADD COLUMN IF NOT EXISTS endereco_logradouro text,
  ADD COLUMN IF NOT EXISTS endereco_numero text,
  ADD COLUMN IF NOT EXISTS endereco_complemento text,
  ADD COLUMN IF NOT EXISTS endereco_bairro text,
  ADD COLUMN IF NOT EXISTS endereco_cidade text,
  ADD COLUMN IF NOT EXISTS endereco_cep text,
  ADD COLUMN IF NOT EXISTS localizacao_geografica point,
  
  -- Contatos
  ADD COLUMN IF NOT EXISTS telefone_principal text,
  ADD COLUMN IF NOT EXISTS telefone_secundario text,
  ADD COLUMN IF NOT EXISTS email text,
  
  -- Responsáveis (compatível com campos antigos)
  ADD COLUMN IF NOT EXISTS mae_nome text,
  ADD COLUMN IF NOT EXISTS mae_telefone text,
  ADD COLUMN IF NOT EXISTS mae_cpf text,
  ADD COLUMN IF NOT EXISTS pai_nome text,
  ADD COLUMN IF NOT EXISTS pai_telefone text,
  ADD COLUMN IF NOT EXISTS pai_cpf text,
  
  -- Status Acadêmico
  ADD COLUMN IF NOT EXISTS status_matricula text DEFAULT 'Ativo' 
    CHECK (status_matricula IN ('Ativo', 'Transferido', 'Cancelado', 'Concluído', 'Abandonou')),
  
  -- Necessidades Especiais (expansão)
  ADD COLUMN IF NOT EXISTS necessidades_especiais boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tipo_necessidade text[],
  ADD COLUMN IF NOT EXISTS laudo_medico_url text;

-- Migrar dados de special_needs para novo formato (se coluna existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' 
    AND column_name = 'special_needs'
  ) THEN
    UPDATE students 
    SET necessidades_especiais = (special_needs IS NOT NULL AND special_needs != ''),
        tipo_necessidade = CASE 
          WHEN special_needs IS NOT NULL AND special_needs != '' THEN ARRAY[special_needs]
          ELSE NULL
        END
    WHERE necessidades_especiais IS NULL;
  END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_students_codigo ON students(codigo_identificador);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status_matricula);
CREATE INDEX IF NOT EXISTS idx_students_necessidades ON students(necessidades_especiais) WHERE necessidades_especiais = true;
CREATE INDEX IF NOT EXISTS idx_students_cpf ON students(cpf) WHERE cpf IS NOT NULL;

-- 1.2 EXPANDIR TABELA profiles (Staff)
-- ============================================================================
ALTER TABLE profiles
  -- Dados Profissionais
  ADD COLUMN IF NOT EXISTS matricula_funcional text,
  ADD COLUMN IF NOT EXISTS cargo_funcao text,
  ADD COLUMN IF NOT EXISTS tipo_vinculo text 
    CHECK (tipo_vinculo IN ('Efetivo', 'Contrato', 'Comissionado', 'Voluntário')),
  ADD COLUMN IF NOT EXISTS regime_trabalho text 
    CHECK (regime_trabalho IN ('20h', '30h', '40h', 'Dedicação Exclusiva')),
  ADD COLUMN IF NOT EXISTS departamento_setor text,
  ADD COLUMN IF NOT EXISTS data_entrada date,
  ADD COLUMN IF NOT EXISTS data_saida date,
  
  -- Formação
  ADD COLUMN IF NOT EXISTS escolaridade text,
  ADD COLUMN IF NOT EXISTS formacao jsonb, -- [{curso, instituicao, ano}]
  ADD COLUMN IF NOT EXISTS habilitacoes jsonb, -- [Libras, Braille, AEE]
  
  -- Dados Pessoais
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS endereco_completo text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS email_pessoal text;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_profiles_matricula ON profiles(matricula_funcional);
CREATE INDEX IF NOT EXISTS idx_profiles_cargo ON profiles(cargo_funcao);

-- 1.3 EXPANDIR TABELA schools
-- ============================================================================
ALTER TABLE schools
  -- Dados Institucionais
  ADD COLUMN IF NOT EXISTS codigo_inep text UNIQUE,
  ADD COLUMN IF NOT EXISTS tipo_escola text 
    CHECK (tipo_escola IN ('Municipal', 'Estadual', 'Federal', 'Privada')),
  ADD COLUMN IF NOT EXISTS diretor_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS coordenador_pedagogico_id uuid REFERENCES profiles(id),
  
  -- Capacidade e Estrutura
  ADD COLUMN IF NOT EXISTS capacidade_total integer,
  ADD COLUMN IF NOT EXISTS oferece_eja boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS oferece_aee boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS turnos jsonb, -- ["Matutino", "Vespertino", "Noturno"]
  
  -- Localização
  ADD COLUMN IF NOT EXISTS latitude decimal(10,8),
  ADD COLUMN IF NOT EXISTS longitude decimal(11,8);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_schools_inep ON schools(codigo_inep);
CREATE INDEX IF NOT EXISTS idx_schools_tipo ON schools(tipo_escola);

-- ============================================================================
-- PARTE 2: NOVAS TABELAS
-- ============================================================================

-- 2.1 GRADE_LEVELS - Níveis de Ensino
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Identificação
  codigo text NOT NULL,
  nome text NOT NULL,
  
  -- Classificação
  modalidade text CHECK (modalidade IN (
    'Educação Infantil', 
    'Ensino Fundamental', 
    'Ensino Médio', 
    'EJA', 
    'Educação Especial'
  )),
  etapa text, -- Anos Iniciais, Anos Finais
  
  -- Faixa Etária
  idade_minima integer,
  idade_maxima integer,
  
  -- Carga Horária
  carga_horaria_anual integer,
  
  -- BNCC
  competencias_bncc jsonb,
  descricao text,
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(tenant_id, codigo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_grade_levels_tenant ON grade_levels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grade_levels_modalidade ON grade_levels(modalidade);

-- RLS
ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view grade levels of their tenant" ON grade_levels;
CREATE POLICY "Users can view grade levels of their tenant"
  ON grade_levels FOR SELECT
  USING (tenant_id = get_user_tenant_safe(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage grade levels" ON grade_levels;
CREATE POLICY "Admins can manage grade levels"
  ON grade_levels FOR ALL
  USING (
    tenant_id = get_user_tenant_safe(auth.uid())
    AND (
      has_role(auth.uid(), 'education_secretary')
      OR has_role(auth.uid(), 'school_director')
    )
  );

-- 2.2 SUBJECTS - Disciplinas
-- ============================================================================
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Identificação
  codigo text NOT NULL,
  nome text NOT NULL,
  
  -- Classificação
  componente_curricular text, -- Base Nacional Comum / Parte Diversificada
  area_conhecimento text, -- Linguagens, Matemática, Ciências Humanas, Ciências da Natureza
  
  -- Carga Horária
  carga_horaria_semanal integer,
  
  -- BNCC
  competencias_bncc jsonb,
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(tenant_id, codigo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subjects_tenant ON subjects(tenant_id);

-- RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view subjects of their tenant" ON subjects;
CREATE POLICY "Users can view subjects of their tenant"
  ON subjects FOR SELECT
  USING (tenant_id = get_user_tenant_safe(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  USING (
    tenant_id = get_user_tenant_safe(auth.uid())
    AND (
      has_role(auth.uid(), 'education_secretary')
      OR has_role(auth.uid(), 'school_director')
    )
  );

-- 2.3 ENROLLMENTS - Matrículas
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id),
  school_id uuid NOT NULL REFERENCES schools(id),
  
  -- Ano Letivo
  ano_letivo integer NOT NULL,
  data_matricula date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Tipo de Matrícula
  modalidade text CHECK (modalidade IN ('Regular', 'Transferência', 'Rematrícula')),
  escola_origem text, -- Se transferência
  
  -- Status
  status text DEFAULT 'Matriculado' 
    CHECK (status IN ('Matriculado', 'Transferido', 'Cancelado', 'Concluído', 'Abandonou')),
  motivo_saida text,
  data_saida date,
  
  observacoes text,
  
  -- Auditoria
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(student_id, class_id, ano_letivo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_school ON enrollments(school_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_ano ON enrollments(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view enrollments of their schools" ON enrollments;
CREATE POLICY "Users can view enrollments of their schools"
  ON enrollments FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM user_schools WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;
CREATE POLICY "Admins can manage enrollments"
  ON enrollments FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM user_schools WHERE user_id = auth.uid()
    )
    AND (
      has_role(auth.uid(), 'education_secretary')
      OR has_role(auth.uid(), 'school_director')
      OR has_role(auth.uid(), 'coordinator')
    )
  );

-- 2.4 EXPANDIR TABELA peis (Vincular turma e matrícula)
-- ============================================================================
-- NOTA: Precisa estar DEPOIS de enrollments ser criada
ALTER TABLE peis
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES classes(id),
  ADD COLUMN IF NOT EXISTS enrollment_id uuid REFERENCES enrollments(id);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_peis_class ON peis(class_id) WHERE class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_peis_enrollment ON peis(enrollment_id) WHERE enrollment_id IS NOT NULL;

-- 2.5 ATTENDANCE - Frequência
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id),
  student_id uuid NOT NULL REFERENCES students(id),
  subject_id uuid REFERENCES subjects(id), -- NULL = frequência geral do dia
  
  -- Data e Presença
  data date NOT NULL,
  presenca boolean NOT NULL,
  atraso_minutos integer DEFAULT 0,
  saida_antecipada_minutos integer DEFAULT 0,
  
  -- Justificativa
  justificativa text,
  observacao text,
  
  -- Auditoria
  registrado_por uuid NOT NULL REFERENCES auth.users(id),
  is_synced boolean DEFAULT false, -- Para offline PWA
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(data DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_presenca ON attendance(presenca, data DESC);

-- Índice único: garantir apenas um registro por aluno/data/disciplina
-- Usamos índice parcial para subject_id NULL e subject_id NOT NULL separadamente
DROP INDEX IF EXISTS idx_attendance_unique_with_subject;
CREATE UNIQUE INDEX idx_attendance_unique_with_subject 
  ON attendance(student_id, data, subject_id) 
  WHERE subject_id IS NOT NULL;

DROP INDEX IF EXISTS idx_attendance_unique_without_subject;
CREATE UNIQUE INDEX idx_attendance_unique_without_subject 
  ON attendance(student_id, data) 
  WHERE subject_id IS NULL;

-- RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view attendance of their schools" ON attendance;
CREATE POLICY "Users can view attendance of their schools"
  ON attendance FOR SELECT
  USING (
    class_id IN (
      SELECT c.id FROM classes c
      JOIN user_schools us ON us.school_id = c.school_id
      WHERE us.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can manage attendance of their classes" ON attendance;
CREATE POLICY "Teachers can manage attendance of their classes"
  ON attendance FOR ALL
  USING (
    class_id IN (
      SELECT c.id FROM classes c
      WHERE c.main_teacher_id = auth.uid()
    )
  );

-- 2.6 GRADES - Notas e Avaliações
-- ============================================================================
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  
  -- Tipo de Avaliação
  avaliacao_tipo text CHECK (avaliacao_tipo IN (
    'Prova', 'Trabalho', 'Projeto', 'Participação', 'Recuperação', 'Simulado'
  )),
  periodo text NOT NULL, -- "1BIM", "2BIM", "3BIM", "4BIM", "SEM1", "SEM2", "ANUAL"
  
  -- Nota
  nota_valor decimal(5,2), -- 0.00 a 10.00
  conceito text, -- A, B, C, D, E ou MB, B, R, I
  peso decimal(3,2) DEFAULT 1.0, -- Para média ponderada
  
  comentario text,
  
  -- Aprovação
  lancado_por uuid NOT NULL REFERENCES auth.users(id),
  aprovado_por uuid REFERENCES auth.users(id), -- Coordenação aprova
  aprovado_em timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_nota_or_conceito CHECK (
    (nota_valor IS NOT NULL) OR (conceito IS NOT NULL)
  ),
  CONSTRAINT valid_nota_range CHECK (
    nota_valor IS NULL OR (nota_valor >= 0 AND nota_valor <= 10)
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_grades_enrollment ON grades(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id, periodo);
CREATE INDEX IF NOT EXISTS idx_grades_periodo ON grades(periodo);

-- RLS
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view grades of their schools" ON grades;
CREATE POLICY "Users can view grades of their schools"
  ON grades FOR SELECT
  USING (
    enrollment_id IN (
      SELECT e.id FROM enrollments e
      JOIN user_schools us ON us.school_id = e.school_id
      WHERE us.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can manage grades" ON grades;
CREATE POLICY "Teachers can manage grades"
  ON grades FOR ALL
  USING (
    enrollment_id IN (
      SELECT e.id FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.main_teacher_id = auth.uid()
    )
    OR has_role(auth.uid(), 'coordinator')
    OR has_role(auth.uid(), 'school_director')
  );

-- ============================================================================
-- PARTE 3: TRIGGERS E FUNÇÕES DE INTEGRAÇÃO
-- ============================================================================

-- 3.1 Trigger: Sincronizar class_id do PEI ao criar/atualizar matrícula
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_pei_class()
RETURNS TRIGGER AS $$
BEGIN
  -- Se houver PEI ativo, vincular à turma atual
  UPDATE peis
  SET 
    class_id = NEW.class_id,
    enrollment_id = NEW.id,
    updated_at = now()
  WHERE student_id = NEW.student_id
    AND is_active_version = true
    AND status NOT IN ('obsolete');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_pei_class ON enrollments;
CREATE TRIGGER trigger_sync_pei_class
AFTER INSERT OR UPDATE OF class_id, status ON enrollments
FOR EACH ROW
WHEN (NEW.status = 'Matriculado')
EXECUTE FUNCTION sync_pei_class();

-- 3.2 Trigger: Alertar professor AEE sobre faltas acumuladas
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_pei_attendance()
RETURNS TRIGGER AS $$
DECLARE
  faltas_mes integer;
  has_active_pei boolean;
  pei_id_ativo uuid;
BEGIN
  -- Verificar se aluno tem PEI ativo
  SELECT 
    EXISTS(SELECT 1 FROM peis WHERE student_id = NEW.student_id AND is_active_version = true),
    (SELECT id FROM peis WHERE student_id = NEW.student_id AND is_active_version = true LIMIT 1)
  INTO has_active_pei, pei_id_ativo;
  
  IF has_active_pei AND NEW.presenca = false THEN
    -- Contar faltas no mês
    SELECT COUNT(*) INTO faltas_mes
    FROM attendance
    WHERE student_id = NEW.student_id
      AND presenca = false
      AND data >= date_trunc('month', NEW.data)
      AND data <= date_trunc('month', NEW.data) + interval '1 month' - interval '1 day';
    
    -- Se > 5 faltas no mês, criar notificação
    IF faltas_mes > 5 THEN
      INSERT INTO pei_notifications (
        user_id, 
        pei_id, 
        notification_type,
        is_read
      )
      SELECT 
        pt.teacher_id,
        pei_id_ativo,
        'attendance_alert',
        false
      FROM pei_teachers pt
      WHERE pt.pei_id = pei_id_ativo
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_pei_attendance_alert ON attendance;
CREATE TRIGGER trigger_pei_attendance_alert
AFTER INSERT ON attendance
FOR EACH ROW
EXECUTE FUNCTION notify_pei_attendance();

-- 3.3 Trigger: Comparar notas com metas do PEI
-- ============================================================================
CREATE OR REPLACE FUNCTION compare_grade_with_pei()
RETURNS TRIGGER AS $$
DECLARE
  pei_goal_target decimal;
  student_id_ref uuid;
BEGIN
  -- Buscar student_id da matrícula
  SELECT student_id INTO student_id_ref
  FROM enrollments
  WHERE id = NEW.enrollment_id;
  
  -- Buscar meta relacionada à disciplina no PEI ativo
  SELECT pg.progress_score / 10.0 INTO pei_goal_target
  FROM peis p
  JOIN pei_goals pg ON pg.pei_id = p.id
  JOIN subjects s ON s.id = NEW.subject_id
  WHERE p.student_id = student_id_ref
    AND p.is_active_version = true
    AND pg.description ILIKE '%' || s.nome || '%'
  ORDER BY pg.created_at DESC
  LIMIT 1;
  
  -- Se nota < meta, criar notificação
  IF pei_goal_target IS NOT NULL AND NEW.nota_valor < pei_goal_target THEN
    INSERT INTO pei_notifications (
      user_id,
      pei_id,
      notification_type,
      is_read
    )
    SELECT 
      p.created_by,
      p.id,
      'grade_below_goal',
      false
    FROM peis p
    WHERE p.student_id = student_id_ref 
      AND p.is_active_version = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_compare_grade_pei ON grades;
CREATE TRIGGER trigger_compare_grade_pei
AFTER INSERT OR UPDATE OF nota_valor ON grades
FOR EACH ROW
WHEN (NEW.nota_valor IS NOT NULL)
EXECUTE FUNCTION compare_grade_with_pei();

-- ============================================================================
-- PARTE 4: FUNÇÕES AUXILIARES
-- ============================================================================

-- 4.1 Função: Buscar contexto acadêmico do aluno para PEI
-- ============================================================================
CREATE OR REPLACE FUNCTION get_student_academic_context(_student_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'turma', COALESCE(c.class_name, 'Sem turma'),
    'nivel', COALESCE(c.education_level::text || ' - ' || COALESCE(c.grade, ''), 'Sem turma'),
    'frequencia_percentual', COALESCE(
      (COUNT(a.*) FILTER (WHERE a.presenca = true)::decimal / NULLIF(COUNT(a.*), 0)) * 100,
      100
    ),
    'media_geral', COALESCE(AVG(g.nota_valor), 0),
    'disciplinas_abaixo_media', COUNT(DISTINCT g.subject_id) FILTER (WHERE g.nota_valor < 6.0),
    'faltas_mes_atual', COUNT(a.*) FILTER (
      WHERE a.presenca = false 
      AND a.data >= date_trunc('month', CURRENT_DATE)
    ),
    'em_risco', (
      COALESCE(
        (COUNT(a.*) FILTER (WHERE a.presenca = true)::decimal / NULLIF(COUNT(a.*), 0)) * 100,
        100
      ) < 75 
      OR COALESCE(AVG(g.nota_valor), 0) < 6.0
    )
  ) INTO result
  FROM students s
  LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'Matriculado'
  LEFT JOIN classes c ON c.id = e.class_id
  LEFT JOIN attendance a ON a.student_id = s.id 
    AND a.data >= CURRENT_DATE - INTERVAL '30 days'
  LEFT JOIN grades g ON g.enrollment_id = e.id
  WHERE s.id = _student_id
  GROUP BY c.class_name, c.education_level, c.grade;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 5: DADOS INICIAIS
-- ============================================================================

-- Inserir níveis de ensino padrão (exemplo para um tenant)
-- NOTA: Executar manualmente após criar tenant específico

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

