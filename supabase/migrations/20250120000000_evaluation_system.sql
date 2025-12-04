-- Sistema de Avaliação Flexível
-- Tabelas para suportar avaliações numéricas, conceituais e descritivas

-- EVALUATION_CONFIGS (Configuração do Sistema de Avaliação)
CREATE TABLE IF NOT EXISTS "public"."evaluation_configs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "academic_year" integer NOT NULL,
    "evaluation_type" text NOT NULL DEFAULT 'numeric' CHECK ("evaluation_type" IN ('numeric', 'conceptual', 'descriptive')),
    "calculation_method" text NOT NULL DEFAULT 'arithmetic' CHECK ("calculation_method" IN ('arithmetic', 'weighted', 'bimester_average')),
    "passing_grade" numeric(5,2) NOT NULL DEFAULT 6.0,
    "max_grade" numeric(5,2) NOT NULL DEFAULT 10.0,
    "weights" jsonb,
    "formula" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("tenant_id", "school_id", "academic_year")
);

-- GRADES (Notas dos Alunos)
CREATE TABLE IF NOT EXISTS "public"."grades" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "enrollment_id" uuid REFERENCES "public"."student_enrollments"("id") ON DELETE CASCADE,
    "subject_id" uuid NOT NULL REFERENCES "public"."subjects"("id") ON DELETE CASCADE,
    "academic_year" integer NOT NULL,
    "period" integer NOT NULL CHECK ("period" >= 1 AND "period" <= 4),
    "grade_value" numeric(5,2), -- Para avaliação numérica
    "conceptual_grade" text, -- Para avaliação conceitual (A, B, C, D, E)
    "descriptive_grade" text, -- Para avaliação descritiva
    "evaluation_type" text NOT NULL DEFAULT 'numeric' CHECK ("evaluation_type" IN ('numeric', 'conceptual', 'descriptive')),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("student_id", "enrollment_id", "subject_id", "academic_year", "period")
);

-- ATTENDANCE (Frequência dos Alunos)
CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "enrollment_id" uuid REFERENCES "public"."student_enrollments"("id") ON DELETE CASCADE,
    "subject_id" uuid REFERENCES "public"."subjects"("id") ON DELETE SET NULL, -- null para frequência geral
    "academic_year" integer NOT NULL,
    "period" integer NOT NULL CHECK ("period" >= 1 AND "period" <= 4),
    "total_classes" integer NOT NULL DEFAULT 0,
    "present_classes" integer NOT NULL DEFAULT 0,
    "absent_classes" integer NOT NULL DEFAULT 0,
    "justified_absences" integer NOT NULL DEFAULT 0,
    "attendance_percentage" numeric(5,2) NOT NULL DEFAULT 0,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("student_id", "enrollment_id", "subject_id", "academic_year", "period")
);

-- DESCRIPTIVE_REPORTS (Pareceres Descritivos)
CREATE TABLE IF NOT EXISTS "public"."descriptive_reports" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "enrollment_id" uuid REFERENCES "public"."student_enrollments"("id") ON DELETE CASCADE,
    "academic_year" integer NOT NULL,
    "period" integer NOT NULL CHECK ("period" >= 1 AND "period" <= 4),
    "report_text" text NOT NULL,
    "created_by" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("student_id", "enrollment_id", "academic_year", "period")
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS "idx_grades_student" ON "public"."grades"("student_id");
CREATE INDEX IF NOT EXISTS "idx_grades_enrollment" ON "public"."grades"("enrollment_id");
CREATE INDEX IF NOT EXISTS "idx_grades_subject" ON "public"."grades"("subject_id");
CREATE INDEX IF NOT EXISTS "idx_grades_academic_year" ON "public"."grades"("academic_year", "period");

CREATE INDEX IF NOT EXISTS "idx_attendance_student" ON "public"."attendance"("student_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_enrollment" ON "public"."attendance"("enrollment_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_subject" ON "public"."attendance"("subject_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_academic_year" ON "public"."attendance"("academic_year", "period");

CREATE INDEX IF NOT EXISTS "idx_descriptive_reports_student" ON "public"."descriptive_reports"("student_id");
CREATE INDEX IF NOT EXISTS "idx_descriptive_reports_enrollment" ON "public"."descriptive_reports"("enrollment_id");
CREATE INDEX IF NOT EXISTS "idx_descriptive_reports_academic_year" ON "public"."descriptive_reports"("academic_year", "period");

-- RLS Policies
ALTER TABLE "public"."evaluation_configs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."grades" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."descriptive_reports" ENABLE ROW LEVEL SECURITY;

-- Políticas para evaluation_configs
CREATE POLICY "Users can view evaluation configs in their tenant"
    ON "public"."evaluation_configs" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "evaluation_configs"."tenant_id"
        )
    );

CREATE POLICY "Users can create evaluation configs in their tenant"
    ON "public"."evaluation_configs" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "evaluation_configs"."tenant_id"
        )
    );

CREATE POLICY "Users can update evaluation configs in their tenant"
    ON "public"."evaluation_configs" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "evaluation_configs"."tenant_id"
        )
    );

-- Políticas para grades
CREATE POLICY "Users can view grades in their tenant"
    ON "public"."grades" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            JOIN "public"."students" s ON s.tenant_id = ut.tenant_id
            WHERE ut.user_id = auth.uid() AND s.id = "grades"."student_id"
        )
    );

CREATE POLICY "Users can create grades in their tenant"
    ON "public"."grades" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            JOIN "public"."students" s ON s.tenant_id = ut.tenant_id
            WHERE ut.user_id = auth.uid() AND s.id = "grades"."student_id"
        )
    );

CREATE POLICY "Users can update grades in their tenant"
    ON "public"."grades" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            JOIN "public"."students" s ON s.tenant_id = ut.tenant_id
            WHERE ut.user_id = auth.uid() AND s.id = "grades"."student_id"
        )
    );

-- Políticas para attendance
CREATE POLICY "Users can view attendance in their tenant"
    ON "public"."attendance" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            JOIN "public"."students" s ON s.tenant_id = ut.tenant_id
            WHERE ut.user_id = auth.uid() AND s.id = "attendance"."student_id"
        )
    );

CREATE POLICY "Users can create attendance in their tenant"
    ON "public"."attendance" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            JOIN "public"."students" s ON s.tenant_id = ut.tenant_id
            WHERE ut.user_id = auth.uid() AND s.id = "attendance"."student_id"
        )
    );

CREATE POLICY "Users can update attendance in their tenant"
    ON "public"."attendance" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            JOIN "public"."students" s ON s.tenant_id = ut.tenant_id
            WHERE ut.user_id = auth.uid() AND s.id = "attendance"."student_id"
        )
    );

-- Políticas para descriptive_reports
CREATE POLICY "Users can view descriptive reports in their tenant"
    ON "public"."descriptive_reports" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            JOIN "public"."students" s ON s.tenant_id = ut.tenant_id
            WHERE ut.user_id = auth.uid() AND s.id = "descriptive_reports"."student_id"
        )
    );

CREATE POLICY "Users can create descriptive reports in their tenant"
    ON "public"."descriptive_reports" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            JOIN "public"."students" s ON s.tenant_id = ut.tenant_id
            WHERE ut.user_id = auth.uid() AND s.id = "descriptive_reports"."student_id"
        )
    );

CREATE POLICY "Users can update descriptive reports in their tenant"
    ON "public"."descriptive_reports" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            JOIN "public"."students" s ON s.tenant_id = ut.tenant_id
            WHERE ut.user_id = auth.uid() AND s.id = "descriptive_reports"."student_id"
        )
    );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_evaluation_configs_updated_at BEFORE UPDATE ON "public"."evaluation_configs"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON "public"."grades"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON "public"."attendance"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_descriptive_reports_updated_at BEFORE UPDATE ON "public"."descriptive_reports"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

