-- Gestão Avançada de Servidores
-- Tabelas para alocações, afastamentos e substituições de profissionais

-- PROFESSIONAL_ALLOCATIONS (Alocações de Profissionais)
CREATE TABLE IF NOT EXISTS "public"."professional_allocations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "professional_id" uuid NOT NULL REFERENCES "public"."professionals"("id") ON DELETE CASCADE,
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "subject_id" uuid REFERENCES "public"."subjects"("id") ON DELETE SET NULL,
    "academic_year" integer NOT NULL,
    "weekly_hours" numeric NOT NULL,
    "start_date" date NOT NULL,
    "end_date" date,
    "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'inactive')),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("professional_id", "class_id", "subject_id", "academic_year")
);

-- PROFESSIONAL_ABSENCES (Afastamentos)
CREATE TABLE IF NOT EXISTS "public"."professional_absences" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "professional_id" uuid NOT NULL REFERENCES "public"."professionals"("id") ON DELETE CASCADE,
    "absence_type" text NOT NULL CHECK ("absence_type" IN ('license', 'vacation', 'sick_leave', 'other')),
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "reason" text NOT NULL,
    "document_url" text,
    "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected')),
    "approved_by" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "approved_at" timestamptz,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- PROFESSIONAL_SUBSTITUTIONS (Substituições)
CREATE TABLE IF NOT EXISTS "public"."professional_substitutions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "original_professional_id" uuid NOT NULL REFERENCES "public"."professionals"("id") ON DELETE CASCADE,
    "substitute_professional_id" uuid NOT NULL REFERENCES "public"."professionals"("id") ON DELETE CASCADE,
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "start_date" date NOT NULL,
    "end_date" date,
    "reason" text NOT NULL,
    "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'completed', 'cancelled')),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_professional_allocations_professional" ON "public"."professional_allocations"("professional_id");
CREATE INDEX IF NOT EXISTS "idx_professional_allocations_class" ON "public"."professional_allocations"("class_id");
CREATE INDEX IF NOT EXISTS "idx_professional_allocations_academic_year" ON "public"."professional_allocations"("academic_year");

CREATE INDEX IF NOT EXISTS "idx_professional_absences_professional" ON "public"."professional_absences"("professional_id");
CREATE INDEX IF NOT EXISTS "idx_professional_absences_status" ON "public"."professional_absences"("status");
CREATE INDEX IF NOT EXISTS "idx_professional_absences_dates" ON "public"."professional_absences"("start_date", "end_date");

CREATE INDEX IF NOT EXISTS "idx_professional_substitutions_original" ON "public"."professional_substitutions"("original_professional_id");
CREATE INDEX IF NOT EXISTS "idx_professional_substitutions_substitute" ON "public"."professional_substitutions"("substitute_professional_id");
CREATE INDEX IF NOT EXISTS "idx_professional_substitutions_class" ON "public"."professional_substitutions"("class_id");

-- RLS Policies
ALTER TABLE "public"."professional_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."professional_absences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."professional_substitutions" ENABLE ROW LEVEL SECURITY;

-- Políticas para professional_allocations
CREATE POLICY "Users can view allocations in their tenant"
    ON "public"."professional_allocations" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "professional_allocations"."tenant_id"
        )
    );

CREATE POLICY "Users can create allocations in their tenant"
    ON "public"."professional_allocations" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "professional_allocations"."tenant_id"
        )
    );

CREATE POLICY "Users can update allocations in their tenant"
    ON "public"."professional_allocations" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "professional_allocations"."tenant_id"
        )
    );

-- Políticas para professional_absences
CREATE POLICY "Users can view absences in their tenant"
    ON "public"."professional_absences" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "professional_absences"."tenant_id"
        )
    );

CREATE POLICY "Users can create absences in their tenant"
    ON "public"."professional_absences" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "professional_absences"."tenant_id"
        )
    );

CREATE POLICY "Users can update absences in their tenant"
    ON "public"."professional_absences" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "professional_absences"."tenant_id"
        )
    );

-- Políticas para professional_substitutions
CREATE POLICY "Users can view substitutions in their tenant"
    ON "public"."professional_substitutions" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "professional_substitutions"."tenant_id"
        )
    );

CREATE POLICY "Users can create substitutions in their tenant"
    ON "public"."professional_substitutions" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "professional_substitutions"."tenant_id"
        )
    );

CREATE POLICY "Users can update substitutions in their tenant"
    ON "public"."professional_substitutions" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "professional_substitutions"."tenant_id"
        )
    );

-- Triggers para updated_at
CREATE TRIGGER update_professional_allocations_updated_at BEFORE UPDATE ON "public"."professional_allocations"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_absences_updated_at BEFORE UPDATE ON "public"."professional_absences"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_substitutions_updated_at BEFORE UPDATE ON "public"."professional_substitutions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

