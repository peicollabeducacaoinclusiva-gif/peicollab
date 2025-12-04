-- Conformidade LGPD (Lei Geral de Proteção de Dados)
-- Implementa políticas de privacidade, consentimento e direitos do titular

-- ============================================================================
-- PARTE 1: TABELA DE CONSENTIMENTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."data_consents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "guardian_id" uuid, -- Referência será adicionada quando tabela guardians existir
    "consent_type" text NOT NULL CHECK ("consent_type" IN (
        'data_collection',
        'data_sharing',
        'data_processing',
        'marketing',
        'research',
        'photo_video'
    )),
    "consent_given" boolean NOT NULL,
    "consent_date" timestamptz NOT NULL DEFAULT now(),
    "consent_method" text NOT NULL CHECK ("consent_method" IN ('digital', 'paper', 'verbal')),
    "consent_version" text NOT NULL,
    "withdrawn_at" timestamptz,
    "withdrawn_reason" text,
    "ip_address" text,
    "user_agent" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_data_consents_student ON "public"."data_consents"("student_id", "consent_date");
CREATE INDEX IF NOT EXISTS idx_data_consents_guardian ON "public"."data_consents"("guardian_id");
CREATE INDEX IF NOT EXISTS idx_data_consents_type ON "public"."data_consents"("consent_type", "consent_given");

-- ============================================================================
-- PARTE 2: TABELA DE POLÍTICAS DE PRIVACIDADE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."privacy_policies" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "version" text NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "effective_date" date NOT NULL,
    "expiry_date" date,
    "is_active" boolean NOT NULL DEFAULT true,
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "created_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_privacy_policies_tenant ON "public"."privacy_policies"("tenant_id", "is_active");
CREATE INDEX IF NOT EXISTS idx_privacy_policies_version ON "public"."privacy_policies"("version", "effective_date");

-- ============================================================================
-- PARTE 3: TABELA DE SOLICITAÇÕES LGPD
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."lgpd_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "request_type" text NOT NULL CHECK ("request_type" IN (
        'access',
        'rectification',
        'deletion',
        'portability',
        'opposition',
        'restriction'
    )),
    "student_id" uuid REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "guardian_id" uuid, -- Referência será adicionada quando tabela guardians existir
    "requested_by" text NOT NULL,
    "requested_by_cpf" text,
    "requested_by_email" text,
    "requested_by_phone" text,
    "request_description" text NOT NULL,
    "status" text NOT NULL CHECK ("status" IN (
        'pending',
        'in_progress',
        'completed',
        'rejected',
        'cancelled'
    )) DEFAULT 'pending',
    "assigned_to" uuid REFERENCES "auth"."users"("id"),
    "response_data" jsonb,
    "response_date" timestamptz,
    "rejection_reason" text,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_student ON "public"."lgpd_requests"("student_id", "status");
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_type ON "public"."lgpd_requests"("request_type", "status");
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_tenant ON "public"."lgpd_requests"("tenant_id", "created_at");

-- ============================================================================
-- PARTE 4: TABELA DE ANONIMIZAÇÃO
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."data_anonymization" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "lgpd_request_id" uuid REFERENCES "public"."lgpd_requests"("id") ON DELETE SET NULL,
    "anonymization_type" text NOT NULL CHECK ("anonymization_type" IN ('full', 'partial')),
    "anonymized_fields" text[] NOT NULL,
    "anonymized_data" jsonb,
    "anonymized_at" timestamptz DEFAULT now(),
    "anonymized_by" uuid REFERENCES "auth"."users"("id"),
    "reason" text NOT NULL,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_data_anonymization_student ON "public"."data_anonymization"("student_id");
CREATE INDEX IF NOT EXISTS idx_data_anonymization_request ON "public"."data_anonymization"("lgpd_request_id");

-- ============================================================================
-- PARTE 5: FUNÇÕES LGPD
-- ============================================================================

-- Função para exportar dados pessoais (portabilidade)
CREATE OR REPLACE FUNCTION "public"."export_personal_data"(
    p_student_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
    v_student jsonb;
    v_enrollments jsonb;
    v_grades jsonb;
    v_attendance jsonb;
    v_peis jsonb;
BEGIN
    -- Buscar dados do aluno
    SELECT to_jsonb(s.*) INTO v_student
    FROM "public"."students" s
    WHERE s.id = p_student_id;

    -- Buscar matrículas
    SELECT jsonb_agg(to_jsonb(e.*)) INTO v_enrollments
    FROM "public"."enrollments" e
    WHERE e.student_id = p_student_id;

    -- Buscar notas
    SELECT jsonb_agg(to_jsonb(g.*)) INTO v_grades
    FROM "public"."grades" g
    JOIN "public"."enrollments" e ON e.id = g.enrollment_id
    WHERE e.student_id = p_student_id;

    -- Buscar frequência
    SELECT jsonb_agg(to_jsonb(a.*)) INTO v_attendance
    FROM "public"."attendance" a
    JOIN "public"."enrollments" e ON e.id = a.enrollment_id
    WHERE e.student_id = p_student_id;

    -- Buscar PEIs
    SELECT jsonb_agg(to_jsonb(p.*)) INTO v_peis
    FROM "public"."peis" p
    WHERE p.student_id = p_student_id;

    -- Montar resultado
    v_result := jsonb_build_object(
        'student', v_student,
        'enrollments', COALESCE(v_enrollments, '[]'::jsonb),
        'grades', COALESCE(v_grades, '[]'::jsonb),
        'attendance', COALESCE(v_attendance, '[]'::jsonb),
        'peis', COALESCE(v_peis, '[]'::jsonb),
        'exported_at', now(),
        'format_version', '1.0'
    );

    RETURN v_result;
END;
$$;

-- Função para anonimizar dados (direito ao esquecimento)
CREATE OR REPLACE FUNCTION "public"."anonymize_student_data"(
    p_student_id uuid,
    p_reason text,
    p_anonymized_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_anonymized_fields text[];
    v_result jsonb;
BEGIN
    -- Anonimizar dados pessoais do aluno
    UPDATE "public"."students"
    SET 
        name = 'ANONIMIZADO',
        cpf = NULL,
        rg = NULL,
        email = NULL,
        phone = NULL,
        address = NULL,
        mother_name = NULL,
        father_name = NULL,
        updated_at = now()
    WHERE id = p_student_id;

    v_anonymized_fields := ARRAY['name', 'cpf', 'rg', 'email', 'phone', 'address', 'mother_name', 'father_name'];

    -- Registrar anonimização
    INSERT INTO "public"."data_anonymization" (
        student_id,
        anonymization_type,
        anonymized_fields,
        reason,
        anonymized_by,
        tenant_id
    )
    SELECT 
        p_student_id,
        'full',
        v_anonymized_fields,
        p_reason,
        COALESCE(p_anonymized_by, auth.uid()),
        s.tenant_id
    FROM "public"."students" s
    WHERE s.id = p_student_id;

    v_result := jsonb_build_object(
        'success', true,
        'student_id', p_student_id,
        'anonymized_fields', v_anonymized_fields,
        'anonymized_at', now()
    );

    RETURN v_result;
END;
$$;

-- Função para verificar consentimentos ativos
CREATE OR REPLACE FUNCTION "public"."check_active_consents"(
    p_student_id uuid,
    p_consent_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_result jsonb;
    v_consents jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'consent_type', consent_type,
            'consent_given', consent_given,
            'consent_date', consent_date,
            'withdrawn_at', withdrawn_at
        )
    ) INTO v_consents
    FROM "public"."data_consents"
    WHERE student_id = p_student_id
        AND (p_consent_type IS NULL OR consent_type = p_consent_type)
        AND (withdrawn_at IS NULL OR withdrawn_at > consent_date)
    ORDER BY consent_date DESC;

    v_result := jsonb_build_object(
        'student_id', p_student_id,
        'consents', COALESCE(v_consents, '[]'::jsonb),
        'has_active_consents', COALESCE(jsonb_array_length(v_consents), 0) > 0
    );

    RETURN v_result;
END;
$$;

-- ============================================================================
-- PARTE 6: RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."data_consents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."privacy_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lgpd_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."data_anonymization" ENABLE ROW LEVEL SECURITY;

-- Políticas para data_consents
CREATE POLICY "Users can view consents in their tenant"
    ON "public"."data_consents" FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM "public"."students"
            WHERE tenant_id IN (
                SELECT tenant_id FROM "public"."user_tenants" WHERE user_id = auth.uid()
                UNION
                SELECT tenant_id FROM "public"."profiles" WHERE id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() AND role = 'superadmin'
        )
    );

-- Políticas para privacy_policies
CREATE POLICY "Users can view active privacy policies"
    ON "public"."privacy_policies" FOR SELECT
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

-- Políticas para lgpd_requests
CREATE POLICY "Users can view LGPD requests in their tenant"
    ON "public"."lgpd_requests" FOR SELECT
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

CREATE POLICY "Admins can manage LGPD requests"
    ON "public"."lgpd_requests" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary', 'school_manager')
        )
    );

-- Políticas para data_anonymization (somente leitura para admins)
CREATE POLICY "Admins can view anonymization records"
    ON "public"."data_anonymization" FOR SELECT
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

COMMENT ON TABLE "public"."data_consents" IS 'Registro de consentimentos LGPD';
COMMENT ON TABLE "public"."privacy_policies" IS 'Políticas de privacidade por versão';
COMMENT ON TABLE "public"."lgpd_requests" IS 'Solicitações de direitos LGPD';
COMMENT ON TABLE "public"."data_anonymization" IS 'Registro de anonimizações realizadas';
COMMENT ON FUNCTION "public"."export_personal_data" IS 'Exporta todos os dados pessoais de um aluno (portabilidade)';
COMMENT ON FUNCTION "public"."anonymize_student_data" IS 'Anonimiza dados de um aluno (direito ao esquecimento)';
COMMENT ON FUNCTION "public"."check_active_consents" IS 'Verifica consentimentos ativos de um aluno';

