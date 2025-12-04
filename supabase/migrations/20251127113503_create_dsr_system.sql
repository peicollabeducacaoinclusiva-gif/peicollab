-- Sistema de Direitos do Titular (DSR) Completo
-- Expande e melhora a estrutura LGPD existente para DSR completo

-- ============================================================================
-- PARTE 1: MELHORAR TABELA DSR_REQUESTS (RENOMEAR E EXPANDIR LGPD_REQUESTS)
-- ============================================================================

-- Criar tabela dsr_requests (mais completa que lgpd_requests)
CREATE TABLE IF NOT EXISTS "public"."dsr_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "subject_id" uuid NOT NULL, -- ID do titular (pode ser student_id, user_id, etc.)
    "subject_type" text NOT NULL CHECK ("subject_type" IN ('student', 'user', 'guardian', 'professional')),
    "request_type" text NOT NULL CHECK ("request_type" IN (
        'access',           -- Artigo 15 GDPR - Direito de acesso
        'rectification',    -- Artigo 16 GDPR - Direito de retificação
        'deletion',         -- Artigo 17 GDPR - Direito ao esquecimento
        'portability',      -- Artigo 20 GDPR - Portabilidade de dados
        'opposition',       -- Artigo 21 GDPR - Oposição ao processamento
        'restriction'       -- Artigo 18 GDPR - Restrição de processamento
    )),
    "status" text NOT NULL CHECK ("status" IN (
        'pending',
        'in_progress',
        'completed',
        'rejected',
        'cancelled'
    )) DEFAULT 'pending',
    "requested_by" text NOT NULL,
    "requested_by_cpf" text,
    "requested_by_email" text,
    "requested_by_phone" text,
    "request_description" text NOT NULL,
    "assigned_to" uuid REFERENCES "auth"."users"("id"),
    "response_data" jsonb,
    "response_date" timestamptz,
    "rejection_reason" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dsr_requests_tenant ON "public"."dsr_requests"("tenant_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_dsr_requests_subject ON "public"."dsr_requests"("subject_id", "subject_type");
CREATE INDEX IF NOT EXISTS idx_dsr_requests_type ON "public"."dsr_requests"("request_type", "status");
CREATE INDEX IF NOT EXISTS idx_dsr_requests_status ON "public"."dsr_requests"("status", "created_at" DESC);

-- ============================================================================
-- PARTE 2: FUNÇÕES RPC PARA DSR
-- ============================================================================

-- Função para criar solicitação DSR
CREATE OR REPLACE FUNCTION "public"."create_dsr_request"(
    p_tenant_id uuid,
    p_subject_id uuid,
    p_subject_type text,
    p_request_type text,
    p_requested_by text,
    p_request_description text,
    p_requested_by_cpf text DEFAULT NULL,
    p_requested_by_email text DEFAULT NULL,
    p_requested_by_phone text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request_id uuid;
BEGIN
    INSERT INTO "public"."dsr_requests" (
        tenant_id,
        subject_id,
        subject_type,
        request_type,
        requested_by,
        requested_by_cpf,
        requested_by_email,
        requested_by_phone,
        request_description,
        metadata
    ) VALUES (
        p_tenant_id,
        p_subject_id,
        p_subject_type,
        p_request_type,
        p_requested_by,
        p_requested_by_cpf,
        p_requested_by_email,
        p_requested_by_phone,
        p_request_description,
        p_metadata
    ) RETURNING id INTO v_request_id;

    -- Registrar evento de auditoria
    PERFORM "public"."log_audit_event"(
        p_tenant_id,
        p_subject_type,
        p_subject_id,
        'INSERT',
        jsonb_build_object(
            'dsr_request_id', v_request_id,
            'request_type', p_request_type,
            'action', 'dsr_request_created'
        )
    );

    RETURN v_request_id;
END;
$$;

-- Função para exportar dados pessoais (portabilidade) - Versão melhorada
CREATE OR REPLACE FUNCTION "public"."export_personal_data_v2"(
    p_subject_id uuid,
    p_subject_type text,
    p_tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
    v_student jsonb;
    v_user jsonb;
    v_enrollments jsonb;
    v_grades jsonb;
    v_attendance jsonb;
    v_peis jsonb;
    v_aee jsonb;
    v_consents jsonb;
    v_audit_events jsonb;
BEGIN
    -- Exportar dados baseado no tipo de sujeito
    IF p_subject_type = 'student' THEN
        -- Buscar dados do aluno
        SELECT to_jsonb(s.*) INTO v_student
        FROM "public"."students" s
        WHERE s.id = p_subject_id;

        -- Buscar matrículas
        SELECT jsonb_agg(to_jsonb(e.*)) INTO v_enrollments
        FROM "public"."enrollments" e
        WHERE e.student_id = p_subject_id;

        -- Buscar notas
        SELECT jsonb_agg(to_jsonb(g.*)) INTO v_grades
        FROM "public"."grades" g
        JOIN "public"."enrollments" e ON e.id = g.enrollment_id
        WHERE e.student_id = p_subject_id;

        -- Buscar frequência
        SELECT jsonb_agg(to_jsonb(a.*)) INTO v_attendance
        FROM "public"."attendance" a
        JOIN "public"."enrollments" e ON e.id = a.enrollment_id
        WHERE e.student_id = p_subject_id;

        -- Buscar PEIs
        SELECT jsonb_agg(to_jsonb(p.*)) INTO v_peis
        FROM "public"."peis" p
        WHERE p.student_id = p_subject_id;

        -- Buscar AEE (se a tabela existir)
        BEGIN
            SELECT jsonb_agg(to_jsonb(aee.*)) INTO v_aee
            FROM "public"."aee_plans" aee
            WHERE aee.student_id = p_subject_id;
        EXCEPTION WHEN OTHERS THEN
            v_aee := '[]'::jsonb;
        END;

    ELSIF p_subject_type = 'user' THEN
        -- Buscar dados do usuário
        SELECT jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'created_at', u.created_at,
            'updated_at', u.updated_at
        ) INTO v_user
        FROM "auth"."users" u
        WHERE u.id = p_subject_id;

        -- Buscar perfil
        SELECT to_jsonb(p.*) INTO v_student
        FROM "public"."profiles" p
        WHERE p.id = p_subject_id;
    END IF;

    -- Buscar consentimentos
    SELECT jsonb_agg(to_jsonb(c.*)) INTO v_consents
    FROM "public"."consents" c
    WHERE c.tenant_id = p_tenant_id
        AND (
            (c.user_id = p_subject_id AND p_subject_type = 'user')
            OR (c.student_id = p_subject_id AND p_subject_type = 'student')
        );

    -- Buscar eventos de auditoria relacionados
    SELECT jsonb_agg(to_jsonb(ae.*)) INTO v_audit_events
    FROM "public"."audit_events" ae
    WHERE ae.tenant_id = p_tenant_id
        AND ae.entity_id = p_subject_id
        AND ae.entity_type = p_subject_type
    ORDER BY ae.created_at DESC
    LIMIT 1000;

    -- Montar resultado
    v_result := jsonb_build_object(
        'subject_id', p_subject_id,
        'subject_type', p_subject_type,
        'tenant_id', p_tenant_id,
        'exported_at', now(),
        'format_version', '2.0',
        'data', jsonb_build_object(
            'profile', COALESCE(v_student, v_user, '{}'::jsonb),
            'enrollments', COALESCE(v_enrollments, '[]'::jsonb),
            'grades', COALESCE(v_grades, '[]'::jsonb),
            'attendance', COALESCE(v_attendance, '[]'::jsonb),
            'peis', COALESCE(v_peis, '[]'::jsonb),
            'aee', COALESCE(v_aee, '[]'::jsonb),
            'consents', COALESCE(v_consents, '[]'::jsonb),
            'audit_events', COALESCE(v_audit_events, '[]'::jsonb)
        )
    );

    -- Registrar evento de auditoria
    PERFORM "public"."log_audit_event"(
        p_tenant_id,
        p_subject_type,
        p_subject_id,
        'EXPORT',
        jsonb_build_object(
            'action', 'data_export',
            'format_version', '2.0'
        )
    );

    RETURN v_result;
END;
$$;

-- Função para anonimizar dados pessoais - Versão melhorada
CREATE OR REPLACE FUNCTION "public"."anonymize_personal_data_v2"(
    p_subject_id uuid,
    p_subject_type text,
    p_tenant_id uuid,
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
    v_anonymization_id uuid;
BEGIN
    -- Anonimizar dados baseado no tipo de sujeito
    IF p_subject_type = 'student' THEN
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
        WHERE id = p_subject_id;

        v_anonymized_fields := ARRAY['name', 'cpf', 'rg', 'email', 'phone', 'address', 'mother_name', 'father_name'];

    ELSIF p_subject_type = 'user' THEN
        -- Anonimizar dados do usuário (apenas no perfil, não no auth.users)
        UPDATE "public"."profiles"
        SET 
            full_name = 'ANONIMIZADO',
            cpf = NULL,
            phone = NULL,
            updated_at = now()
        WHERE id = p_subject_id;

        v_anonymized_fields := ARRAY['full_name', 'cpf', 'phone'];
    END IF;

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
        CASE WHEN p_subject_type = 'student' THEN p_subject_id ELSE NULL END,
        'full',
        v_anonymized_fields,
        p_reason,
        COALESCE(p_anonymized_by, auth.uid()),
        p_tenant_id
    RETURNING id INTO v_anonymization_id;

    -- Registrar evento de auditoria
    PERFORM "public"."log_audit_event"(
        p_tenant_id,
        p_subject_type,
        p_subject_id,
        'ANONYMIZE',
        jsonb_build_object(
            'anonymization_id', v_anonymization_id,
            'anonymized_fields', v_anonymized_fields,
            'reason', p_reason
        )
    );

    v_result := jsonb_build_object(
        'success', true,
        'subject_id', p_subject_id,
        'subject_type', p_subject_type,
        'anonymized_fields', v_anonymized_fields,
        'anonymized_at', now(),
        'anonymization_id', v_anonymization_id
    );

    RETURN v_result;
END;
$$;

-- Função para atualizar status de solicitação DSR
CREATE OR REPLACE FUNCTION "public"."update_dsr_request_status"(
    p_request_id uuid,
    p_status text,
    p_response_data jsonb DEFAULT NULL,
    p_rejection_reason text DEFAULT NULL,
    p_assigned_to uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request "public"."dsr_requests"%ROWTYPE;
    v_updated integer;
BEGIN
    -- Buscar solicitação
    SELECT * INTO v_request
    FROM "public"."dsr_requests"
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Atualizar status
    UPDATE "public"."dsr_requests"
    SET 
        status = p_status,
        response_data = COALESCE(p_response_data, response_data),
        response_date = CASE WHEN p_status = 'completed' THEN now() ELSE response_date END,
        rejection_reason = COALESCE(p_rejection_reason, rejection_reason),
        assigned_to = COALESCE(p_assigned_to, assigned_to),
        updated_at = now()
    WHERE id = p_request_id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    -- Registrar evento de auditoria
    IF v_updated > 0 THEN
        PERFORM "public"."log_audit_event"(
            v_request.tenant_id,
            v_request.subject_type,
            v_request.subject_id,
            'UPDATE',
            jsonb_build_object(
                'dsr_request_id', p_request_id,
                'old_status', v_request.status,
                'new_status', p_status,
                'action', 'dsr_request_status_updated'
            )
        );
    END IF;

    RETURN v_updated > 0;
END;
$$;

-- Função para buscar solicitações DSR
CREATE OR REPLACE FUNCTION "public"."get_dsr_requests"(
    p_tenant_id uuid,
    p_subject_id uuid DEFAULT NULL,
    p_subject_type text DEFAULT NULL,
    p_request_type text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_limit integer DEFAULT 100
)
RETURNS TABLE (
    id uuid,
    tenant_id uuid,
    subject_id uuid,
    subject_type text,
    request_type text,
    status text,
    requested_by text,
    requested_by_email text,
    request_description text,
    assigned_to uuid,
    response_data jsonb,
    response_date timestamptz,
    rejection_reason text,
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
        dr.id,
        dr.tenant_id,
        dr.subject_id,
        dr.subject_type,
        dr.request_type,
        dr.status,
        dr.requested_by,
        dr.requested_by_email,
        dr.request_description,
        dr.assigned_to,
        dr.response_data,
        dr.response_date,
        dr.rejection_reason,
        dr.created_at,
        dr.updated_at
    FROM "public"."dsr_requests" dr
    WHERE dr.tenant_id = p_tenant_id
        AND (p_subject_id IS NULL OR dr.subject_id = p_subject_id)
        AND (p_subject_type IS NULL OR dr.subject_type = p_subject_type)
        AND (p_request_type IS NULL OR dr.request_type = p_request_type)
        AND (p_status IS NULL OR dr.status = p_status)
    ORDER BY dr.created_at DESC
    LIMIT p_limit;
END;
$$;

-- ============================================================================
-- PARTE 3: RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."dsr_requests" ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver solicitações do seu tenant
CREATE POLICY "Users can view DSR requests in their tenant"
    ON "public"."dsr_requests" FOR SELECT
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

-- Admins podem gerenciar solicitações DSR
CREATE POLICY "Admins can manage DSR requests"
    ON "public"."dsr_requests" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary', 'school_manager')
        )
    );

-- Sistema pode inserir solicitações (via função SECURITY DEFINER)
CREATE POLICY "System can insert DSR requests"
    ON "public"."dsr_requests" FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."dsr_requests" IS 'Solicitações de Direitos do Titular (DSR/LGPD)';
COMMENT ON FUNCTION "public"."create_dsr_request" IS 'Cria uma nova solicitação DSR';
COMMENT ON FUNCTION "public"."export_personal_data_v2" IS 'Exporta todos os dados pessoais de um titular (portabilidade)';
COMMENT ON FUNCTION "public"."anonymize_personal_data_v2" IS 'Anonimiza dados de um titular (direito ao esquecimento)';
COMMENT ON FUNCTION "public"."update_dsr_request_status" IS 'Atualiza o status de uma solicitação DSR';
COMMENT ON FUNCTION "public"."get_dsr_requests" IS 'Retorna solicitações DSR com filtros';

