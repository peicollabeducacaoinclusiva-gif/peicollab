-- ============================================================================
-- MIGRAÇÃO: Base da Integração com Censo Escolar/EducaCenso
-- Data: 15/02/2025
-- Descrição: 
--   1. Adicionar códigos INEP nas tabelas existentes
--   2. Criar tabela censo_integration (Sincronizações)
--   3. Criar tabela censo_validation_log (Logs de Validação)
--   4. Criar tabela censo_sync_schedules (Agendamentos)
--   5. Criar RPCs básicos para exportação e validação
-- ============================================================================

-- ============================================================================
-- PARTE 1: ADICIONAR CÓDIGOS INEP NAS TABELAS EXISTENTES
-- ============================================================================

-- Verificar e adicionar códigos INEP se não existirem
DO $$
BEGIN
  -- Schools: codigo_inep (já deve existir, verificar)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schools' AND column_name = 'codigo_inep'
  ) THEN
    ALTER TABLE schools ADD COLUMN codigo_inep VARCHAR(8);
    COMMENT ON COLUMN schools.codigo_inep IS 'Código INEP da escola (8 dígitos)';
  END IF;

  -- Students: codigo_inep_aluno
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'codigo_inep_aluno'
  ) THEN
    ALTER TABLE students ADD COLUMN codigo_inep_aluno VARCHAR(12);
    COMMENT ON COLUMN students.codigo_inep_aluno IS 'Código único do aluno no Censo Escolar';
  END IF;

  -- Professionals: codigo_inep_servidor
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professionals' AND column_name = 'codigo_inep_servidor'
  ) THEN
    ALTER TABLE professionals ADD COLUMN codigo_inep_servidor VARCHAR(12);
    COMMENT ON COLUMN professionals.codigo_inep_servidor IS 'Código do servidor no Censo Escolar';
  END IF;

  -- Classes: codigo_inep_turma
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' AND column_name = 'codigo_inep_turma'
  ) THEN
    ALTER TABLE classes ADD COLUMN codigo_inep_turma VARCHAR(20);
    COMMENT ON COLUMN classes.codigo_inep_turma IS 'Código da turma no Censo Escolar';
  END IF;

  -- Student_enrollments: codigo_inep_matricula
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_enrollments' AND column_name = 'codigo_inep_matricula'
  ) THEN
    ALTER TABLE student_enrollments ADD COLUMN codigo_inep_matricula VARCHAR(20);
    COMMENT ON COLUMN student_enrollments.codigo_inep_matricula IS 'Código da matrícula no Censo Escolar';
  END IF;
END $$;

-- Criar índices para códigos INEP
CREATE INDEX IF NOT EXISTS idx_schools_codigo_inep ON schools(codigo_inep) WHERE codigo_inep IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_codigo_inep_aluno ON students(codigo_inep_aluno) WHERE codigo_inep_aluno IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_professionals_codigo_inep_servidor ON professionals(codigo_inep_servidor) WHERE codigo_inep_servidor IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_codigo_inep_turma ON classes(codigo_inep_turma) WHERE codigo_inep_turma IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_enrollments_codigo_inep_matricula ON student_enrollments(codigo_inep_matricula) WHERE codigo_inep_matricula IS NOT NULL;

-- ============================================================================
-- PARTE 2: TABELA censo_integration (Sincronizações)
-- ============================================================================

CREATE TABLE IF NOT EXISTS censo_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  academic_year integer NOT NULL,
  
  -- Tipo e status
  sync_type text NOT NULL CHECK (sync_type IN ('export', 'import', 'validation')),
  sync_status text NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'processing', 'completed', 'failed', 'validated')),
  
  -- Datas
  sync_date date NOT NULL,
  last_sync_at timestamptz,
  next_sync_date date,
  
  -- Arquivo
  file_format text CHECK (file_format IN ('txt', 'xml', 'csv')),
  file_url text,
  file_size bigint,
  
  -- Estatísticas
  records_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  warning_count integer DEFAULT 0,
  
  -- Resultados
  sync_errors jsonb DEFAULT '[]'::jsonb, -- [{entity_type, entity_id, error_code, error_message}]
  validation_results jsonb DEFAULT '{}'::jsonb, -- Resultados da validação
  inep_validation_code text, -- Código retornado pelo Inep após validação
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_censo_integration_school ON censo_integration(school_id, academic_year, sync_date DESC);
CREATE INDEX IF NOT EXISTS idx_censo_integration_tenant ON censo_integration(tenant_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_censo_integration_type ON censo_integration(sync_type, sync_status);
CREATE INDEX IF NOT EXISTS idx_censo_integration_status ON censo_integration(sync_status, sync_date DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_censo_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS censo_integration_updated_at_trigger ON censo_integration;
CREATE TRIGGER censo_integration_updated_at_trigger
  BEFORE UPDATE ON censo_integration
  FOR EACH ROW
  EXECUTE FUNCTION update_censo_integration_updated_at();

-- Comentários
COMMENT ON TABLE censo_integration IS 
  'Registro de sincronizações com Censo Escolar/EducaCenso. Controla exportações, importações e validações.';

-- ============================================================================
-- PARTE 3: TABELA censo_validation_log (Logs de Validação)
-- ============================================================================

CREATE TABLE IF NOT EXISTS censo_validation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  censo_integration_id uuid REFERENCES censo_integration(id) ON DELETE CASCADE,
  
  -- Entidade validada
  entity_type text NOT NULL CHECK (entity_type IN ('school', 'student', 'class', 'professional', 'enrollment')),
  entity_id uuid NOT NULL,
  
  -- Validação
  validation_rule text NOT NULL, -- Código da regra (ex: "R001", "R015")
  validation_status text NOT NULL CHECK (validation_status IN ('passed', 'failed', 'warning')),
  
  -- Detalhes
  error_message text,
  suggested_fix text,
  
  -- Status
  validated_at timestamptz DEFAULT now(),
  fixed_at timestamptz,
  fixed_by uuid REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_censo_validation_log_integration ON censo_validation_log(censo_integration_id, validation_status);
CREATE INDEX IF NOT EXISTS idx_censo_validation_log_entity ON censo_validation_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_censo_validation_log_status ON censo_validation_log(validation_status, validated_at DESC);
CREATE INDEX IF NOT EXISTS idx_censo_validation_log_rule ON censo_validation_log(validation_rule);

-- Comentários
COMMENT ON TABLE censo_validation_log IS 
  'Log detalhado de validações do Censo. Registra cada regra aplicada a cada entidade.';

-- ============================================================================
-- PARTE 4: TABELA censo_sync_schedules (Agendamentos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS censo_sync_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Tipo e agendamento
  sync_type text NOT NULL CHECK (sync_type IN ('export', 'import', 'validation')),
  schedule_type text NOT NULL CHECK (schedule_type IN ('manual', 'daily', 'weekly', 'monthly', 'annual')),
  schedule_config jsonb DEFAULT '{}'::jsonb, -- Configuração de cron
  
  -- Execução
  last_run_at timestamptz,
  next_run_at timestamptz,
  is_active boolean DEFAULT true,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_censo_sync_schedules_school ON censo_sync_schedules(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_censo_sync_schedules_tenant ON censo_sync_schedules(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_censo_sync_schedules_next_run ON censo_sync_schedules(next_run_at) WHERE is_active = true;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_censo_sync_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS censo_sync_schedules_updated_at_trigger ON censo_sync_schedules;
CREATE TRIGGER censo_sync_schedules_updated_at_trigger
  BEFORE UPDATE ON censo_sync_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_censo_sync_schedules_updated_at();

-- Comentários
COMMENT ON TABLE censo_sync_schedules IS 
  'Agendamentos de sincronização automática com Censo Escolar.';

-- ============================================================================
-- PARTE 5: RPCs BÁSICOS PARA CENSO
-- ============================================================================

-- 5.1. Validar dados da escola para Censo
CREATE OR REPLACE FUNCTION validate_censo_school_data(
  p_school_id uuid
)
RETURNS TABLE (
  validation_status text,
  errors jsonb,
  warnings jsonb
) AS $$
DECLARE
  v_errors jsonb := '[]'::jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_school RECORD;
BEGIN
  -- Buscar dados da escola
  SELECT * INTO v_school
  FROM schools
  WHERE id = p_school_id;
  
  IF v_school.id IS NULL THEN
    RETURN QUERY SELECT 'failed'::text, jsonb_build_array(jsonb_build_object('rule', 'SCHOOL_NOT_FOUND', 'message', 'Escola não encontrada'))::jsonb, '[]'::jsonb;
    RETURN;
  END IF;
  
  -- Validação: Código INEP obrigatório
  IF v_school.codigo_inep IS NULL OR LENGTH(v_school.codigo_inep) != 8 THEN
    v_errors := v_errors || jsonb_build_object('rule', 'R001', 'message', 'Código INEP da escola é obrigatório e deve ter 8 dígitos');
  END IF;
  
  -- Validação: Nome da escola obrigatório
  IF v_school.school_name IS NULL OR TRIM(v_school.school_name) = '' THEN
    v_errors := v_errors || jsonb_build_object('rule', 'R002', 'message', 'Nome da escola é obrigatório');
  END IF;
  
  -- Validação: Dependência administrativa
  IF v_school.dependencia_administrativa IS NULL THEN
    v_warnings := v_warnings || jsonb_build_object('rule', 'R003', 'message', 'Dependência administrativa não informada');
  END IF;
  
  RETURN QUERY SELECT
    CASE 
      WHEN jsonb_array_length(v_errors) > 0 THEN 'failed'::text
      WHEN jsonb_array_length(v_warnings) > 0 THEN 'warning'::text
      ELSE 'passed'::text
    END,
    v_errors,
    v_warnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.2. Validar dados do aluno para Censo
CREATE OR REPLACE FUNCTION validate_censo_student_data(
  p_student_id uuid
)
RETURNS TABLE (
  validation_status text,
  errors jsonb,
  warnings jsonb
) AS $$
DECLARE
  v_errors jsonb := '[]'::jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_student RECORD;
  v_age integer;
BEGIN
  -- Buscar dados do aluno
  SELECT * INTO v_student
  FROM students
  WHERE id = p_student_id;
  
  IF v_student.id IS NULL THEN
    RETURN QUERY SELECT 'failed'::text, jsonb_build_array(jsonb_build_object('rule', 'STUDENT_NOT_FOUND', 'message', 'Aluno não encontrado'))::jsonb, '[]'::jsonb;
    RETURN;
  END IF;
  
  -- Validação: Nome obrigatório
  IF v_student.name IS NULL OR TRIM(v_student.name) = '' THEN
    v_errors := v_errors || jsonb_build_object('rule', 'R010', 'message', 'Nome do aluno é obrigatório');
  END IF;
  
  -- Validação: Data de nascimento obrigatória
  IF v_student.date_of_birth IS NULL THEN
    v_errors := v_errors || jsonb_build_object('rule', 'R011', 'message', 'Data de nascimento é obrigatória');
  ELSE
    -- Calcular idade
    v_age := EXTRACT(YEAR FROM AGE(v_student.date_of_birth));
    
    -- Validação: Idade compatível com Educação Infantil (0-6 anos)
    -- (Esta é uma validação simplificada - expandir conforme necessário)
  END IF;
  
  -- Validação: CPF (se informado)
  IF v_student.cpf IS NOT NULL AND LENGTH(REPLACE(v_student.cpf, '.', '')) != 11 THEN
    v_warnings := v_warnings || jsonb_build_object('rule', 'R012', 'message', 'CPF deve ter 11 dígitos');
  END IF;
  
  RETURN QUERY SELECT
    CASE 
      WHEN jsonb_array_length(v_errors) > 0 THEN 'failed'::text
      WHEN jsonb_array_length(v_warnings) > 0 THEN 'warning'::text
      ELSE 'passed'::text
    END,
    v_errors,
    v_warnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.3. Criar registro de sincronização
CREATE OR REPLACE FUNCTION create_censo_integration(
  p_school_id uuid,
  p_tenant_id uuid,
  p_academic_year integer,
  p_sync_type text,
  p_sync_date date DEFAULT CURRENT_DATE,
  p_file_format text DEFAULT 'txt'
)
RETURNS uuid AS $$
DECLARE
  v_integration_id uuid;
BEGIN
  INSERT INTO censo_integration (
    school_id,
    tenant_id,
    academic_year,
    sync_type,
    sync_status,
    sync_date,
    file_format,
    created_by
  ) VALUES (
    p_school_id,
    p_tenant_id,
    p_academic_year,
    p_sync_type,
    'pending',
    p_sync_date,
    p_file_format,
    auth.uid()
  )
  RETURNING id INTO v_integration_id;
  
  RETURN v_integration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4. Atualizar status de sincronização
CREATE OR REPLACE FUNCTION update_censo_integration_status(
  p_integration_id uuid,
  p_status text,
  p_file_url text DEFAULT NULL,
  p_file_size bigint DEFAULT NULL,
  p_records_count integer DEFAULT NULL,
  p_success_count integer DEFAULT NULL,
  p_error_count integer DEFAULT NULL,
  p_validation_results jsonb DEFAULT NULL,
  p_inep_validation_code text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE censo_integration
  SET 
    sync_status = p_status,
    last_sync_at = CASE WHEN p_status IN ('completed', 'validated', 'failed') THEN NOW() ELSE last_sync_at END,
    file_url = COALESCE(p_file_url, file_url),
    file_size = COALESCE(p_file_size, file_size),
    records_count = COALESCE(p_records_count, records_count),
    success_count = COALESCE(p_success_count, success_count),
    error_count = COALESCE(p_error_count, error_count),
    validation_results = COALESCE(p_validation_results, validation_results),
    inep_validation_code = COALESCE(p_inep_validation_code, inep_validation_code),
    updated_at = NOW()
  WHERE id = p_integration_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5. Listar sincronizações
CREATE OR REPLACE FUNCTION get_censo_integrations(
  p_school_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL,
  p_academic_year integer DEFAULT NULL,
  p_sync_type text DEFAULT NULL,
  p_sync_status text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  school_id uuid,
  school_name text,
  tenant_id uuid,
  academic_year integer,
  sync_type text,
  sync_status text,
  sync_date date,
  last_sync_at timestamptz,
  file_format text,
  file_url text,
  file_size bigint,
  records_count integer,
  success_count integer,
  error_count integer,
  warning_count integer,
  inep_validation_code text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.school_id,
    sch.school_name,
    ci.tenant_id,
    ci.academic_year,
    ci.sync_type,
    ci.sync_status,
    ci.sync_date,
    ci.last_sync_at,
    ci.file_format,
    ci.file_url,
    ci.file_size,
    ci.records_count,
    ci.success_count,
    ci.error_count,
    ci.warning_count,
    ci.inep_validation_code,
    ci.created_at
  FROM censo_integration ci
  LEFT JOIN schools sch ON sch.id = ci.school_id
  WHERE 
    (p_school_id IS NULL OR ci.school_id = p_school_id)
    AND (p_tenant_id IS NULL OR ci.tenant_id = p_tenant_id)
    AND (p_academic_year IS NULL OR ci.academic_year = p_academic_year)
    AND (p_sync_type IS NULL OR ci.sync_type = p_sync_type)
    AND (p_sync_status IS NULL OR ci.sync_status = p_sync_status)
  ORDER BY ci.sync_date DESC, ci.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 6: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE censo_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE censo_validation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE censo_sync_schedules ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to censo_integration" ON censo_integration;
CREATE POLICY "Superadmin full access to censo_integration"
  ON censo_integration FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Secretário de educação vê sincronizações da rede
DROP POLICY IF EXISTS "Education secretary can view network censo integrations" ON censo_integration;
CREATE POLICY "Education secretary can view network censo integrations"
  ON censo_integration FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid()
      AND ur.role = 'education_secretary'
      AND p.tenant_id = censo_integration.tenant_id
    )
  );

-- Diretores e coordenadores veem sincronizações da escola
DROP POLICY IF EXISTS "School staff can view school censo integrations" ON censo_integration;
CREATE POLICY "School staff can view school censo integrations"
  ON censo_integration FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can manage school censo integrations" ON censo_integration;
CREATE POLICY "School staff can manage school censo integrations"
  ON censo_integration FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('school_director', 'coordinator', 'school_manager')
    )
  );

-- Logs de validação: mesmas regras
DROP POLICY IF EXISTS "Users can view validation logs in their scope" ON censo_validation_log;
CREATE POLICY "Users can view validation logs in their scope"
  ON censo_validation_log FOR SELECT
  USING (
    censo_integration_id IN (
      SELECT id FROM censo_integration
      WHERE school_id IN (
        SELECT school_id FROM profiles WHERE id = auth.uid()
      )
      OR tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
      )
    )
  );

-- Agendamentos: mesmas regras
DROP POLICY IF EXISTS "Users can view sync schedules in their scope" ON censo_sync_schedules;
CREATE POLICY "Users can view sync schedules in their scope"
  ON censo_sync_schedules FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    OR tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can manage sync schedules" ON censo_sync_schedules;
CREATE POLICY "School staff can manage sync schedules"
  ON censo_sync_schedules FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('school_director', 'coordinator', 'school_manager')
    )
  );

-- ============================================================================
-- PARTE 7: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de base da integração com Censo Escolar concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Adicionados códigos INEP nas tabelas (schools, students, professionals, classes, student_enrollments)';
  RAISE NOTICE '  2. ✅ Criada tabela censo_integration (sincronizações)';
  RAISE NOTICE '  3. ✅ Criada tabela censo_validation_log (logs de validação)';
  RAISE NOTICE '  4. ✅ Criada tabela censo_sync_schedules (agendamentos)';
  RAISE NOTICE '  5. ✅ Criados RPCs básicos: validate_censo_school_data, validate_censo_student_data, create_censo_integration, update_censo_integration_status, get_censo_integrations';
  RAISE NOTICE '  6. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Criar interface no app Gestão Escolar (/censo)';
  RAISE NOTICE '  - Implementar geração de arquivos .txt no layout do Inep';
  RAISE NOTICE '  - Expandir validações (500+ regras)';
  RAISE NOTICE '  - Implementar Edge Functions para processamento assíncrono';
END $$;

