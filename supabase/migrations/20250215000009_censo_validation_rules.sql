-- ============================================================================
-- MIGRAÇÃO: Sistema de Validações do Censo Escolar (Estrutura Extensível)
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar tabela censo_validation_rules (Regras de Validação)
--   2. Criar tabela censo_validation_results (Resultados de Validação)
--   3. Criar RPCs para registrar e executar validações
--   4. Inserir regras básicas (exemplos para expansão)
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA censo_validation_rules (Regras de Validação)
-- ============================================================================

CREATE TABLE IF NOT EXISTS censo_validation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação da regra
  rule_code text NOT NULL UNIQUE, -- Ex: "R001", "R015", "R023"
  rule_name text NOT NULL,
  rule_description text,
  
  -- Categoria e prioridade
  category text NOT NULL CHECK (category IN ('format', 'consistency', 'business', 'completeness')),
  entity_type text NOT NULL CHECK (entity_type IN ('school', 'student', 'class', 'professional', 'enrollment', 'all')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Validação
  validation_function text NOT NULL, -- Nome da função SQL ou código da validação
  validation_type text NOT NULL CHECK (validation_type IN ('sql_function', 'javascript', 'custom')),
  
  -- Mensagens
  error_message text NOT NULL,
  warning_message text,
  suggested_fix text,
  
  -- Metadados
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(rule_code, version)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_censo_validation_rules_code ON censo_validation_rules(rule_code);
CREATE INDEX IF NOT EXISTS idx_censo_validation_rules_category ON censo_validation_rules(category, entity_type);
CREATE INDEX IF NOT EXISTS idx_censo_validation_rules_active ON censo_validation_rules(is_active, severity);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_censo_validation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS censo_validation_rules_updated_at_trigger ON censo_validation_rules;
CREATE TRIGGER censo_validation_rules_updated_at_trigger
  BEFORE UPDATE ON censo_validation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_censo_validation_rules_updated_at();

-- Comentários
COMMENT ON TABLE censo_validation_rules IS 
  'Regras de validação do Censo Escolar. Estrutura extensível para 500+ regras.';

-- ============================================================================
-- PARTE 2: TABELA censo_validation_results (Resultados de Validação)
-- ============================================================================

CREATE TABLE IF NOT EXISTS censo_validation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  censo_integration_id uuid REFERENCES censo_integration(id) ON DELETE CASCADE,
  validation_rule_id uuid REFERENCES censo_validation_rules(id) ON DELETE SET NULL,
  rule_code text, -- Mantido para histórico mesmo se regra for removida
  
  -- Entidade validada
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  
  -- Resultado
  validation_status text NOT NULL CHECK (validation_status IN ('passed', 'failed', 'warning')),
  error_details jsonb DEFAULT '{}'::jsonb,
  
  -- Correção
  is_fixed boolean DEFAULT false,
  fixed_at timestamptz,
  fixed_by uuid REFERENCES profiles(id),
  fixed_data jsonb, -- Dados após correção
  
  -- Metadados
  validated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_censo_validation_results_integration ON censo_validation_results(censo_integration_id, validation_status);
CREATE INDEX IF NOT EXISTS idx_censo_validation_results_entity ON censo_validation_results(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_censo_validation_results_rule ON censo_validation_results(rule_code);
CREATE INDEX IF NOT EXISTS idx_censo_validation_results_status ON censo_validation_results(validation_status, validated_at DESC);
CREATE INDEX IF NOT EXISTS idx_censo_validation_results_fixed ON censo_validation_results(is_fixed, fixed_at);

-- Comentários
COMMENT ON TABLE censo_validation_results IS 
  'Resultados de validações do Censo. Registra cada validação aplicada a cada entidade.';

-- ============================================================================
-- PARTE 3: FUNÇÕES DE VALIDAÇÃO (Exemplos - Expandir para 500+)
-- ============================================================================

-- 3.1. Validação R001: Código INEP da escola obrigatório e formato
CREATE OR REPLACE FUNCTION validate_r001_school_inep_code(p_school_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_codigo_inep text;
  v_result jsonb;
BEGIN
  SELECT codigo_inep INTO v_codigo_inep
  FROM schools
  WHERE id = p_school_id;
  
  IF v_codigo_inep IS NULL OR TRIM(v_codigo_inep) = '' THEN
    v_result := jsonb_build_object(
      'status', 'failed',
      'error', 'Código INEP da escola é obrigatório',
      'suggested_fix', 'Informar o código INEP de 8 dígitos da escola'
    );
  ELSIF LENGTH(REPLACE(v_codigo_inep, ' ', '')) != 8 OR NOT (REPLACE(v_codigo_inep, ' ', '') ~ '^[0-9]+$') THEN
    v_result := jsonb_build_object(
      'status', 'failed',
      'error', 'Código INEP deve ter exatamente 8 dígitos numéricos',
      'suggested_fix', 'Corrigir o código INEP para 8 dígitos numéricos'
    );
  ELSE
    v_result := jsonb_build_object('status', 'passed');
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3.2. Validação R010: Nome do aluno obrigatório
CREATE OR REPLACE FUNCTION validate_r010_student_name(p_student_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_name text;
  v_result jsonb;
BEGIN
  SELECT name INTO v_name
  FROM students
  WHERE id = p_student_id;
  
  IF v_name IS NULL OR TRIM(v_name) = '' THEN
    v_result := jsonb_build_object(
      'status', 'failed',
      'error', 'Nome do aluno é obrigatório',
      'suggested_fix', 'Informar o nome completo do aluno'
    );
  ELSIF LENGTH(TRIM(v_name)) < 3 THEN
    v_result := jsonb_build_object(
      'status', 'warning',
      'error', 'Nome do aluno muito curto (mínimo 3 caracteres)',
      'suggested_fix', 'Verificar se o nome está completo'
    );
  ELSE
    v_result := jsonb_build_object('status', 'passed');
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3.3. Validação R011: Data de nascimento obrigatória e válida
CREATE OR REPLACE FUNCTION validate_r011_student_birth_date(p_student_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_date_of_birth date;
  v_age integer;
  v_result jsonb;
BEGIN
  SELECT date_of_birth INTO v_date_of_birth
  FROM students
  WHERE id = p_student_id;
  
  IF v_date_of_birth IS NULL THEN
    v_result := jsonb_build_object(
      'status', 'failed',
      'error', 'Data de nascimento é obrigatória',
      'suggested_fix', 'Informar a data de nascimento do aluno'
    );
  ELSIF v_date_of_birth > CURRENT_DATE THEN
    v_result := jsonb_build_object(
      'status', 'failed',
      'error', 'Data de nascimento não pode ser futura',
      'suggested_fix', 'Corrigir a data de nascimento'
    );
  ELSE
    v_age := EXTRACT(YEAR FROM AGE(v_date_of_birth));
    IF v_age < 0 OR v_age > 120 THEN
      v_result := jsonb_build_object(
        'status', 'warning',
        'error', 'Idade calculada parece inválida',
        'suggested_fix', 'Verificar a data de nascimento'
      );
    ELSE
      v_result := jsonb_build_object('status', 'passed');
    END IF;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3.4. Validação R015: Alunos de EJA devem ter idade mínima de 15 anos
CREATE OR REPLACE FUNCTION validate_r015_eja_minimum_age(p_student_id uuid, p_class_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_date_of_birth date;
  v_age integer;
  v_education_level text;
  v_result jsonb;
BEGIN
  SELECT s.date_of_birth, c.education_level
  INTO v_date_of_birth, v_education_level
  FROM students s
  LEFT JOIN classes c ON c.id = p_class_id
  WHERE s.id = p_student_id;
  
  IF v_education_level IS NULL OR v_education_level NOT LIKE '%EJA%' THEN
    RETURN jsonb_build_object('status', 'passed'); -- Não se aplica
  END IF;
  
  IF v_date_of_birth IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error', 'Não é possível validar idade sem data de nascimento',
      'suggested_fix', 'Informar data de nascimento'
    );
  END IF;
  
  v_age := EXTRACT(YEAR FROM AGE(v_date_of_birth));
  
  IF v_age < 15 THEN
    v_result := jsonb_build_object(
      'status', 'failed',
      'error', 'Alunos de EJA devem ter idade mínima de 15 anos',
      'suggested_fix', format('Aluno tem %s anos. Verificar modalidade de ensino.', v_age)
    );
  ELSE
    v_result := jsonb_build_object('status', 'passed');
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3.5. Validação R023: Docente deve ter formação compatível com disciplina
CREATE OR REPLACE FUNCTION validate_r023_teacher_qualification(p_professional_id uuid, p_subject_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_formation text;
  v_subject_name text;
  v_result jsonb;
BEGIN
  SELECT p.formation, s.subject_name
  INTO v_formation, v_subject_name
  FROM professionals p
  CROSS JOIN subjects s
  WHERE p.id = p_professional_id AND s.id = p_subject_id;
  
  -- Validação simplificada (expandir conforme regras específicas)
  IF v_formation IS NULL OR TRIM(v_formation) = '' THEN
    v_result := jsonb_build_object(
      'status', 'warning',
      'error', 'Formação do docente não informada',
      'suggested_fix', 'Informar a formação acadêmica do docente'
    );
  ELSE
    v_result := jsonb_build_object('status', 'passed');
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3.6. Validação R047: Escolas urbanas devem informar transporte apenas se ofertado
CREATE OR REPLACE FUNCTION validate_r047_urban_school_transport(p_school_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_location_type text;
  v_has_transport boolean;
  v_result jsonb;
BEGIN
  SELECT location_type, has_transport
  INTO v_location_type, v_has_transport
  FROM schools
  WHERE id = p_school_id;
  
  IF v_location_type = 'urban' AND v_has_transport IS NULL THEN
    v_result := jsonb_build_object(
      'status', 'warning',
      'error', 'Escola urbana deve informar se oferta transporte escolar',
      'suggested_fix', 'Informar se a escola oferta transporte escolar'
    );
  ELSE
    v_result := jsonb_build_object('status', 'passed');
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3.7. Validação R089: Alunos com deficiência devem ter recursos de acessibilidade informados
CREATE OR REPLACE FUNCTION validate_r089_disability_accessibility(p_student_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_has_disability boolean;
  v_accessibility_resources text[];
  v_result jsonb;
BEGIN
  SELECT 
    (necessidades_especiais IS NOT NULL AND necessidades_especiais = true),
    recursos_acessibilidade
  INTO v_has_disability, v_accessibility_resources
  FROM students
  WHERE id = p_student_id;
  
  IF v_has_disability AND (v_accessibility_resources IS NULL OR array_length(v_accessibility_resources, 1) = 0) THEN
    v_result := jsonb_build_object(
      'status', 'failed',
      'error', 'Alunos com deficiência devem ter recursos de acessibilidade informados',
      'suggested_fix', 'Informar os recursos de acessibilidade necessários para o aluno'
    );
  ELSE
    v_result := jsonb_build_object('status', 'passed');
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 4: RPCs PARA GERENCIAR VALIDAÇÕES
-- ============================================================================

-- 4.1. Registrar regra de validação
CREATE OR REPLACE FUNCTION register_censo_validation_rule(
  p_rule_code text,
  p_rule_name text,
  p_rule_description text DEFAULT NULL,
  p_category text,
  p_entity_type text,
  p_severity text DEFAULT 'medium',
  p_validation_function text,
  p_validation_type text DEFAULT 'sql_function',
  p_error_message text,
  p_warning_message text DEFAULT NULL,
  p_suggested_fix text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_rule_id uuid;
BEGIN
  INSERT INTO censo_validation_rules (
    rule_code,
    rule_name,
    rule_description,
    category,
    entity_type,
    severity,
    validation_function,
    validation_type,
    error_message,
    warning_message,
    suggested_fix
  ) VALUES (
    p_rule_code,
    p_rule_name,
    p_rule_description,
    p_category,
    p_entity_type,
    p_severity,
    p_validation_function,
    p_validation_type,
    p_error_message,
    p_warning_message,
    p_suggested_fix
  )
  ON CONFLICT (rule_code, version)
  DO UPDATE SET
    rule_name = EXCLUDED.rule_name,
    rule_description = EXCLUDED.rule_description,
    category = EXCLUDED.category,
    entity_type = EXCLUDED.entity_type,
    severity = EXCLUDED.severity,
    validation_function = EXCLUDED.validation_function,
    validation_type = EXCLUDED.validation_type,
    error_message = EXCLUDED.error_message,
    warning_message = EXCLUDED.warning_message,
    suggested_fix = EXCLUDED.suggested_fix,
    updated_at = NOW()
  RETURNING id INTO v_rule_id;
  
  RETURN v_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2. Executar validação em lote
CREATE OR REPLACE FUNCTION execute_censo_validation(
  p_censo_integration_id uuid,
  p_entity_type text,
  p_entity_ids uuid[],
  p_rule_codes text[] DEFAULT NULL -- Se NULL, executa todas as regras ativas
)
RETURNS integer AS $$
DECLARE
  v_rule RECORD;
  v_entity_id uuid;
  v_result jsonb;
  v_status text;
  v_count integer := 0;
BEGIN
  -- Iterar sobre regras
  FOR v_rule IN 
    SELECT * FROM censo_validation_rules
    WHERE is_active = true
    AND (p_rule_codes IS NULL OR rule_code = ANY(p_rule_codes))
    AND (entity_type = p_entity_type OR entity_type = 'all')
    ORDER BY severity DESC, rule_code
  LOOP
    -- Iterar sobre entidades
    FOREACH v_entity_id IN ARRAY p_entity_ids
    LOOP
      -- Executar função de validação
      BEGIN
        EXECUTE format('SELECT %I($1)', v_rule.validation_function)
        USING v_entity_id
        INTO v_result;
        
        v_status := v_result->>'status';
        
        -- Registrar resultado
        INSERT INTO censo_validation_results (
          censo_integration_id,
          validation_rule_id,
          rule_code,
          entity_type,
          entity_id,
          validation_status,
          error_details
        ) VALUES (
          p_censo_integration_id,
          v_rule.id,
          v_rule.rule_code,
          p_entity_type,
          v_entity_id,
          v_status,
          v_result
        );
        
        v_count := v_count + 1;
      EXCEPTION WHEN OTHERS THEN
        -- Registrar erro na execução da validação
        INSERT INTO censo_validation_results (
          censo_integration_id,
          validation_rule_id,
          rule_code,
          entity_type,
          entity_id,
          validation_status,
          error_details
        ) VALUES (
          p_censo_integration_id,
          v_rule.id,
          v_rule.rule_code,
          p_entity_type,
          v_entity_id,
          'failed',
          jsonb_build_object('error', SQLERRM)
        );
      END;
    END LOOP;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3. Inserir regras básicas (exemplos)
DO $$
BEGIN
  -- R001: Código INEP da escola
  PERFORM register_censo_validation_rule(
    'R001', 'Código INEP da escola obrigatório',
    'O código INEP da escola é obrigatório e deve ter 8 dígitos numéricos',
    'format', 'school', 'critical',
    'validate_r001_school_inep_code', 'sql_function',
    'Código INEP da escola é obrigatório',
    NULL,
    'Informar o código INEP de 8 dígitos da escola'
  );
  
  -- R010: Nome do aluno
  PERFORM register_censo_validation_rule(
    'R010', 'Nome do aluno obrigatório',
    'O nome completo do aluno é obrigatório e deve ter pelo menos 3 caracteres',
    'completeness', 'student', 'critical',
    'validate_r010_student_name', 'sql_function',
    'Nome do aluno é obrigatório',
    'Nome do aluno muito curto',
    'Informar o nome completo do aluno'
  );
  
  -- R011: Data de nascimento
  PERFORM register_censo_validation_rule(
    'R011', 'Data de nascimento válida',
    'A data de nascimento é obrigatória e deve ser uma data válida no passado',
    'format', 'student', 'critical',
    'validate_r011_student_birth_date', 'sql_function',
    'Data de nascimento é obrigatória',
    'Data de nascimento parece inválida',
    'Informar a data de nascimento correta do aluno'
  );
  
  -- R015: Idade mínima EJA
  PERFORM register_censo_validation_rule(
    'R015', 'Idade mínima para EJA',
    'Alunos de EJA devem ter idade mínima de 15 anos',
    'business', 'student', 'high',
    'validate_r015_eja_minimum_age', 'sql_function',
    'Alunos de EJA devem ter idade mínima de 15 anos',
    NULL,
    'Verificar modalidade de ensino ou data de nascimento'
  );
  
  -- R023: Formação docente
  PERFORM register_censo_validation_rule(
    'R023', 'Formação docente compatível',
    'Docente deve ter formação compatível com a disciplina lecionada',
    'business', 'professional', 'medium',
    'validate_r023_teacher_qualification', 'sql_function',
    'Formação do docente não informada',
    'Formação pode não ser compatível com a disciplina',
    'Verificar formação acadêmica do docente'
  );
  
  -- R047: Transporte escolar urbano
  PERFORM register_censo_validation_rule(
    'R047', 'Transporte escolar em escolas urbanas',
    'Escolas urbanas devem informar se ofertam transporte escolar',
    'completeness', 'school', 'low',
    'validate_r047_urban_school_transport', 'sql_function',
    NULL,
    'Escola urbana deve informar se oferta transporte',
    'Informar se a escola oferta transporte escolar'
  );
  
  -- R089: Recursos de acessibilidade
  PERFORM register_censo_validation_rule(
    'R089', 'Recursos de acessibilidade para alunos com deficiência',
    'Alunos com deficiência devem ter recursos de acessibilidade informados',
    'completeness', 'student', 'high',
    'validate_r089_disability_accessibility', 'sql_function',
    'Recursos de acessibilidade não informados',
    NULL,
    'Informar os recursos de acessibilidade necessários'
  );
END $$;

-- ============================================================================
-- PARTE 5: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE censo_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE censo_validation_results ENABLE ROW LEVEL SECURITY;

-- Regras: apenas leitura para usuários autorizados
DROP POLICY IF EXISTS "Users can view validation rules" ON censo_validation_rules;
CREATE POLICY "Users can view validation rules"
  ON censo_validation_rules FOR SELECT
  USING (true); -- Regras são públicas para consulta

DROP POLICY IF EXISTS "Superadmin can manage validation rules" ON censo_validation_rules;
CREATE POLICY "Superadmin can manage validation rules"
  ON censo_validation_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Resultados: mesmas regras de censo_integration
DROP POLICY IF EXISTS "Users can view validation results in their scope" ON censo_validation_results;
CREATE POLICY "Users can view validation results in their scope"
  ON censo_validation_results FOR SELECT
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

-- ============================================================================
-- PARTE 6: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de sistema de validações do Censo concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela censo_validation_rules (estrutura extensível)';
  RAISE NOTICE '  2. ✅ Criada tabela censo_validation_results (resultados)';
  RAISE NOTICE '  3. ✅ Criadas 7 funções de validação de exemplo (R001, R010, R011, R015, R023, R047, R089)';
  RAISE NOTICE '  4. ✅ Criados RPCs: register_censo_validation_rule, execute_censo_validation';
  RAISE NOTICE '  5. ✅ Inseridas 7 regras básicas como exemplo';
  RAISE NOTICE '  6. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Expandir para 500+ regras usando a mesma estrutura';
  RAISE NOTICE '  - Criar interface para gerenciar regras';
  RAISE NOTICE '  - Implementar validações em lote otimizadas';
END $$;

