-- ============================================================================
-- MIGRAÇÃO: Sistema de Criação de Atividades
-- ============================================================================
-- Banco de atividades educacionais compartilháveis
-- Data: 2025-01-08
-- ============================================================================

-- ============================================================================
-- ENUM: tipo_atividade
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "public"."tipo_atividade" AS ENUM (
        'individual',
        'dupla',
        'grupo',
        'coletiva',
        'pratica',
        'teorica'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ENUM: nivel_dificuldade
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "public"."nivel_dificuldade" AS ENUM (
        'muito_facil',
        'facil',
        'medio',
        'dificil',
        'muito_dificil'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABELA: atividades
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."atividades" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    "title" text NOT NULL,
    "description" text,
    "thumbnail_url" text,
    
    -- Classificação
    "subject_id" uuid REFERENCES "public"."subjects"("id") ON DELETE SET NULL,
    "education_level" education_level NOT NULL,
    "tipo_atividade" tipo_atividade NOT NULL,
    "nivel_dificuldade" nivel_dificuldade DEFAULT 'medio',
    
    -- Conteúdo
    "objectives" jsonb DEFAULT '[]'::jsonb,
    "bncc_skills" jsonb DEFAULT '[]'::jsonb,
    
    "materials" jsonb DEFAULT '[]'::jsonb,
    -- Ex: ["Papel", "Lápis de cor", "Tesoura"]
    
    "instructions" text NOT NULL,
    "duration" integer, -- Duração estimada em minutos
    
    -- Adaptações para Inclusão
    "adaptations" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"disability_type": "string", "adaptation": "text"}]
    
    "accessibility_tips" text,
    
    -- Referência Externa (se for da internet)
    "is_external_reference" boolean DEFAULT false,
    "external_url" text,
    "external_source" text, -- Nome do site/autor
    
    -- Anexos
    "attachments" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"filename": "string", "url": "string", "type": "pdf|image|video"}]
    
    -- Autoria e Compartilhamento
    "created_by" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "is_public" boolean DEFAULT false, -- Se true, visível para toda a rede
    "is_featured" boolean DEFAULT false,
    
    -- Métricas
    "views_count" integer DEFAULT 0,
    "uses_count" integer DEFAULT 0, -- Quantas vezes foi usada em planos
    "likes_count" integer DEFAULT 0,
    "downloads_count" integer DEFAULT 0,
    
    -- Tags
    "tags" text[] DEFAULT '{}',
    
    -- Status
    "is_active" boolean DEFAULT true,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_atividades_subject" ON "public"."atividades"("subject_id");
CREATE INDEX IF NOT EXISTS "idx_atividades_level" ON "public"."atividades"("education_level");
CREATE INDEX IF NOT EXISTS "idx_atividades_tipo" ON "public"."atividades"("tipo_atividade");
CREATE INDEX IF NOT EXISTS "idx_atividades_dificuldade" ON "public"."atividades"("nivel_dificuldade");
CREATE INDEX IF NOT EXISTS "idx_atividades_teacher" ON "public"."atividades"("created_by");
CREATE INDEX IF NOT EXISTS "idx_atividades_tenant" ON "public"."atividades"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_atividades_public" ON "public"."atividades"("is_public");
CREATE INDEX IF NOT EXISTS "idx_atividades_tags" ON "public"."atividades" USING GIN ("tags");

-- ============================================================================
-- TABELA: atividade_likes (Curtidas em Atividades)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."atividade_likes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "atividade_id" uuid NOT NULL REFERENCES "public"."atividades"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now(),
    
    CONSTRAINT "unique_like_per_user_atividade" UNIQUE ("atividade_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "idx_atividade_likes_atividade" ON "public"."atividade_likes"("atividade_id");
CREATE INDEX IF NOT EXISTS "idx_atividade_likes_user" ON "public"."atividade_likes"("user_id");

-- ============================================================================
-- TABELA: atividade_comments (Comentários)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."atividade_comments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "atividade_id" uuid NOT NULL REFERENCES "public"."atividades"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "comment_text" text NOT NULL,
    "rating" integer CHECK (rating BETWEEN 1 AND 5),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_atividade_comments_atividade" ON "public"."atividade_comments"("atividade_id");
CREATE INDEX IF NOT EXISTS "idx_atividade_comments_user" ON "public"."atividade_comments"("user_id");

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."atividades" ENABLE ROW LEVEL SECURITY;

-- Professores gerenciam suas próprias atividades
CREATE POLICY "teacher_manage_own_atividades"
    ON "public"."atividades"
    FOR ALL
    USING (created_by = auth.uid());

-- Todos podem ver atividades públicas
CREATE POLICY "all_view_public_atividades"
    ON "public"."atividades"
    FOR SELECT
    USING (is_public = true);

-- Professores podem ver atividades da mesma rede
CREATE POLICY "teachers_view_network_atividades"
    ON "public"."atividades"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('teacher', 'aee_teacher', 'coordinator')
        )
    );

ALTER TABLE "public"."atividade_likes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_view_likes"
    ON "public"."atividade_likes"
    FOR SELECT
    USING (true);

CREATE POLICY "users_manage_own_likes"
    ON "public"."atividade_likes"
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_likes"
    ON "public"."atividade_likes"
    FOR DELETE
    USING (user_id = auth.uid());

ALTER TABLE "public"."atividade_comments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_view_comments"
    ON "public"."atividade_comments"
    FOR SELECT
    USING (true);

CREATE POLICY "users_create_comments"
    ON "public"."atividade_comments"
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_comments"
    ON "public"."atividade_comments"
    FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_atividades_updated_at
    BEFORE UPDATE ON "public"."atividades"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_atividade_comments_updated_at
    BEFORE UPDATE ON "public"."atividade_comments"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar contador de curtidas
CREATE OR REPLACE FUNCTION update_atividade_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "public"."atividades"
        SET likes_count = likes_count + 1
        WHERE id = NEW.atividade_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "public"."atividades"
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.atividade_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_atividade_likes
    AFTER INSERT OR DELETE ON "public"."atividade_likes"
    FOR EACH ROW
    EXECUTE FUNCTION update_atividade_likes_count();

-- Trigger para incrementar uses_count quando vinculada a um plano
CREATE OR REPLACE FUNCTION increment_atividade_uses()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "public"."atividades"
    SET uses_count = uses_count + 1
    WHERE id = NEW.atividade_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_uses
    AFTER INSERT ON "public"."plano_aula_atividades"
    FOR EACH ROW
    EXECUTE FUNCTION increment_atividade_uses();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."atividades" IS 'Banco de atividades educacionais compartilháveis';
COMMENT ON TABLE "public"."atividade_likes" IS 'Curtidas em atividades';
COMMENT ON TABLE "public"."atividade_comments" IS 'Comentários e avaliações de atividades';

COMMENT ON COLUMN "public"."atividades"."is_external_reference" IS 'Se true, atividade é uma referência externa (link)';
COMMENT ON COLUMN "public"."atividades"."adaptations" IS 'Adaptações por tipo de deficiência';

SELECT '✅ Migração 9 (Sistema de Atividades) aplicada com sucesso!' AS status;

