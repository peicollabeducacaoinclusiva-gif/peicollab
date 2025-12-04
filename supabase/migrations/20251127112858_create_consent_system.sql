-- Sistema de Consentimento Completo com Suporte a Tenant
-- Expande a estrutura existente para suportar consentimentos por tenant

-- ============================================================================
-- PARTE 1: MELHORAR TABELA DATA_CONSENTS (ADICIONAR TENANT_ID)
-- ============================================================================

-- Adicionar tenant_id se não existir
ALTER TABLE "public"."data_consents" 
ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE;

-- Adicionar user_id para consentimentos de usuários (não apenas estudantes)
ALTER TABLE "public"."data_consents" 
ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Índice para consultas por tenant
CREATE INDEX IF NOT EXISTS idx_data_consents_tenant ON "public"."data_consents"("tenant_id", "consent_date" DESC);
CREATE INDEX IF NOT EXISTS idx_data_consents_user ON "public"."data_consents"("user_id", "consent_type");

-- ============================================================================
-- PARTE 2: CRIAR TABELA CONSENTS (ESTRUTURA UNIFICADA)
-- ============================================================================

-- Tabela principal de consentimentos com suporte a tenant
CREATE TABLE IF NOT EXISTS "public"."consents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "student_id" uuid REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "guardian_id" uuid, -- Referência será adicionada quando tabela guardians existir
    "consent_type" text NOT NULL CHECK ("consent_type" IN (
        'data_collection',
        'data_sharing',
        'data_processing',
        'marketing',
        'research',
        'photo_video',
        'analytics',
        'cookies',
        'third_party'
    )),
    "granted" boolean NOT NULL DEFAULT false,
    "granted_at" timestamptz,
    "revoked_at" timestamptz,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "ip_address" text,
    "user_agent" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_consents_tenant ON "public"."consents"("tenant_id", "granted_at" DESC);
CREATE INDEX IF NOT EXISTS idx_consents_user ON "public"."consents"("user_id", "consent_type");
CREATE INDEX IF NOT EXISTS idx_consents_student ON "public"."consents"("student_id", "consent_type");
CREATE INDEX IF NOT EXISTS idx_consents_type ON "public"."consents"("consent_type", "granted");
CREATE INDEX IF NOT EXISTS idx_consents_active ON "public"."consents"("tenant_id", "consent_type", "granted") 
    WHERE "revoked_at" IS NULL;

-- ============================================================================
-- PARTE 3: CRIAR TABELA CONSENT_TEMPLATES
-- ============================================================================

-- Templates de consentimento por tenant (permite personalização)
CREATE TABLE IF NOT EXISTS "public"."consent_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "consent_type" text NOT NULL CHECK ("consent_type" IN (
        'data_collection',
        'data_sharing',
        'data_processing',
        'marketing',
        'research',
        'photo_video',
        'analytics',
        'cookies',
        'third_party'
    )),
    "required" boolean NOT NULL DEFAULT false,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "version" text NOT NULL DEFAULT '1.0',
    "is_active" boolean NOT NULL DEFAULT true,
    "created_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("tenant_id", "consent_type", "version")
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_consent_templates_tenant ON "public"."consent_templates"("tenant_id", "is_active");
CREATE INDEX IF NOT EXISTS idx_consent_templates_type ON "public"."consent_templates"("consent_type", "is_active");

-- ============================================================================
-- PARTE 4: FUNÇÕES DE CONSENTIMENTO
-- ============================================================================

-- Função para conceder consentimento
CREATE OR REPLACE FUNCTION "public"."grant_consent"(
    p_tenant_id uuid,
    p_consent_type text,
    p_user_id uuid DEFAULT NULL,
    p_student_id uuid DEFAULT NULL,
    p_guardian_id uuid DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_consent_id uuid;
    v_ip_address text;
    v_user_agent text;
BEGIN
    -- Tentar obter IP e User Agent
    BEGIN
        v_ip_address := current_setting('request.headers', true)::jsonb->>'x-forwarded-for';
        v_user_agent := current_setting('request.headers', true)::jsonb->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        v_ip_address := NULL;
        v_user_agent := NULL;
    END;

    -- Revogar consentimento anterior se existir
    UPDATE "public"."consents"
    SET revoked_at = now()
    WHERE tenant_id = p_tenant_id
        AND consent_type = p_consent_type
        AND (user_id = p_user_id OR (p_user_id IS NULL AND user_id IS NULL))
        AND (student_id = p_student_id OR (p_student_id IS NULL AND student_id IS NULL))
        AND (guardian_id = p_guardian_id OR (p_guardian_id IS NULL AND guardian_id IS NULL))
        AND revoked_at IS NULL;

    -- Criar novo consentimento
    INSERT INTO "public"."consents" (
        tenant_id,
        user_id,
        student_id,
        guardian_id,
        consent_type,
        granted,
        granted_at,
        metadata,
        ip_address,
        user_agent
    ) VALUES (
        p_tenant_id,
        COALESCE(p_user_id, auth.uid()),
        p_student_id,
        p_guardian_id,
        p_consent_type,
        true,
        now(),
        p_metadata,
        v_ip_address,
        v_user_agent
    ) RETURNING id INTO v_consent_id;

    RETURN v_consent_id;
END;
$$;

-- Função para revogar consentimento
CREATE OR REPLACE FUNCTION "public"."revoke_consent"(
    p_tenant_id uuid,
    p_consent_type text,
    p_user_id uuid DEFAULT NULL,
    p_student_id uuid DEFAULT NULL,
    p_guardian_id uuid DEFAULT NULL,
    p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated integer;
BEGIN
    UPDATE "public"."consents"
    SET 
        revoked_at = now(),
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{revocation_reason}',
            to_jsonb(p_reason)
        )
    WHERE tenant_id = p_tenant_id
        AND consent_type = p_consent_type
        AND (user_id = p_user_id OR (p_user_id IS NULL AND user_id IS NULL))
        AND (student_id = p_student_id OR (p_student_id IS NULL AND student_id IS NULL))
        AND (guardian_id = p_guardian_id OR (p_guardian_id IS NULL AND guardian_id IS NULL))
        AND revoked_at IS NULL;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$;

-- Função para verificar consentimento ativo
CREATE OR REPLACE FUNCTION "public"."check_consent"(
    p_tenant_id uuid,
    p_consent_type text,
    p_user_id uuid DEFAULT NULL,
    p_student_id uuid DEFAULT NULL,
    p_guardian_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_has_consent boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM "public"."consents"
        WHERE tenant_id = p_tenant_id
            AND consent_type = p_consent_type
            AND granted = true
            AND revoked_at IS NULL
            AND (user_id = p_user_id OR (p_user_id IS NULL AND user_id IS NULL))
            AND (student_id = p_student_id OR (p_student_id IS NULL AND student_id IS NULL))
            AND (guardian_id = p_guardian_id OR (p_guardian_id IS NULL AND guardian_id IS NULL))
    ) INTO v_has_consent;

    RETURN COALESCE(v_has_consent, false);
END;
$$;

-- Função para obter consentimentos de um usuário/estudante
CREATE OR REPLACE FUNCTION "public"."get_user_consents"(
    p_tenant_id uuid,
    p_user_id uuid DEFAULT NULL,
    p_student_id uuid DEFAULT NULL,
    p_guardian_id uuid DEFAULT NULL
)
RETURNS TABLE (
    consent_type text,
    granted boolean,
    granted_at timestamptz,
    revoked_at timestamptz,
    metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.consent_type,
        c.granted,
        c.granted_at,
        c.revoked_at,
        c.metadata
    FROM "public"."consents" c
    WHERE c.tenant_id = p_tenant_id
        AND (c.user_id = p_user_id OR (p_user_id IS NULL AND c.user_id IS NULL))
        AND (c.student_id = p_student_id OR (p_student_id IS NULL AND c.student_id IS NULL))
        AND (c.guardian_id = p_guardian_id OR (p_guardian_id IS NULL AND c.guardian_id IS NULL))
    ORDER BY c.granted_at DESC;
END;
$$;

-- ============================================================================
-- PARTE 5: RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."consents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."consent_templates" ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios consentimentos
CREATE POLICY "Users can view their own consents"
    ON "public"."consents" FOR SELECT
    USING (
        user_id = auth.uid()
        OR tenant_id IN (
            SELECT tenant_id FROM "public"."user_tenants" WHERE user_id = auth.uid()
            UNION
            SELECT tenant_id FROM "public"."profiles" WHERE id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() AND role = 'superadmin'
        )
    );

-- Usuários podem conceder/revogar seus próprios consentimentos
CREATE POLICY "Users can manage their own consents"
    ON "public"."consents" FOR ALL
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() AND role IN ('superadmin', 'education_secretary')
        )
    );

-- Sistema pode inserir consentimentos (via função SECURITY DEFINER)
CREATE POLICY "System can insert consents"
    ON "public"."consents" FOR INSERT
    WITH CHECK (true);

-- Usuários podem ver templates ativos do seu tenant
CREATE POLICY "Users can view active consent templates"
    ON "public"."consent_templates" FOR SELECT
    USING (
        is_active = true
        AND (
            tenant_id IN (
                SELECT tenant_id FROM "public"."user_tenants" WHERE user_id = auth.uid()
                UNION
                SELECT tenant_id FROM "public"."profiles" WHERE id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM "public"."user_roles" 
                WHERE user_id = auth.uid() AND role = 'superadmin'
            )
        )
    );

-- Admins podem gerenciar templates
CREATE POLICY "Admins can manage consent templates"
    ON "public"."consent_templates" FOR ALL
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

COMMENT ON TABLE "public"."consents" IS 'Consentimentos LGPD por tenant';
COMMENT ON TABLE "public"."consent_templates" IS 'Templates de consentimento personalizáveis por tenant';
COMMENT ON FUNCTION "public"."grant_consent" IS 'Concede um consentimento';
COMMENT ON FUNCTION "public"."revoke_consent" IS 'Revoga um consentimento';
COMMENT ON FUNCTION "public"."check_consent" IS 'Verifica se existe consentimento ativo';
COMMENT ON FUNCTION "public"."get_user_consents" IS 'Retorna todos os consentimentos de um usuário/estudante';

