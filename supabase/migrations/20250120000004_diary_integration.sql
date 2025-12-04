-- Integração do Diário Escolar com Sistema de Avaliações
-- Adiciona relacionamentos entre class_diary, attendance e grades

-- Criar tabela de frequência diária (detalhada por dia)
CREATE TABLE IF NOT EXISTS "public"."daily_attendance" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "diary_entry_id" uuid REFERENCES "public"."class_diary"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "enrollment_id" uuid REFERENCES "public"."student_enrollments"("id") ON DELETE CASCADE,
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "subject_id" uuid REFERENCES "public"."subjects"("id") ON DELETE SET NULL,
    "academic_year" integer NOT NULL,
    "date" date NOT NULL,
    "is_present" boolean NOT NULL DEFAULT true,
    "justification" text,
    "recorded_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("student_id", "class_id", "subject_id", "date", "diary_entry_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_daily_attendance_diary_entry" ON "public"."daily_attendance"("diary_entry_id");
CREATE INDEX IF NOT EXISTS "idx_daily_attendance_student" ON "public"."daily_attendance"("student_id");
CREATE INDEX IF NOT EXISTS "idx_daily_attendance_date" ON "public"."daily_attendance"("date");
CREATE INDEX IF NOT EXISTS "idx_daily_attendance_class" ON "public"."daily_attendance"("class_id", "date");

-- RLS Policies
ALTER TABLE "public"."daily_attendance" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view daily attendance in their tenant"
    ON "public"."daily_attendance" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "daily_attendance"."tenant_id"
        )
    );

CREATE POLICY "Users can create daily attendance in their tenant"
    ON "public"."daily_attendance" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "daily_attendance"."tenant_id"
        )
    );

CREATE POLICY "Users can update daily attendance in their tenant"
    ON "public"."daily_attendance" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "daily_attendance"."tenant_id"
        )
    );

-- Trigger para updated_at
CREATE TRIGGER update_daily_attendance_updated_at BEFORE UPDATE ON "public"."daily_attendance"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Adicionar campo diary_entry_id na tabela attendance (para referência)
ALTER TABLE "public"."attendance"
  ADD COLUMN IF NOT EXISTS "diary_entry_id" uuid REFERENCES "public"."class_diary"("id") ON DELETE SET NULL;

-- Adicionar campo diary_entry_id na tabela grades
ALTER TABLE "public"."grades"
  ADD COLUMN IF NOT EXISTS "diary_entry_id" uuid REFERENCES "public"."class_diary"("id") ON DELETE SET NULL;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS "idx_attendance_diary_entry" ON "public"."attendance"("diary_entry_id");
CREATE INDEX IF NOT EXISTS "idx_grades_diary_entry" ON "public"."grades"("diary_entry_id");

-- Adicionar campo diary_entry_id na tabela descriptive_reports
ALTER TABLE "public"."descriptive_reports"
  ADD COLUMN IF NOT EXISTS "diary_entry_id" uuid REFERENCES "public"."class_diary"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_descriptive_reports_diary_entry" ON "public"."descriptive_reports"("diary_entry_id");

-- Adicionar campos na tabela grades para integração
ALTER TABLE "public"."grades"
  ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "class_id" uuid REFERENCES "public"."classes"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "diary_entry_id" uuid REFERENCES "public"."class_diary"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_grades_diary_entry" ON "public"."grades"("diary_entry_id");
CREATE INDEX IF NOT EXISTS "idx_grades_tenant" ON "public"."grades"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_grades_class" ON "public"."grades"("class_id");

-- View consolidada: Diário + Frequência + Notas
CREATE OR REPLACE VIEW "public"."diary_consolidated_view" AS
SELECT 
  cd.id as diary_id,
  cd.class_id,
  cd.subject_id,
  cd.teacher_id,
  cd.academic_year,
  cd.date,
  cd.lesson_number,
  cd.lesson_topic,
  cd.content_taught,
  cd.activities,
  cd.homework_assigned,
  cd.observations,
  COUNT(DISTINCT att.id) as attendance_records_count,
  COUNT(DISTINCT gr.id) as grades_records_count,
  COUNT(DISTINCT dr.id) as reports_records_count
FROM "public"."class_diary" cd
LEFT JOIN "public"."attendance" att ON att.diary_entry_id = cd.id
LEFT JOIN "public"."grades" gr ON gr.diary_entry_id = cd.id
LEFT JOIN "public"."descriptive_reports" dr ON dr.diary_entry_id = cd.id
GROUP BY cd.id, cd.class_id, cd.subject_id, cd.teacher_id, cd.academic_year, 
         cd.date, cd.lesson_number, cd.lesson_topic, cd.content_taught, 
         cd.activities, cd.homework_assigned, cd.observations;

COMMENT ON VIEW "public"."diary_consolidated_view" IS 
  'View consolidada que mostra registros do diário com contadores de frequência, notas e pareceres relacionados';

-- RPC para buscar diário com dados consolidados
CREATE OR REPLACE FUNCTION "public"."get_diary_entry_consolidated"(
  p_diary_id uuid
)
RETURNS TABLE (
  diary_entry jsonb,
  attendance_records jsonb,
  grade_records jsonb,
  report_records jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    row_to_json(cd.*)::jsonb as diary_entry,
    COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', att.id,
        'student_id', att.student_id,
        'date', att.date,
        'is_present', att.is_present,
        'justification', att.justification
      )) FILTER (WHERE att.id IS NOT NULL),
      '[]'::jsonb
    ) as attendance_records,
    COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', gr.id,
        'student_id', gr.student_id,
        'grade_value', gr.grade_value,
        'concept', gr.concept,
        'period', gr.period
      )) FILTER (WHERE gr.id IS NOT NULL),
      '[]'::jsonb
    ) as grade_records,
    COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', dr.id,
        'student_id', dr.student_id,
        'period', dr.period,
        'report_content', dr.report_content
      )) FILTER (WHERE dr.id IS NOT NULL),
      '[]'::jsonb
    ) as report_records
  FROM "public"."class_diary" cd
  LEFT JOIN "public"."attendance" att ON att.diary_entry_id = cd.id
  LEFT JOIN "public"."grades" gr ON gr.diary_entry_id = cd.id
  LEFT JOIN "public"."descriptive_reports" dr ON dr.diary_entry_id = cd.id
  WHERE cd.id = p_diary_id
  GROUP BY cd.id;
END;
$$;

COMMENT ON FUNCTION "public"."get_diary_entry_consolidated" IS 
  'Retorna um registro do diário com todos os dados relacionados (frequência, notas, pareceres)';

