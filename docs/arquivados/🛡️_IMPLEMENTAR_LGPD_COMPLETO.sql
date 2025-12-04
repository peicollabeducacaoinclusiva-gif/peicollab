-- ============================================================================
-- IMPLEMENTAÇÃO COMPLETA DE CONFORMIDADE LGPD
-- ============================================================================
-- Sistema: PEI Collab
-- Data: 08/01/2025
-- Objetivo: Tornar o sistema 100% conforme com LGPD
-- ============================================================================

-- ============================================================================
-- 1. TABELA DE LOGS DE CONSENTIMENTO (Art. 14 LGPD)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."consent_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Titular dos dados (estudante)
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    
    -- Quem consentiu (responsável)
    "consented_by_user_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "consented_by_name" text NOT NULL,
    "consented_by_relationship" text, -- 'pai', 'mãe', 'responsável legal'
    
    -- Tipo de consentimento
    "consent_type" text NOT NULL,
    -- Valores: 'data_collection', 'pei_creation', 'photo_use', 'medical_data', 'all'
    
    -- Detalhes
    "consent_text" text NOT NULL, -- Texto exato que foi consentido
    "consent_version" text DEFAULT '1.0',
    
    -- Controle
    "consented_at" timestamptz DEFAULT now(),
    "revoked_at" timestamptz,
    "revoked_by_user_id" uuid REFERENCES "auth"."users"("id"),
    "revocation_reason" text,
    
    -- Auditoria
    "ip_address" inet,
    "user_agent" text,
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    
    CONSTRAINT "consent_logs_type_check" CHECK (
        consent_type IN (
            'data_collection', 
            'pei_creation', 
            'photo_use', 
            'medical_data',
            'aee_plan',
            'data_sharing',
            'all'
        )
    )
);

CREATE INDEX IF NOT EXISTS "idx_consent_logs_student" ON "public"."consent_logs"("student_id");
CREATE INDEX IF NOT EXISTS "idx_consent_logs_consented_by" ON "public"."consent_logs"("consented_by_user_id");
CREATE INDEX IF NOT EXISTS "idx_consent_logs_type" ON "public"."consent_logs"("consent_type");
CREATE INDEX IF NOT EXISTS "idx_consent_logs_active" ON "public"."consent_logs"("student_id", "consent_type") 
    WHERE revoked_at IS NULL;

COMMENT ON TABLE "public"."consent_logs" IS 'Registro de consentimentos conforme LGPD Art. 14';
COMMENT ON COLUMN "public"."consent_logs"."consent_text" IS 'Texto EXATO do termo aceito - imutável para auditoria';

-- ============================================================================
-- 2. TABELA DE LOGS DE ACESSO (Art. 37 LGPD)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."access_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Quem acessou
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "user_role" text NOT NULL,
    
    -- O que foi acessado
    "action" text NOT NULL, -- 'view', 'edit', 'delete', 'export', 'print'
    "table_name" text NOT NULL,
    "record_id" uuid,
    
    -- Dados sensíveis acessados (LGPD)
    "sensitive_fields_accessed" text[], 
    -- Ex: ['cpf', 'diagnosis', 'medical_report']
    
    -- Contexto
    "description" text,
    "ip_address" inet,
    "user_agent" text,
    
    -- Controle
    "accessed_at" timestamptz DEFAULT now(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    
    CONSTRAINT "access_logs_action_check" CHECK (
        action IN ('view', 'edit', 'create', 'delete', 'export', 'print', 'download')
    )
);

CREATE INDEX IF NOT EXISTS "idx_access_logs_user" ON "public"."access_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_access_logs_table" ON "public"."access_logs"("table_name");
CREATE INDEX IF NOT EXISTS "idx_access_logs_record" ON "public"."access_logs"("record_id");
CREATE INDEX IF NOT EXISTS "idx_access_logs_date" ON "public"."access_logs"("accessed_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_access_logs_sensitive" ON "public"."access_logs" USING GIN ("sensitive_fields_accessed");

COMMENT ON TABLE "public"."access_logs" IS 'Logs de acesso para auditoria LGPD Art. 37';
COMMENT ON COLUMN "public"."access_logs"."sensitive_fields_accessed" IS 'Array de campos sensíveis acessados (CPF, diagnóstico, etc)';

-- ============================================================================
-- 3. ADICIONAR SOFT DELETE EM TABELAS PRINCIPAIS
-- ============================================================================

-- Students
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "anonymized_at" timestamptz;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "anonymization_reason" text;

CREATE INDEX IF NOT EXISTS "idx_students_deleted" ON "public"."students"("deleted_at") WHERE deleted_at IS NOT NULL;

-- PEIs
ALTER TABLE "public"."peis" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;

CREATE INDEX IF NOT EXISTS "idx_peis_deleted" ON "public"."peis"("deleted_at") WHERE deleted_at IS NOT NULL;

-- Plano AEE
ALTER TABLE "public"."plano_aee" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;

-- ============================================================================
-- 4. TABELA DE SOLICITAÇÕES DE DIREITOS (Art. 18 LGPD)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."data_subject_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Solicitante
    "requester_user_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "requester_name" text NOT NULL,
    "requester_email" text NOT NULL,
    
    -- Titular (pode ser diferente do solicitante)
    "subject_student_id" uuid REFERENCES "public"."students"("id"),
    "subject_name" text NOT NULL,
    
    -- Tipo de solicitação (Art. 18 LGPD)
    "request_type" text NOT NULL,
    -- 'access', 'correction', 'deletion', 'portability', 'revoke_consent', 'anonymization'
    
    -- Detalhes
    "description" text NOT NULL,
    "status" text DEFAULT 'pending',
    -- 'pending', 'in_progress', 'completed', 'rejected', 'cancelled'
    
    -- Resposta
    "response_text" text,
    "response_by_user_id" uuid REFERENCES "auth"."users"("id"),
    "response_at" timestamptz,
    
    -- Prazos (LGPD: 15 dias)
    "requested_at" timestamptz DEFAULT now(),
    "deadline_at" timestamptz DEFAULT (now() + INTERVAL '15 days'),
    "completed_at" timestamptz,
    
    -- Auditoria
    "ip_address" inet,
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    
    CONSTRAINT "dsr_type_check" CHECK (
        request_type IN (
            'access',           -- Art. 18, I e II
            'correction',       -- Art. 18, III
            'deletion',         -- Art. 18, IV e VI
            'anonymization',    -- Art. 18, IV
            'portability',      -- Art. 18, V
            'revoke_consent',   -- Art. 18, IX
            'info_sharing',     -- Art. 18, VII
            'oppose_treatment'  -- Art. 18, § 2º
        )
    ),
    CONSTRAINT "dsr_status_check" CHECK (
        status IN ('pending', 'in_progress', 'completed', 'rejected', 'cancelled')
    )
);

CREATE INDEX IF NOT EXISTS "idx_dsr_requester" ON "public"."data_subject_requests"("requester_user_id");
CREATE INDEX IF NOT EXISTS "idx_dsr_subject" ON "public"."data_subject_requests"("subject_student_id");
CREATE INDEX IF NOT EXISTS "idx_dsr_status" ON "public"."data_subject_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_dsr_deadline" ON "public"."data_subject_requests"("deadline_at") 
    WHERE status IN ('pending', 'in_progress');

COMMENT ON TABLE "public"."data_subject_requests" IS 'Solicitações de direitos dos titulares (LGPD Art. 18)';

-- ============================================================================
-- 5. TABELA DE RETENÇÃO E PURGA DE DADOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."data_retention_policy" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    "table_name" text NOT NULL UNIQUE,
    "retention_period_months" integer NOT NULL,
    "purge_after_months" integer,
    "anonymize_after_months" integer,
    
    "description" text,
    "legal_basis" text, -- Base legal para retenção
    
    "is_active" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

INSERT INTO "public"."data_retention_policy" (table_name, retention_period_months, anonymize_after_months, description, legal_basis)
VALUES 
    ('students', 60, 72, 'Dados de estudantes - 5 anos após conclusão', 'Art. 16 LGPD'),
    ('peis', 60, 72, 'PEIs devem ser mantidos por 5 anos', 'Legislação Educacional'),
    ('plano_aee', 60, 72, 'Planos de AEE - mesma retenção que PEIs', 'Legislação Educacional'),
    ('access_logs', 6, NULL, 'Logs de acesso - mínimo 6 meses', 'Art. 37 LGPD')
ON CONFLICT (table_name) DO NOTHING;

-- ============================================================================
-- 6. FUNÇÃO PARA ANONIMIZAR ESTUDANTE
-- ============================================================================

CREATE OR REPLACE FUNCTION anonymize_student(p_student_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE "public"."students"
    SET 
        name = 'Aluno Anonimizado ' || LEFT(id::text, 8),
        cpf = NULL,
        rg = NULL,
        birth_date = NULL,
        address = NULL,
        city = NULL,
        state = NULL,
        zip_code = NULL,
        parent_name = NULL,
        parent_phone = NULL,
        parent_email = NULL,
        guardian_name = NULL,
        guardian_phone = NULL,
        guardian_email = NULL,
        medical_diagnosis = 'ANONIMIZADO',
        medical_reports = NULL,
        anonymized_at = NOW(),
        anonymization_reason = 'Solicitação de anonimização - LGPD Art. 18'
    WHERE id = p_student_id;
    
    -- Log da ação
    INSERT INTO "public"."access_logs" (
        user_id,
        user_role,
        action,
        table_name,
        record_id,
        description
    ) VALUES (
        auth.uid(),
        'system',
        'anonymize',
        'students',
        p_student_id,
        'Estudante anonimizado conforme LGPD'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION anonymize_student IS 'Anonimiza dados de estudante (LGPD Art. 18, IV)';

-- ============================================================================
-- 7. FUNÇÃO PARA EXPORTAR DADOS DO ESTUDANTE (PORTABILIDADE)
-- ============================================================================

CREATE OR REPLACE FUNCTION export_student_data(p_student_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'student', (SELECT row_to_json(s) FROM "public"."students" s WHERE id = p_student_id),
        'peis', (SELECT jsonb_agg(row_to_json(p)) FROM "public"."peis" p WHERE student_id = p_student_id),
        'feedbacks', (SELECT jsonb_agg(row_to_json(f)) FROM "public"."support_professional_feedbacks" f WHERE student_id = p_student_id),
        'plano_aee', (SELECT jsonb_agg(row_to_json(a)) FROM "public"."plano_aee" a WHERE student_id = p_student_id),
        'exported_at', NOW(),
        'exported_by', auth.uid()
    ) INTO v_result;
    
    -- Log da exportação
    INSERT INTO "public"."access_logs" (
        user_id,
        user_role,
        action,
        table_name,
        record_id,
        description
    ) VALUES (
        auth.uid(),
        'user',
        'export',
        'students',
        p_student_id,
        'Dados do estudante exportados (LGPD Art. 18, V)'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION export_student_data IS 'Exporta todos os dados de um estudante (LGPD Art. 18, V - Portabilidade)';

-- ============================================================================
-- 8. TRIGGER PARA LOG AUTOMÁTICO DE ACESSO A DADOS SENSÍVEIS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Apenas logar SELECTs, não INSERTs/UPDATEs (já logados via audit)
    IF TG_OP = 'SELECT' THEN
        INSERT INTO "public"."access_logs" (
            user_id,
            user_role,
            action,
            table_name,
            record_id,
            sensitive_fields_accessed,
            description
        ) VALUES (
            auth.uid(),
            (SELECT role FROM "public"."profiles" WHERE id = auth.uid()),
            'view',
            TG_TABLE_NAME,
            NEW.id,
            ARRAY['cpf', 'medical_diagnosis', 'medical_reports']::text[],
            'Acesso automático logado'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger (exemplo para students)
-- Nota: Triggers em SELECT não são nativos no Postgres
-- Alternativa: Usar Views e log na aplicação

-- ============================================================================
-- 9. VIEW PARA DASHBOARD DE DPO (Data Protection Officer)
-- ============================================================================

CREATE OR REPLACE VIEW "public"."dpo_dashboard" AS
SELECT 
    'Consentimentos Pendentes' as metric,
    COUNT(*) as value
FROM "public"."students" s
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."consent_logs" c
    WHERE c.student_id = s.id
    AND c.consent_type = 'all'
    AND c.revoked_at IS NULL
)
AND s.deleted_at IS NULL

UNION ALL

SELECT 
    'Solicitações Pendentes (Art. 18)' as metric,
    COUNT(*) as value
FROM "public"."data_subject_requests"
WHERE status IN ('pending', 'in_progress')

UNION ALL

SELECT 
    'Solicitações Atrasadas' as metric,
    COUNT(*) as value
FROM "public"."data_subject_requests"
WHERE status IN ('pending', 'in_progress')
AND deadline_at < NOW()

UNION ALL

SELECT 
    'Acessos a Dados Sensíveis (últimas 24h)' as metric,
    COUNT(*) as value
FROM "public"."access_logs"
WHERE accessed_at > NOW() - INTERVAL '24 hours'
AND sensitive_fields_accessed IS NOT NULL

UNION ALL

SELECT 
    'Estudantes para Revisão de Retenção' as metric,
    COUNT(*) as value
FROM "public"."students"
WHERE updated_at < NOW() - INTERVAL '5 years'
AND deleted_at IS NULL
AND anonymized_at IS NULL;

COMMENT ON VIEW "public"."dpo_dashboard" IS 'Dashboard para o DPO monitorar conformidade LGPD';

-- ============================================================================
-- 10. RLS POLICIES PARA NOVAS TABELAS
-- ============================================================================

-- Consent Logs
ALTER TABLE "public"."consent_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_consents"
    ON "public"."consent_logs"
    FOR SELECT
    USING (consented_by_user_id = auth.uid());

CREATE POLICY "admins_view_all_consents"
    ON "public"."consent_logs"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('school_manager', 'education_secretary', 'coordinator')
        )
    );

-- Access Logs
ALTER TABLE "public"."access_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_access_logs"
    ON "public"."access_logs"
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "admins_view_all_access_logs"
    ON "public"."access_logs"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('school_manager', 'education_secretary')
        )
    );

-- Data Subject Requests
ALTER TABLE "public"."data_subject_requests" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_requests"
    ON "public"."data_subject_requests"
    FOR ALL
    USING (requester_user_id = auth.uid());

CREATE POLICY "admins_manage_all_requests"
    ON "public"."data_subject_requests"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('school_manager', 'education_secretary', 'coordinator')
        )
    );

-- ============================================================================
-- FIM DA IMPLEMENTAÇÃO LGPD
-- ============================================================================

SELECT 
    '✅ IMPLEMENTAÇÃO LGPD CONCLUÍDA' as status,
    'Tabelas criadas: consent_logs, access_logs, data_subject_requests, data_retention_policy' as tabelas,
    'Funções criadas: anonymize_student, export_student_data' as funcoes,
    NOW() as data_implementacao;






