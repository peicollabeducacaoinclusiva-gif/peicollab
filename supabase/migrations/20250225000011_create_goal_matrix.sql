-- ============================================================================
-- MIGRAÇÃO: Matriz de Metas Reutilizável
-- Data: 25/02/2025
-- Descrição: Criar tabelas para templates de metas e adaptações reutilizáveis
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Templates de Metas
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."goal_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "disability_type" text NOT NULL, -- 'deficiencia_intelectual', 'autismo', 'tdah', etc.
    "stage" text, -- 'infantil', 'fundamental_anos_iniciais', 'fundamental_anos_finais', 'medio'
    "goal_category" text NOT NULL, -- 'academic', 'functional', 'social', 'communication'
    "goal_schema" jsonb NOT NULL, -- Schema normalizado da meta
    "title" text NOT NULL,
    "description" text NOT NULL,
    "suggested_strategies" text[],
    "suggested_resources" text[],
    "suggested_adaptations" text[],
    "enabled" boolean DEFAULT true,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_goal_templates_disability" ON "public"."goal_templates"("disability_type");
CREATE INDEX IF NOT EXISTS "idx_goal_templates_stage" ON "public"."goal_templates"("stage");
CREATE INDEX IF NOT EXISTS "idx_goal_templates_category" ON "public"."goal_templates"("goal_category");
CREATE INDEX IF NOT EXISTS "idx_goal_templates_tenant" ON "public"."goal_templates"("tenant_id");

-- ============================================================================
-- PARTE 2: Tabela de Templates de Adaptações
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."adaptation_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "disability_type" text NOT NULL,
    "stage" text,
    "adaptation_type" text NOT NULL, -- 'curricular', 'metodologica', 'avaliacao', 'fisica'
    "adaptation_schema" jsonb NOT NULL,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "resources_needed" text[],
    "implementation_notes" text,
    "enabled" boolean DEFAULT true,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_adaptation_templates_disability" ON "public"."adaptation_templates"("disability_type");
CREATE INDEX IF NOT EXISTS "idx_adaptation_templates_type" ON "public"."adaptation_templates"("adaptation_type");
CREATE INDEX IF NOT EXISTS "idx_adaptation_templates_tenant" ON "public"."adaptation_templates"("tenant_id");

-- ============================================================================
-- PARTE 3: Tabela de Metas Criadas a partir de Templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."goal_template_usage" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "goal_id" uuid NOT NULL REFERENCES "public"."pei_goals"("id") ON DELETE CASCADE,
    "template_id" uuid REFERENCES "public"."goal_templates"("id") ON DELETE SET NULL,
    "customizations" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_goal_template_usage_goal" ON "public"."goal_template_usage"("goal_id");
CREATE INDEX IF NOT EXISTS "idx_goal_template_usage_template" ON "public"."goal_template_usage"("template_id");

-- ============================================================================
-- PARTE 4: Função para buscar templates de metas
-- ============================================================================

CREATE OR REPLACE FUNCTION get_goal_templates(
    p_disability_type text,
    p_stage text DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    goal_schema jsonb,
    suggested_strategies text[],
    suggested_resources text[],
    suggested_adaptations text[],
    usage_count integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gt.id,
        gt.title,
        gt.description,
        gt.goal_schema,
        gt.suggested_strategies,
        gt.suggested_resources,
        gt.suggested_adaptations,
        gt.usage_count
    FROM "public"."goal_templates" gt
    WHERE gt.disability_type = p_disability_type
    AND gt.enabled = true
    AND (p_stage IS NULL OR gt.stage = p_stage)
    AND (p_category IS NULL OR gt.goal_category = p_category)
    AND (p_tenant_id IS NULL OR gt.tenant_id = p_tenant_id OR gt.tenant_id IS NULL)
    ORDER BY gt.usage_count DESC, gt.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 5: Função para criar meta a partir de template
-- ============================================================================

CREATE OR REPLACE FUNCTION create_goal_from_template(
    p_pei_id uuid,
    p_template_id uuid,
    p_customizations jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
    v_template record;
    v_goal_id uuid;
    v_schema jsonb;
BEGIN
    -- Buscar template
    SELECT * INTO v_template
    FROM "public"."goal_templates"
    WHERE id = p_template_id
    AND enabled = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template não encontrado ou desabilitado';
    END IF;

    -- Aplicar customizações ao schema
    v_schema := v_template.goal_schema;
    IF p_customizations IS NOT NULL AND jsonb_typeof(p_customizations) = 'object' THEN
        v_schema := v_schema || p_customizations;
    END IF;

    -- Criar meta
    INSERT INTO "public"."pei_goals" (
        pei_id,
        description,
        category,
        barrier_id,
        target_date,
        progress_level
    )
    VALUES (
        p_pei_id,
        COALESCE((v_schema->>'description')::text, v_template.title),
        COALESCE((v_schema->>'category')::text, 'academic')::text,
        NULL,
        (v_schema->>'target_date')::date,
        'não iniciada'
    )
    RETURNING id INTO v_goal_id;

    -- Registrar uso do template
    INSERT INTO "public"."goal_template_usage" (goal_id, template_id, customizations)
    VALUES (v_goal_id, p_template_id, p_customizations);

    -- Incrementar contador de uso
    UPDATE "public"."goal_templates"
    SET usage_count = usage_count + 1
    WHERE id = p_template_id;

    RETURN v_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 6: Inserir templates padrão
-- ============================================================================

-- Templates para Deficiência Intelectual - Metas Acadêmicas
INSERT INTO "public"."goal_templates" (disability_type, stage, goal_category, title, description, goal_schema, suggested_strategies, suggested_resources)
VALUES
    ('deficiencia_intelectual', 'fundamental_anos_iniciais', 'academic', 
     'Leitura e Escrita Funcional', 
     'Desenvolver habilidades básicas de leitura e escrita para uso funcional',
     '{"description": "Desenvolver habilidades básicas de leitura e escrita para uso funcional", "category": "academic", "target_date": null}'::jsonb,
     ARRAY['Instrução direta', 'Prática guiada', 'Material concreto'],
     ARRAY['Material adaptado', 'Organizadores visuais', 'Tecnologia assistiva'])
ON CONFLICT DO NOTHING;

-- Templates para Autismo - Metas Sociais
INSERT INTO "public"."goal_templates" (disability_type, stage, goal_category, title, description, goal_schema, suggested_strategies, suggested_resources)
VALUES
    ('autismo', 'fundamental_anos_iniciais', 'social',
     'Habilidades de Interação Social',
     'Desenvolver habilidades de interação e comunicação social',
     '{"description": "Desenvolver habilidades de interação e comunicação social", "category": "functional", "target_date": null}'::jsonb,
     ARRAY['História social', 'Modelagem por vídeo', 'Intervenção mediada por pares'],
     ARRAY['Histórias sociais', 'Vídeos modelo', 'Jogos cooperativos'])
ON CONFLICT DO NOTHING;

-- Templates para TDAH - Metas Funcionais
INSERT INTO "public"."goal_templates" (disability_type, stage, goal_category, title, description, goal_schema, suggested_strategies, suggested_resources)
VALUES
    ('tdah', 'fundamental_anos_iniciais', 'functional',
     'Autorregulação e Organização',
     'Desenvolver habilidades de autorregulação, organização e planejamento',
     '{"description": "Desenvolver habilidades de autorregulação, organização e planejamento", "category": "functional", "target_date": null}'::jsonb,
     ARRAY['Checklist', 'Agenda visual', 'Pausas programadas'],
     ARRAY['Agenda', 'Planner', 'Timer', 'Organizadores visuais'])
ON CONFLICT DO NOTHING;

-- Templates de Adaptações
INSERT INTO "public"."adaptation_templates" (disability_type, adaptation_type, title, description, adaptation_schema, resources_needed)
VALUES
    ('deficiencia_intelectual', 'curricular',
     'Adaptação Curricular - Conteúdo Simplificado',
     'Simplificar conteúdo mantendo objetivos de aprendizagem',
     '{"type": "curricular", "approach": "simplificacao", "maintain_objectives": true}'::jsonb,
     ARRAY['Material adaptado', 'Organizadores visuais']),
    ('autismo', 'metodologica',
     'Adaptação Metodológica - Rotina Visual',
     'Implementar rotina visual e previsibilidade',
     '{"type": "metodologica", "tools": ["agenda_visual", "antecipacao"]}'::jsonb,
     ARRAY['Agenda visual', 'Sinalização']),
    ('tdah', 'avaliacao',
     'Adaptação de Avaliação - Tempo Extra',
     'Fornecer tempo adicional e ambiente adequado para avaliações',
     '{"type": "avaliacao", "adaptations": ["tempo_extra", "ambiente_adequado"]}'::jsonb,
     ARRAY['Espaço isolado', 'Timer'])
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 7: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."goal_templates" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."adaptation_templates" TO authenticated;
GRANT SELECT, INSERT ON "public"."goal_template_usage" TO authenticated;
GRANT EXECUTE ON FUNCTION get_goal_templates(text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_goal_from_template(uuid, uuid, jsonb) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."goal_templates" IS 'Templates de metas reutilizáveis por deficiência e etapa';
COMMENT ON TABLE "public"."adaptation_templates" IS 'Templates de adaptações reutilizáveis';
COMMENT ON TABLE "public"."goal_template_usage" IS 'Registro de uso de templates para rastreabilidade';
COMMENT ON FUNCTION get_goal_templates(text, text, text, uuid) IS 'Busca templates de metas filtrados por deficiência, etapa e categoria';
COMMENT ON FUNCTION create_goal_from_template(uuid, uuid, jsonb) IS 'Cria uma meta do PEI a partir de um template';

