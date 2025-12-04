-- ============================================================================
-- MIGRAÇÃO: Banco de Estratégias e Atividades AEE por Deficiência
-- Data: 25/02/2025
-- Descrição: Criar bancos de estratégias e atividades padronizadas
-- ============================================================================

-- ============================================================================
-- PARTE 1: Banco de Estratégias AEE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_strategy_bank" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "disability_type" text NOT NULL,
    "stage" text, -- 'infantil', 'fundamental_anos_iniciais', etc.
    "strategy_name" text NOT NULL,
    "strategy_description" text NOT NULL,
    "category" text, -- 'comunicacao', 'socializacao', 'academico', 'funcional'
    "implementation_steps" text[],
    "resources_needed" text[],
    "expected_outcomes" text[],
    "usage_count" integer DEFAULT 0,
    "enabled" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_strategy_bank_disability" ON "public"."aee_strategy_bank"("disability_type");
CREATE INDEX IF NOT EXISTS "idx_aee_strategy_bank_stage" ON "public"."aee_strategy_bank"("stage");
CREATE INDEX IF NOT EXISTS "idx_aee_strategy_bank_category" ON "public"."aee_strategy_bank"("category");
CREATE INDEX IF NOT EXISTS "idx_aee_strategy_bank_tenant" ON "public"."aee_strategy_bank"("tenant_id");

-- ============================================================================
-- PARTE 2: Banco de Atividades AEE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_activity_bank" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "disability_type" text NOT NULL,
    "stage" text,
    "activity_name" text NOT NULL,
    "activity_description" text NOT NULL,
    "category" text,
    "duration_minutes" integer,
    "materials" text[],
    "instructions" text,
    "adaptations" jsonb DEFAULT '{}'::jsonb,
    "linked_strategies" uuid[],
    "usage_count" integer DEFAULT 0,
    "enabled" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_activity_bank_disability" ON "public"."aee_activity_bank"("disability_type");
CREATE INDEX IF NOT EXISTS "idx_aee_activity_bank_stage" ON "public"."aee_activity_bank"("stage");
CREATE INDEX IF NOT EXISTS "idx_aee_activity_bank_category" ON "public"."aee_activity_bank"("category");
CREATE INDEX IF NOT EXISTS "idx_aee_activity_bank_tenant" ON "public"."aee_activity_bank"("tenant_id");

-- ============================================================================
-- PARTE 3: Inserir estratégias padrão
-- ============================================================================

-- Estratégias para Deficiência Intelectual
INSERT INTO "public"."aee_strategy_bank" (disability_type, stage, strategy_name, strategy_description, category, implementation_steps, resources_needed)
VALUES
    ('deficiencia_intelectual', 'fundamental_anos_iniciais', 
     'Instrução Direta e Explícita',
     'Metodologia de ensino estruturada com modelagem, prática guiada e prática independente',
     'academico',
     ARRAY['Modelagem do professor', 'Prática guiada com feedback', 'Prática independente', 'Generalização'],
     ARRAY['Material concreto', 'Organizadores visuais', 'Checklist'])
ON CONFLICT DO NOTHING;

-- Estratégias para Autismo
INSERT INTO "public"."aee_strategy_bank" (disability_type, stage, strategy_name, strategy_description, category, implementation_steps, resources_needed)
VALUES
    ('autismo', 'fundamental_anos_iniciais',
     'História Social',
     'Narrativas visuais que explicam situações sociais e comportamentos esperados',
     'socializacao',
     ARRAY['Identificar situação', 'Criar história visual', 'Ler com aluno', 'Praticar situação', 'Generalizar'],
     ARRAY['Histórias sociais', 'Imagens', 'Suporte visual'])
ON CONFLICT DO NOTHING;

-- Estratégias para TDAH
INSERT INTO "public"."aee_strategy_bank" (disability_type, stage, strategy_name, strategy_description, category, implementation_steps, resources_needed)
VALUES
    ('tdah', 'fundamental_anos_iniciais',
     'Estruturação de Tarefas',
     'Dividir tarefas em etapas menores e fornecer pausas programadas',
     'academico',
     ARRAY['Dividir em etapas', 'Criar checklist', 'Definir pausas', 'Monitorar progresso'],
     ARRAY['Checklist', 'Timer', 'Agenda visual'])
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 4: Inserir atividades padrão
-- ============================================================================

-- Atividades para Deficiência Intelectual
INSERT INTO "public"."aee_activity_bank" (disability_type, stage, activity_name, activity_description, category, duration_minutes, materials, instructions)
VALUES
    ('deficiencia_intelectual', 'fundamental_anos_iniciais',
     'Leitura com Material Concreto',
     'Atividade de leitura utilizando objetos e imagens para facilitar compreensão',
     'academico',
     30,
     ARRAY['Objetos reais', 'Imagens', 'Palavras escritas'],
     'Apresentar objeto/imagem, associar à palavra escrita, praticar leitura')
ON CONFLICT DO NOTHING;

-- Atividades para Autismo
INSERT INTO "public"."aee_activity_bank" (disability_type, stage, activity_name, activity_description, category, duration_minutes, materials, instructions)
VALUES
    ('autismo', 'fundamental_anos_iniciais',
     'Jogo de Interação Social',
     'Atividade estruturada para desenvolver habilidades de interação',
     'socializacao',
     20,
     ARRAY['Jogos cooperativos', 'Roteiro visual', 'Suporte de pares'],
     'Estruturar jogo com regras claras, usar roteiro visual, incluir pares')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 5: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."aee_strategy_bank" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."aee_activity_bank" TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."aee_strategy_bank" IS 'Banco de estratégias AEE padronizadas por deficiência';
COMMENT ON TABLE "public"."aee_activity_bank" IS 'Banco de atividades AEE padronizadas por deficiência';

