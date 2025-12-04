-- Sistema de Auditoria Completa
-- Triggers automáticos para rastrear todas as alterações em tabelas críticas

-- ============================================================================
-- PARTE 1: FUNÇÃO GENÉRICA DE AUDITORIA
-- ============================================================================

-- Função para registrar alterações em audit_log
CREATE OR REPLACE FUNCTION "public"."audit_trigger_function"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_data jsonb;
    v_new_data jsonb;
    v_action text;
    v_ip_address text;
    v_user_agent text;
BEGIN
    -- Determinar ação
    IF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
    END IF;

    -- Tentar obter IP e User Agent do contexto (se disponível)
    -- Em produção, isso pode vir de headers HTTP via função Edge
    v_ip_address := current_setting('request.headers', true)::jsonb->>'x-forwarded-for';
    v_user_agent := current_setting('request.headers', true)::jsonb->>'user-agent';

    -- Inserir registro de auditoria
    INSERT INTO "public"."audit_log" (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        changed_by,
        changed_at,
        ip_address,
        user_agent
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE((NEW.id)::text, (OLD.id)::text),
        v_action,
        v_old_data,
        v_new_data,
        auth.uid(),
        now(),
        v_ip_address,
        v_user_agent
    );

    -- Retornar registro apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- ============================================================================
-- PARTE 2: TRIGGERS PARA TABELAS CRÍTICAS
-- ============================================================================

-- Students (Alunos)
DROP TRIGGER IF EXISTS audit_students_trigger ON "public"."students";
CREATE TRIGGER audit_students_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."students"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- PEIs (Planos de Educação Individualizada)
DROP TRIGGER IF EXISTS audit_peis_trigger ON "public"."peis";
CREATE TRIGGER audit_peis_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."peis"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Enrollments (Matrículas)
DROP TRIGGER IF EXISTS audit_enrollments_trigger ON "public"."enrollments";
CREATE TRIGGER audit_enrollments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."enrollments"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Enrollment Requests (Solicitações de Matrícula)
DROP TRIGGER IF EXISTS audit_enrollment_requests_trigger ON "public"."enrollment_requests";
CREATE TRIGGER audit_enrollment_requests_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."enrollment_requests"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Grades (Notas)
DROP TRIGGER IF EXISTS audit_grades_trigger ON "public"."grades";
CREATE TRIGGER audit_grades_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."grades"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Attendance (Frequência)
DROP TRIGGER IF EXISTS audit_attendance_trigger ON "public"."attendance";
CREATE TRIGGER audit_attendance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."attendance"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Daily Attendance Records (Registros Diários de Frequência)
DROP TRIGGER IF EXISTS audit_daily_attendance_trigger ON "public"."daily_attendance_records";
CREATE TRIGGER audit_daily_attendance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."daily_attendance_records"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Descriptive Reports (Pareceres Descritivos)
DROP TRIGGER IF EXISTS audit_descriptive_reports_trigger ON "public"."descriptive_reports";
CREATE TRIGGER audit_descriptive_reports_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."descriptive_reports"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Evaluation Configs (Configurações de Avaliação)
DROP TRIGGER IF EXISTS audit_evaluation_configs_trigger ON "public"."evaluation_configs";
CREATE TRIGGER audit_evaluation_configs_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."evaluation_configs"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Classes (Turmas)
DROP TRIGGER IF EXISTS audit_classes_trigger ON "public"."classes";
CREATE TRIGGER audit_classes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."classes"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Professionals (Profissionais)
DROP TRIGGER IF EXISTS audit_professionals_trigger ON "public"."professionals";
CREATE TRIGGER audit_professionals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."professionals"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Certificates (Certificados)
DROP TRIGGER IF EXISTS audit_certificates_trigger ON "public"."certificates";
CREATE TRIGGER audit_certificates_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."certificates"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Class Diary (Diário de Classe)
DROP TRIGGER IF EXISTS audit_class_diary_trigger ON "public"."class_diary";
CREATE TRIGGER audit_class_diary_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."class_diary"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Diary Occurrences (Ocorrências do Diário)
DROP TRIGGER IF EXISTS audit_diary_occurrences_trigger ON "public"."diary_occurrences";
CREATE TRIGGER audit_diary_occurrences_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."diary_occurrences"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."audit_trigger_function"();

-- ============================================================================
-- PARTE 3: FUNÇÃO PARA LOGS DE ACESSO
-- ============================================================================

-- Tabela para logs de acesso
CREATE TABLE IF NOT EXISTS "public"."access_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "action" text NOT NULL,
    "resource" text,
    "resource_id" uuid,
    "ip_address" text,
    "user_agent" text,
    "success" boolean NOT NULL DEFAULT true,
    "error_message" text,
    "created_at" timestamptz DEFAULT now()
);

-- Índices para access_logs
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON "public"."access_logs"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON "public"."access_logs"("action", "created_at");
CREATE INDEX IF NOT EXISTS idx_access_logs_resource ON "public"."access_logs"("resource", "resource_id");
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON "public"."access_logs"("created_at" DESC);

-- Função para registrar acesso
CREATE OR REPLACE FUNCTION "public"."log_access"(
    p_action text,
    p_resource text DEFAULT NULL,
    p_resource_id uuid DEFAULT NULL,
    p_success boolean DEFAULT true,
    p_error_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id uuid;
    v_ip_address text;
    v_user_agent text;
BEGIN
    -- Tentar obter IP e User Agent
    BEGIN
        v_ip_address := current_setting('request.headers', true)::jsonb->>'x-forwarded-for';
        v_user_agent := current_setting('request.headers', true)::jsonb->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        -- Se não conseguir obter, usar NULL
        v_ip_address := NULL;
        v_user_agent := NULL;
    END;

    INSERT INTO "public"."access_logs" (
        user_id,
        action,
        resource,
        resource_id,
        ip_address,
        user_agent,
        success,
        error_message
    ) VALUES (
        auth.uid(),
        p_action,
        p_resource,
        p_resource_id,
        v_ip_address,
        v_user_agent,
        p_success,
        p_error_message
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- ============================================================================
-- PARTE 4: FUNÇÕES DE CONSULTA DE AUDITORIA
-- ============================================================================

-- Função para buscar histórico de alterações de um registro
CREATE OR REPLACE FUNCTION "public"."get_audit_history"(
    p_table_name text,
    p_record_id text,
    p_limit integer DEFAULT 50
)
RETURNS TABLE (
    id uuid,
    action text,
    old_data jsonb,
    new_data jsonb,
    changed_by uuid,
    changed_at timestamptz,
    changed_by_name text,
    changed_by_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.action,
        al.old_data,
        al.new_data,
        al.changed_by,
        al.changed_at,
        p.full_name as changed_by_name,
        p.email as changed_by_email
    FROM "public"."audit_log" al
    LEFT JOIN "public"."profiles" p ON p.id = al.changed_by
    WHERE al.table_name = p_table_name
        AND al.record_id = p_record_id
    ORDER BY al.changed_at DESC
    LIMIT p_limit;
END;
$$;

-- Função para buscar logs de acesso de um usuário
CREATE OR REPLACE FUNCTION "public"."get_user_access_logs"(
    p_user_id uuid,
    p_limit integer DEFAULT 100
)
RETURNS TABLE (
    id uuid,
    action text,
    resource text,
    resource_id uuid,
    ip_address text,
    user_agent text,
    success boolean,
    error_message text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.action,
        al.resource,
        al.resource_id,
        al.ip_address,
        al.user_agent,
        al.success,
        al.error_message,
        al.created_at
    FROM "public"."access_logs" al
    WHERE al.user_id = p_user_id
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$;

-- ============================================================================
-- PARTE 5: RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."access_logs" ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios logs de acesso
CREATE POLICY "Users can view their own access logs"
    ON "public"."access_logs" FOR SELECT
    USING (user_id = auth.uid());

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all access logs"
    ON "public"."access_logs" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary')
        )
    );

-- Sistema pode inserir logs (via função SECURITY DEFINER)
CREATE POLICY "System can insert access logs"
    ON "public"."access_logs" FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION "public"."audit_trigger_function"() IS 'Função genérica para registrar alterações em tabelas críticas';
COMMENT ON FUNCTION "public"."log_access" IS 'Registra logs de acesso e ações do usuário';
COMMENT ON FUNCTION "public"."get_audit_history" IS 'Retorna histórico de alterações de um registro específico';
COMMENT ON FUNCTION "public"."get_user_access_logs" IS 'Retorna logs de acesso de um usuário específico';
COMMENT ON TABLE "public"."access_logs" IS 'Logs de acesso e ações dos usuários no sistema';








