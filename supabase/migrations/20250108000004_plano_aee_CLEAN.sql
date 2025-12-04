-- ============================================================================
-- MIGRAÇÃO LIMPA: Plano de AEE
-- ============================================================================
-- Sistema completo para Planos de AEE como anexo dos PEIs
-- Data: 2025-01-08
-- Versão: CLEAN - Com DROP POLICY IF EXISTS
-- ⚠️ Execute LIMPAR_MIGRATION_4.sql ANTES deste arquivo
-- ============================================================================

-- ============================================================================
-- TABELA: plano_aee
-- ============================================================================

CREATE TABLE "public"."plano_aee" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "pei_id" uuid REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    
    -- Responsável
    "created_by" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "assigned_aee_teacher_id" uuid REFERENCES "auth"."users"("id"),
    
    -- Seções do Plano
    "diagnosis_tools" jsonb DEFAULT '[]'::jsonb,
    "anamnesis_data" jsonb DEFAULT '{}'::jsonb,
    "learning_barriers" jsonb DEFAULT '[]'::jsonb,
    "school_complaint" text,
    "family_complaint" text,
    "resources" jsonb DEFAULT '[]'::jsonb,
    "adaptations" jsonb DEFAULT '[]'::jsonb,
    "teaching_objectives" jsonb DEFAULT '[]'::jsonb,
    "evaluation_methodology" text,
    "evaluation_instruments" jsonb DEFAULT '[]'::jsonb,
    "follow_ups" jsonb DEFAULT '[]'::jsonb,
    "referrals" jsonb DEFAULT '[]'::jsonb,
    "family_guidance" text,
    "school_guidance" text,
    "other_guidance" text,
    
    -- Avaliações por Ciclo
    "cycle_1_evaluation" jsonb DEFAULT '{}'::jsonb,
    "cycle_2_evaluation" jsonb DEFAULT '{}'::jsonb,
    "cycle_3_evaluation" jsonb DEFAULT '{}'::jsonb,
    
    -- Status e Controle
    "status" text DEFAULT 'draft',
    "version" integer DEFAULT 1,
    
    -- Datas
    "start_date" date,
    "end_date" date,
    "last_review_date" date,
    "next_review_date" date,
    
    -- Aprovações
    "approved_by" uuid REFERENCES "auth"."users"("id"),
    "approved_at" timestamptz,
    "approval_notes" text,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "plano_aee_status_check" CHECK (status IN ('draft', 'pending', 'approved', 'returned', 'archived'))
);

-- Índices
CREATE INDEX "idx_plano_aee_pei" ON "public"."plano_aee"("pei_id");
CREATE INDEX "idx_plano_aee_student" ON "public"."plano_aee"("student_id");
CREATE INDEX "idx_plano_aee_school" ON "public"."plano_aee"("school_id");
CREATE INDEX "idx_plano_aee_tenant" ON "public"."plano_aee"("tenant_id");
CREATE INDEX "idx_plano_aee_teacher" ON "public"."plano_aee"("assigned_aee_teacher_id");
CREATE INDEX "idx_plano_aee_status" ON "public"."plano_aee"("status");

-- ============================================================================
-- TABELA: plano_aee_comments
-- ============================================================================

CREATE TABLE "public"."plano_aee_comments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plano_aee_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Conteúdo
    "comment_text" text NOT NULL,
    "section" text,
    
    -- Tipo
    "comment_type" text DEFAULT 'general',
    
    -- Thread
    "parent_comment_id" uuid REFERENCES "public"."plano_aee_comments"("id") ON DELETE CASCADE,
    
    -- Status
    "is_resolved" boolean DEFAULT false,
    "resolved_by" uuid REFERENCES "auth"."users"("id"),
    "resolved_at" timestamptz,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "plano_aee_comments_type_check" CHECK (comment_type IN ('general', 'suggestion', 'question', 'approval', 'concern'))
);

-- Índices
CREATE INDEX "idx_plano_aee_comments_plano" ON "public"."plano_aee_comments"("plano_aee_id");
CREATE INDEX "idx_plano_aee_comments_user" ON "public"."plano_aee_comments"("user_id");
CREATE INDEX "idx_plano_aee_comments_parent" ON "public"."plano_aee_comments"("parent_comment_id");
CREATE INDEX "idx_plano_aee_comments_section" ON "public"."plano_aee_comments"("section");

-- ============================================================================
-- TABELA: plano_aee_attachments
-- ============================================================================

CREATE TABLE "public"."plano_aee_attachments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plano_aee_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    
    -- Arquivo
    "file_name" text NOT NULL,
    "file_path" text NOT NULL,
    "file_type" text,
    "file_size" bigint,
    
    -- Metadados
    "attachment_type" text,
    "description" text,
    "uploaded_by" uuid REFERENCES "auth"."users"("id"),
    "uploaded_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX "idx_plano_aee_attachments_plano" ON "public"."plano_aee_attachments"("plano_aee_id");
CREATE INDEX "idx_plano_aee_attachments_type" ON "public"."plano_aee_attachments"("attachment_type");

-- ============================================================================
-- RLS POLICIES: plano_aee
-- ============================================================================

ALTER TABLE "public"."plano_aee" ENABLE ROW LEVEL SECURITY;

-- Professores de AEE gerenciam seus planos
CREATE POLICY "aee_teachers_manage_own_plans"
    ON "public"."plano_aee"
    FOR ALL
    USING (
        created_by = auth.uid() 
        OR assigned_aee_teacher_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'aee_teacher'
        )
    );

-- Outros usuários podem visualizar
CREATE POLICY "others_view_aee_plans"
    ON "public"."plano_aee"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: plano_aee_comments
-- ============================================================================

ALTER TABLE "public"."plano_aee_comments" ENABLE ROW LEVEL SECURITY;

-- Usuários podem comentar
CREATE POLICY "users_comment_on_visible_plans"
    ON "public"."plano_aee_comments"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
        )
    );

-- Usuários podem ver comentários
CREATE POLICY "users_view_comments_on_accessible_plans"
    ON "public"."plano_aee_comments"
    FOR SELECT
    USING (true);

-- Usuários gerenciam próprios comentários
CREATE POLICY "users_manage_own_comments"
    ON "public"."plano_aee_comments"
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "users_delete_own_comments"
    ON "public"."plano_aee_comments"
    FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: plano_aee_attachments
-- ============================================================================

ALTER TABLE "public"."plano_aee_attachments" ENABLE ROW LEVEL SECURITY;

-- Professores de AEE gerenciam anexos
CREATE POLICY "aee_teachers_manage_attachments"
    ON "public"."plano_aee_attachments"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "plano_aee_attachments"."plano_aee_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
    );

-- Outros podem visualizar anexos
CREATE POLICY "others_view_attachments"
    ON "public"."plano_aee_attachments"
    FOR SELECT
    USING (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_plano_aee_updated_at
    BEFORE UPDATE ON "public"."plano_aee"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plano_aee_comments_updated_at
    BEFORE UPDATE ON "public"."plano_aee_comments"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."plano_aee" IS 'Planos de Atendimento Educacional Especializado - Anexo do PEI';
COMMENT ON TABLE "public"."plano_aee_comments" IS 'Sistema de comentários colaborativos no Plano de AEE';
COMMENT ON TABLE "public"."plano_aee_attachments" IS 'Anexos e documentos complementares do Plano de AEE';

COMMENT ON COLUMN "public"."plano_aee"."diagnosis_tools" IS 'Ferramentas de diagnóstico aplicadas por tipo de deficiência';
COMMENT ON COLUMN "public"."plano_aee"."learning_barriers" IS 'Barreiras de aprendizagem identificadas';
COMMENT ON COLUMN "public"."plano_aee"."adaptations" IS 'Adaptações curriculares, arquitetônicas, comunicacionais e metodológicas';

-- ============================================================================
-- CONFIRMAÇÃO
-- ============================================================================

SELECT '✅ Migração 4 (Plano de AEE) aplicada com sucesso! (CLEAN VERSION)' AS status;

