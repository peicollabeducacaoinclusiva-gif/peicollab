-- Sistema de Notificações e Links Públicos do Diário Escolar

-- DIARY_NOTIFICATIONS (Notificações para Responsáveis)
CREATE TABLE IF NOT EXISTS "public"."diary_notifications" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "enrollment_id" uuid NOT NULL REFERENCES "public"."student_enrollments"("id") ON DELETE CASCADE,
    "notification_type" text NOT NULL CHECK ("notification_type" IN ('diary_entry', 'grade', 'attendance', 'report', 'occurrence')),
    "title" text NOT NULL,
    "message" text NOT NULL,
    "diary_entry_id" uuid REFERENCES "public"."class_diary"("id") ON DELETE SET NULL,
    "grade_id" uuid REFERENCES "public"."grades"("id") ON DELETE SET NULL,
    "attendance_id" uuid REFERENCES "public"."attendance"("id") ON DELETE SET NULL,
    "report_id" uuid REFERENCES "public"."descriptive_reports"("id") ON DELETE SET NULL,
    "occurrence_id" uuid REFERENCES "public"."diary_occurrences"("id") ON DELETE SET NULL,
    "sent_to" uuid[] NOT NULL DEFAULT '{}', -- IDs dos responsáveis
    "sent_at" timestamptz,
    "read_at" timestamptz,
    "created_at" timestamptz DEFAULT now()
);

-- DIARY_PUBLIC_ACCESS_LINKS (Links Públicos para Consulta)
CREATE TABLE IF NOT EXISTS "public"."diary_public_access_links" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "enrollment_id" uuid NOT NULL REFERENCES "public"."student_enrollments"("id") ON DELETE CASCADE,
    "access_token" text NOT NULL UNIQUE,
    "expires_at" timestamptz,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_by" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "created_at" timestamptz DEFAULT now(),
    "last_accessed_at" timestamptz,
    "access_count" integer NOT NULL DEFAULT 0
);

-- DIARY_TEMPLATE_VERSIONS (Histórico de Versões dos Templates)
CREATE TABLE IF NOT EXISTS "public"."diary_template_versions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "template_id" uuid NOT NULL REFERENCES "public"."diary_templates"("id") ON DELETE CASCADE,
    "version_number" integer NOT NULL,
    "template_content" text NOT NULL,
    "template_fields" jsonb DEFAULT '{}'::jsonb,
    "created_by" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "created_at" timestamptz DEFAULT now(),
    "change_description" text
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_diary_notifications_enrollment" ON "public"."diary_notifications"("enrollment_id");
CREATE INDEX IF NOT EXISTS "idx_diary_notifications_student" ON "public"."diary_notifications"("student_id");
CREATE INDEX IF NOT EXISTS "idx_diary_notifications_type" ON "public"."diary_notifications"("notification_type");
CREATE INDEX IF NOT EXISTS "idx_diary_notifications_sent_to" ON "public"."diary_notifications" USING GIN("sent_to");

CREATE INDEX IF NOT EXISTS "idx_diary_public_links_enrollment" ON "public"."diary_public_access_links"("enrollment_id");
CREATE INDEX IF NOT EXISTS "idx_diary_public_links_token" ON "public"."diary_public_access_links"("access_token");
CREATE INDEX IF NOT EXISTS "idx_diary_public_links_active" ON "public"."diary_public_access_links"("is_active", "expires_at");

CREATE INDEX IF NOT EXISTS "idx_diary_template_versions_template" ON "public"."diary_template_versions"("template_id");
CREATE INDEX IF NOT EXISTS "idx_diary_template_versions_number" ON "public"."diary_template_versions"("template_id", "version_number");

-- RLS Policies
ALTER TABLE "public"."diary_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."diary_public_access_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."diary_template_versions" ENABLE ROW LEVEL SECURITY;

-- Políticas para diary_notifications
CREATE POLICY "Users can view notifications in their tenant"
    ON "public"."diary_notifications" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "diary_notifications"."tenant_id"
        )
        OR
        auth.uid() = ANY("diary_notifications"."sent_to")
    );

CREATE POLICY "Users can create notifications in their tenant"
    ON "public"."diary_notifications" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "diary_notifications"."tenant_id"
        )
    );

-- Políticas para diary_public_access_links
CREATE POLICY "Users can view links for enrollments they manage"
    ON "public"."diary_public_access_links" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."student_enrollments" se
            JOIN "public"."classes" c ON c.id = se.class_id
            JOIN "public"."profiles" p ON p.school_id = c.school_id
            WHERE se.id = "diary_public_access_links"."enrollment_id"
            AND p.id = auth.uid()
        )
        OR
        "diary_public_access_links"."created_by" = auth.uid()
    );

CREATE POLICY "Users can create links for enrollments they manage"
    ON "public"."diary_public_access_links" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."student_enrollments" se
            JOIN "public"."classes" c ON c.id = se.class_id
            JOIN "public"."profiles" p ON p.school_id = c.school_id
            WHERE se.id = "diary_public_access_links"."enrollment_id"
            AND p.id = auth.uid()
        )
    );

CREATE POLICY "Users can update links they created"
    ON "public"."diary_public_access_links" FOR UPDATE
    USING ("diary_public_access_links"."created_by" = auth.uid());

-- Políticas para diary_template_versions
CREATE POLICY "Users can view template versions in their tenant"
    ON "public"."diary_template_versions" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."diary_templates" dt
            JOIN "public"."user_tenants" ut ON ut.tenant_id = dt.tenant_id
            WHERE dt.id = "diary_template_versions"."template_id"
            AND ut.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create template versions in their tenant"
    ON "public"."diary_template_versions" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."diary_templates" dt
            JOIN "public"."user_tenants" ut ON ut.tenant_id = dt.tenant_id
            WHERE dt.id = "diary_template_versions"."template_id"
            AND ut.user_id = auth.uid()
        )
    );

-- Trigger para criar versão ao atualizar template
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
DECLARE
    v_version_number integer;
BEGIN
    -- Obter próximo número de versão
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM diary_template_versions
    WHERE template_id = NEW.id;

    -- Criar versão com conteúdo antigo
    INSERT INTO diary_template_versions (
        template_id,
        version_number,
        template_content,
        template_fields,
        created_by
    ) VALUES (
        NEW.id,
        v_version_number,
        OLD.template_content,
        OLD.template_fields,
        auth.uid()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER diary_template_version_trigger
    AFTER UPDATE OF template_content, template_fields ON "public"."diary_templates"
    FOR EACH ROW
    WHEN (OLD.template_content IS DISTINCT FROM NEW.template_content OR OLD.template_fields IS DISTINCT FROM NEW.template_fields)
    EXECUTE FUNCTION create_template_version();

