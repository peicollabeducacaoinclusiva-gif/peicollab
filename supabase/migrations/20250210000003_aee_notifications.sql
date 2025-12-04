-- ============================================================================
-- PLANO AEE V2.0 - FASE 6: SISTEMA DE NOTIFICAÇÕES INTELIGENTES
-- ============================================================================
-- Descrição: Notificações automáticas para alertas importantes
-- Autor: Sistema PEI Collab
-- Data: 2025-02-10
-- ============================================================================

-- ============================================================================
-- 1. TABELA DE NOTIFICAÇÕES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_notifications" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Tipo e Contexto
    "notification_type" text NOT NULL CHECK ("notification_type" IN (
        'cycle_ending',           -- Fim de ciclo avaliativo
        'low_attendance',         -- Baixa frequência em atendimentos
        'pending_review',         -- Revisão de plano pendente
        'referral_no_response',   -- Encaminhamento sem resposta
        'visit_follow_up',        -- Follow-up de visita
        'goal_deadline',          -- Meta próxima do prazo
        'plan_expiring',          -- Plano expirando
        'missing_documentation'   -- Documentação faltando
    )),
    
    "priority" text DEFAULT 'media' CHECK ("priority" IN ('baixa', 'media', 'alta', 'urgente')),
    
    -- Dados da Notificação
    "title" text NOT NULL,
    "message" text NOT NULL,
    "action_url" text, -- URL para ação (ex: /planos/:id)
    "action_label" text, -- Label do botão (ex: "Ver Plano")
    
    -- Contexto (IDs relacionados)
    "plan_id" uuid REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "student_id" uuid REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "cycle_id" uuid REFERENCES "public"."aee_evaluation_cycles"("id") ON DELETE CASCADE,
    "referral_id" uuid REFERENCES "public"."aee_referrals"("id") ON DELETE CASCADE,
    "visit_id" uuid REFERENCES "public"."aee_school_visits"("id") ON DELETE CASCADE,
    
    -- Metadados Adicionais (JSON flexível)
    "metadata" jsonb DEFAULT '{}'::jsonb,
    -- Exemplo: {"days_remaining": 7, "attendance_rate": 45, "expected_rate": 75}
    
    -- Status
    "is_read" boolean DEFAULT false,
    "read_at" timestamptz,
    "is_dismissed" boolean DEFAULT false,
    "dismissed_at" timestamptz,
    
    -- Controle
    "created_at" timestamptz DEFAULT now(),
    "expires_at" timestamptz DEFAULT (now() + INTERVAL '30 days')
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "public"."aee_notifications"("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_tenant" ON "public"."aee_notifications"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_type" ON "public"."aee_notifications"("notification_type");
CREATE INDEX IF NOT EXISTS "idx_notifications_priority" ON "public"."aee_notifications"("priority");
CREATE INDEX IF NOT EXISTS "idx_notifications_unread" ON "public"."aee_notifications"("user_id", "is_read") WHERE is_read = false;
CREATE INDEX IF NOT EXISTS "idx_notifications_plan" ON "public"."aee_notifications"("plan_id");

-- Comentários
COMMENT ON TABLE "public"."aee_notifications" IS 'Sistema de notificações inteligentes do AEE';
COMMENT ON COLUMN "public"."aee_notifications"."metadata" IS 'Dados adicionais da notificação em formato JSON';

-- ============================================================================
-- 2. FUNÇÕES DE VERIFICAÇÃO E CRIAÇÃO DE NOTIFICAÇÕES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Função: Criar Notificação
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_aee_notification(
    p_tenant_id uuid,
    p_user_id uuid,
    p_type text,
    p_priority text,
    p_title text,
    p_message text,
    p_action_url text DEFAULT NULL,
    p_action_label text DEFAULT NULL,
    p_plan_id uuid DEFAULT NULL,
    p_student_id uuid DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id uuid;
BEGIN
    INSERT INTO aee_notifications (
        tenant_id,
        user_id,
        notification_type,
        priority,
        title,
        message,
        action_url,
        action_label,
        plan_id,
        student_id,
        metadata
    )
    VALUES (
        p_tenant_id,
        p_user_id,
        p_type,
        p_priority,
        p_title,
        p_message,
        p_action_url,
        p_action_label,
        p_plan_id,
        p_student_id,
        p_metadata
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2.2 Função: Verificar Ciclos Próximos do Fim
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_ending_cycles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
    v_days_remaining integer;
BEGIN
    -- Buscar ciclos que terminam em 7 dias ou menos
    FOR r IN
        SELECT 
            ec.id as cycle_id,
            ec.plan_id,
            p.student_id,
            p.tenant_id,
            p.assigned_aee_teacher_id as teacher_id,
            ec.cycle_name,
            ec.end_date,
            s.name as student_name,
            (ec.end_date - CURRENT_DATE) as days_remaining
        FROM aee_evaluation_cycles ec
        JOIN plano_aee p ON p.id = ec.plan_id
        JOIN students s ON s.id = p.student_id
        WHERE ec.end_date >= CURRENT_DATE
          AND ec.end_date <= CURRENT_DATE + INTERVAL '7 days'
          AND NOT EXISTS (
              SELECT 1 FROM aee_notifications n
              WHERE n.cycle_id = ec.id
                AND n.notification_type = 'cycle_ending'
                AND n.created_at > CURRENT_DATE - INTERVAL '7 days'
          )
    LOOP
        v_days_remaining := r.days_remaining;
        
        PERFORM create_aee_notification(
            r.tenant_id,
            r.teacher_id,
            'cycle_ending',
            CASE WHEN v_days_remaining <= 3 THEN 'alta' ELSE 'media' END,
            format('⏰ %s está terminando em %s dia(s)', r.cycle_name, v_days_remaining),
            format('O %s do aluno %s termina em %s dia(s). É hora de registrar a avaliação final do ciclo.',
                   r.cycle_name, r.student_name, v_days_remaining),
            format('/planos/%s/avaliacoes', r.plan_id),
            'Avaliar Ciclo',
            r.plan_id,
            r.student_id,
            jsonb_build_object('cycle_id', r.cycle_id, 'days_remaining', v_days_remaining)
        );
    END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2.3 Função: Verificar Baixa Frequência
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_low_attendance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
    v_attendance_rate numeric;
    v_expected_rate integer := 75; -- 75% esperado
BEGIN
    -- Buscar planos com baixa frequência (< 75%) nos últimos 30 dias
    FOR r IN
        SELECT 
            p.id as plan_id,
            p.student_id,
            p.tenant_id,
            p.assigned_aee_teacher_id as teacher_id,
            s.name as student_name,
            COUNT(*) FILTER (WHERE ar.attendance_status = 'presente') as presencas,
            COUNT(*) as total_atendimentos,
            ROUND((COUNT(*) FILTER (WHERE ar.attendance_status = 'presente')::numeric / 
                   NULLIF(COUNT(*), 0)::numeric) * 100, 2) as attendance_rate
        FROM plano_aee p
        JOIN students s ON s.id = p.student_id
        LEFT JOIN aee_attendance_records ar ON ar.plan_id = p.id
            AND ar.attendance_date >= CURRENT_DATE - INTERVAL '30 days'
        WHERE p.status = 'ativo'
        GROUP BY p.id, p.student_id, p.tenant_id, p.assigned_aee_teacher_id, s.name
        HAVING COUNT(*) >= 4 -- Pelo menos 4 atendimentos registrados
          AND ROUND((COUNT(*) FILTER (WHERE ar.attendance_status = 'presente')::numeric / 
                     NULLIF(COUNT(*), 0)::numeric) * 100, 2) < v_expected_rate
          AND NOT EXISTS (
              SELECT 1 FROM aee_notifications n
              WHERE n.plan_id = p.id
                AND n.notification_type = 'low_attendance'
                AND n.created_at > CURRENT_DATE - INTERVAL '14 days'
          )
    LOOP
        v_attendance_rate := r.attendance_rate;
        
        PERFORM create_aee_notification(
            r.tenant_id,
            r.teacher_id,
            'low_attendance',
            CASE 
                WHEN v_attendance_rate < 50 THEN 'urgente'
                WHEN v_attendance_rate < 60 THEN 'alta'
                ELSE 'media'
            END,
            format('⚠️ Baixa frequência: %s', r.student_name),
            format('O aluno %s tem apenas %.1f%% de frequência nos atendimentos dos últimos 30 dias. Taxa esperada: %s%%.',
                   r.student_name, v_attendance_rate, v_expected_rate),
            format('/planos/%s/atendimentos', r.plan_id),
            'Ver Atendimentos',
            r.plan_id,
            r.student_id,
            jsonb_build_object('attendance_rate', v_attendance_rate, 'expected_rate', v_expected_rate, 
                               'presencas', r.presencas, 'total', r.total_atendimentos)
        );
    END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2.4 Função: Verificar Encaminhamentos Sem Resposta
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_pending_referrals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
    v_days_pending integer;
BEGIN
    -- Buscar encaminhamentos enviados há mais de 30 dias sem retorno
    FOR r IN
        SELECT 
            ref.id as referral_id,
            ref.plan_id,
            ref.student_id,
            ref.tenant_id,
            p.assigned_aee_teacher_id as teacher_id,
            ref.specialist_type,
            s.name as student_name,
            ref.referral_date,
            (CURRENT_DATE - ref.referral_date) as days_pending
        FROM aee_referrals ref
        JOIN plano_aee p ON p.id = ref.plan_id
        JOIN students s ON s.id = ref.student_id
        WHERE ref.status IN ('enviado', 'agendado')
          AND ref.specialist_feedback IS NULL
          AND ref.referral_date <= CURRENT_DATE - INTERVAL '30 days'
          AND NOT EXISTS (
              SELECT 1 FROM aee_notifications n
              WHERE n.referral_id = ref.id
                AND n.notification_type = 'referral_no_response'
                AND n.created_at > CURRENT_DATE - INTERVAL '15 days'
          )
    LOOP
        v_days_pending := r.days_pending;
        
        PERFORM create_aee_notification(
            r.tenant_id,
            r.teacher_id,
            'referral_no_response',
            CASE 
                WHEN v_days_pending > 60 THEN 'alta'
                ELSE 'media'
            END,
            format('🔔 Encaminhamento aguardando retorno: %s', r.specialist_type),
            format('O encaminhamento de %s para %s foi feito há %s dias e ainda não teve retorno.',
                   r.student_name, r.specialist_type, v_days_pending),
            format('/encaminhamentos/%s', r.referral_id),
            'Ver Encaminhamento',
            r.plan_id,
            r.student_id,
            jsonb_build_object('referral_id', r.referral_id, 'days_pending', v_days_pending, 
                               'specialist_type', r.specialist_type)
        );
    END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2.5 Função: Verificar Follow-ups de Visitas
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_visit_followups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
BEGIN
    -- Buscar visitas com follow-up próximo ou atrasado
    FOR r IN
        SELECT 
            v.id as visit_id,
            v.plan_id,
            v.student_id,
            v.tenant_id,
            v.aee_teacher_id as teacher_id,
            s.name as student_name,
            v.follow_up_date,
            (v.follow_up_date - CURRENT_DATE) as days_until
        FROM aee_school_visits v
        JOIN students s ON s.id = v.student_id
        WHERE v.follow_up_date IS NOT NULL
          AND v.follow_up_date >= CURRENT_DATE - INTERVAL '7 days' -- Incluir atrasados até 7 dias
          AND v.follow_up_date <= CURRENT_DATE + INTERVAL '7 days'
          AND v.status = 'realizada'
          AND NOT EXISTS (
              SELECT 1 FROM aee_notifications n
              WHERE n.visit_id = v.id
                AND n.notification_type = 'visit_follow_up'
                AND n.created_at > CURRENT_DATE - INTERVAL '7 days'
          )
    LOOP
        PERFORM create_aee_notification(
            r.tenant_id,
            r.teacher_id,
            'visit_follow_up',
            CASE WHEN r.days_until < 0 THEN 'alta' ELSE 'media' END,
            format('📅 Follow-up de visita: %s', r.student_name),
            CASE 
                WHEN r.days_until < 0 THEN
                    format('O follow-up da visita de %s está atrasado há %s dia(s).', r.student_name, ABS(r.days_until))
                WHEN r.days_until = 0 THEN
                    format('O follow-up da visita de %s é hoje!', r.student_name)
                ELSE
                    format('O follow-up da visita de %s está agendado para daqui a %s dia(s).', r.student_name, r.days_until)
            END,
            format('/visitas/%s', r.visit_id),
            'Ver Visita',
            r.plan_id,
            r.student_id,
            jsonb_build_object('visit_id', r.visit_id, 'days_until', r.days_until)
        );
    END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2.6 Função Principal: Executar Todas as Verificações
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION run_notification_checks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM check_ending_cycles();
    PERFORM check_low_attendance();
    PERFORM check_pending_referrals();
    PERFORM check_visit_followups();
    
    -- Limpar notificações expiradas
    DELETE FROM aee_notifications
    WHERE expires_at < now()
      AND (is_dismissed = true OR is_read = true);
END;
$$;

COMMENT ON FUNCTION run_notification_checks() IS 'Executa todas as verificações de notificações. Deve ser agendado para executar diariamente.';

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE "public"."aee_notifications" ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias notificações
DROP POLICY IF EXISTS "users_view_own_notifications" ON "public"."aee_notifications";
CREATE POLICY "users_view_own_notifications"
    ON "public"."aee_notifications"
    FOR SELECT
    USING (user_id = auth.uid());

-- Usuários podem atualizar suas próprias notificações (marcar como lida/dismissal)
DROP POLICY IF EXISTS "users_update_own_notifications" ON "public"."aee_notifications";
CREATE POLICY "users_update_own_notifications"
    ON "public"."aee_notifications"
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Apenas sistema pode criar notificações (via funções)
DROP POLICY IF EXISTS "system_create_notifications" ON "public"."aee_notifications";
CREATE POLICY "system_create_notifications"
    ON "public"."aee_notifications"
    FOR INSERT
    WITH CHECK (true); -- Controlado pela SECURITY DEFINER das funções

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

-- NOTA: Para ativar as notificações automáticas, é necessário criar um cron job
-- no Supabase (ou agendador externo) que execute a função run_notification_checks()
-- diariamente, por exemplo:
-- 
-- SELECT cron.schedule(
--     'run-aee-notifications',
--     '0 8 * * *', -- Todo dia às 8h
--     $$ SELECT run_notification_checks(); $$
-- );

