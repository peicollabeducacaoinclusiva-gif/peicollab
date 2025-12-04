-- ============================================================================
-- MIGRAÇÃO: Co-ensino e Planejamento Conjunto - Plano de AEE
-- ============================================================================
-- Sistema de co-ensino onde professor AEE e professor regular planejam 
-- e executam aulas conjuntas para promover inclusão
-- Data: 2025-02-20
-- ============================================================================

-- ============================================================================
-- TABELA: aee_co_teaching_sessions
-- ============================================================================
-- Sessões de co-ensino entre professor AEE e professor regular
CREATE TABLE IF NOT EXISTS "public"."aee_co_teaching_sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "regular_teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "aee_teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Identificação da sessão
    "session_date" date NOT NULL,
    "start_time" time NOT NULL,
    "end_time" time NOT NULL,
    "subject_id" uuid REFERENCES "public"."subjects"("id") ON DELETE SET NULL,
    "subject_name" text, -- Nome da disciplina (caso subject_id não exista)
    "topic" text,
    "grade" text, -- Série/ano
    
    -- Conteúdo da sessão
    "lesson_plan_id" uuid REFERENCES "public"."aee_lesson_plans"("id") ON DELETE SET NULL,
    "materials_used" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"material_id": "uuid", "material_name": "string", "how_used": "string"}]
    
    -- Observações e avaliação
    "observations" text,
    "effectiveness_rating" integer CHECK ("effectiveness_rating" >= 1 AND "effectiveness_rating" <= 5),
    "student_engagement" text, -- 'low', 'medium', 'high'
    "inclusion_success" boolean,
    "challenges_faced" text,
    "success_factors" text,
    "next_steps" text,
    
    -- Status
    "status" text DEFAULT 'planned' CHECK ("status" IN ('planned', 'in_progress', 'completed', 'cancelled', 'postponed')),
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_co_teaching_sessions_plan" ON "public"."aee_co_teaching_sessions"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_aee_co_teaching_sessions_student" ON "public"."aee_co_teaching_sessions"("student_id");
CREATE INDEX IF NOT EXISTS "idx_aee_co_teaching_sessions_class" ON "public"."aee_co_teaching_sessions"("class_id");
CREATE INDEX IF NOT EXISTS "idx_aee_co_teaching_sessions_regular_teacher" ON "public"."aee_co_teaching_sessions"("regular_teacher_id");
CREATE INDEX IF NOT EXISTS "idx_aee_co_teaching_sessions_aee_teacher" ON "public"."aee_co_teaching_sessions"("aee_teacher_id");
CREATE INDEX IF NOT EXISTS "idx_aee_co_teaching_sessions_date" ON "public"."aee_co_teaching_sessions"("session_date");
CREATE INDEX IF NOT EXISTS "idx_aee_co_teaching_sessions_status" ON "public"."aee_co_teaching_sessions"("status");

-- ============================================================================
-- TABELA: aee_lesson_plans
-- ============================================================================
-- Planos de aula conjuntos criados por professor AEE e professor regular
CREATE TABLE IF NOT EXISTS "public"."aee_lesson_plans" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "co_teaching_session_id" uuid REFERENCES "public"."aee_co_teaching_sessions"("id") ON DELETE SET NULL,
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "class_id" uuid REFERENCES "public"."classes"("id") ON DELETE SET NULL,
    "subject_id" uuid REFERENCES "public"."subjects"("id") ON DELETE SET NULL,
    
    -- Identificação
    "subject" text NOT NULL,
    "topic" text NOT NULL,
    "grade" text,
    "duration_minutes" integer,
    "planned_date" date,
    
    -- Objetivos
    "learning_objectives" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"objective": "string", "target_student": "string ou 'all'", "success_criteria": "string"}]
    
    -- Estratégias inclusivas
    "inclusive_strategies" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"strategy": "string", "description": "string", "applied_to": "string"}]
    
    -- Atividades diferenciadas
    "differentiated_activities" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"activity_name": "string", "description": "string", "for_whom": "string", "materials": []}]
    
    -- Contribuições de cada professor
    "aee_teacher_contributions" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"role": "string", "responsibilities": [], "specialized_support": "string"}
    
    "regular_teacher_contributions" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"role": "string", "responsibilities": [], "content_delivery": "string"}
    
    -- Adaptações necessárias
    "adaptations_needed" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"type": "string", "description": "string", "implementation": "string"}]
    
    -- Materiais e recursos
    "materials_list" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"material": "string", "quantity": "integer", "location": "string", "accessibility_features": []}]
    
    -- Métodos de avaliação
    "assessment_methods" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"method": "string", "description": "string", "adapted_for": "string"}]
    
    -- Status e aprovação
    "status" text DEFAULT 'draft' CHECK ("status" IN ('draft', 'shared', 'approved', 'rejected')),
    "created_by" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "approved_by" uuid REFERENCES "auth"."users"("id"),
    "approved_at" timestamptz,
    "approval_notes" text,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_lesson_plans_plan" ON "public"."aee_lesson_plans"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_aee_lesson_plans_session" ON "public"."aee_lesson_plans"("co_teaching_session_id");
CREATE INDEX IF NOT EXISTS "idx_aee_lesson_plans_class" ON "public"."aee_lesson_plans"("class_id");
CREATE INDEX IF NOT EXISTS "idx_aee_lesson_plans_status" ON "public"."aee_lesson_plans"("status");
CREATE INDEX IF NOT EXISTS "idx_aee_lesson_plans_date" ON "public"."aee_lesson_plans"("planned_date");

-- ============================================================================
-- TABELA: aee_co_teaching_participants
-- ============================================================================
-- Participantes das sessões de co-ensino (observadores, apoio, etc.)
CREATE TABLE IF NOT EXISTS "public"."aee_co_teaching_participants" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "session_id" uuid NOT NULL REFERENCES "public"."aee_co_teaching_sessions"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Papel do participante
    "role" text NOT NULL CHECK ("role" IN ('co_teacher', 'observer', 'support', 'student_support', 'specialist')),
    "participation_level" text CHECK ("participation_level" IN ('active', 'observing', 'supporting')),
    
    -- Feedback
    "feedback" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"observations": "string", "suggestions": "string", "effectiveness_rating": "integer"}
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    UNIQUE("session_id", "user_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_co_teaching_participants_session" ON "public"."aee_co_teaching_participants"("session_id");
CREATE INDEX IF NOT EXISTS "idx_aee_co_teaching_participants_user" ON "public"."aee_co_teaching_participants"("user_id");

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_aee_co_teaching_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_aee_co_teaching_sessions_updated_at ON "public"."aee_co_teaching_sessions";
CREATE TRIGGER update_aee_co_teaching_sessions_updated_at
    BEFORE UPDATE ON "public"."aee_co_teaching_sessions"
    FOR EACH ROW
    EXECUTE FUNCTION update_aee_co_teaching_updated_at();

DROP TRIGGER IF EXISTS update_aee_lesson_plans_updated_at ON "public"."aee_lesson_plans";
CREATE TRIGGER update_aee_lesson_plans_updated_at
    BEFORE UPDATE ON "public"."aee_lesson_plans"
    FOR EACH ROW
    EXECUTE FUNCTION update_aee_co_teaching_updated_at();

DROP TRIGGER IF EXISTS update_aee_co_teaching_participants_updated_at ON "public"."aee_co_teaching_participants";
CREATE TRIGGER update_aee_co_teaching_participants_updated_at
    BEFORE UPDATE ON "public"."aee_co_teaching_participants"
    FOR EACH ROW
    EXECUTE FUNCTION update_aee_co_teaching_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."aee_co_teaching_sessions" ENABLE ROW LEVEL SECURITY;

-- Professores AEE e regulares podem ver suas próprias sessões
CREATE POLICY "aee_and_regular_teachers_view_sessions"
    ON "public"."aee_co_teaching_sessions"
    FOR SELECT
    USING (
        "aee_teacher_id" = auth.uid()
        OR "regular_teacher_id" = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_co_teaching_sessions"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role IN ('coordinator', 'school_director', 'school_manager')
            AND (
                p.school_id IN (
                    SELECT school_id FROM "public"."plano_aee" WHERE id = "aee_co_teaching_sessions"."plan_id"
                )
                OR p.tenant_id IN (
                    SELECT tenant_id FROM "public"."plano_aee" WHERE id = "aee_co_teaching_sessions"."plan_id"
                )
            )
        )
    );

-- Professores AEE e regulares podem criar sessões
CREATE POLICY "aee_and_regular_teachers_create_sessions"
    ON "public"."aee_co_teaching_sessions"
    FOR INSERT
    WITH CHECK (
        "aee_teacher_id" = auth.uid()
        OR "regular_teacher_id" = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_co_teaching_sessions"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
    );

-- Professores AEE e regulares podem atualizar suas sessões
CREATE POLICY "aee_and_regular_teachers_update_sessions"
    ON "public"."aee_co_teaching_sessions"
    FOR UPDATE
    USING (
        "aee_teacher_id" = auth.uid()
        OR "regular_teacher_id" = auth.uid()
    )
    WITH CHECK (
        "aee_teacher_id" = auth.uid()
        OR "regular_teacher_id" = auth.uid()
    );

ALTER TABLE "public"."aee_lesson_plans" ENABLE ROW LEVEL SECURITY;

-- Professores AEE e regulares podem ver planos de aula relacionados
CREATE POLICY "teachers_view_lesson_plans"
    ON "public"."aee_lesson_plans"
    FOR SELECT
    USING (
        "created_by" = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."aee_co_teaching_sessions" s
            WHERE s.lesson_plan_id = "aee_lesson_plans"."id"
            AND (s.aee_teacher_id = auth.uid() OR s.regular_teacher_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_lesson_plans"."plan_id"
            AND EXISTS (
                SELECT 1 FROM "public"."profiles" p
                JOIN "public"."user_roles" ur ON ur.user_id = p.id
                WHERE p.id = auth.uid()
                AND (
                    ur.role IN ('coordinator', 'school_director', 'school_manager')
                    AND (p.school_id = pa.school_id OR p.tenant_id = pa.tenant_id)
                )
            )
        )
    );

-- Professores podem criar planos de aula
CREATE POLICY "teachers_create_lesson_plans"
    ON "public"."aee_lesson_plans"
    FOR INSERT
    WITH CHECK (
        "created_by" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role IN ('aee_teacher', 'teacher')
        )
    );

-- Professores podem atualizar seus próprios planos
CREATE POLICY "teachers_update_own_lesson_plans"
    ON "public"."aee_lesson_plans"
    FOR UPDATE
    USING ("created_by" = auth.uid())
    WITH CHECK ("created_by" = auth.uid());

ALTER TABLE "public"."aee_co_teaching_participants" ENABLE ROW LEVEL SECURITY;

-- Participantes podem ver seus próprios registros
CREATE POLICY "participants_view_own_records"
    ON "public"."aee_co_teaching_participants"
    FOR SELECT
    USING (
        "user_id" = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."aee_co_teaching_sessions" s
            WHERE s.id = "aee_co_teaching_participants"."session_id"
            AND (s.aee_teacher_id = auth.uid() OR s.regular_teacher_id = auth.uid())
        )
    );

-- Professores podem adicionar participantes
CREATE POLICY "teachers_add_participants"
    ON "public"."aee_co_teaching_participants"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."aee_co_teaching_sessions" s
            WHERE s.id = "aee_co_teaching_participants"."session_id"
            AND (s.aee_teacher_id = auth.uid() OR s.regular_teacher_id = auth.uid())
        )
    );

-- Participantes podem atualizar seus próprios feedbacks
CREATE POLICY "participants_update_own_feedback"
    ON "public"."aee_co_teaching_participants"
    FOR UPDATE
    USING ("user_id" = auth.uid())
    WITH CHECK ("user_id" = auth.uid());

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."aee_co_teaching_sessions" IS 'Sessões de co-ensino entre professor AEE e professor regular';
COMMENT ON TABLE "public"."aee_lesson_plans" IS 'Planos de aula conjuntos criados para co-ensino inclusivo';
COMMENT ON TABLE "public"."aee_co_teaching_participants" IS 'Participantes adicionais nas sessões de co-ensino';

COMMENT ON COLUMN "public"."aee_co_teaching_sessions"."effectiveness_rating" IS 'Avaliação da eficácia da sessão (1-5)';
COMMENT ON COLUMN "public"."aee_lesson_plans"."inclusive_strategies" IS 'Estratégias inclusivas aplicadas na aula';
COMMENT ON COLUMN "public"."aee_lesson_plans"."differentiated_activities" IS 'Atividades diferenciadas para diferentes níveis de aprendizado';

