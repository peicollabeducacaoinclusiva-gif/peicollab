-- Sistema de Certificados e Diplomas
-- Tabelas para emissão de certificados, diplomas, históricos e declarações

-- CERTIFICATE_TEMPLATES (Templates de Certificados)
CREATE TABLE IF NOT EXISTS "public"."certificate_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "template_name" text NOT NULL,
    "certificate_type" text NOT NULL CHECK ("certificate_type" IN ('completion', 'diploma', 'school_history', 'declaration')),
    "template_content" text NOT NULL,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- CERTIFICATES (Certificados Emitidos)
CREATE TABLE IF NOT EXISTS "public"."certificates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "enrollment_id" uuid REFERENCES "public"."student_enrollments"("id") ON DELETE CASCADE,
    "certificate_type" text NOT NULL CHECK ("certificate_type" IN ('completion', 'diploma', 'school_history', 'declaration')),
    "academic_year" integer NOT NULL,
    "issue_date" date NOT NULL,
    "certificate_number" text NOT NULL UNIQUE,
    "pdf_url" text,
    "template_id" uuid REFERENCES "public"."certificate_templates"("id") ON DELETE SET NULL,
    "custom_data" jsonb DEFAULT '{}',
    "issued_by" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_certificates_student" ON "public"."certificates"("student_id");
CREATE INDEX IF NOT EXISTS "idx_certificates_enrollment" ON "public"."certificates"("enrollment_id");
CREATE INDEX IF NOT EXISTS "idx_certificates_type" ON "public"."certificates"("certificate_type");
CREATE INDEX IF NOT EXISTS "idx_certificates_academic_year" ON "public"."certificates"("academic_year");
CREATE INDEX IF NOT EXISTS "idx_certificates_number" ON "public"."certificates"("certificate_number");

CREATE INDEX IF NOT EXISTS "idx_certificate_templates_tenant" ON "public"."certificate_templates"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_certificate_templates_school" ON "public"."certificate_templates"("school_id");
CREATE INDEX IF NOT EXISTS "idx_certificate_templates_type" ON "public"."certificate_templates"("certificate_type");

-- RLS Policies
ALTER TABLE "public"."certificate_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."certificates" ENABLE ROW LEVEL SECURITY;

-- Políticas para certificate_templates
CREATE POLICY "Users can view templates in their tenant"
    ON "public"."certificate_templates" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "certificate_templates"."tenant_id"
        )
    );

CREATE POLICY "Users can create templates in their tenant"
    ON "public"."certificate_templates" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "certificate_templates"."tenant_id"
        )
    );

CREATE POLICY "Users can update templates in their tenant"
    ON "public"."certificate_templates" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "certificate_templates"."tenant_id"
        )
    );

-- Políticas para certificates
CREATE POLICY "Users can view certificates in their tenant"
    ON "public"."certificates" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            JOIN "public"."students" s ON s.tenant_id = ut.tenant_id
            WHERE ut.user_id = auth.uid() AND s.id = "certificates"."student_id"
        )
    );

CREATE POLICY "Users can create certificates in their tenant"
    ON "public"."certificates" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            JOIN "public"."students" s ON s.tenant_id = ut.tenant_id
            WHERE ut.user_id = auth.uid() AND s.id = "certificates"."student_id"
        )
    );

-- Triggers para updated_at
CREATE TRIGGER update_certificate_templates_updated_at BEFORE UPDATE ON "public"."certificate_templates"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON "public"."certificates"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

