-- Sistema de Ocorrências e Atendimentos Individuais
-- Tabelas para registro de ocorrências disciplinares e atendimentos individuais

-- DIARY_OCCURRENCES (Ocorrências Disciplinares)
CREATE TABLE IF NOT EXISTS "public"."diary_occurrences" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "enrollment_id" uuid REFERENCES "public"."student_enrollments"("id") ON DELETE CASCADE,
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "subject_id" uuid REFERENCES "public"."subjects"("id") ON DELETE SET NULL,
    "diary_entry_id" uuid REFERENCES "public"."class_diary"("id") ON DELETE SET NULL,
    "occurrence_type" text NOT NULL CHECK ("occurrence_type" IN ('behavioral', 'pedagogical', 'administrative', 'attendance', 'other')),
    "severity" text NOT NULL DEFAULT 'medium' CHECK ("severity" IN ('low', 'medium', 'high', 'critical')),
    "title" text NOT NULL,
    "description" text NOT NULL,
    "date" date NOT NULL,
    "location" text,
    "witnesses" text[],
    "actions_taken" text,
    "follow_up_required" boolean NOT NULL DEFAULT false,
    "follow_up_date" date,
    "document_url" text,
    "reported_by" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "status" text NOT NULL DEFAULT 'open' CHECK ("status" IN ('open', 'resolved', 'archived')),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- INDIVIDUAL_ATTENDANCES (Atendimentos Individuais)
CREATE TABLE IF NOT EXISTS "public"."individual_attendances" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "enrollment_id" uuid REFERENCES "public"."student_enrollments"("id") ON DELETE CASCADE,
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "subject_id" uuid REFERENCES "public"."subjects"("id") ON DELETE SET NULL,
    "diary_entry_id" uuid REFERENCES "public"."class_diary"("id") ON DELETE SET NULL,
    "attendance_date" date NOT NULL,
    "attendance_type" text NOT NULL DEFAULT 'individual' CHECK ("attendance_type" IN ('individual', 'group', 'special_needs')),
    "description" text NOT NULL,
    "objectives" text[],
    "activities_performed" text,
    "observations" text,
    "next_steps" text,
    "conducted_by" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_diary_occurrences_student" ON "public"."diary_occurrences"("student_id");
CREATE INDEX IF NOT EXISTS "idx_diary_occurrences_class" ON "public"."diary_occurrences"("class_id");
CREATE INDEX IF NOT EXISTS "idx_diary_occurrences_date" ON "public"."diary_occurrences"("date");
CREATE INDEX IF NOT EXISTS "idx_diary_occurrences_type" ON "public"."diary_occurrences"("occurrence_type");
CREATE INDEX IF NOT EXISTS "idx_diary_occurrences_status" ON "public"."diary_occurrences"("status");
CREATE INDEX IF NOT EXISTS "idx_diary_occurrences_diary_entry" ON "public"."diary_occurrences"("diary_entry_id");

CREATE INDEX IF NOT EXISTS "idx_individual_attendances_student" ON "public"."individual_attendances"("student_id");
CREATE INDEX IF NOT EXISTS "idx_individual_attendances_class" ON "public"."individual_attendances"("class_id");
CREATE INDEX IF NOT EXISTS "idx_individual_attendances_date" ON "public"."individual_attendances"("attendance_date");
CREATE INDEX IF NOT EXISTS "idx_individual_attendances_diary_entry" ON "public"."individual_attendances"("diary_entry_id");

-- RLS Policies
ALTER TABLE "public"."diary_occurrences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."individual_attendances" ENABLE ROW LEVEL SECURITY;

-- Políticas para diary_occurrences
CREATE POLICY "Users can view occurrences in their tenant"
    ON "public"."diary_occurrences" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "diary_occurrences"."tenant_id"
        )
    );

CREATE POLICY "Users can create occurrences in their tenant"
    ON "public"."diary_occurrences" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "diary_occurrences"."tenant_id"
        )
    );

CREATE POLICY "Users can update occurrences in their tenant"
    ON "public"."diary_occurrences" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "diary_occurrences"."tenant_id"
        )
    );

-- Políticas para individual_attendances
CREATE POLICY "Users can view individual attendances in their tenant"
    ON "public"."individual_attendances" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "individual_attendances"."tenant_id"
        )
    );

CREATE POLICY "Users can create individual attendances in their tenant"
    ON "public"."individual_attendances" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "individual_attendances"."tenant_id"
        )
    );

CREATE POLICY "Users can update individual attendances in their tenant"
    ON "public"."individual_attendances" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "individual_attendances"."tenant_id"
        )
    );

-- Triggers para updated_at
CREATE TRIGGER update_diary_occurrences_updated_at BEFORE UPDATE ON "public"."diary_occurrences"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_individual_attendances_updated_at BEFORE UPDATE ON "public"."individual_attendances"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

