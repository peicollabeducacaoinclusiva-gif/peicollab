-- Sistema de Auditoria Completo com Suporte a Tenant
-- Adiciona tenant_id à auditoria e cria estrutura completa para LGPD

-- ============================================================================
-- PARTE 1: ADICIONAR TENANT_ID À TABELA AUDIT_LOG EXISTENTE
-- ============================================================================

-- Adicionar coluna tenant_id se não existir
ALTER TABLE "public"."audit_log" 
ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE;

-- Adicionar coluna entity_type para melhor categorização
ALTER TABLE "public"."audit_log" 
ADD COLUMN IF NOT EXISTS "entity_type" text;

-- Adicionar coluna metadata para informações adicionais
ALTER TABLE "public"."audit_log" 
ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;

-- Índices adicionais para consultas por tenant
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON "public"."audit_log"("tenant_id", "changed_at" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON "public"."audit_log"("entity_type", "tenant_id");

-- ============================================================================
-- PARTE 2: CRIAR TABELA AUDIT_EVENTS (NOVA ESTRUTURA)
-- ============================================================================

-- Tabela principal de eventos de auditoria com tenant_id
CREATE TABLE IF NOT EXISTS "public"."audit_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "actor_id" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "entity_type" text NOT NULL, -- 'student', 'pei', 'aee', 'professional', etc.
    "entity_id" uuid NOT NULL,
    "action" text NOT NULL CHECK ("action" IN ('READ', 'INSERT', 'UPDATE', 'DELETE', 'EXPORT', 'ANONYMIZE')),
    "ip_address" text,
    "user_agent" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamptz DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant ON "public"."audit_events"("tenant_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON "public"."audit_events"("actor_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON "public"."audit_events"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON "public"."audit_events"("action", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON "public"."audit_events"("created_at" DESC);

-- ============================================================================
-- PARTE 3: FUNÇÃO PARA REGISTRAR EVENTOS DE AUDITORIA
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."log_audit_event"(
    p_tenant_id uuid,
    p_entity_type text,
    p_entity_id uuid,
    p_action text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id uuid;
    v_ip_address text;
    v_user_agent text;
BEGIN
    -- Tentar obter IP e User Agent do contexto
    BEGIN
        v_ip_address := current_setting('request.headers', true)::jsonb->>'x-forwarded-for';
        v_user_agent := current_setting('request.headers', true)::jsonb->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        v_ip_address := NULL;
        v_user_agent := NULL;
    END;

    INSERT INTO "public"."audit_events" (
        tenant_id,
        actor_id,
        entity_type,
        entity_id,
        action,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        p_tenant_id,
        auth.uid(),
        p_entity_type,
        p_entity_id,
        p_action,
        v_ip_address,
        v_user_agent,
        p_metadata
    ) RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$;

-- ============================================================================
-- PARTE 4: FUNÇÃO PARA BUSCAR TRAIL DE AUDITORIA
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."get_audit_trail"(
    p_tenant_id uuid,
    p_entity_type text DEFAULT NULL,
    p_entity_id uuid DEFAULT NULL,
    p_action text DEFAULT NULL,
    p_actor_id uuid DEFAULT NULL,
    p_start_date timestamptz DEFAULT NULL,
    p_end_date timestamptz DEFAULT NULL,
    p_limit integer DEFAULT 100
)
RETURNS TABLE (
    id uuid,
    tenant_id uuid,
    actor_id uuid,
    actor_name text,
    actor_email text,
    entity_type text,
    entity_id uuid,
    action text,
    ip_address text,
    user_agent text,
    metadata jsonb,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ae.id,
        ae.tenant_id,
        ae.actor_id,
        p.full_name as actor_name,
        p.email as actor_email,
        ae.entity_type,
        ae.entity_id,
        ae.action,
        ae.ip_address,
        ae.user_agent,
        ae.metadata,
        ae.created_at
    FROM "public"."audit_events" ae
    LEFT JOIN "public"."profiles" p ON p.id = ae.actor_id
    WHERE ae.tenant_id = p_tenant_id
        AND (p_entity_type IS NULL OR ae.entity_type = p_entity_type)
        AND (p_entity_id IS NULL OR ae.entity_id = p_entity_id)
        AND (p_action IS NULL OR ae.action = p_action)
        AND (p_actor_id IS NULL OR ae.actor_id = p_actor_id)
        AND (p_start_date IS NULL OR ae.created_at >= p_start_date)
        AND (p_end_date IS NULL OR ae.created_at <= p_end_date)
    ORDER BY ae.created_at DESC
    LIMIT p_limit;
END;
$$;

-- ============================================================================
-- PARTE 5: ATUALIZAR TRIGGER DE AUDITORIA PARA INCLUIR TENANT_ID
-- ============================================================================

-- Função atualizada para incluir tenant_id
CREATE OR REPLACE FUNCTION "public"."audit_trigger_function_v2"()
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
    v_tenant_id uuid;
    v_entity_type text;
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

    -- Tentar obter tenant_id do registro
    IF TG_OP = 'DELETE' THEN
        v_tenant_id := (OLD.tenant_id)::uuid;
    ELSE
        v_tenant_id := (NEW.tenant_id)::uuid;
    END IF;

    -- Se não tiver tenant_id direto, tentar obter via relacionamento
    IF v_tenant_id IS NULL THEN
        IF TG_TABLE_NAME = 'students' THEN
            SELECT s.tenant_id INTO v_tenant_id
            FROM "public"."schools" s
            WHERE s.id = COALESCE((NEW.school_id)::uuid, (OLD.school_id)::uuid);
        ELSIF TG_TABLE_NAME = 'peis' THEN
            SELECT s.tenant_id INTO v_tenant_id
            FROM "public"."students" st
            JOIN "public"."schools" s ON s.id = st.school_id
            WHERE st.id = COALESCE((NEW.student_id)::uuid, (OLD.student_id)::uuid);
        END IF;
    END IF;

    -- Determinar entity_type baseado no nome da tabela
    v_entity_type := TG_TABLE_NAME;

    -- Tentar obter IP e User Agent
    BEGIN
        v_ip_address := current_setting('request.headers', true)::jsonb->>'x-forwarded-for';
        v_user_agent := current_setting('request.headers', true)::jsonb->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        v_ip_address := NULL;
        v_user_agent := NULL;
    END;

    -- Inserir em audit_log (mantendo compatibilidade)
    INSERT INTO "public"."audit_log" (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        changed_by,
        changed_at,
        ip_address,
        user_agent,
        tenant_id,
        entity_type
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE((NEW.id)::text, (OLD.id)::text),
        v_action,
        v_old_data,
        v_new_data,
        auth.uid(),
        now(),
        v_ip_address,
        v_user_agent,
        v_tenant_id,
        v_entity_type
    );

    -- Inserir em audit_events (nova estrutura)
    IF v_tenant_id IS NOT NULL THEN
        INSERT INTO "public"."audit_events" (
            tenant_id,
            actor_id,
            entity_type,
            entity_id,
            action,
            ip_address,
            user_agent,
            metadata
        ) VALUES (
            v_tenant_id,
            auth.uid(),
            v_entity_type,
            COALESCE((NEW.id)::uuid, (OLD.id)::uuid),
            v_action,
            v_ip_address,
            v_user_agent,
            jsonb_build_object(
                'table_name', TG_TABLE_NAME,
                'old_data', v_old_data,
                'new_data', v_new_data
            )
        );
    END IF;

    -- Retornar registro apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- ============================================================================
-- PARTE 6: RLS POLICIES PARA AUDIT_EVENTS
-- ============================================================================

ALTER TABLE "public"."audit_events" ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver eventos do seu tenant
CREATE POLICY "Users can view audit events in their tenant"
    ON "public"."audit_events" FOR SELECT
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

-- Sistema pode inserir eventos (via função SECURITY DEFINER)
CREATE POLICY "System can insert audit events"
    ON "public"."audit_events" FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."audit_events" IS 'Eventos de auditoria com suporte a tenant para conformidade LGPD';
COMMENT ON FUNCTION "public"."log_audit_event" IS 'Registra um evento de auditoria com tenant_id';
COMMENT ON FUNCTION "public"."get_audit_trail" IS 'Retorna trail de auditoria filtrado por tenant e outros critérios';
COMMENT ON FUNCTION "public"."audit_trigger_function_v2" IS 'Função de trigger atualizada com suporte a tenant_id';

