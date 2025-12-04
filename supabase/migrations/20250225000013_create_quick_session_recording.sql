-- ============================================================================
-- MIGRAÇÃO: Registro Rápido de Sessões AEE (Modelo WhatsApp Status)
-- Data: 25/02/2025
-- Descrição: Sistema de registro rápido de sessões com transcrição
-- ============================================================================

-- ============================================================================
-- PARTE 1: Melhorar tabela aee_sessions para registro rápido
-- ============================================================================

-- Adicionar campos para registro rápido
ALTER TABLE "public"."aee_sessions" 
ADD COLUMN IF NOT EXISTS "quick_record" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "audio_transcription" text,
ADD COLUMN IF NOT EXISTS "tags" text[],
ADD COLUMN IF NOT EXISTS "photo_urls" text[],
ADD COLUMN IF NOT EXISTS "video_url" text,
ADD COLUMN IF NOT EXISTS "recorded_at" timestamptz,
ADD COLUMN IF NOT EXISTS "transcription_status" text DEFAULT 'pending'; -- 'pending', 'processing', 'completed', 'failed'

-- ============================================================================
-- PARTE 2: Tabela de Tags Pedagógicas
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_pedagogical_tags" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "tag_name" text NOT NULL,
    "tag_category" text, -- 'habilidade', 'area_conhecimento', 'estrategia', 'recurso'
    "description" text,
    "color" text DEFAULT '#3b82f6',
    "usage_count" integer DEFAULT 0,
    "created_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id"),
    UNIQUE("tenant_id", "tag_name")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_tags_tenant" ON "public"."aee_pedagogical_tags"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_aee_tags_category" ON "public"."aee_pedagogical_tags"("tag_category");

-- ============================================================================
-- PARTE 3: Tabela de Participação do Aluno na Sessão
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_session_participation" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id" uuid NOT NULL REFERENCES "public"."aee_sessions"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "participation_level" text NOT NULL, -- 'alta', 'media', 'baixa', 'ausente'
    "engagement_indicators" jsonb DEFAULT '{}'::jsonb,
    "observations" text,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("session_id", "student_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_participation_session" ON "public"."aee_session_participation"("session_id");
CREATE INDEX IF NOT EXISTS "idx_aee_participation_student" ON "public"."aee_session_participation"("student_id");

-- ============================================================================
-- PARTE 4: Função para criar sessão rápida
-- ============================================================================

CREATE OR REPLACE FUNCTION create_quick_aee_session(
    p_student_id uuid,
    p_aee_id uuid,
    p_notes text DEFAULT NULL,
    p_tags text[] DEFAULT ARRAY[]::text[],
    p_objective_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_session_id uuid;
BEGIN
    INSERT INTO "public"."aee_sessions" (
        student_id,
        aee_id,
        date,
        notes,
        tags,
        objective_id,
        quick_record,
        recorded_at,
        session_type
    )
    VALUES (
        p_student_id,
        p_aee_id,
        CURRENT_DATE,
        p_notes,
        p_tags,
        p_objective_id,
        true,
        now(),
        'regular'
    )
    RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 5: Inserir tags padrão
-- ============================================================================

INSERT INTO "public"."aee_pedagogical_tags" (tenant_id, tag_name, tag_category, description, color)
SELECT 
    NULL,
    tag,
    category,
    description,
    color
FROM (VALUES
    ('comunicacao', 'habilidade', 'Habilidades de comunicação', '#3b82f6'),
    ('socializacao', 'habilidade', 'Habilidades de socialização', '#10b981'),
    ('autonomia', 'habilidade', 'Desenvolvimento de autonomia', '#f59e0b'),
    ('leitura', 'area_conhecimento', 'Leitura e escrita', '#8b5cf6'),
    ('matematica', 'area_conhecimento', 'Matemática', '#ec4899'),
    ('instrucao_direta', 'estrategia', 'Instrução direta e explícita', '#06b6d4'),
    ('pratica_guiada', 'estrategia', 'Prática guiada', '#14b8a6'),
    ('material_concreto', 'recurso', 'Material concreto', '#f97316')
) AS tags(tag, category, description, color)
ON CONFLICT (tenant_id, tag_name) DO NOTHING;

-- ============================================================================
-- PARTE 6: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."aee_pedagogical_tags" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."aee_session_participation" TO authenticated;
GRANT EXECUTE ON FUNCTION create_quick_aee_session(uuid, uuid, text, text[], uuid) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."aee_pedagogical_tags" IS 'Tags pedagógicas para indexar sessões AEE';
COMMENT ON TABLE "public"."aee_session_participation" IS 'Registro de participação do aluno nas sessões';
COMMENT ON FUNCTION create_quick_aee_session(uuid, uuid, text, text[], uuid) IS 'Cria registro rápido de sessão AEE';

