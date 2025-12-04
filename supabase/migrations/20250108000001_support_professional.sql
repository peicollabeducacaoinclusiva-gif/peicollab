-- ============================================================================
-- MIGRAÇÃO: Profissional de Apoio
-- ============================================================================
-- Adiciona novo role 'support_professional' e tabelas relacionadas
-- Data: 2025-01-08
-- ============================================================================

-- Adicionar novo valor ao ENUM user_role
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'user_role' AND e.enumlabel = 'support_professional'
    ) THEN
        ALTER TYPE user_role ADD VALUE 'support_professional';
    END IF;
END$$;

-- ============================================================================
-- TABELA: support_professional_students
-- ============================================================================
-- Vinculação entre Profissionais de Apoio e Alunos
CREATE TABLE IF NOT EXISTS "public"."support_professional_students" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "support_professional_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "assigned_by" uuid REFERENCES "auth"."users"("id"),
    "assigned_at" timestamptz DEFAULT now(),
    "is_active" boolean DEFAULT true,
    "notes" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "unique_active_assignment" UNIQUE ("support_professional_id", "student_id", "is_active")
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "idx_sp_students_sp_id" ON "public"."support_professional_students"("support_professional_id");
CREATE INDEX IF NOT EXISTS "idx_sp_students_student_id" ON "public"."support_professional_students"("student_id");
CREATE INDEX IF NOT EXISTS "idx_sp_students_is_active" ON "public"."support_professional_students"("is_active");

-- ============================================================================
-- TABELA: support_professional_feedbacks
-- ============================================================================
-- Feedbacks diários dos Profissionais de Apoio sobre os alunos
CREATE TABLE IF NOT EXISTS "public"."support_professional_feedbacks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "support_professional_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "feedback_date" date NOT NULL DEFAULT CURRENT_DATE,
    
    -- Scores de 1 a 5
    "socialization_score" integer CHECK ("socialization_score" BETWEEN 1 AND 5),
    "autonomy_score" integer CHECK ("autonomy_score" BETWEEN 1 AND 5),
    "behavior_score" integer CHECK ("behavior_score" BETWEEN 1 AND 5),
    
    -- Comentários opcionais
    "comments" text,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraint: um feedback por profissional por aluno por dia
    CONSTRAINT "unique_feedback_per_day" UNIQUE ("student_id", "support_professional_id", "feedback_date")
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "idx_sp_feedbacks_student_id" ON "public"."support_professional_feedbacks"("student_id");
CREATE INDEX IF NOT EXISTS "idx_sp_feedbacks_sp_id" ON "public"."support_professional_feedbacks"("support_professional_id");
CREATE INDEX IF NOT EXISTS "idx_sp_feedbacks_date" ON "public"."support_professional_feedbacks"("feedback_date");

-- ============================================================================
-- RLS POLICIES: support_professional_students
-- ============================================================================

ALTER TABLE "public"."support_professional_students" ENABLE ROW LEVEL SECURITY;

-- Profissionais de Apoio podem ver suas próprias vinculações
CREATE POLICY "support_professionals_view_own_assignments"
    ON "public"."support_professional_students"
    FOR SELECT
    USING (
        "support_professional_id" = auth.uid()
    );

-- Diretores podem gerenciar vinculações da sua escola
CREATE POLICY "directors_manage_sp_assignments"
    ON "public"."support_professional_students"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."students" s
            JOIN "public"."profiles" p ON p.school_id = s.school_id
            WHERE s.id = "support_professional_students"."student_id"
            AND p.id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM "public"."user_roles" ur
                WHERE ur.user_id = auth.uid()
                AND ur.role IN ('school_manager', 'coordinator')
            )
        )
    );

-- Coordenadores podem ver todas as vinculações da rede
CREATE POLICY "coordinators_view_all_sp_assignments"
    ON "public"."support_professional_students"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'coordinator'
        )
    );

-- ============================================================================
-- RLS POLICIES: support_professional_feedbacks
-- ============================================================================

ALTER TABLE "public"."support_professional_feedbacks" ENABLE ROW LEVEL SECURITY;

-- Profissionais de Apoio podem gerenciar seus próprios feedbacks
CREATE POLICY "support_professionals_manage_own_feedbacks"
    ON "public"."support_professional_feedbacks"
    FOR ALL
    USING (
        "support_professional_id" = auth.uid()
    );

-- Professores podem ver feedbacks dos alunos que gerenciam
CREATE POLICY "teachers_view_student_feedbacks"
    ON "public"."support_professional_feedbacks"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."peis" p
            WHERE p.student_id = "support_professional_feedbacks"."student_id"
            AND (
                p.assigned_teacher_id = auth.uid()
                OR p.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM "public"."pei_teachers" pt
                    WHERE pt.pei_id = p.id
                    AND pt.teacher_id = auth.uid()
                )
            )
        )
    );

-- Coordenadores e diretores podem ver todos os feedbacks da sua escola/rede
CREATE POLICY "coordinators_directors_view_feedbacks"
    ON "public"."support_professional_feedbacks"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."students" s
            JOIN "public"."profiles" p ON (
                p.school_id = s.school_id 
                OR p.tenant_id = s.tenant_id
            )
            WHERE s.id = "support_professional_feedbacks"."student_id"
            AND p.id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM "public"."user_roles" ur
                WHERE ur.user_id = auth.uid()
                AND ur.role IN ('coordinator', 'school_manager', 'education_secretary')
            )
        )
    );

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sp_students_updated_at ON "public"."support_professional_students";
CREATE TRIGGER update_sp_students_updated_at
    BEFORE UPDATE ON "public"."support_professional_students"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sp_feedbacks_updated_at ON "public"."support_professional_feedbacks";
CREATE TRIGGER update_sp_feedbacks_updated_at
    BEFORE UPDATE ON "public"."support_professional_feedbacks"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."support_professional_students" IS 'Vinculação entre Profissionais de Apoio e Alunos';
COMMENT ON TABLE "public"."support_professional_feedbacks" IS 'Feedbacks diários dos Profissionais de Apoio sobre socialização, autonomia e comportamento';

COMMENT ON COLUMN "public"."support_professional_feedbacks"."socialization_score" IS 'Pontuação de socialização: 1 (muito ruim) a 5 (excelente)';
COMMENT ON COLUMN "public"."support_professional_feedbacks"."autonomy_score" IS 'Pontuação de autonomia: 1 (muito ruim) a 5 (excelente)';
COMMENT ON COLUMN "public"."support_professional_feedbacks"."behavior_score" IS 'Pontuação de comportamento: 1 (muito ruim) a 5 (excelente)';































