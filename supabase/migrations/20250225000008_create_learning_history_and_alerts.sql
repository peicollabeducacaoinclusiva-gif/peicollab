-- ============================================================================
-- MIGRAÇÃO: Histórico de Aprendizagem + Sistema de Alertas
-- Data: 25/02/2025
-- Descrição: Criar tabelas para histórico de aprendizagem e alertas automáticos
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Histórico de Aprendizagem
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."student_learning_history" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "academic_year" integer NOT NULL,
    "period" text, -- 'bimestre', 'trimestre', 'semestre'
    "period_number" integer,
    "subject_id" uuid REFERENCES "public"."subjects"("id"),
    "attendance_rate" numeric(5,2), -- Percentual de frequência
    "average_grade" numeric(5,2),
    "performance_indicators" jsonb DEFAULT '{}'::jsonb, -- Indicadores por eixo/área
    "pei_goals_progress" jsonb DEFAULT '[]'::jsonb, -- Progresso das metas do PEI
    "aee_sessions_count" integer DEFAULT 0,
    "observations" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("student_id", "academic_year", "period", "period_number", "subject_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_learning_history_student" ON "public"."student_learning_history"("student_id");
CREATE INDEX IF NOT EXISTS "idx_learning_history_year" ON "public"."student_learning_history"("academic_year");
CREATE INDEX IF NOT EXISTS "idx_learning_history_subject" ON "public"."student_learning_history"("subject_id");

-- ============================================================================
-- PARTE 2: Tabela de Alertas Automáticos
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."automatic_alerts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "alert_type" text NOT NULL, -- 'low_attendance', 'critical_grade', 'pei_goal_at_risk', 'aee_missing'
    "severity" text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    "title" text NOT NULL,
    "message" text NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "status" text DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
    "acknowledged_by" uuid REFERENCES "auth"."users"("id"),
    "acknowledged_at" timestamptz,
    "resolved_at" timestamptz,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_alerts_student" ON "public"."automatic_alerts"("student_id");
CREATE INDEX IF NOT EXISTS "idx_alerts_type" ON "public"."automatic_alerts"("alert_type");
CREATE INDEX IF NOT EXISTS "idx_alerts_status" ON "public"."automatic_alerts"("status");
CREATE INDEX IF NOT EXISTS "idx_alerts_severity" ON "public"."automatic_alerts"("severity");
CREATE INDEX IF NOT EXISTS "idx_alerts_created" ON "public"."automatic_alerts"("created_at");

-- ============================================================================
-- PARTE 3: Tabela de Regras de Alertas
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."alert_rules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "rule_name" text NOT NULL,
    "alert_type" text NOT NULL,
    "condition" jsonb NOT NULL, -- Condições para disparar alerta
    "severity" text DEFAULT 'medium',
    "enabled" boolean DEFAULT true,
    "notification_channels" text[] DEFAULT ARRAY[]::text[], -- 'email', 'sms', 'in_app'
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_alert_rules_tenant" ON "public"."alert_rules"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_alert_rules_enabled" ON "public"."alert_rules"("enabled");

-- ============================================================================
-- PARTE 4: Função para calcular indicadores de aprendizagem
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_learning_indicators(
    p_student_id uuid,
    p_academic_year integer,
    p_period text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_indicators jsonb;
    v_attendance_rate numeric;
    v_average_grade numeric;
    v_subjects_count integer;
    v_pei_goals_count integer;
    v_aee_sessions_count integer;
BEGIN
    -- Calcular frequência média
    SELECT COALESCE(AVG(attendance_rate), 0)
    INTO v_attendance_rate
    FROM "public"."student_learning_history"
    WHERE student_id = p_student_id
    AND academic_year = p_academic_year
    AND (p_period IS NULL OR period = p_period);

    -- Calcular média de notas
    SELECT COALESCE(AVG(average_grade), 0)
    INTO v_average_grade
    FROM "public"."student_learning_history"
    WHERE student_id = p_student_id
    AND academic_year = p_academic_year
    AND (p_period IS NULL OR period = p_period);

    -- Contar disciplinas
    SELECT COUNT(DISTINCT subject_id)
    INTO v_subjects_count
    FROM "public"."student_learning_history"
    WHERE student_id = p_student_id
    AND academic_year = p_academic_year
    AND (p_period IS NULL OR period = p_period);

    -- Contar metas do PEI
    SELECT COUNT(*)
    INTO v_pei_goals_count
    FROM "public"."pei_goals" pg
    JOIN "public"."peis" p ON pg.pei_id = p.id
    WHERE p.student_id = p_student_id
    AND p.is_active_version = true;

    -- Contar sessões AEE
    SELECT COUNT(*)
    INTO v_aee_sessions_count
    FROM "public"."aee_sessions"
    WHERE student_id = p_student_id
    AND EXTRACT(YEAR FROM date) = p_academic_year;

    v_indicators := jsonb_build_object(
        'attendance_rate', v_attendance_rate,
        'average_grade', v_average_grade,
        'subjects_count', v_subjects_count,
        'pei_goals_count', v_pei_goals_count,
        'aee_sessions_count', v_aee_sessions_count,
        'calculated_at', now()
    );

    RETURN v_indicators;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 5: Função para verificar e criar alertas
-- ============================================================================

CREATE OR REPLACE FUNCTION check_and_create_alerts(p_student_id uuid)
RETURNS void AS $$
DECLARE
    v_rule record;
    v_condition jsonb;
    v_should_alert boolean;
    v_alert_title text;
    v_alert_message text;
    v_metadata jsonb;
BEGIN
    -- Buscar regras ativas
    FOR v_rule IN
        SELECT ar.*
        FROM "public"."alert_rules" ar
        JOIN "public"."students" s ON s.tenant_id = ar.tenant_id
        WHERE s.id = p_student_id
        AND ar.enabled = true
    LOOP
        v_condition := v_rule.condition;
        v_should_alert := false;
        v_metadata := '{}'::jsonb;

        -- Verificar condições baseadas no tipo de alerta
        CASE v_rule.alert_type
            WHEN 'low_attendance' THEN
                -- Verificar frequência baixa
                SELECT 
                    CASE 
                        WHEN attendance_rate < (v_condition->>'threshold')::numeric THEN true
                        ELSE false
                    END,
                    jsonb_build_object('attendance_rate', attendance_rate, 'threshold', v_condition->>'threshold')
                INTO v_should_alert, v_metadata
                FROM (
                    SELECT COALESCE(AVG(attendance_rate), 100) as attendance_rate
                    FROM "public"."student_learning_history"
                    WHERE student_id = p_student_id
                    AND academic_year = EXTRACT(YEAR FROM now())::integer
                ) sub;

                IF v_should_alert THEN
                    v_alert_title := 'Frequência Baixa';
                    v_alert_message := format('O aluno possui frequência de %.2f%%, abaixo do mínimo de %s%%', 
                        (v_metadata->>'attendance_rate')::numeric, v_condition->>'threshold');
                END IF;

            WHEN 'critical_grade' THEN
                -- Verificar notas críticas
                SELECT 
                    CASE 
                        WHEN average_grade < (v_condition->>'threshold')::numeric THEN true
                        ELSE false
                    END,
                    jsonb_build_object('average_grade', average_grade, 'threshold', v_condition->>'threshold')
                INTO v_should_alert, v_metadata
                FROM (
                    SELECT COALESCE(AVG(average_grade), 10) as average_grade
                    FROM "public"."student_learning_history"
                    WHERE student_id = p_student_id
                    AND academic_year = EXTRACT(YEAR FROM now())::integer
                ) sub;

                IF v_should_alert THEN
                    v_alert_title := 'Nota Crítica';
                    v_alert_message := format('O aluno possui média de %.2f, abaixo do mínimo de %s', 
                        (v_metadata->>'average_grade')::numeric, v_condition->>'threshold');
                END IF;

            WHEN 'pei_goal_at_risk' THEN
                -- Verificar metas do PEI em risco
                SELECT 
                    CASE 
                        WHEN COUNT(*) > 0 THEN true
                        ELSE false
                    END,
                    jsonb_build_object('goals_at_risk', COUNT(*))
                INTO v_should_alert, v_metadata
                FROM "public"."pei_goals" pg
                JOIN "public"."peis" p ON pg.pei_id = p.id
                WHERE p.student_id = p_student_id
                AND p.is_active_version = true
                AND pg.progress_level IN ('não iniciada', 'em andamento')
                AND pg.target_date < (now() + interval '30 days');

                IF v_should_alert THEN
                    v_alert_title := 'Meta do PEI em Risco';
                    v_alert_message := format('O aluno possui %s meta(s) do PEI com prazo próximo', 
                        (v_metadata->>'goals_at_risk')::text);
                END IF;

            WHEN 'aee_missing' THEN
                -- Verificar sessões AEE faltantes
                SELECT 
                    CASE 
                        WHEN COUNT(*) < (v_condition->>'min_sessions')::integer THEN true
                        ELSE false
                    END,
                    jsonb_build_object('sessions_count', COUNT(*), 'min_sessions', v_condition->>'min_sessions')
                INTO v_should_alert, v_metadata
                FROM "public"."aee_sessions"
                WHERE student_id = p_student_id
                AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM now())
                AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM now());

                IF v_should_alert THEN
                    v_alert_title := 'Sessões AEE Faltantes';
                    v_alert_message := format('O aluno possui apenas %s sessão(ões) AEE este mês, abaixo do mínimo de %s', 
                        (v_metadata->>'sessions_count')::text, v_condition->>'min_sessions');
                END IF;
        END CASE;

        -- Criar alerta se necessário
        IF v_should_alert THEN
            INSERT INTO "public"."automatic_alerts" (
                student_id,
                alert_type,
                severity,
                title,
                message,
                metadata,
                status
            )
            VALUES (
                p_student_id,
                v_rule.alert_type,
                v_rule.severity,
                v_alert_title,
                v_alert_message,
                v_metadata,
                'active'
            )
            ON CONFLICT DO NOTHING; -- Evitar duplicatas
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 6: Inserir regras padrão
-- ============================================================================

-- Regras padrão (serão aplicadas a todos os tenants)
INSERT INTO "public"."alert_rules" (tenant_id, rule_name, alert_type, condition, severity, enabled)
SELECT 
    NULL, -- Aplicar a todos os tenants
    'Frequência Baixa (< 75%)',
    'low_attendance',
    '{"threshold": 75}'::jsonb,
    'high',
    true
ON CONFLICT DO NOTHING;

INSERT INTO "public"."alert_rules" (tenant_id, rule_name, alert_type, condition, severity, enabled)
SELECT 
    NULL,
    'Nota Crítica (< 5.0)',
    'critical_grade',
    '{"threshold": 5.0}'::jsonb,
    'critical',
    true
ON CONFLICT DO NOTHING;

INSERT INTO "public"."alert_rules" (tenant_id, rule_name, alert_type, condition, severity, enabled)
SELECT 
    NULL,
    'Meta do PEI em Risco',
    'pei_goal_at_risk',
    '{}'::jsonb,
    'medium',
    true
ON CONFLICT DO NOTHING;

INSERT INTO "public"."alert_rules" (tenant_id, rule_name, alert_type, condition, severity, enabled)
SELECT 
    NULL,
    'Sessões AEE Faltantes (< 4/mês)',
    'aee_missing',
    '{"min_sessions": 4}'::jsonb,
    'medium',
    true
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 7: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON "public"."student_learning_history" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."automatic_alerts" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."alert_rules" TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_learning_indicators(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_create_alerts(uuid) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."student_learning_history" IS 'Histórico de aprendizagem e desempenho do aluno';
COMMENT ON TABLE "public"."automatic_alerts" IS 'Alertas automáticos gerados pelo sistema';
COMMENT ON TABLE "public"."alert_rules" IS 'Regras para geração automática de alertas';
COMMENT ON FUNCTION calculate_learning_indicators(uuid, integer, text) IS 'Calcula indicadores de aprendizagem do aluno';
COMMENT ON FUNCTION check_and_create_alerts(uuid) IS 'Verifica condições e cria alertas automáticos';

