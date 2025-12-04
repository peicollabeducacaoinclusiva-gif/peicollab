-- ============================================================================
-- MIGRAÇÃO: Integração com Recursos Interativos do App Atividades
-- ============================================================================
-- Sistema de vinculação de atividades do App Atividades ao Plano AEE
-- Nota: Recursos interativos e atividades lúdicas são desenvolvidos no App Atividades
-- Este módulo apenas registra o uso e adaptações das atividades no contexto do AEE
-- Data: 2025-02-20
-- ============================================================================

-- ============================================================================
-- TABELA: aee_activity_links
-- ============================================================================
-- Vinculação de atividades do App Atividades ao Plano AEE
-- Permite usar atividades interativas e lúdicas desenvolvidas no App Atividades
CREATE TABLE IF NOT EXISTS "public"."aee_activity_links" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "student_id" uuid REFERENCES "public"."students"("id") ON DELETE SET NULL,
    
    -- Referência à atividade do App Atividades
    "activity_id" uuid NOT NULL, -- ID da atividade no App Atividades
    "activity_name" text NOT NULL, -- Nome da atividade (cópia para referência)
    "activity_type" text, -- 'game', 'quiz', 'simulation', 'story', 'exercise'
    "activity_url" text, -- URL da atividade no App Atividades
    
    -- Adaptações para AEE
    "adaptations_made" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"adaptation_type": "string", "description": "string", "reason": "string"}]
    
    "target_disabilities" jsonb DEFAULT '[]'::jsonb,
    -- Formato: ["TEA", "Deficiência Visual", "TDAH", etc.]
    
    "target_skills" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"skill": "string", "level": "string"}]
    
    "accessibility_adaptations" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"feature": "screen_reader", "enabled": true}, {"feature": "high_contrast", "enabled": true}]
    
    -- Uso da atividade
    "used_in_context" text CHECK ("used_in_context" IN (
        'individual_aee', 
        'group_aee', 
        'co_teaching', 
        'homework',
        'assessment'
    )),
    "co_teaching_session_id" uuid REFERENCES "public"."aee_co_teaching_sessions"("id") ON DELETE SET NULL,
    
    -- Eficácia e feedback
    "effectiveness_rating" integer CHECK ("effectiveness_rating" >= 1 AND "effectiveness_rating" <= 5),
    "student_response" text,
    "effectiveness_feedback" text,
    "usage_count" integer DEFAULT 0,
    
    -- Metadados
    "linked_by" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "linked_at" timestamptz DEFAULT now(),
    "last_used_at" timestamptz,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_activity_links_plan" ON "public"."aee_activity_links"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_aee_activity_links_student" ON "public"."aee_activity_links"("student_id");
CREATE INDEX IF NOT EXISTS "idx_aee_activity_links_activity" ON "public"."aee_activity_links"("activity_id");
CREATE INDEX IF NOT EXISTS "idx_aee_activity_links_co_teaching" ON "public"."aee_activity_links"("co_teaching_session_id");
CREATE INDEX IF NOT EXISTS "idx_aee_activity_links_context" ON "public"."aee_activity_links"("used_in_context");

-- ============================================================================
-- TABELA: aee_activity_sessions
-- ============================================================================
-- Sessões de uso de atividades interativas vinculadas do App Atividades
CREATE TABLE IF NOT EXISTS "public"."aee_activity_sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "activity_link_id" uuid NOT NULL REFERENCES "public"."aee_activity_links"("id") ON DELETE CASCADE,
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    
    -- Sessão
    "session_date" date NOT NULL,
    "duration_minutes" integer,
    "used_by" uuid NOT NULL REFERENCES "auth"."users"("id"),
    
    -- Resultados e desempenho
    "student_responses" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"responses": [...], "score": number, "completion_percentage": number}
    
    "performance_data" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"time_spent": number, "attempts": number, "errors": number, "hints_used": number}
    
    "learning_outcomes" text,
    "skills_demonstrated" jsonb DEFAULT '[]'::jsonb,
    "areas_needing_improvement" jsonb DEFAULT '[]'::jsonb,
    
    -- Observações
    "observations" text,
    "student_engagement" text CHECK ("student_engagement" IN ('low', 'medium', 'high')),
    "adaptations_used" jsonb DEFAULT '[]'::jsonb,
    
    -- Próximos passos
    "next_steps" text,
    "recommended_follow_up" text,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_activity_sessions_link" ON "public"."aee_activity_sessions"("activity_link_id");
CREATE INDEX IF NOT EXISTS "idx_aee_activity_sessions_plan" ON "public"."aee_activity_sessions"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_aee_activity_sessions_student" ON "public"."aee_activity_sessions"("student_id");
CREATE INDEX IF NOT EXISTS "idx_aee_activity_sessions_date" ON "public"."aee_activity_sessions"("session_date");

-- ============================================================================
-- RPCs PARA INTEGRAÇÃO COM APP ATIVIDADES
-- ============================================================================

-- RPC: Vincular atividade do App Atividades ao Plano AEE
CREATE OR REPLACE FUNCTION link_activity_to_aee_plan(
    p_plan_id uuid,
    p_activity_id uuid,
    p_activity_name text,
    p_activity_type text DEFAULT NULL,
    p_activity_url text DEFAULT NULL,
    p_adaptations_made jsonb DEFAULT '[]'::jsonb,
    p_target_disabilities jsonb DEFAULT '[]'::jsonb,
    p_target_skills jsonb DEFAULT '[]'::jsonb,
    p_accessibility_adaptations jsonb DEFAULT '[]'::jsonb,
    p_used_in_context text DEFAULT NULL,
    p_student_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_link_id uuid;
BEGIN
    INSERT INTO "public"."aee_activity_links" (
        plan_id,
        activity_id,
        activity_name,
        activity_type,
        activity_url,
        adaptations_made,
        target_disabilities,
        target_skills,
        accessibility_adaptations,
        used_in_context,
        student_id,
        linked_by
    ) VALUES (
        p_plan_id,
        p_activity_id,
        p_activity_name,
        p_activity_type,
        p_activity_url,
        p_adaptations_made,
        p_target_disabilities,
        p_target_skills,
        p_accessibility_adaptations,
        p_used_in_context,
        p_student_id,
        auth.uid()
    )
    RETURNING id INTO v_link_id;
    
    RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION link_activity_to_aee_plan IS 
'Vincular atividade do App Atividades ao Plano AEE com adaptações específicas';

-- RPC: Registrar sessão de uso de atividade
CREATE OR REPLACE FUNCTION record_activity_session(
    p_activity_link_id uuid,
    p_plan_id uuid,
    p_student_id uuid,
    p_session_date date,
    p_duration_minutes integer DEFAULT NULL,
    p_student_responses jsonb DEFAULT '{}'::jsonb,
    p_performance_data jsonb DEFAULT '{}'::jsonb,
    p_learning_outcomes text DEFAULT NULL,
    p_observations text DEFAULT NULL,
    p_student_engagement text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_session_id uuid;
BEGIN
    INSERT INTO "public"."aee_activity_sessions" (
        activity_link_id,
        plan_id,
        student_id,
        session_date,
        duration_minutes,
        used_by,
        student_responses,
        performance_data,
        learning_outcomes,
        observations,
        student_engagement
    ) VALUES (
        p_activity_link_id,
        p_plan_id,
        p_student_id,
        p_session_date,
        p_duration_minutes,
        auth.uid(),
        p_student_responses,
        p_performance_data,
        p_learning_outcomes,
        p_observations,
        p_student_engagement
    )
    RETURNING id INTO v_session_id;
    
    -- Atualizar contador de uso e última data de uso
    UPDATE "public"."aee_activity_links"
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE id = p_activity_link_id;
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_activity_session IS 
'Registrar sessão de uso de atividade interativa';

-- RPC: Buscar atividades vinculadas a um plano
CREATE OR REPLACE FUNCTION get_linked_activities_by_plan(p_plan_id uuid)
RETURNS TABLE (
    id uuid,
    activity_id uuid,
    activity_name text,
    activity_type text,
    activity_url text,
    adaptations_made jsonb,
    target_disabilities jsonb,
    usage_count integer,
    effectiveness_rating integer,
    last_used_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.activity_id,
        al.activity_name,
        al.activity_type,
        al.activity_url,
        al.adaptations_made,
        al.target_disabilities,
        al.usage_count,
        al.effectiveness_rating,
        al.last_used_at
    FROM "public"."aee_activity_links" al
    WHERE al.plan_id = p_plan_id
    ORDER BY al.last_used_at DESC NULLS LAST, al.linked_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_linked_activities_by_plan IS 
'Buscar atividades vinculadas a um plano AEE';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_aee_activity_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_aee_activity_links_updated_at_trigger ON "public"."aee_activity_links";
CREATE TRIGGER update_aee_activity_links_updated_at_trigger
    BEFORE UPDATE ON "public"."aee_activity_links"
    FOR EACH ROW
    EXECUTE FUNCTION update_aee_activity_links_updated_at();

DROP TRIGGER IF EXISTS update_aee_activity_sessions_updated_at_trigger ON "public"."aee_activity_sessions";
CREATE TRIGGER update_aee_activity_sessions_updated_at_trigger
    BEFORE UPDATE ON "public"."aee_activity_sessions"
    FOR EACH ROW
    EXECUTE FUNCTION update_aee_activity_links_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."aee_activity_links" ENABLE ROW LEVEL SECURITY;

-- Professores AEE podem ver atividades vinculadas aos seus planos
CREATE POLICY "aee_teachers_view_activity_links"
    ON "public"."aee_activity_links"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_activity_links"."plan_id"
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
                    SELECT school_id FROM "public"."plano_aee" WHERE id = "aee_activity_links"."plan_id"
                )
                OR p.tenant_id IN (
                    SELECT tenant_id FROM "public"."plano_aee" WHERE id = "aee_activity_links"."plan_id"
                )
            )
        )
    );

-- Professores AEE podem vincular atividades
CREATE POLICY "aee_teachers_link_activities"
    ON "public"."aee_activity_links"
    FOR INSERT
    WITH CHECK (
        "linked_by" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role = 'aee_teacher'
        )
        AND EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_activity_links"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
    );

-- Professores AEE podem atualizar vínculos
CREATE POLICY "aee_teachers_update_activity_links"
    ON "public"."aee_activity_links"
    FOR UPDATE
    USING ("linked_by" = auth.uid())
    WITH CHECK ("linked_by" = auth.uid());

ALTER TABLE "public"."aee_activity_sessions" ENABLE ROW LEVEL SECURITY;

-- Professores AEE podem ver sessões de atividades
CREATE POLICY "aee_teachers_view_activity_sessions"
    ON "public"."aee_activity_sessions"
    FOR SELECT
    USING (
        "used_by" = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_activity_sessions"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
    );

-- Professores AEE podem criar sessões
CREATE POLICY "aee_teachers_create_activity_sessions"
    ON "public"."aee_activity_sessions"
    FOR INSERT
    WITH CHECK (
        "used_by" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role = 'aee_teacher'
        )
    );

-- Professores AEE podem atualizar suas sessões
CREATE POLICY "aee_teachers_update_activity_sessions"
    ON "public"."aee_activity_sessions"
    FOR UPDATE
    USING ("used_by" = auth.uid())
    WITH CHECK ("used_by" = auth.uid());

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."aee_activity_links" IS 
'Vinculação de atividades do App Atividades ao Plano AEE com adaptações específicas';
COMMENT ON TABLE "public"."aee_activity_sessions" IS 
'Sessões de uso de atividades interativas vinculadas do App Atividades';

COMMENT ON COLUMN "public"."aee_activity_links"."activity_id" IS 
'ID da atividade no App Atividades (pode referenciar tabela externa futuramente)';
COMMENT ON COLUMN "public"."aee_activity_links"."adaptations_made" IS 
'Adaptações feitas na atividade original para uso no contexto AEE';
COMMENT ON COLUMN "public"."aee_activity_links"."used_in_context" IS 
'Contexto de uso: individual_aee, group_aee, co_teaching, homework, assessment';

