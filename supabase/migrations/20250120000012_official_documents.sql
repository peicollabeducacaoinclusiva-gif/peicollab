-- Emissão de Documentos Oficiais
-- Sistema completo para geração de documentos escolares oficiais

-- ============================================================================
-- PARTE 1: TABELA DE DOCUMENTOS OFICIAIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."official_documents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "enrollment_id" uuid REFERENCES "public"."enrollments"("id") ON DELETE SET NULL,
    "document_type" text NOT NULL CHECK ("document_type" IN (
        'declaracao_escolar',
        'historico_escolar',
        'certificado_conclusao',
        'diploma',
        'atestado_frequencia',
        'declaracao_transferencia',
        'declaracao_vinculo'
    )),
    "status" text NOT NULL CHECK ("status" IN (
        'draft',
        'pending_approval',
        'approved',
        'rejected',
        'issued'
    )) DEFAULT 'draft',
    "template_id" uuid REFERENCES "public"."document_templates"("id") ON DELETE SET NULL,
    "content" jsonb NOT NULL,
    "issued_at" timestamptz,
    "issued_by" uuid REFERENCES "auth"."users"("id"),
    "approved_at" timestamptz,
    "approved_by" uuid REFERENCES "auth"."users"("id"),
    "rejected_at" timestamptz,
    "rejected_by" uuid REFERENCES "auth"."users"("id"),
    "rejection_reason" text,
    "digital_signature" text,
    "verification_code" text,
    "pdf_url" text,
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "academic_year" integer,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_official_documents_student ON "public"."official_documents"("student_id");
CREATE INDEX IF NOT EXISTS idx_official_documents_type ON "public"."official_documents"("document_type", "status");
CREATE INDEX IF NOT EXISTS idx_official_documents_school ON "public"."official_documents"("school_id", "academic_year");
CREATE INDEX IF NOT EXISTS idx_official_documents_status ON "public"."official_documents"("status", "created_at");
CREATE INDEX IF NOT EXISTS idx_official_documents_verification ON "public"."official_documents"("verification_code") WHERE "verification_code" IS NOT NULL;

-- ============================================================================
-- PARTE 2: TABELA DE TEMPLATES DE DOCUMENTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."document_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "document_type" text NOT NULL CHECK ("document_type" IN (
        'declaracao_escolar',
        'historico_escolar',
        'certificado_conclusao',
        'diploma',
        'atestado_frequencia',
        'declaracao_transferencia',
        'declaracao_vinculo'
    )),
    "name" text NOT NULL,
    "description" text,
    "template_content" jsonb NOT NULL,
    "is_official" boolean NOT NULL DEFAULT false,
    "requires_approval" boolean NOT NULL DEFAULT true,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON "public"."document_templates"("document_type", "is_active");
CREATE INDEX IF NOT EXISTS idx_document_templates_tenant ON "public"."document_templates"("tenant_id", "school_id");

-- ============================================================================
-- PARTE 3: FUNÇÃO PARA GERAR CÓDIGO DE VERIFICAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."generate_document_verification_code"()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_code text;
BEGIN
    -- Gerar código alfanumérico de 12 caracteres
    v_code := upper(
        substring(
            md5(random()::text || clock_timestamp()::text),
            1,
            12
        )
    );
    
    RETURN v_code;
END;
$$;

-- ============================================================================
-- PARTE 4: RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."official_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."document_templates" ENABLE ROW LEVEL SECURITY;

-- Políticas para official_documents
CREATE POLICY "Users can view documents in their tenant"
    ON "public"."official_documents" FOR SELECT
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

CREATE POLICY "Admins can create documents"
    ON "public"."official_documents" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary', 'school_manager')
        )
    );

CREATE POLICY "Admins can update documents"
    ON "public"."official_documents" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary', 'school_manager')
        )
    );

-- Políticas para document_templates
CREATE POLICY "Users can view templates in their tenant"
    ON "public"."document_templates" FOR SELECT
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

CREATE POLICY "Admins can manage templates"
    ON "public"."document_templates" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary', 'school_manager')
        )
    );

-- ============================================================================
-- PARTE 5: TRIGGERS
-- ============================================================================

CREATE TRIGGER update_official_documents_updated_at 
    BEFORE UPDATE ON "public"."official_documents"
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at 
    BEFORE UPDATE ON "public"."document_templates"
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."official_documents" IS 'Documentos oficiais emitidos pela escola';
COMMENT ON TABLE "public"."document_templates" IS 'Templates para geração de documentos oficiais';
COMMENT ON COLUMN "public"."official_documents"."verification_code" IS 'Código único para verificação online do documento';
COMMENT ON COLUMN "public"."official_documents"."digital_signature" IS 'Assinatura digital do documento';








