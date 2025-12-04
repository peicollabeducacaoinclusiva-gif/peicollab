-- ============================================================================
-- MIGRAÇÃO: Sistema de Recomendações Automáticas
-- Data: 25/02/2025
-- Descrição: Criar tabelas para recomendações baseadas em classificações
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Classificações do Aluno
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."student_classifications" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "classification_type" text NOT NULL, -- 'deficiency', 'disorder', 'giftedness', 'other'
    "classification" text NOT NULL, -- 'deficiencia_intelectual', 'autismo', 'tdah', etc.
    "confidence" numeric(3,2) DEFAULT 1.0, -- 0.0 a 1.0
    "source" text, -- 'diagnosis', 'evaluation', 'manual'
    "diagnosed_by" uuid REFERENCES "auth"."users"("id"),
    "diagnosis_date" date,
    "observations" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("student_id", "classification")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_student_classifications_student" ON "public"."student_classifications"("student_id");
CREATE INDEX IF NOT EXISTS "idx_student_classifications_type" ON "public"."student_classifications"("classification_type");

-- ============================================================================
-- PARTE 2: Tabela de Templates de Recomendações
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."recommendation_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "classification" text NOT NULL,
    "recommendation_type" text NOT NULL, -- 'goal', 'strategy', 'adaptation', 'resource', 'referral'
    "title" text NOT NULL,
    "description" text NOT NULL,
    "content" jsonb NOT NULL, -- Conteúdo específico da recomendação
    "priority" text DEFAULT 'medium', -- 'low', 'medium', 'high'
    "stage" text, -- 'infantil', 'fundamental', 'medio'
    "enabled" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_recommendation_templates_classification" ON "public"."recommendation_templates"("classification");
CREATE INDEX IF NOT EXISTS "idx_recommendation_templates_type" ON "public"."recommendation_templates"("recommendation_type");
CREATE INDEX IF NOT EXISTS "idx_recommendation_templates_tenant" ON "public"."recommendation_templates"("tenant_id");

-- ============================================================================
-- PARTE 3: Tabela de Recomendações Aplicadas
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."applied_recommendations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "pei_id" uuid REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "template_id" uuid REFERENCES "public"."recommendation_templates"("id") ON DELETE SET NULL,
    "recommendation_type" text NOT NULL,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "content" jsonb NOT NULL,
    "applied_at" timestamptz DEFAULT now(),
    "applied_by" uuid REFERENCES "auth"."users"("id"),
    "status" text DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'modified'
    "notes" text
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_applied_recommendations_student" ON "public"."applied_recommendations"("student_id");
CREATE INDEX IF NOT EXISTS "idx_applied_recommendations_pei" ON "public"."applied_recommendations"("pei_id");
CREATE INDEX IF NOT EXISTS "idx_applied_recommendations_status" ON "public"."applied_recommendations"("status");

-- ============================================================================
-- PARTE 4: Função para gerar recomendações baseadas em classificações
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_recommendations(p_student_id uuid, p_pei_id uuid)
RETURNS TABLE (
    recommendation_type text,
    title text,
    description text,
    content jsonb,
    priority text,
    template_id uuid
) AS $$
DECLARE
    v_classification record;
    v_template record;
BEGIN
    -- Buscar classificações do aluno
    FOR v_classification IN
        SELECT classification, classification_type, confidence
        FROM "public"."student_classifications"
        WHERE student_id = p_student_id
        AND confidence >= 0.7 -- Apenas classificações com confiança >= 70%
        ORDER BY confidence DESC
    LOOP
        -- Buscar templates de recomendações para esta classificação
        FOR v_template IN
            SELECT *
            FROM "public"."recommendation_templates"
            WHERE classification = v_classification.classification
            AND enabled = true
            AND (tenant_id IS NULL OR tenant_id = (
                SELECT tenant_id FROM "public"."students" WHERE id = p_student_id
            ))
            ORDER BY priority DESC, created_at DESC
        LOOP
            RETURN QUERY SELECT
                v_template.recommendation_type,
                v_template.title,
                v_template.description,
                v_template.content,
                v_template.priority,
                v_template.id;
        END LOOP;
    END LOOP;

    -- Se não houver classificações, retornar recomendações genéricas
    IF NOT FOUND THEN
        FOR v_template IN
            SELECT *
            FROM "public"."recommendation_templates"
            WHERE classification = 'generic'
            AND enabled = true
            AND (tenant_id IS NULL OR tenant_id = (
                SELECT tenant_id FROM "public"."students" WHERE id = p_student_id
            ))
            ORDER BY priority DESC
            LIMIT 5
        LOOP
            RETURN QUERY SELECT
                v_template.recommendation_type,
                v_template.title,
                v_template.description,
                v_template.content,
                v_template.priority,
                v_template.id;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 5: Inserir templates padrão de recomendações
-- ============================================================================

-- Recomendações para Deficiência Intelectual
INSERT INTO "public"."recommendation_templates" (classification, recommendation_type, title, description, content, priority)
VALUES
    ('deficiencia_intelectual', 'goal', 'Metas Funcionais', 'Priorizar desenvolvimento de habilidades funcionais e autonomia', 
     '{"focus": "autonomia", "areas": ["comunicação", "socialização", "vida_diaria"]}'::jsonb, 'high'),
    ('deficiencia_intelectual', 'strategy', 'Instrução Direta', 'Usar metodologia de instrução direta e explícita', 
     '{"methodology": "instrucao_direta", "steps": ["modelagem", "pratica_guiada", "pratica_independente"]}'::jsonb, 'high'),
    ('deficiencia_intelectual', 'adaptation', 'Material Concreto', 'Utilizar material concreto e manipulável', 
     '{"resources": ["material_concreto", "organizadores_visuais", "roteiros"]}'::jsonb, 'high'),
    ('deficiencia_intelectual', 'resource', 'Tecnologia Assistiva', 'Avaliar necessidade de tecnologia assistiva para comunicação', 
     '{"type": "comunicacao", "options": ["prancha_comunicacao", "aplicativo_caa"]}'::jsonb, 'medium')
ON CONFLICT DO NOTHING;

-- Recomendações para Autismo
INSERT INTO "public"."recommendation_templates" (classification, recommendation_type, title, description, content, priority)
VALUES
    ('autismo', 'goal', 'Habilidades Sociais', 'Desenvolver habilidades de interação social', 
     '{"focus": "socializacao", "strategies": ["historia_social", "modelagem_video"]}'::jsonb, 'high'),
    ('autismo', 'strategy', 'Rotina Visual', 'Implementar rotina visual e previsibilidade', 
     '{"tools": ["agenda_visual", "antecipacao", "transicoes"]}'::jsonb, 'high'),
    ('autismo', 'adaptation', 'Ambiente Estruturado', 'Organizar ambiente físico de forma estruturada', 
     '{"elements": ["espacos_definidos", "sinalizacao_visual", "reducao_estimulos"]}'::jsonb, 'high'),
    ('autismo', 'resource', 'Comunicação Alternativa', 'Avaliar necessidade de CAA (Comunicação Alternativa e Aumentativa)', 
     '{"type": "caa", "options": ["pecs", "prancha_digital", "aplicativo"]}'::jsonb, 'high')
ON CONFLICT DO NOTHING;

-- Recomendações para TDAH
INSERT INTO "public"."recommendation_templates" (classification, recommendation_type, title, description, content, priority)
VALUES
    ('tdah', 'goal', 'Autorregulação', 'Desenvolver habilidades de autorregulação e atenção', 
     '{"focus": "atencao", "areas": ["concentracao", "organizacao", "planejamento"]}'::jsonb, 'high'),
    ('tdah', 'strategy', 'Estruturação de Tarefas', 'Dividir tarefas em etapas menores e estruturadas', 
     '{"method": "divisao_etapas", "tools": ["checklist", "timer", "pausas"]}'::jsonb, 'high'),
    ('tdah', 'adaptation', 'Ambiente com Menos Distrações', 'Organizar ambiente para reduzir distrações', 
     '{"changes": ["posicao_sala", "isolamento_visual", "reducao_ruido"]}'::jsonb, 'medium'),
    ('tdah', 'resource', 'Organizadores e Agendas', 'Utilizar organizadores visuais e agendas', 
     '{"type": "organizacao", "tools": ["agenda", "planner", "lembretes_visuais"]}'::jsonb, 'medium')
ON CONFLICT DO NOTHING;

-- Recomendações Genéricas
INSERT INTO "public"."recommendation_templates" (classification, recommendation_type, title, description, content, priority)
VALUES
    ('generic', 'goal', 'Metas Curriculares Adaptadas', 'Adaptar metas curriculares às necessidades do aluno', 
     '{"approach": "adaptacao_curricular", "flexibility": true}'::jsonb, 'medium'),
    ('generic', 'strategy', 'Diferenciação Pedagógica', 'Implementar diferenciação pedagógica', 
     '{"methods": ["variacao_conteudo", "variacao_processo", "variacao_produto"]}'::jsonb, 'medium'),
    ('generic', 'adaptation', 'Avaliação Adaptada', 'Adaptar métodos e instrumentos de avaliação', 
     '{"types": ["tempo_extra", "formato_alternativo", "avaliacao_continua"]}'::jsonb, 'medium')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 6: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON "public"."student_classifications" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."recommendation_templates" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."applied_recommendations" TO authenticated;
GRANT EXECUTE ON FUNCTION generate_recommendations(uuid, uuid) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."student_classifications" IS 'Classificações do aluno (deficiências, transtornos, altas habilidades)';
COMMENT ON TABLE "public"."recommendation_templates" IS 'Templates de recomendações baseadas em classificações';
COMMENT ON TABLE "public"."applied_recommendations" IS 'Recomendações aplicadas a alunos/PEIs';
COMMENT ON FUNCTION generate_recommendations(uuid, uuid) IS 'Gera recomendações automáticas baseadas nas classificações do aluno';

