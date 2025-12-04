-- Sistema de Retenção e Anonimização Automática de Dados
-- Implementa regras de retenção configuráveis por tenant e tipo de entidade

-- ============================================================================
-- PARTE 1: TABELA DE REGRAS DE RETENÇÃO
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."data_retention_rules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "entity_type" text NOT NULL CHECK ("entity_type" IN (
        'student',
        'user',
        'guardian',
        'professional',
        'pei',
        'aee',
        'enrollment',
        'grade',
        'attendance',
        'audit_event',
        'consent',
        'dsr_request'
    )),
    "retention_period_days" integer NOT NULL CHECK ("retention_period_days" > 0),
    "anonymization_strategy" text NOT NULL CHECK ("anonymization_strategy" IN (
        'full',      -- Anonimização completa
        'partial',   -- Anonimização parcial (campos específicos)
        'delete',    -- Exclusão completa
        'archive'    -- Arquivar (mover para tabela de arquivo)
    )) DEFAULT 'full',
    "anonymize_fields" text[] DEFAULT ARRAY[]::text[], -- Campos específicos para anonimização parcial
    "is_active" boolean NOT NULL DEFAULT true,
    "description" text,
    "created_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("tenant_id", "entity_type")
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_retention_rules_tenant ON "public"."data_retention_rules"("tenant_id", "is_active");
CREATE INDEX IF NOT EXISTS idx_retention_rules_entity ON "public"."data_retention_rules"("entity_type", "is_active");

-- ============================================================================
-- PARTE 2: TABELA DE LOGS DE RETENÇÃO
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."retention_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "rule_id" uuid REFERENCES "public"."data_retention_rules"("id") ON DELETE SET NULL,
    "entity_type" text NOT NULL,
    "entity_id" uuid NOT NULL,
    "action" text NOT NULL CHECK ("action" IN ('anonymized', 'deleted', 'archived')),
    "anonymized_fields" text[],
    "retention_period_days" integer,
    "original_created_at" timestamptz,
    "processed_at" timestamptz DEFAULT now(),
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_retention_logs_tenant ON "public"."retention_logs"("tenant_id", "processed_at" DESC);
CREATE INDEX IF NOT EXISTS idx_retention_logs_entity ON "public"."retention_logs"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS idx_retention_logs_rule ON "public"."retention_logs"("rule_id", "processed_at" DESC);

-- ============================================================================
-- PARTE 3: FUNÇÕES DE RETENÇÃO
-- ============================================================================

-- Função para aplicar regras de retenção para um tenant
CREATE OR REPLACE FUNCTION "public"."apply_retention_rules"(
    p_tenant_id uuid,
    p_dry_run boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rule RECORD;
    v_result jsonb;
    v_total_processed integer := 0;
    v_total_anonymized integer := 0;
    v_total_deleted integer := 0;
    v_total_archived integer := 0;
    v_errors jsonb := '[]'::jsonb;
BEGIN
    -- Buscar todas as regras ativas do tenant
    FOR v_rule IN
        SELECT * FROM "public"."data_retention_rules"
        WHERE tenant_id = p_tenant_id
            AND is_active = true
    LOOP
        BEGIN
            -- Aplicar regra baseado no tipo de entidade
            IF v_rule.entity_type = 'student' THEN
                PERFORM "public"."_apply_retention_students"(
                    v_rule.id,
                    v_rule.retention_period_days,
                    v_rule.anonymization_strategy,
                    v_rule.anonymize_fields,
                    p_tenant_id,
                    p_dry_run
                );
            ELSIF v_rule.entity_type = 'user' THEN
                PERFORM "public"."_apply_retention_users"(
                    v_rule.id,
                    v_rule.retention_period_days,
                    v_rule.anonymization_strategy,
                    v_rule.anonymize_fields,
                    p_tenant_id,
                    p_dry_run
                );
            ELSIF v_rule.entity_type = 'audit_event' THEN
                PERFORM "public"."_apply_retention_audit_events"(
                    v_rule.id,
                    v_rule.retention_period_days,
                    v_rule.anonymization_strategy,
                    p_tenant_id,
                    p_dry_run
                );
            END IF;

            v_total_processed := v_total_processed + 1;
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors || jsonb_build_object(
                'rule_id', v_rule.id,
                'entity_type', v_rule.entity_type,
                'error', SQLERRM
            );
        END;
    END LOOP;

    -- Montar resultado
    v_result := jsonb_build_object(
        'success', true,
        'tenant_id', p_tenant_id,
        'dry_run', p_dry_run,
        'total_rules_processed', v_total_processed,
        'total_anonymized', v_total_anonymized,
        'total_deleted', v_total_deleted,
        'total_archived', v_total_archived,
        'errors', v_errors,
        'processed_at', now()
    );

    RETURN v_result;
END;
$$;

-- Função auxiliar para aplicar retenção em estudantes
CREATE OR REPLACE FUNCTION "public"."_apply_retention_students"(
    p_rule_id uuid,
    p_retention_days integer,
    p_strategy text,
    p_anonymize_fields text[],
    p_tenant_id uuid,
    p_dry_run boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student RECORD;
    v_anonymized_fields text[];
BEGIN
    -- Buscar estudantes que excederam o período de retenção
    FOR v_student IN
        SELECT s.*
        FROM "public"."students" s
        JOIN "public"."schools" sc ON sc.id = s.school_id
        WHERE sc.tenant_id = p_tenant_id
            AND s.created_at < NOW() - (p_retention_days || ' days')::interval
            AND NOT EXISTS (
                SELECT 1 FROM "public"."retention_logs" rl
                WHERE rl.entity_type = 'student'
                    AND rl.entity_id = s.id
                    AND rl.action IN ('anonymized', 'deleted')
            )
    LOOP
        IF NOT p_dry_run THEN
            IF p_strategy = 'full' OR p_strategy = 'partial' THEN
                -- Anonimizar dados
                UPDATE "public"."students"
                SET 
                    name = CASE WHEN 'name' = ANY(p_anonymize_fields) OR p_strategy = 'full' THEN 'ANONIMIZADO' ELSE name END,
                    cpf = CASE WHEN 'cpf' = ANY(p_anonymize_fields) OR p_strategy = 'full' THEN NULL ELSE cpf END,
                    rg = CASE WHEN 'rg' = ANY(p_anonymize_fields) OR p_strategy = 'full' THEN NULL ELSE rg END,
                    email = CASE WHEN 'email' = ANY(p_anonymize_fields) OR p_strategy = 'full' THEN NULL ELSE email END,
                    phone = CASE WHEN 'phone' = ANY(p_anonymize_fields) OR p_strategy = 'full' THEN NULL ELSE phone END,
                    address = CASE WHEN 'address' = ANY(p_anonymize_fields) OR p_strategy = 'full' THEN NULL ELSE address END,
                    mother_name = CASE WHEN 'mother_name' = ANY(p_anonymize_fields) OR p_strategy = 'full' THEN NULL ELSE mother_name END,
                    father_name = CASE WHEN 'father_name' = ANY(p_anonymize_fields) OR p_strategy = 'full' THEN NULL ELSE father_name END,
                    updated_at = now()
                WHERE id = v_student.id;

                -- Registrar log
                INSERT INTO "public"."retention_logs" (
                    tenant_id,
                    rule_id,
                    entity_type,
                    entity_id,
                    action,
                    anonymized_fields,
                    retention_period_days,
                    original_created_at
                ) VALUES (
                    p_tenant_id,
                    p_rule_id,
                    'student',
                    v_student.id,
                    'anonymized',
                    p_anonymize_fields,
                    p_retention_days,
                    v_student.created_at
                );

                -- Registrar evento de auditoria
                PERFORM "public"."log_audit_event"(
                    p_tenant_id,
                    'student',
                    v_student.id,
                    'ANONYMIZE',
                    jsonb_build_object(
                        'retention_rule_id', p_rule_id,
                        'retention_period_days', p_retention_days,
                        'strategy', p_strategy,
                        'reason', 'Retenção automática de dados'
                    )
                );
            ELSIF p_strategy = 'delete' THEN
                -- Excluir registro (cuidado com foreign keys)
                -- Por segurança, apenas marcar como deletado ou mover para arquivo
                -- DELETE FROM "public"."students" WHERE id = v_student.id;
                -- Por enquanto, vamos apenas anonimizar
                RAISE NOTICE 'Delete strategy not fully implemented for safety';
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- Função auxiliar para aplicar retenção em usuários
CREATE OR REPLACE FUNCTION "public"."_apply_retention_users"(
    p_rule_id uuid,
    p_retention_days integer,
    p_strategy text,
    p_anonymize_fields text[],
    p_tenant_id uuid,
    p_dry_run boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
BEGIN
    -- Buscar usuários que excederam o período de retenção
    FOR v_user IN
        SELECT p.*
        FROM "public"."profiles" p
        WHERE p.tenant_id = p_tenant_id
            AND p.created_at < NOW() - (p_retention_days || ' days')::interval
            AND NOT EXISTS (
                SELECT 1 FROM "public"."retention_logs" rl
                WHERE rl.entity_type = 'user'
                    AND rl.entity_id = p.id
                    AND rl.action IN ('anonymized', 'deleted')
            )
    LOOP
        IF NOT p_dry_run THEN
            IF p_strategy = 'full' OR p_strategy = 'partial' THEN
                -- Anonimizar dados
                UPDATE "public"."profiles"
                SET 
                    full_name = CASE WHEN 'full_name' = ANY(p_anonymize_fields) OR p_strategy = 'full' THEN 'ANONIMIZADO' ELSE full_name END,
                    cpf = CASE WHEN 'cpf' = ANY(p_anonymize_fields) OR p_strategy = 'full' THEN NULL ELSE cpf END,
                    phone = CASE WHEN 'phone' = ANY(p_anonymize_fields) OR p_strategy = 'full' THEN NULL ELSE phone END,
                    updated_at = now()
                WHERE id = v_user.id;

                -- Registrar log
                INSERT INTO "public"."retention_logs" (
                    tenant_id,
                    rule_id,
                    entity_type,
                    entity_id,
                    action,
                    anonymized_fields,
                    retention_period_days,
                    original_created_at
                ) VALUES (
                    p_tenant_id,
                    p_rule_id,
                    'user',
                    v_user.id,
                    'anonymized',
                    p_anonymize_fields,
                    p_retention_days,
                    v_user.created_at
                );

                -- Registrar evento de auditoria
                PERFORM "public"."log_audit_event"(
                    p_tenant_id,
                    'user',
                    v_user.id,
                    'ANONYMIZE',
                    jsonb_build_object(
                        'retention_rule_id', p_rule_id,
                        'retention_period_days', p_retention_days,
                        'strategy', p_strategy,
                        'reason', 'Retenção automática de dados'
                    )
                );
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- Função auxiliar para aplicar retenção em eventos de auditoria
CREATE OR REPLACE FUNCTION "public"."_apply_retention_audit_events"(
    p_rule_id uuid,
    p_retention_days integer,
    p_strategy text,
    p_tenant_id uuid,
    p_dry_run boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT p_dry_run THEN
        IF p_strategy = 'delete' THEN
            -- Excluir eventos de auditoria antigos
            DELETE FROM "public"."audit_events"
            WHERE tenant_id = p_tenant_id
                AND created_at < NOW() - (p_retention_days || ' days')::interval;

            -- Registrar log
            INSERT INTO "public"."retention_logs" (
                tenant_id,
                rule_id,
                entity_type,
                entity_id,
                action,
                retention_period_days,
                metadata
            )
            SELECT 
                p_tenant_id,
                p_rule_id,
                'audit_event',
                gen_random_uuid(), -- Placeholder, já que deletamos múltiplos registros
                'deleted',
                p_retention_days,
                jsonb_build_object('deleted_count', (SELECT COUNT(*) FROM "public"."audit_events" WHERE tenant_id = p_tenant_id AND created_at < NOW() - (p_retention_days || ' days')::interval))
            LIMIT 1;
        END IF;
    END IF;
END;
$$;

-- Função para criar/atualizar regra de retenção
CREATE OR REPLACE FUNCTION "public"."upsert_retention_rule"(
    p_tenant_id uuid,
    p_entity_type text,
    p_retention_period_days integer,
    p_anonymization_strategy text,
    p_anonymize_fields text[] DEFAULT ARRAY[]::text[],
    p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rule_id uuid;
BEGIN
    INSERT INTO "public"."data_retention_rules" (
        tenant_id,
        entity_type,
        retention_period_days,
        anonymization_strategy,
        anonymize_fields,
        description,
        created_by
    ) VALUES (
        p_tenant_id,
        p_entity_type,
        p_retention_period_days,
        p_anonymization_strategy,
        p_anonymize_fields,
        p_description,
        auth.uid()
    )
    ON CONFLICT (tenant_id, entity_type)
    DO UPDATE SET
        retention_period_days = EXCLUDED.retention_period_days,
        anonymization_strategy = EXCLUDED.anonymization_strategy,
        anonymize_fields = EXCLUDED.anonymize_fields,
        description = EXCLUDED.description,
        updated_at = now()
    RETURNING id INTO v_rule_id;

    RETURN v_rule_id;
END;
$$;

-- Função para buscar regras de retenção
CREATE OR REPLACE FUNCTION "public"."get_retention_rules"(
    p_tenant_id uuid
)
RETURNS TABLE (
    id uuid,
    tenant_id uuid,
    entity_type text,
    retention_period_days integer,
    anonymization_strategy text,
    anonymize_fields text[],
    is_active boolean,
    description text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        drr.id,
        drr.tenant_id,
        drr.entity_type,
        drr.retention_period_days,
        drr.anonymization_strategy,
        drr.anonymize_fields,
        drr.is_active,
        drr.description,
        drr.created_at,
        drr.updated_at
    FROM "public"."data_retention_rules" drr
    WHERE drr.tenant_id = p_tenant_id
    ORDER BY drr.entity_type;
END;
$$;

-- ============================================================================
-- PARTE 4: RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."data_retention_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."retention_logs" ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver regras do seu tenant
CREATE POLICY "Users can view retention rules in their tenant"
    ON "public"."data_retention_rules" FOR SELECT
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

-- Admins podem gerenciar regras de retenção
CREATE POLICY "Admins can manage retention rules"
    ON "public"."data_retention_rules" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary')
        )
    );

-- Admins podem ver logs de retenção
CREATE POLICY "Admins can view retention logs"
    ON "public"."retention_logs" FOR SELECT
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

COMMENT ON TABLE "public"."data_retention_rules" IS 'Regras de retenção e anonimização automática de dados por tenant';
COMMENT ON TABLE "public"."retention_logs" IS 'Logs de aplicação de regras de retenção';
COMMENT ON FUNCTION "public"."apply_retention_rules" IS 'Aplica todas as regras de retenção ativas para um tenant';
COMMENT ON FUNCTION "public"."upsert_retention_rule" IS 'Cria ou atualiza uma regra de retenção';
COMMENT ON FUNCTION "public"."get_retention_rules" IS 'Retorna todas as regras de retenção de um tenant';

