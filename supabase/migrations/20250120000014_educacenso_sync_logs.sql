-- Logs de Sincronização Educacenso
-- Rastreamento completo de operações de exportação, importação e validação

-- ============================================================================
-- TABELA DE LOGS DE SINCRONIZAÇÃO
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."educacenso_sync_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "sync_type" text NOT NULL CHECK ("sync_type" IN ('export', 'import', 'validation')),
    "sync_status" text NOT NULL CHECK ("sync_status" IN ('pending', 'processing', 'completed', 'failed', 'validated')),
    "academic_year" integer NOT NULL,
    "file_format" text CHECK ("file_format" IN ('txt', 'csv', 'xml')),
    "file_url" text,
    "file_size_bytes" bigint,
    "records_count" integer DEFAULT 0,
    "success_count" integer DEFAULT 0,
    "error_count" integer DEFAULT 0,
    "warning_count" integer DEFAULT 0,
    "validation_errors" jsonb,
    "validation_warnings" jsonb,
    "inep_validation_code" text,
    "sync_started_at" timestamptz DEFAULT now(),
    "sync_completed_at" timestamptz,
    "duration_seconds" integer,
    "error_message" text,
    "created_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_educacenso_sync_logs_school ON "public"."educacenso_sync_logs"("school_id", "academic_year");
CREATE INDEX IF NOT EXISTS idx_educacenso_sync_logs_tenant ON "public"."educacenso_sync_logs"("tenant_id", "sync_started_at");
CREATE INDEX IF NOT EXISTS idx_educacenso_sync_logs_type ON "public"."educacenso_sync_logs"("sync_type", "sync_status");
CREATE INDEX IF NOT EXISTS idx_educacenso_sync_logs_status ON "public"."educacenso_sync_logs"("sync_status", "sync_started_at");

-- ============================================================================
-- FUNÇÃO PARA REGISTRAR SINCRONIZAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."log_educacenso_sync"(
    p_school_id uuid,
    p_tenant_id uuid,
    p_sync_type text,
    p_academic_year integer,
    p_file_format text DEFAULT NULL,
    p_created_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id uuid;
BEGIN
    INSERT INTO "public"."educacenso_sync_logs" (
        school_id,
        tenant_id,
        sync_type,
        sync_status,
        academic_year,
        file_format,
        created_by
    ) VALUES (
        p_school_id,
        p_tenant_id,
        p_sync_type,
        'pending',
        p_academic_year,
        p_file_format,
        COALESCE(p_created_by, auth.uid())
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- ============================================================================
-- FUNÇÃO PARA ATUALIZAR STATUS DE SINCRONIZAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."update_educacenso_sync_status"(
    p_log_id uuid,
    p_status text,
    p_records_count integer DEFAULT NULL,
    p_success_count integer DEFAULT NULL,
    p_error_count integer DEFAULT NULL,
    p_warning_count integer DEFAULT NULL,
    p_validation_errors jsonb DEFAULT NULL,
    p_validation_warnings jsonb DEFAULT NULL,
    p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_started_at timestamptz;
    v_duration integer;
BEGIN
    -- Buscar data de início
    SELECT sync_started_at INTO v_started_at
    FROM "public"."educacenso_sync_logs"
    WHERE id = p_log_id;

    -- Calcular duração se completado
    IF p_status IN ('completed', 'failed', 'validated') THEN
        v_duration := EXTRACT(EPOCH FROM (now() - v_started_at))::integer;
    END IF;

    UPDATE "public"."educacenso_sync_logs"
    SET 
        sync_status = p_status,
        records_count = COALESCE(p_records_count, records_count),
        success_count = COALESCE(p_success_count, success_count),
        error_count = COALESCE(p_error_count, error_count),
        warning_count = COALESCE(p_warning_count, warning_count),
        validation_errors = COALESCE(p_validation_errors, validation_errors),
        validation_warnings = COALESCE(p_validation_warnings, validation_warnings),
        error_message = COALESCE(p_error_message, error_message),
        sync_completed_at = CASE 
            WHEN p_status IN ('completed', 'failed', 'validated') THEN now()
            ELSE sync_completed_at
        END,
        duration_seconds = v_duration
    WHERE id = p_log_id;
END;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."educacenso_sync_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync logs in their tenant"
    ON "public"."educacenso_sync_logs" FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM "public"."user_tenants" WHERE user_id = auth.uid()
            UNION
            SELECT tenant_id FROM "public"."profiles" WHERE id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() AND role = 'superadmin'
        )
    );

CREATE POLICY "Admins can create sync logs"
    ON "public"."educacenso_sync_logs" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary', 'school_manager')
        )
    );

CREATE POLICY "Admins can update sync logs"
    ON "public"."educacenso_sync_logs" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary', 'school_manager')
        )
    );

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."educacenso_sync_logs" IS 'Logs de sincronização com Educacenso';
COMMENT ON FUNCTION "public"."log_educacenso_sync" IS 'Registra início de sincronização Educacenso';
COMMENT ON FUNCTION "public"."update_educacenso_sync_status" IS 'Atualiza status e resultados de sincronização';








