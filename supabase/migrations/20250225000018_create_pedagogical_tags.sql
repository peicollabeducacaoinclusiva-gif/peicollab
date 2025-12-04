-- ============================================================================
-- MIGRAÇÃO: Tags Pedagógicas Reutilizáveis
-- Data: 25/02/2025
-- Descrição: Criar tabela de tags pedagógicas para indexar atividades
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Tags Pedagógicas
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."pedagogical_tags" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "tag_name" text NOT NULL,
    "tag_category" text, -- 'tema', 'habilidade', 'meta', 'area_conhecimento'
    "description" text,
    "color" text DEFAULT '#3b82f6',
    "usage_count" integer DEFAULT 0,
    "created_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id"),
    UNIQUE("tenant_id", "tag_name")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_pedagogical_tags_tenant" ON "public"."pedagogical_tags"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_pedagogical_tags_category" ON "public"."pedagogical_tags"("tag_category");

-- ============================================================================
-- PARTE 2: Inserir tags padrão
-- ============================================================================

INSERT INTO "public"."pedagogical_tags" (tenant_id, tag_name, tag_category, description, color)
SELECT 
    NULL,
    tag,
    category,
    description,
    color
FROM (VALUES
    ('leitura', 'habilidade', 'Habilidades de leitura', '#3b82f6'),
    ('escrita', 'habilidade', 'Habilidades de escrita', '#10b981'),
    ('matematica', 'area_conhecimento', 'Matemática', '#f59e0b'),
    ('ciencias', 'area_conhecimento', 'Ciências', '#8b5cf6'),
    ('historia', 'area_conhecimento', 'História', '#ec4899'),
    ('geografia', 'area_conhecimento', 'Geografia', '#06b6d4'),
    ('comunicacao', 'habilidade', 'Comunicação', '#14b8a6'),
    ('socializacao', 'habilidade', 'Socialização', '#f97316'),
    ('autonomia', 'meta', 'Desenvolvimento de autonomia', '#84cc16'),
    ('inclusao', 'tema', 'Inclusão e diversidade', '#6366f1')
) AS tags(tag, category, description, color)
ON CONFLICT (tenant_id, tag_name) DO NOTHING;

-- ============================================================================
-- PARTE 3: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."pedagogical_tags" TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."pedagogical_tags" IS 'Tags pedagógicas reutilizáveis para indexar atividades e planejamentos';

