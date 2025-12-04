-- ============================================================================
-- MIGRAÇÃO: Templates e Reutilização de Planejamentos
-- Data: 25/02/2025
-- Descrição: Criar sistema de templates e reutilização de planejamentos
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Templates de Planejamento
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."planning_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "template_name" text NOT NULL,
    "template_type" text NOT NULL, -- 'daily', 'weekly', 'monthly', 'bimonthly'
    "subject" text,
    "stage" text, -- 'infantil', 'fundamental_anos_iniciais', etc.
    "content_structure" jsonb NOT NULL, -- Estrutura do planejamento
    "tags" text[],
    "is_public" boolean DEFAULT false, -- Se outros professores podem usar
    "usage_count" integer DEFAULT 0,
    "created_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_planning_templates_tenant" ON "public"."planning_templates"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_planning_templates_type" ON "public"."planning_templates"("template_type");
CREATE INDEX IF NOT EXISTS "idx_planning_templates_stage" ON "public"."planning_templates"("stage");

-- ============================================================================
-- PARTE 2: Tabela de Campos de Experiência (BNCC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."experience_fields" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "field_name" text NOT NULL,
    "field_code" text NOT NULL, -- Código BNCC
    "stage" text NOT NULL, -- 'infantil', 'fundamental_anos_iniciais', etc.
    "description" text,
    "learning_objectives" jsonb DEFAULT '[]'::jsonb,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_experience_fields_stage" ON "public"."experience_fields"("stage");
CREATE INDEX IF NOT EXISTS "idx_experience_fields_code" ON "public"."experience_fields"("field_code");

-- ============================================================================
-- PARTE 3: Tabela de Áreas do Conhecimento
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."knowledge_areas" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "area_name" text NOT NULL,
    "area_code" text NOT NULL, -- Código BNCC
    "stage" text NOT NULL,
    "description" text,
    "components" jsonb DEFAULT '[]'::jsonb,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_knowledge_areas_stage" ON "public"."knowledge_areas"("stage");
CREATE INDEX IF NOT EXISTS "idx_knowledge_areas_code" ON "public"."knowledge_areas"("area_code");

-- ============================================================================
-- PARTE 4: Inserir Campos de Experiência (BNCC - Educação Infantil)
-- ============================================================================

INSERT INTO "public"."experience_fields" (field_name, field_code, stage, description)
VALUES
    ('O eu, o outro e o nós', 'EI01', 'infantil', 'Construção da identidade e subjetividade'),
    ('Corpo, gestos e movimentos', 'EI02', 'infantil', 'Exploração e conhecimento do corpo'),
    ('Traços, sons, cores e formas', 'EI03', 'infantil', 'Expressão e comunicação'),
    ('Escuta, fala, pensamento e imaginação', 'EI04', 'infantil', 'Linguagem oral e escrita'),
    ('Espaços, tempos, quantidades, relações e transformações', 'EI05', 'infantil', 'Matemática e ciências')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 5: Inserir Áreas do Conhecimento (BNCC - Ensino Fundamental)
-- ============================================================================

INSERT INTO "public"."knowledge_areas" (area_name, area_code, stage, description)
VALUES
    ('Linguagens', 'EF01', 'fundamental_anos_iniciais', 'Língua Portuguesa, Arte, Educação Física, Língua Inglesa'),
    ('Matemática', 'EF02', 'fundamental_anos_iniciais', 'Matemática'),
    ('Ciências da Natureza', 'EF03', 'fundamental_anos_iniciais', 'Ciências'),
    ('Ciências Humanas', 'EF04', 'fundamental_anos_iniciais', 'História, Geografia'),
    ('Ensino Religioso', 'EF05', 'fundamental_anos_iniciais', 'Ensino Religioso')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 6: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."planning_templates" TO authenticated;
GRANT SELECT ON "public"."experience_fields" TO authenticated;
GRANT SELECT ON "public"."knowledge_areas" TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."planning_templates" IS 'Templates de planejamento reutilizáveis';
COMMENT ON TABLE "public"."experience_fields" IS 'Campos de experiência da BNCC (Educação Infantil)';
COMMENT ON TABLE "public"."knowledge_areas" IS 'Áreas do conhecimento da BNCC (Ensino Fundamental/Médio)';

