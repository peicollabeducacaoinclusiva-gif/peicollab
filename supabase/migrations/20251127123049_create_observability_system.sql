-- Sistema de Observabilidade Avançada
-- Central de erros, métricas e alertas

-- ============================================================================
-- PARTE 1: TABELA DE LOGS DE ERROS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "app_name" text NOT NULL,
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "error_type" text NOT NULL CHECK ("error_type" IN (
        'javascript_error',
        'network_error',
        'api_error',
        'validation_error',
        'authentication_error',
        'authorization_error',
        'database_error',
        'unknown_error'
    )),
    "message" text NOT NULL,
    "stack_trace" text,
    "url" text,
    "user_agent" text,
    "ip_address" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "severity" text NOT NULL CHECK ("severity" IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    "resolved" boolean NOT NULL DEFAULT false,
    "resolved_at" timestamptz,
    "resolved_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_error_logs_app ON "public"."error_logs"("app_name", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_tenant ON "public"."error_logs"("tenant_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON "public"."error_logs"("error_type", "severity");
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON "public"."error_logs"("resolved", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON "public"."error_logs"("severity", "created_at" DESC);

-- ============================================================================
-- PARTE 2: TABELA DE MÉTRICAS DE PERFORMANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."performance_metrics" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "app_name" text NOT NULL,
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "metric_type" text NOT NULL CHECK ("metric_type" IN (
        'lcp',      -- Largest Contentful Paint
        'inp',      -- Interaction to Next Paint
        'fcp',      -- First Contentful Paint
        'ttfb',     -- Time to First Byte
        'cls',      -- Cumulative Layout Shift
        'fid',      -- First Input Delay
        'custom'    -- Métricas customizadas
    )),
    "metric_name" text NOT NULL,
    "value" numeric NOT NULL,
    "unit" text NOT NULL DEFAULT 'ms',
    "url" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_performance_metrics_app ON "public"."performance_metrics"("app_name", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant ON "public"."performance_metrics"("tenant_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON "public"."performance_metrics"("metric_type", "created_at" DESC);

-- ============================================================================
-- PARTE 3: TABELA DE ALERTAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."alerts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "app_name" text NOT NULL,
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "alert_type" text NOT NULL CHECK ("alert_type" IN (
        'error_rate',
        'performance',
        'availability',
        'security',
        'custom'
    )),
    "alert_name" text NOT NULL,
    "message" text NOT NULL,
    "severity" text NOT NULL CHECK ("severity" IN ('info', 'warning', 'error', 'critical')) DEFAULT 'warning',
    "status" text NOT NULL CHECK ("status" IN ('active', 'acknowledged', 'resolved', 'dismissed')) DEFAULT 'active',
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "acknowledged_at" timestamptz,
    "acknowledged_by" uuid REFERENCES "auth"."users"("id"),
    "resolved_at" timestamptz,
    "resolved_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alerts_app ON "public"."alerts"("app_name", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_tenant ON "public"."alerts"("tenant_id", "status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON "public"."alerts"("alert_type", "severity");
CREATE INDEX IF NOT EXISTS idx_alerts_status ON "public"."alerts"("status", "severity");

-- ============================================================================
-- PARTE 4: TABELA DE REGRAS DE ALERTA
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."alert_rules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "app_name" text,
    "rule_name" text NOT NULL,
    "alert_type" text NOT NULL CHECK ("alert_type" IN (
        'error_rate',
        'performance',
        'availability',
        'security',
        'custom'
    )),
    "condition" jsonb NOT NULL, -- { metric: 'error_count', operator: '>', threshold: 10, window: '1h' }
    "severity" text NOT NULL CHECK ("severity" IN ('info', 'warning', 'error', 'critical')) DEFAULT 'warning',
    "notification_channels" text[] DEFAULT ARRAY[]::text[], -- ['email', 'slack', 'webhook']
    "is_active" boolean NOT NULL DEFAULT true,
    "created_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant ON "public"."alert_rules"("tenant_id", "is_active");
CREATE INDEX IF NOT EXISTS idx_alert_rules_app ON "public"."alert_rules"("app_name", "is_active");

-- ============================================================================
-- PARTE 5: FUNÇÕES RPC
-- ============================================================================

-- Função para reportar erro
CREATE OR REPLACE FUNCTION "public"."report_error"(
    p_app_name text,
    p_error_type text,
    p_message text,
    p_stack_trace text DEFAULT NULL,
    p_tenant_id uuid DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_url text DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_ip_address text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb,
    p_severity text DEFAULT 'medium'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_error_id uuid;
    v_ip_address text;
    v_user_agent text;
BEGIN
    -- Tentar obter IP e User Agent do contexto
    BEGIN
        v_ip_address := COALESCE(p_ip_address, current_setting('request.headers', true)::jsonb->>'x-forwarded-for');
        v_user_agent := COALESCE(p_user_agent, current_setting('request.headers', true)::jsonb->>'user-agent');
    EXCEPTION WHEN OTHERS THEN
        v_ip_address := p_ip_address;
        v_user_agent := p_user_agent;
    END;

    INSERT INTO "public"."error_logs" (
        app_name,
        tenant_id,
        user_id,
        error_type,
        message,
        stack_trace,
        url,
        user_agent,
        ip_address,
        metadata,
        severity
    ) VALUES (
        p_app_name,
        p_tenant_id,
        COALESCE(p_user_id, auth.uid()),
        p_error_type,
        p_message,
        p_stack_trace,
        p_url,
        v_user_agent,
        v_ip_address,
        p_metadata,
        p_severity
    ) RETURNING id INTO v_error_id;

    -- Verificar se deve criar alerta automático
    PERFORM "public"."_check_alert_rules"(
        p_app_name,
        p_tenant_id,
        'error_rate',
        jsonb_build_object('error_id', v_error_id, 'error_type', p_error_type, 'severity', p_severity)
    );

    RETURN v_error_id;
END;
$$;

-- Função para registrar métrica de performance
CREATE OR REPLACE FUNCTION "public"."report_performance_metric"(
    p_app_name text,
    p_metric_type text,
    p_metric_name text,
    p_value numeric,
    p_unit text DEFAULT 'ms',
    p_tenant_id uuid DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_url text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_metric_id uuid;
BEGIN
    INSERT INTO "public"."performance_metrics" (
        app_name,
        tenant_id,
        user_id,
        metric_type,
        metric_name,
        value,
        unit,
        url,
        metadata
    ) VALUES (
        p_app_name,
        p_tenant_id,
        COALESCE(p_user_id, auth.uid()),
        p_metric_type,
        p_metric_name,
        p_value,
        p_unit,
        p_url,
        p_metadata
    ) RETURNING id INTO v_metric_id;

    -- Verificar se deve criar alerta automático
    PERFORM "public"."_check_alert_rules"(
        p_app_name,
        p_tenant_id,
        'performance',
        jsonb_build_object('metric_id', v_metric_id, 'metric_type', p_metric_type, 'value', p_value)
    );

    RETURN v_metric_id;
END;
$$;

-- Função auxiliar para verificar regras de alerta
CREATE OR REPLACE FUNCTION "public"."_check_alert_rules"(
    p_app_name text,
    p_tenant_id uuid,
    p_alert_type text,
    p_context jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rule RECORD;
    v_should_alert boolean;
BEGIN
    -- Buscar regras ativas que correspondem
    FOR v_rule IN
        SELECT * FROM "public"."alert_rules"
        WHERE is_active = true
            AND alert_type = p_alert_type
            AND (tenant_id = p_tenant_id OR tenant_id IS NULL)
            AND (app_name = p_app_name OR app_name IS NULL)
    LOOP
        -- Verificar condição (implementação simplificada)
        -- Em produção, isso seria mais complexo com avaliação de condições
        v_should_alert := true; -- Placeholder - implementar lógica de avaliação

        IF v_should_alert THEN
            -- Criar alerta
            INSERT INTO "public"."alerts" (
                app_name,
                tenant_id,
                alert_type,
                alert_name,
                message,
                severity,
                metadata
            ) VALUES (
                p_app_name,
                p_tenant_id,
                p_alert_type,
                v_rule.rule_name,
                'Alerta automático: ' || v_rule.rule_name,
                v_rule.severity,
                p_context
            );
        END IF;
    END LOOP;
END;
$$;

-- Função para buscar estatísticas de erros
CREATE OR REPLACE FUNCTION "public"."get_error_statistics"(
    p_app_name text DEFAULT NULL,
    p_tenant_id uuid DEFAULT NULL,
    p_start_date timestamptz DEFAULT NULL,
    p_end_date timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_errors', COUNT(*),
        'by_type', (
            SELECT jsonb_object_agg(error_type, count)
            FROM (
                SELECT error_type, COUNT(*) as count
                FROM "public"."error_logs"
                WHERE (p_app_name IS NULL OR app_name = p_app_name)
                    AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
                    AND (p_start_date IS NULL OR created_at >= p_start_date)
                    AND (p_end_date IS NULL OR created_at <= p_end_date)
                GROUP BY error_type
            ) sub
        ),
        'by_severity', (
            SELECT jsonb_object_agg(severity, count)
            FROM (
                SELECT severity, COUNT(*) as count
                FROM "public"."error_logs"
                WHERE (p_app_name IS NULL OR app_name = p_app_name)
                    AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
                    AND (p_start_date IS NULL OR created_at >= p_start_date)
                    AND (p_end_date IS NULL OR created_at <= p_end_date)
                GROUP BY severity
            ) sub
        ),
        'unresolved_count', (
            SELECT COUNT(*)
            FROM "public"."error_logs"
            WHERE resolved = false
                AND (p_app_name IS NULL OR app_name = p_app_name)
                AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
                AND (p_start_date IS NULL OR created_at >= p_start_date)
                AND (p_end_date IS NULL OR created_at <= p_end_date)
        )
    ) INTO v_result
    FROM "public"."error_logs"
    WHERE (p_app_name IS NULL OR app_name = p_app_name)
        AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        AND (p_start_date IS NULL OR created_at >= p_start_date)
        AND (p_end_date IS NULL OR created_at <= p_end_date);

    RETURN v_result;
END;
$$;

-- Função para buscar métricas de performance agregadas
CREATE OR REPLACE FUNCTION "public"."get_performance_statistics"(
    p_app_name text DEFAULT NULL,
    p_tenant_id uuid DEFAULT NULL,
    p_metric_type text DEFAULT NULL,
    p_start_date timestamptz DEFAULT NULL,
    p_end_date timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'by_metric', (
            SELECT jsonb_object_agg(metric_name, jsonb_build_object(
                'avg', AVG(value),
                'min', MIN(value),
                'max', MAX(value),
                'p95', PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value),
                'count', COUNT(*)
            ))
            FROM "public"."performance_metrics"
            WHERE (p_app_name IS NULL OR app_name = p_app_name)
                AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
                AND (p_metric_type IS NULL OR metric_type = p_metric_type)
                AND (p_start_date IS NULL OR created_at >= p_start_date)
                AND (p_end_date IS NULL OR created_at <= p_end_date)
            GROUP BY metric_name
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ============================================================================
-- PARTE 6: RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."performance_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."alert_rules" ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver erros do seu tenant
CREATE POLICY "Users can view error logs in their tenant"
    ON "public"."error_logs" FOR SELECT
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

-- Sistema pode inserir erros (via função SECURITY DEFINER)
CREATE POLICY "System can insert error logs"
    ON "public"."error_logs" FOR INSERT
    WITH CHECK (true);

-- Admins podem gerenciar erros
CREATE POLICY "Admins can manage error logs"
    ON "public"."error_logs" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary')
        )
    );

-- Usuários podem ver métricas do seu tenant
CREATE POLICY "Users can view performance metrics in their tenant"
    ON "public"."performance_metrics" FOR SELECT
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

-- Sistema pode inserir métricas (via função SECURITY DEFINER)
CREATE POLICY "System can insert performance metrics"
    ON "public"."performance_metrics" FOR INSERT
    WITH CHECK (true);

-- Usuários podem ver alertas do seu tenant
CREATE POLICY "Users can view alerts in their tenant"
    ON "public"."alerts" FOR SELECT
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

-- Admins podem gerenciar alertas
CREATE POLICY "Admins can manage alerts"
    ON "public"."alerts" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary')
        )
    );

-- Admins podem gerenciar regras de alerta
CREATE POLICY "Admins can manage alert rules"
    ON "public"."alert_rules" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary')
        )
    );

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."error_logs" IS 'Logs centralizados de erros de todos os apps';
COMMENT ON TABLE "public"."performance_metrics" IS 'Métricas de performance (Web Vitals)';
COMMENT ON TABLE "public"."alerts" IS 'Alertas automáticos e manuais';
COMMENT ON TABLE "public"."alert_rules" IS 'Regras para geração automática de alertas';
COMMENT ON FUNCTION "public"."report_error" IS 'Reporta um erro para a central de erros';
COMMENT ON FUNCTION "public"."report_performance_metric" IS 'Registra uma métrica de performance';
COMMENT ON FUNCTION "public"."get_error_statistics" IS 'Retorna estatísticas agregadas de erros';
COMMENT ON FUNCTION "public"."get_performance_statistics" IS 'Retorna estatísticas agregadas de performance';

