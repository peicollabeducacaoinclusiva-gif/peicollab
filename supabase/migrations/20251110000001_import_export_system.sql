-- ============================================================================
-- SISTEMA DE IMPORTAÇÃO E EXPORTAÇÃO EM LOTE
-- Data: 10/11/2025
-- App: Gestão Escolar (Hub Central)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CONFIGURAÇÕES DE IMPORTAÇÃO
-- ----------------------------------------------------------------------------

-- Configurações salvas de importação (templates reutilizáveis)
CREATE TABLE IF NOT EXISTS import_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source_system VARCHAR(100), -- 'egrafite', 'outro_sistema', 'custom'
  file_format VARCHAR(20) NOT NULL, -- 'csv', 'json', 'xlsx'
  field_mappings JSONB NOT NULL DEFAULT '{}', -- Mapeamento origem→destino
  validation_rules JSONB DEFAULT '{}', -- Regras de validação
  duplicate_strategy VARCHAR(50) DEFAULT 'ask', -- 'skip', 'overwrite', 'ask', 'create_new'
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_import_configs_tenant ON import_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_import_configs_source ON import_configs(source_system);

-- ----------------------------------------------------------------------------
-- 2. LOTES DE IMPORTAÇÃO (Histórico)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS import_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID REFERENCES import_configs(id) ON DELETE SET NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT, -- bytes
  file_format VARCHAR(20) NOT NULL,
  total_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  duplicate_records INTEGER DEFAULT 0,
  skipped_records INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed, cancelled
  error_log JSONB DEFAULT '[]', -- Array de erros
  warnings_log JSONB DEFAULT '[]', -- Array de warnings
  summary JSONB DEFAULT '{}', -- Resumo da importação
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_import_batches_tenant ON import_batches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_school ON import_batches(school_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_created_by ON import_batches(created_by);

-- ----------------------------------------------------------------------------
-- 3. REGISTROS DE IMPORTAÇÃO (Detalhes por linha)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS import_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES import_batches(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  record_type VARCHAR(50) NOT NULL, -- 'student', 'professional', 'user', 'class', etc.
  source_data JSONB NOT NULL, -- Dados originais do arquivo
  mapped_data JSONB, -- Dados após mapeamento
  target_id UUID, -- ID do registro criado/atualizado
  status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed, skipped, duplicate
  action_taken VARCHAR(50), -- created, updated, skipped, merged
  error_message TEXT,
  warnings JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_import_records_batch ON import_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_records_status ON import_records(status);
CREATE INDEX IF NOT EXISTS idx_import_records_type ON import_records(record_type);

-- ----------------------------------------------------------------------------
-- 4. REGRAS DE VALIDAÇÃO PERSONALIZÁVEIS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS validation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  field_name VARCHAR(100) NOT NULL, -- Campo a ser validado
  record_type VARCHAR(50) NOT NULL, -- 'student', 'professional', etc.
  rule_type VARCHAR(50) NOT NULL, -- 'required', 'regex', 'range', 'unique', 'cpf', 'email', etc.
  rule_config JSONB NOT NULL, -- Configuração da regra
  severity VARCHAR(20) DEFAULT 'error', -- 'error', 'warning', 'info'
  error_message TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_validation_rules_tenant ON validation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_validation_rules_record_type ON validation_rules(record_type);
CREATE INDEX IF NOT EXISTS idx_validation_rules_field ON validation_rules(field_name);

-- ----------------------------------------------------------------------------
-- 5. MAPEAMENTOS DE CAMPOS (Source → Target)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS field_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID REFERENCES import_configs(id) ON DELETE CASCADE,
  source_field VARCHAR(255) NOT NULL, -- Nome do campo no arquivo de origem
  target_field VARCHAR(255) NOT NULL, -- Nome do campo no banco de dados
  target_table VARCHAR(100) NOT NULL, -- Tabela de destino
  transform_function VARCHAR(100), -- Função de transformação (uppercase, lowercase, date_format, etc.)
  transform_params JSONB, -- Parâmetros da transformação
  default_value TEXT, -- Valor padrão se campo vazio
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_field_mappings_config ON field_mappings(config_id);
CREATE INDEX IF NOT EXISTS idx_field_mappings_target_table ON field_mappings(target_table);

-- ----------------------------------------------------------------------------
-- 6. LOTES DE EXPORTAÇÃO (Histórico)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS export_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  export_name VARCHAR(255) NOT NULL,
  export_type VARCHAR(50) NOT NULL, -- 'educacenso', 'csv', 'excel', 'json'
  file_format VARCHAR(20) NOT NULL,
  filters JSONB DEFAULT '{}', -- Filtros aplicados
  fields_selected JSONB DEFAULT '[]', -- Campos selecionados para exportação
  total_records INTEGER DEFAULT 0,
  file_url TEXT, -- URL do arquivo gerado (se armazenado)
  file_size BIGINT,
  status VARCHAR(50) DEFAULT 'processing',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_export_batches_tenant ON export_batches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_export_batches_school ON export_batches(school_id);
CREATE INDEX IF NOT EXISTS idx_export_batches_type ON export_batches(export_type);
CREATE INDEX IF NOT EXISTS idx_export_batches_created_by ON export_batches(created_by);

-- ----------------------------------------------------------------------------
-- 7. RLS (Row Level Security)
-- ----------------------------------------------------------------------------

ALTER TABLE import_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_batches ENABLE ROW LEVEL SECURITY;

-- Políticas para import_configs
CREATE POLICY "Usuários podem ver configs do seu tenant"
  ON import_configs FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coordenadores e admins podem criar configs"
  ON import_configs FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('superadmin', 'coordinator', 'school_director', 'education_secretary')
    )
  );

CREATE POLICY "Coordenadores podem atualizar configs"
  ON import_configs FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('superadmin', 'coordinator', 'school_director', 'education_secretary')
    )
  );

-- Políticas para import_batches
CREATE POLICY "Usuários podem ver importações do seu tenant"
  ON import_batches FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coordenadores podem criar importações"
  ON import_batches FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('superadmin', 'coordinator', 'school_director', 'education_secretary')
    )
  );

-- Políticas para import_records
CREATE POLICY "Usuários podem ver registros de importações do seu tenant"
  ON import_records FOR SELECT
  USING (
    batch_id IN (
      SELECT id FROM import_batches 
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
      )
    )
  );

-- Políticas para validation_rules
CREATE POLICY "Todos podem ver regras de validação do seu tenant"
  ON validation_rules FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem gerenciar regras de validação"
  ON validation_rules FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('superadmin', 'education_secretary')
    )
  );

-- Políticas para field_mappings
CREATE POLICY "Usuários podem ver mapeamentos"
  ON field_mappings FOR SELECT
  USING (
    config_id IN (
      SELECT id FROM import_configs 
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
      )
    )
  );

-- Políticas para export_batches
CREATE POLICY "Usuários podem ver exportações do seu tenant"
  ON export_batches FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coordenadores podem criar exportações"
  ON export_batches FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('superadmin', 'coordinator', 'school_director', 'education_secretary')
    )
  );

-- ----------------------------------------------------------------------------
-- 8. FUNÇÕES AUXILIARES
-- ----------------------------------------------------------------------------

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_import_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para import_configs
DROP TRIGGER IF EXISTS trigger_update_import_config_updated_at ON import_configs;
CREATE TRIGGER trigger_update_import_config_updated_at
  BEFORE UPDATE ON import_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_import_config_updated_at();

-- ----------------------------------------------------------------------------
-- 9. TEMPLATES PRÉ-CONFIGURADOS
-- ----------------------------------------------------------------------------

-- Template para E-grafite (simplificado - alunos)
INSERT INTO import_configs (name, description, source_system, file_format, field_mappings, tenant_id) VALUES
(
  'E-grafite - Alunos (Simplificado)',
  'Importação simplificada de alunos do E-grafite',
  'egrafite',
  'csv',
  '{
    "Matrícula": {"target": "registration_number", "table": "students"},
    "Aluno(a)": {"target": "name", "table": "students", "required": true},
    "Código Identificador": {"target": "codigo_identificador", "table": "students"},
    "Situação Acadêmica": {"target": "status_matricula", "table": "students"},
    "Curso": {"target": "class_name", "table": "students"},
    "ANO": {"target": "grade", "table": "student_enrollments"},
    "Turma": {"target": "class_name", "table": "student_enrollments"},
    "Código INEP": {"target": "student_id", "table": "students"},
    "Número Bolsa Família": {"target": "numero_bolsa_familia", "table": "students"},
    "Responsável": {"target": "guardian_name", "table": "students"},
    "Série": {"target": "grade", "table": "student_enrollments"},
    "Ano Letivo": {"target": "academic_year", "table": "student_enrollments"}
  }'::JSONB,
  NULL
) ON CONFLICT DO NOTHING;

-- Template para E-grafite (colaboradores/profissionais)
INSERT INTO import_configs (name, description, source_system, file_format, field_mappings, tenant_id) VALUES
(
  'E-grafite - Colaboradores',
  'Importação de colaboradores/profissionais do E-grafite',
  'egrafite',
  'csv',
  '{
    "Código do Colaborador": {"target": "registration_number", "table": "professionals"},
    "Nome": {"target": "full_name", "table": "professionals", "required": true},
    "Função": {"target": "professional_role", "table": "professionals"},
    "Data de Admissão": {"target": "hire_date", "table": "professionals"},
    "Data de Demissão": {"target": "termination_date", "table": "professionals"},
    "CPF": {"target": "cpf", "table": "professionals"}
  }'::JSONB,
  NULL
) ON CONFLICT DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE import_configs IS 'Configurações salvas de importação (templates reutilizáveis)';
COMMENT ON TABLE import_batches IS 'Histórico de importações em lote';
COMMENT ON TABLE import_records IS 'Detalhes de cada registro importado';
COMMENT ON TABLE validation_rules IS 'Regras de validação personalizáveis por campo';
COMMENT ON TABLE field_mappings IS 'Mapeamentos detalhados de campos origem→destino';
COMMENT ON TABLE export_batches IS 'Histórico de exportações realizadas';















