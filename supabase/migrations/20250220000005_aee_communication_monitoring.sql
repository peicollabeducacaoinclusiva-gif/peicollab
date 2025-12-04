-- ============================================================================
-- MIGRAÇÃO: Comunicação e Monitoramento - Plano de AEE
-- ============================================================================
-- Sistema de comunicação entre professores AEE e regulares
-- Registro expandido de repertório de aprendizagem
-- Monitoramento detalhado de progresso individual
-- Data: 2025-02-20
-- ============================================================================

-- ============================================================================
-- TABELA: aee_teacher_communication
-- ============================================================================
-- Comunicação entre professores AEE e professores regulares
CREATE TABLE IF NOT EXISTS "public"."aee_teacher_communication" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "from_user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "to_user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Tipo de comunicação
    "communication_type" text NOT NULL CHECK ("communication_type" IN (
        'message', 
        'meeting_request', 
        'feedback', 
        'alert',
        'question',
        'suggestion',
        'update'
    )),
    
    -- Conteúdo
    "subject" text,
    "message_text" text NOT NULL,
    "priority" text DEFAULT 'medium' CHECK ("priority" IN ('low', 'medium', 'high', 'urgent')),
    
    -- Status de leitura
    "read_status" boolean DEFAULT false,
    "read_at" timestamptz,
    
    -- Relacionamentos
    "related_session_id" uuid, -- ID de sessão de co-ensino (se aplicável)
    "related_material_id" uuid, -- ID de material (se aplicável)
    "related_activity_id" uuid, -- ID de atividade (se aplicável)
    "parent_message_id" uuid REFERENCES "public"."aee_teacher_communication"("id") ON DELETE SET NULL, -- Para threads
    
    -- Anexos
    "attachments" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"file_name": "string", "file_url": "string", "file_type": "string"}]
    
    -- Ações (para meeting_request)
    "action_required" boolean DEFAULT false,
    "action_deadline" date,
    "action_completed" boolean DEFAULT false,
    "action_completed_at" timestamptz,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_communication_plan" ON "public"."aee_teacher_communication"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_aee_communication_from" ON "public"."aee_teacher_communication"("from_user_id");
CREATE INDEX IF NOT EXISTS "idx_aee_communication_to" ON "public"."aee_teacher_communication"("to_user_id");
CREATE INDEX IF NOT EXISTS "idx_aee_communication_type" ON "public"."aee_teacher_communication"("communication_type");
CREATE INDEX IF NOT EXISTS "idx_aee_communication_read_status" ON "public"."aee_teacher_communication"("read_status");
CREATE INDEX IF NOT EXISTS "idx_aee_communication_priority" ON "public"."aee_teacher_communication"("priority");
CREATE INDEX IF NOT EXISTS "idx_aee_communication_parent" ON "public"."aee_teacher_communication"("parent_message_id");
CREATE INDEX IF NOT EXISTS "idx_aee_communication_action_required" ON "public"."aee_teacher_communication"("action_required");

-- ============================================================================
-- TABELA: aee_learning_repertoire
-- ============================================================================
-- Registro expandido de repertório de aprendizagem do estudante
-- Contexto familiar, social, acadêmico para personalização do ensino
CREATE TABLE IF NOT EXISTS "public"."aee_learning_repertoire" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "recorded_by" uuid NOT NULL REFERENCES "auth"."users"("id"),
    
    -- Identificação do registro
    "record_date" date NOT NULL,
    "record_type" text NOT NULL CHECK ("record_type" IN ('initial', 'continuous', 'assessment', 'update')),
    
    -- Contexto Familiar
    "family_context" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {
    --   "structure": "string",
    --   "dynamics": "string",
    --   "support_level": "low|medium|high",
    --   "family_members": [{"name": "string", "relationship": "string", "support_role": "string"}],
    --   "economic_situation": "string",
    --   "cultural_background": "string",
    --   "home_environment": "string"
    -- }
    
    -- Contexto Social
    "social_context" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {
    --   "peer_relationships": "string",
    --   "integration_level": "low|medium|high",
    --   "group_participation": "string",
    --   "social_skills": "string",
    --   "friendships": [{"friend_name": "string", "relationship_quality": "string"}],
    --   "social_challenges": "string",
    --   "social_strengths": "string"
    -- }
    
    -- Contexto Acadêmico
    "academic_context" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {
    --   "performance_level": "below|at|above",
    --   "strengths_subjects": ["string"],
    --   "challenges_subjects": ["string"],
    --   "areas_of_interest": ["string"],
    --   "learning_pace": "slow|average|fast",
    --   "motivation_level": "low|medium|high",
    --   "study_habits": "string",
    --   "homework_completion": "string"
    -- }
    
    -- Perfil de Comunicação
    "communication_profile" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {
    --   "preferred_forms": ["verbal", "gestural", "written", "visual", "augmentative"],
    --   "communication_devices": ["string"],
    --   "vocabulary_level": "string",
    --   "comprehension_level": "string",
    --   "expression_level": "string",
    --   "assistive_technology_used": ["string"],
    --   "barriers": ["string"]
    -- }
    
    -- Preferências de Aprendizagem
    "learning_preferences" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {
    --   "learning_styles": ["visual", "auditory", "kinesthetic", "reading"],
    --   "learning_pace": "string",
    --   "attention_span": "string",
    --   "effective_strategies": ["string"],
    --   "environment_preferences": "string",
    --   "stimuli_preferences": "string",
    --   "working_preferences": "individual|pair|group|flexible"
    -- }
    
    -- Pontos Fortes e Fraquezas
    "strengths_weaknesses" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {
    --   "strengths": [{"area": "string", "description": "string", "examples": ["string"]}],
    --   "weaknesses": [{"area": "string", "description": "string", "interventions_needed": ["string"]}],
    --   "opportunities": ["string"],
    --   "challenges": ["string"]
    -- }
    
    -- Histórico de Intervenções
    "interventions_history" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{
    --   "intervention_type": "string",
    --   "date_start": "date",
    --   "date_end": "date",
    --   "provider": "string",
    --   "effectiveness": "string",
    --   "notes": "string"
    -- }]
    
    -- Observações gerais
    "notes" text,
    "next_assessment_date" date,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_learning_repertoire_student" ON "public"."aee_learning_repertoire"("student_id");
CREATE INDEX IF NOT EXISTS "idx_aee_learning_repertoire_plan" ON "public"."aee_learning_repertoire"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_aee_learning_repertoire_recorded_by" ON "public"."aee_learning_repertoire"("recorded_by");
CREATE INDEX IF NOT EXISTS "idx_aee_learning_repertoire_date" ON "public"."aee_learning_repertoire"("record_date");
CREATE INDEX IF NOT EXISTS "idx_aee_learning_repertoire_type" ON "public"."aee_learning_repertoire"("record_type");

-- ============================================================================
-- TABELA: aee_progress_tracking
-- ============================================================================
-- Monitoramento detalhado de progresso individual do estudante
-- Baseado em evidências para apoiar decisões pedagógicas
CREATE TABLE IF NOT EXISTS "public"."aee_progress_tracking" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "goal_id" uuid, -- Referência a plano_aee_goals ou pei_goals (opcional)
    
    -- Identificação do registro
    "tracking_date" date NOT NULL,
    "tracker_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    
    -- Tipo de métrica
    "metric_type" text NOT NULL CHECK ("metric_type" IN (
        'skill_acquisition', 
        'behavior_change', 
        'participation', 
        'independence',
        'communication',
        'social_interaction',
        'academic_achievement',
        'motor_skills',
        'self_care',
        'other'
    )),
    
    -- Valor da métrica
    "metric_value" numeric(10, 2),
    "metric_unit" text, -- 'percentage', 'count', 'rating', 'duration_minutes', 'score', etc.
    "metric_description" text, -- Descrição do que está sendo medido
    
    -- Dados de observação
    "observation_data" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {
    --   "context": "string",
    --   "method": "string",
    --   "duration": "integer",
    --   "environment": "string",
    --   "supports_used": ["string"],
    --   "challenges_observed": ["string"],
    --   "successes_observed": ["string"]
    -- }
    
    -- Evidências
    "evidence_attachments" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"type": "photo|video|document|audio", "url": "string", "description": "string"}]
    
    -- Comparações
    "baseline_comparison" jsonb, -- Comparação com linha de base
    -- Formato: {"baseline_value": "number", "baseline_date": "date", "improvement": "number"}
    
    "target_comparison" jsonb, -- Comparação com meta/objetivo
    -- Formato: {"target_value": "number", "target_date": "date", "progress_percentage": "number"}
    
    -- Tendência
    "trend" text CHECK ("trend" IN ('improving', 'stable', 'declining', 'fluctuating')),
    "trend_analysis" text, -- Análise da tendência
    
    -- Observações e recomendações
    "observations" text,
    "recommendations" text,
    "next_steps" text,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_progress_tracking_plan" ON "public"."aee_progress_tracking"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_aee_progress_tracking_student" ON "public"."aee_progress_tracking"("student_id");
CREATE INDEX IF NOT EXISTS "idx_aee_progress_tracking_goal" ON "public"."aee_progress_tracking"("goal_id");
CREATE INDEX IF NOT EXISTS "idx_aee_progress_tracking_date" ON "public"."aee_progress_tracking"("tracking_date");
CREATE INDEX IF NOT EXISTS "idx_aee_progress_tracking_type" ON "public"."aee_progress_tracking"("metric_type");
CREATE INDEX IF NOT EXISTS "idx_aee_progress_tracking_trend" ON "public"."aee_progress_tracking"("trend");

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_aee_communication_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_aee_teacher_communication_updated_at ON "public"."aee_teacher_communication";
CREATE TRIGGER update_aee_teacher_communication_updated_at
    BEFORE UPDATE ON "public"."aee_teacher_communication"
    FOR EACH ROW
    EXECUTE FUNCTION update_aee_communication_updated_at();

DROP TRIGGER IF EXISTS update_aee_learning_repertoire_updated_at ON "public"."aee_learning_repertoire";
CREATE TRIGGER update_aee_learning_repertoire_updated_at
    BEFORE UPDATE ON "public"."aee_learning_repertoire"
    FOR EACH ROW
    EXECUTE FUNCTION update_aee_communication_updated_at();

DROP TRIGGER IF EXISTS update_aee_progress_tracking_updated_at ON "public"."aee_progress_tracking";
CREATE TRIGGER update_aee_progress_tracking_updated_at
    BEFORE UPDATE ON "public"."aee_progress_tracking"
    FOR EACH ROW
    EXECUTE FUNCTION update_aee_communication_updated_at();

-- Trigger para marcar mensagem como lida
CREATE OR REPLACE FUNCTION mark_message_as_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read_status = true AND OLD.read_status = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mark_communication_as_read_trigger ON "public"."aee_teacher_communication";
CREATE TRIGGER mark_communication_as_read_trigger
    BEFORE UPDATE ON "public"."aee_teacher_communication"
    FOR EACH ROW
    WHEN (NEW.read_status = true AND OLD.read_status = false)
    EXECUTE FUNCTION mark_message_as_read();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."aee_teacher_communication" ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver mensagens enviadas ou recebidas
CREATE POLICY "users_view_own_communications"
    ON "public"."aee_teacher_communication"
    FOR SELECT
    USING (
        "from_user_id" = auth.uid()
        OR "to_user_id" = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_teacher_communication"."plan_id"
            AND EXISTS (
                SELECT 1 FROM "public"."profiles" p
                JOIN "public"."user_roles" ur ON ur.user_id = p.id
                WHERE p.id = auth.uid()
                AND ur.role IN ('coordinator', 'school_director', 'school_manager')
                AND (p.school_id = pa.school_id OR p.tenant_id = pa.tenant_id)
            )
        )
    );

-- Usuários podem criar mensagens
CREATE POLICY "users_create_communications"
    ON "public"."aee_teacher_communication"
    FOR INSERT
    WITH CHECK (
        "from_user_id" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_teacher_communication"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM "public"."profiles" p
                    JOIN "public"."user_roles" ur ON ur.user_id = p.id
                    WHERE p.id = auth.uid()
                    AND ur.role IN ('teacher', 'aee_teacher', 'coordinator', 'school_director', 'school_manager')
                    AND (p.school_id = pa.school_id OR p.tenant_id = pa.tenant_id)
                )
            )
        )
    );

-- Usuários podem atualizar suas próprias mensagens e marcar como lidas
CREATE POLICY "users_update_own_communications"
    ON "public"."aee_teacher_communication"
    FOR UPDATE
    USING ("from_user_id" = auth.uid() OR "to_user_id" = auth.uid())
    WITH CHECK (
        ("from_user_id" = auth.uid() AND "to_user_id" = auth.uid())
        OR ("to_user_id" = auth.uid())
    );

ALTER TABLE "public"."aee_learning_repertoire" ENABLE ROW LEVEL SECURITY;

-- Professores AEE podem ver repertórios de seus alunos
CREATE POLICY "aee_teachers_view_learning_repertoire"
    ON "public"."aee_learning_repertoire"
    FOR SELECT
    USING (
        "recorded_by" = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_learning_repertoire"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role IN ('coordinator', 'school_director', 'school_manager', 'teacher')
            AND (
                p.school_id IN (
                    SELECT school_id FROM "public"."plano_aee" WHERE id = "aee_learning_repertoire"."plan_id"
                )
                OR p.tenant_id IN (
                    SELECT tenant_id FROM "public"."plano_aee" WHERE id = "aee_learning_repertoire"."plan_id"
                )
            )
        )
    );

-- Professores AEE podem criar registros de repertório
CREATE POLICY "aee_teachers_create_learning_repertoire"
    ON "public"."aee_learning_repertoire"
    FOR INSERT
    WITH CHECK (
        "recorded_by" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role IN ('aee_teacher', 'teacher', 'coordinator')
        )
        AND EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_learning_repertoire"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
    );

-- Professores AEE podem atualizar seus registros
CREATE POLICY "aee_teachers_update_learning_repertoire"
    ON "public"."aee_learning_repertoire"
    FOR UPDATE
    USING ("recorded_by" = auth.uid())
    WITH CHECK ("recorded_by" = auth.uid());

ALTER TABLE "public"."aee_progress_tracking" ENABLE ROW LEVEL SECURITY;

-- Professores AEE podem ver registros de progresso
CREATE POLICY "aee_teachers_view_progress_tracking"
    ON "public"."aee_progress_tracking"
    FOR SELECT
    USING (
        "tracker_id" = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_progress_tracking"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role IN ('coordinator', 'school_director', 'school_manager', 'teacher')
            AND (
                p.school_id IN (
                    SELECT school_id FROM "public"."plano_aee" WHERE id = "aee_progress_tracking"."plan_id"
                )
                OR p.tenant_id IN (
                    SELECT tenant_id FROM "public"."plano_aee" WHERE id = "aee_progress_tracking"."plan_id"
                )
            )
        )
    );

-- Professores AEE podem criar registros de progresso
CREATE POLICY "aee_teachers_create_progress_tracking"
    ON "public"."aee_progress_tracking"
    FOR INSERT
    WITH CHECK (
        "tracker_id" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role IN ('aee_teacher', 'teacher', 'coordinator')
        )
        AND EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_progress_tracking"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
    );

-- Professores AEE podem atualizar seus registros
CREATE POLICY "aee_teachers_update_progress_tracking"
    ON "public"."aee_progress_tracking"
    FOR UPDATE
    USING ("tracker_id" = auth.uid())
    WITH CHECK ("tracker_id" = auth.uid());

-- ============================================================================
-- RPCs PARA COMUNICAÇÃO
-- ============================================================================

-- RPC: Buscar mensagens não lidas para um usuário
CREATE OR REPLACE FUNCTION get_unread_messages(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    plan_id uuid,
    from_user_id uuid,
    from_user_name text,
    communication_type text,
    subject text,
    message_text text,
    priority text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.plan_id,
        c.from_user_id,
        p.full_name as from_user_name,
        c.communication_type,
        c.subject,
        LEFT(c.message_text, 200) as message_text,
        c.priority,
        c.created_at
    FROM "public"."aee_teacher_communication" c
    LEFT JOIN "public"."profiles" p ON p.id = c.from_user_id
    WHERE c.to_user_id = p_user_id
    AND c.read_status = false
    ORDER BY 
        CASE c.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_unread_messages IS 
'Buscar mensagens não lidas para um usuário';

-- RPC: Contar mensagens não lidas
CREATE OR REPLACE FUNCTION count_unread_messages(p_user_id uuid)
RETURNS integer AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(*)::integer
    INTO v_count
    FROM "public"."aee_teacher_communication"
    WHERE to_user_id = p_user_id
    AND read_status = false;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION count_unread_messages IS 
'Contar mensagens não lidas para um usuário';

-- RPC: Marcar mensagens como lidas
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_message_ids uuid[],
    p_user_id uuid
)
RETURNS integer AS $$
DECLARE
    v_updated integer;
BEGIN
    UPDATE "public"."aee_teacher_communication"
    SET 
        read_status = true,
        read_at = NOW()
    WHERE id = ANY(p_message_ids)
    AND to_user_id = p_user_id
    AND read_status = false;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_messages_as_read IS 
'Marcar múltiplas mensagens como lidas';

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."aee_teacher_communication" IS 
'Comunicação entre professores AEE e professores regulares sobre planos AEE';
COMMENT ON TABLE "public"."aee_learning_repertoire" IS 
'Registro expandido de repertório de aprendizagem do estudante para personalização do ensino';
COMMENT ON TABLE "public"."aee_progress_tracking" IS 
'Monitoramento detalhado de progresso individual baseado em evidências';

COMMENT ON COLUMN "public"."aee_teacher_communication"."parent_message_id" IS 
'ID da mensagem pai para criar threads de conversação';
COMMENT ON COLUMN "public"."aee_learning_repertoire"."family_context" IS 
'Contexto familiar do estudante para personalização do ensino';
COMMENT ON COLUMN "public"."aee_learning_repertoire"."social_context" IS 
'Contexto social e relações interpessoais do estudante';
COMMENT ON COLUMN "public"."aee_learning_repertoire"."communication_profile" IS 
'Perfil de comunicação do estudante incluindo preferências e barreiras';
COMMENT ON COLUMN "public"."aee_progress_tracking"."evidence_attachments" IS 
'Evidências do progresso (fotos, vídeos, documentos, áudios)';

