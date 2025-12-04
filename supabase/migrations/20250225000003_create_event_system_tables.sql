-- ============================================================================
-- MIGRAÇÃO: Sistema de Eventos e Webhooks
-- Data: 25/02/2025
-- Descrição: Criar tabelas para webhooks e logs de eventos
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Configuração de Webhooks
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."webhook_configs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "url" text NOT NULL,
    "events" text[] NOT NULL,
    "secret" text,
    "enabled" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_webhook_configs_tenant" ON "public"."webhook_configs"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_webhook_configs_enabled" ON "public"."webhook_configs"("enabled");

-- ============================================================================
-- PARTE 2: Tabela de Logs de Webhooks
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "webhook_id" uuid REFERENCES "public"."webhook_configs"("id") ON DELETE CASCADE,
    "event_type" text NOT NULL,
    "status" text NOT NULL, -- 'success', 'failed', 'pending'
    "response_status" integer,
    "error_message" text,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_webhook_logs_webhook_id" ON "public"."webhook_logs"("webhook_id");
CREATE INDEX IF NOT EXISTS "idx_webhook_logs_event_type" ON "public"."webhook_logs"("event_type");
CREATE INDEX IF NOT EXISTS "idx_webhook_logs_status" ON "public"."webhook_logs"("status");
CREATE INDEX IF NOT EXISTS "idx_webhook_logs_created_at" ON "public"."webhook_logs"("created_at");

-- ============================================================================
-- PARTE 3: Função para processar eventos via trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_system_event()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type text;
    v_payload jsonb;
BEGIN
    -- Determinar tipo de evento baseado na tabela
    CASE TG_TABLE_NAME
        WHEN 'students' THEN
            IF TG_OP = 'INSERT' THEN
                v_event_type := 'student.created';
                v_payload := jsonb_build_object(
                    'id', NEW.id,
                    'name', NEW.name,
                    'school_id', NEW.school_id,
                    'tenant_id', NEW.tenant_id,
                    'table', 'students'
                );
            ELSIF TG_OP = 'UPDATE' THEN
                v_event_type := 'student.updated';
                v_payload := jsonb_build_object(
                    'id', NEW.id,
                    'table', 'students',
                    'changes', jsonb_build_object(
                        'name', NEW.name,
                        'school_id', NEW.school_id,
                        'is_active', NEW.is_active
                    )
                );
            ELSIF TG_OP = 'DELETE' THEN
                v_event_type := 'student.deleted';
                v_payload := jsonb_build_object(
                    'id', OLD.id,
                    'table', 'students'
                );
            END IF;
        WHEN 'classes' THEN
            IF TG_OP = 'UPDATE' THEN
                v_event_type := 'class.changed';
                v_payload := jsonb_build_object(
                    'id', NEW.id,
                    'table', 'classes',
                    'changes', jsonb_build_object(
                        'name', NEW.name,
                        'grade', NEW.grade,
                        'shift', NEW.shift
                    )
                );
            END IF;
        WHEN 'peis' THEN
            IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
                v_event_type := 'pei.approved';
                v_payload := jsonb_build_object(
                    'id', NEW.id,
                    'student_id', NEW.student_id,
                    'status', NEW.status,
                    'table', 'peis'
                );
            END IF;
        ELSE
            RETURN NULL;
    END CASE;

    -- Notificar via pg_notify (para Realtime)
    IF v_event_type IS NOT NULL THEN
        PERFORM pg_notify('system_events', jsonb_build_object(
            'event', v_event_type,
            'payload', v_payload,
            'timestamp', now()
        )::text);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 4: Triggers para eventos
-- ============================================================================

-- Trigger para students
DROP TRIGGER IF EXISTS trigger_notify_student_events ON "public"."students";
CREATE TRIGGER trigger_notify_student_events
    AFTER INSERT OR UPDATE OR DELETE ON "public"."students"
    FOR EACH ROW
    EXECUTE FUNCTION notify_system_event();

-- Trigger para classes
DROP TRIGGER IF EXISTS trigger_notify_class_events ON "public"."classes";
CREATE TRIGGER trigger_notify_class_events
    AFTER UPDATE ON "public"."classes"
    FOR EACH ROW
    EXECUTE FUNCTION notify_system_event();

-- Trigger para peis
DROP TRIGGER IF EXISTS trigger_notify_pei_events ON "public"."peis";
CREATE TRIGGER trigger_notify_pei_events
    AFTER UPDATE ON "public"."peis"
    FOR EACH ROW
    EXECUTE FUNCTION notify_system_event();

-- ============================================================================
-- PARTE 5: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."webhook_configs" TO authenticated;
GRANT SELECT ON "public"."webhook_logs" TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."webhook_configs" IS 'Configurações de webhooks para eventos do sistema';
COMMENT ON TABLE "public"."webhook_logs" IS 'Logs de execução de webhooks';
COMMENT ON FUNCTION notify_system_event() IS 'Função trigger para notificar eventos do sistema';

