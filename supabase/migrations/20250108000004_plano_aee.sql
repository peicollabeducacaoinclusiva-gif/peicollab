-- ============================================================================
-- MIGRAÇÃO: Plano de AEE (Atendimento Educacional Especializado)
-- ============================================================================
-- Sistema completo para Planos de AEE como anexo dos PEIs
-- Data: 2025-01-08
-- ============================================================================

-- ============================================================================
-- TABELA: plano_aee
-- ============================================================================
-- Planos de Atendimento Educacional Especializado
CREATE TABLE IF NOT EXISTS "public"."plano_aee" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "pei_id" uuid REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    
    -- Responsável (deve ser aee_teacher)
    "created_by" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "assigned_aee_teacher_id" uuid REFERENCES "auth"."users"("id"),
    
    -- === SEÇÕES DO PLANO DE AEE ===
    
    -- 1. Ferramentas de Diagnóstico
    "diagnosis_tools" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"disability_type": "string", "tool_name": "string", "tool_description": "text", "applied_date": "date", "results": "text"}]
    
    -- 2. Anamnese
    "anamnesis_data" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"medical_history": "text", "developmental_history": "text", "family_context": "text", "previous_interventions": "text"}
    
    -- 3. Barreiras de Aprendizagem
    "learning_barriers" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"barrier_type": "string", "description": "text", "severity": "low|medium|high", "identified_date": "date"}]
    
    -- 4. Queixas
    "school_complaint" text,
    "family_complaint" text,
    
    -- 5. Recursos e Adaptações
    "resources" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"resource_type": "string", "description": "text", "availability": "boolean", "acquisition_date": "date"}]
    
    "adaptations" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"adaptation_type": "curricular|architectural|communicational|methodological", "description": "text", "implementation_date": "date"}]
    
    -- 6. Objetivos de Ensino
    "teaching_objectives" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"objective": "text", "skills_to_develop": "text", "expected_timeline": "text", "success_criteria": "text"}]
    
    -- 7. Avaliação (metodologia)
    "evaluation_methodology" text,
    "evaluation_instruments" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"instrument_name": "string", "description": "text", "frequency": "string"}]
    
    -- 8. Acompanhamentos
    "follow_ups" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"date": "date", "professional": "string", "observations": "text", "recommendations": "text"}]
    
    -- 9. Encaminhamentos
    "referrals" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"professional_type": "string", "reason": "text", "date": "date", "status": "pending|completed"}]
    
    -- 10. Orientações
    "family_guidance" text,
    "school_guidance" text,
    "other_guidance" text,
    
    -- === AVALIAÇÕES POR CICLO ===
    "cycle_1_evaluation" jsonb DEFAULT '{}'::jsonb,
    "cycle_2_evaluation" jsonb DEFAULT '{}'::jsonb,
    "cycle_3_evaluation" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"evaluation_date": "date", "progress_summary": "text", "goals_achieved": [], "adjustments_needed": "text", "next_steps": "text"}
    
    -- Status e Controle
    "status" text DEFAULT 'draft' CHECK ("status" IN ('draft', 'pending', 'approved', 'returned', 'archived')),
    "version" integer DEFAULT 1,
    
    -- Datas e Períodos
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
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_plano_aee_pei" ON "public"."plano_aee"("pei_id");
CREATE INDEX IF NOT EXISTS "idx_plano_aee_student" ON "public"."plano_aee"("student_id");
CREATE INDEX IF NOT EXISTS "idx_plano_aee_school" ON "public"."plano_aee"("school_id");
CREATE INDEX IF NOT EXISTS "idx_plano_aee_tenant" ON "public"."plano_aee"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_plano_aee_teacher" ON "public"."plano_aee"("assigned_aee_teacher_id");
CREATE INDEX IF NOT EXISTS "idx_plano_aee_status" ON "public"."plano_aee"("status");

-- ============================================================================
-- TABELA: plano_aee_comments
-- ============================================================================
-- Comentários colaborativos no Plano de AEE
CREATE TABLE IF NOT EXISTS "public"."plano_aee_comments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plano_aee_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Conteúdo do comentário
    "comment_text" text NOT NULL,
    "section" text, -- Seção específica do plano comentada
    
    -- Tipo de comentário
    "comment_type" text DEFAULT 'general' CHECK ("comment_type" IN ('general', 'suggestion', 'question', 'approval', 'concern')),
    
    -- Thread (respostas a comentários)
    "parent_comment_id" uuid REFERENCES "public"."plano_aee_comments"("id") ON DELETE CASCADE,
    
    -- Status
    "is_resolved" boolean DEFAULT false,
    "resolved_by" uuid REFERENCES "auth"."users"("id"),
    "resolved_at" timestamptz,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_plano_aee_comments_plano" ON "public"."plano_aee_comments"("plano_aee_id");
CREATE INDEX IF NOT EXISTS "idx_plano_aee_comments_user" ON "public"."plano_aee_comments"("user_id");
CREATE INDEX IF NOT EXISTS "idx_plano_aee_comments_parent" ON "public"."plano_aee_comments"("parent_comment_id");
CREATE INDEX IF NOT EXISTS "idx_plano_aee_comments_section" ON "public"."plano_aee_comments"("section");

-- ============================================================================
-- TABELA: plano_aee_attachments
-- ============================================================================
-- Anexos do Plano de AEE (relatórios, laudos, etc.)
CREATE TABLE IF NOT EXISTS "public"."plano_aee_attachments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plano_aee_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    
    -- Arquivo
    "file_name" text NOT NULL,
    "file_path" text NOT NULL, -- Caminho no storage do Supabase
    "file_type" text,
    "file_size" bigint,
    
    -- Metadados
    "attachment_type" text, -- 'laudo', 'relatorio', 'avaliacao', 'outros'
    "description" text,
    "uploaded_by" uuid REFERENCES "auth"."users"("id"),
    "uploaded_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_plano_aee_attachments_plano" ON "public"."plano_aee_attachments"("plano_aee_id");
CREATE INDEX IF NOT EXISTS "idx_plano_aee_attachments_type" ON "public"."plano_aee_attachments"("attachment_type");

-- ============================================================================
-- RLS POLICIES: plano_aee
-- ============================================================================

ALTER TABLE "public"."plano_aee" ENABLE ROW LEVEL SECURITY;

-- Professores de AEE têm controle total sobre seus planos
CREATE POLICY "aee_teachers_manage_own_plans"
    ON "public"."plano_aee"
    FOR ALL
    USING (
        "created_by" = auth.uid() 
        OR "assigned_aee_teacher_id" = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'aee_teacher'
            AND EXISTS (
                SELECT 1 FROM "public"."profiles" p
                WHERE p.id = auth.uid()
                AND (
                    p.school_id = "plano_aee"."school_id"
                    OR p.tenant_id = "plano_aee"."tenant_id"
                )
            )
        )
    );

-- Outros usuários podem apenas visualizar (leitura)
CREATE POLICY "others_view_aee_plans"
    ON "public"."plano_aee"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."students" s
            JOIN "public"."profiles" p ON (
                p.school_id = s.school_id 
                OR p.tenant_id = s.tenant_id
            )
            WHERE s.id = "plano_aee"."student_id"
            AND p.id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: plano_aee_comments
-- ============================================================================

ALTER TABLE "public"."plano_aee_comments" ENABLE ROW LEVEL SECURITY;

-- Todos podem comentar em planos que podem visualizar
CREATE POLICY "users_comment_on_visible_plans"
    ON "public"."plano_aee_comments"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "plano_aee_comments"."plano_aee_id"
            AND EXISTS (
                SELECT 1 FROM "public"."students" s
                JOIN "public"."profiles" p ON (
                    p.school_id = s.school_id 
                    OR p.tenant_id = s.tenant_id
                )
                WHERE s.id = pa.student_id
                AND p.id = auth.uid()
            )
        )
    );

-- Usuários podem ver todos os comentários dos planos que acessam
CREATE POLICY "users_view_comments_on_accessible_plans"
    ON "public"."plano_aee_comments"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "plano_aee_comments"."plano_aee_id"
        )
    );

-- Usuários podem editar/deletar apenas seus próprios comentários
CREATE POLICY "users_manage_own_comments"
    ON "public"."plano_aee_comments"
    FOR ALL
    USING ("user_id" = auth.uid());

-- ============================================================================
-- RLS POLICIES: plano_aee_attachments
-- ============================================================================

ALTER TABLE "public"."plano_aee_attachments" ENABLE ROW LEVEL SECURITY;

-- Professores de AEE podem gerenciar anexos
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

-- Outros podem apenas visualizar anexos
CREATE POLICY "others_view_attachments"
    ON "public"."plano_aee_attachments"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "plano_aee_attachments"."plano_aee_id"
        )
    );

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_plano_aee_updated_at ON "public"."plano_aee";
CREATE TRIGGER update_plano_aee_updated_at
    BEFORE UPDATE ON "public"."plano_aee"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plano_aee_comments_updated_at ON "public"."plano_aee_comments";
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































