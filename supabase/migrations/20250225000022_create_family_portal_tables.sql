-- ============================================================================
-- MIGRAÇÃO: Portal do Responsável / Família
-- Data: 25/02/2025
-- Descrição: Criar estrutura para portal da família com timeline, PEI simplificado e comunicação
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Linha do Tempo do Aluno (para famílias)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."student_timeline_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "event_type" text NOT NULL, -- 'frequency', 'activity', 'evaluation', 'aee_session', 'pei_update', 'message'
    "event_date" date NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "is_visible_to_family" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_student_timeline_events_student" ON "public"."student_timeline_events"("student_id");
CREATE INDEX IF NOT EXISTS "idx_student_timeline_events_date" ON "public"."student_timeline_events"("event_date");
CREATE INDEX IF NOT EXISTS "idx_student_timeline_events_type" ON "public"."student_timeline_events"("event_type");
CREATE INDEX IF NOT EXISTS "idx_student_timeline_events_visible" ON "public"."student_timeline_events"("is_visible_to_family");

-- ============================================================================
-- PARTE 2: Tabela de Observações da Família
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."family_observations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "family_member_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "observation_type" text NOT NULL, -- 'general', 'pei', 'aee', 'behavior', 'health', 'homework'
    "title" text,
    "observation_text" text NOT NULL,
    "priority" text DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    "read_by_school" boolean DEFAULT false,
    "read_by_school_at" timestamptz,
    "read_by_school_user_id" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_family_observations_student" ON "public"."family_observations"("student_id");
CREATE INDEX IF NOT EXISTS "idx_family_observations_family" ON "public"."family_observations"("family_member_id");
CREATE INDEX IF NOT EXISTS "idx_family_observations_read" ON "public"."family_observations"("read_by_school");

-- ============================================================================
-- PARTE 3: Tabela de Confirmação de Leitura de Recados
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."message_read_confirmations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "message_id" uuid NOT NULL, -- Referência a mensagem (pode ser de várias tabelas)
    "message_type" text NOT NULL, -- 'school_message', 'pei_notification', 'aee_notification', 'evaluation'
    "family_member_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "read_at" timestamptz DEFAULT now(),
    "confirmed_at" timestamptz,
    UNIQUE("message_id", "message_type", "family_member_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_message_read_confirmations_family" ON "public"."message_read_confirmations"("family_member_id");
CREATE INDEX IF NOT EXISTS "idx_message_read_confirmations_message" ON "public"."message_read_confirmations"("message_id", "message_type");

-- ============================================================================
-- PARTE 4: Tabela de Configurações de Privacidade por Família
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."family_privacy_settings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "family_member_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "show_diagnosis" boolean DEFAULT false,
    "show_medical_info" boolean DEFAULT false,
    "show_full_pei" boolean DEFAULT true,
    "show_aee_details" boolean DEFAULT true,
    "show_evaluations" boolean DEFAULT true,
    "show_frequency" boolean DEFAULT true,
    "show_behavioral_notes" boolean DEFAULT true,
    "notification_preferences" jsonb DEFAULT '{"push": true, "email": true, "sms": false}'::jsonb,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("student_id", "family_member_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_family_privacy_settings_student" ON "public"."family_privacy_settings"("student_id");
CREATE INDEX IF NOT EXISTS "idx_family_privacy_settings_family" ON "public"."family_privacy_settings"("family_member_id");

-- ============================================================================
-- PARTE 5: Função para buscar timeline do aluno (respeitando privacidade)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_student_timeline_for_family(
    p_student_id uuid,
    p_family_member_id uuid,
    p_start_date date DEFAULT CURRENT_DATE - interval '30 days',
    p_end_date date DEFAULT CURRENT_DATE + interval '30 days'
)
RETURNS TABLE (
    id uuid,
    event_type text,
    event_date date,
    title text,
    description text,
    metadata jsonb
) AS $$
DECLARE
    v_privacy_settings record;
BEGIN
    -- Buscar configurações de privacidade
    SELECT * INTO v_privacy_settings
    FROM "public"."family_privacy_settings"
    WHERE student_id = p_student_id
    AND family_member_id = p_family_member_id;

    -- Retornar eventos respeitando privacidade
    RETURN QUERY
    SELECT 
        ste.id,
        ste.event_type,
        ste.event_date,
        ste.title,
        CASE
            WHEN ste.event_type = 'evaluation' AND (v_privacy_settings IS NULL OR v_privacy_settings.show_evaluations = false) THEN NULL
            WHEN ste.event_type = 'frequency' AND (v_privacy_settings IS NULL OR v_privacy_settings.show_frequency = false) THEN NULL
            WHEN ste.event_type = 'pei_update' AND (v_privacy_settings IS NULL OR v_privacy_settings.show_full_pei = false) THEN NULL
            WHEN ste.event_type = 'aee_session' AND (v_privacy_settings IS NULL OR v_privacy_settings.show_aee_details = false) THEN NULL
            ELSE ste.description
        END as description,
        CASE
            WHEN ste.event_type = 'pei_update' AND (v_privacy_settings IS NULL OR v_privacy_settings.show_diagnosis = false) THEN
                ste.metadata - 'diagnosis' - 'medical_info'
            ELSE ste.metadata
        END as metadata
    FROM "public"."student_timeline_events" ste
    WHERE ste.student_id = p_student_id
    AND ste.is_visible_to_family = true
    AND ste.event_date BETWEEN p_start_date AND p_end_date
    ORDER BY ste.event_date DESC, ste.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 6: Função para criar resumo semanal
-- ============================================================================

CREATE OR REPLACE FUNCTION get_weekly_summary(
    p_student_id uuid,
    p_family_member_id uuid,
    p_week_start date
)
RETURNS jsonb AS $$
DECLARE
    v_week_end date;
    v_summary jsonb;
BEGIN
    v_week_end := p_week_start + interval '6 days';

    SELECT jsonb_build_object(
        'week_start', p_week_start,
        'week_end', v_week_end,
        'frequency', (
            SELECT jsonb_build_object(
                'total_days', COUNT(DISTINCT date),
                'present_days', COUNT(DISTINCT date) FILTER (WHERE status = 'present'),
                'absent_days', COUNT(DISTINCT date) FILTER (WHERE status = 'absent')
            )
            FROM "public"."attendance"
            WHERE student_id = p_student_id
            AND date BETWEEN p_week_start AND v_week_end
        ),
        'activities', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', event_date,
                    'title', title,
                    'type', event_type
                )
            )
            FROM "public"."student_timeline_events"
            WHERE student_id = p_student_id
            AND event_type = 'activity'
            AND event_date BETWEEN p_week_start AND v_week_end
            AND is_visible_to_family = true
            ORDER BY event_date DESC
            LIMIT 10
        ),
        'evaluations', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', event_date,
                    'title', title,
                    'description', description
                )
            )
            FROM "public"."student_timeline_events"
            WHERE student_id = p_student_id
            AND event_type = 'evaluation'
            AND event_date BETWEEN p_week_start AND v_week_end
            AND is_visible_to_family = true
            ORDER BY event_date DESC
        ),
        'aee_sessions', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', event_date,
                    'title', title
                )
            )
            FROM "public"."student_timeline_events"
            WHERE student_id = p_student_id
            AND event_type = 'aee_session'
            AND event_date BETWEEN p_week_start AND v_week_end
            AND is_visible_to_family = true
            ORDER BY event_date DESC
        )
    ) INTO v_summary;

    RETURN v_summary;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 7: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON "public"."student_timeline_events" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."family_observations" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."message_read_confirmations" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."family_privacy_settings" TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_timeline_for_family(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_summary(uuid, uuid, date) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."student_timeline_events" IS 'Eventos da linha do tempo do aluno visíveis para família';
COMMENT ON TABLE "public"."family_observations" IS 'Observações registradas pela família';
COMMENT ON TABLE "public"."message_read_confirmations" IS 'Confirmações de leitura de mensagens pela família';
COMMENT ON TABLE "public"."family_privacy_settings" IS 'Configurações de privacidade por família';
COMMENT ON FUNCTION get_student_timeline_for_family(uuid, uuid, date, date) IS 'Retorna timeline do aluno respeitando configurações de privacidade';
COMMENT ON FUNCTION get_weekly_summary(uuid, uuid, date) IS 'Gera resumo semanal do aluno para família';

