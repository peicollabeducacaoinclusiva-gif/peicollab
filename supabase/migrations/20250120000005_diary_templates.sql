-- Sistema de Templates para Diário Escolar
-- Templates personalizáveis para registro de aula, pareceres e boletins

CREATE TABLE IF NOT EXISTS "public"."diary_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "template_type" text NOT NULL CHECK ("template_type" IN ('diary_entry', 'descriptive_report', 'report_card')),
    "template_name" text NOT NULL,
    "template_content" text NOT NULL, -- HTML ou Markdown
    "template_fields" jsonb DEFAULT '{}'::jsonb, -- Campos dinâmicos do template
    "is_default" boolean NOT NULL DEFAULT false,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_diary_templates_tenant" ON "public"."diary_templates"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_diary_templates_school" ON "public"."diary_templates"("school_id");
CREATE INDEX IF NOT EXISTS "idx_diary_templates_type" ON "public"."diary_templates"("template_type");
CREATE INDEX IF NOT EXISTS "idx_diary_templates_default" ON "public"."diary_templates"("tenant_id", "template_type", "is_default") WHERE "is_default" = true;

-- RLS Policies
ALTER TABLE "public"."diary_templates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates in their tenant"
    ON "public"."diary_templates" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "diary_templates"."tenant_id"
        )
    );

CREATE POLICY "Users can create templates in their tenant"
    ON "public"."diary_templates" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "diary_templates"."tenant_id"
        )
    );

CREATE POLICY "Users can update templates in their tenant"
    ON "public"."diary_templates" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "diary_templates"."tenant_id"
        )
    );

CREATE POLICY "Users can delete templates in their tenant"
    ON "public"."diary_templates" FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_tenants" ut
            WHERE ut.user_id = auth.uid() AND ut.tenant_id = "diary_templates"."tenant_id"
        )
    );

-- Trigger para updated_at
CREATE TRIGGER update_diary_templates_updated_at BEFORE UPDATE ON "public"."diary_templates"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Templates padrão (exemplos)
INSERT INTO "public"."diary_templates" (
    "tenant_id",
    "template_type",
    "template_name",
    "template_content",
    "is_default",
    "is_active"
) VALUES
-- Template padrão para registro de aula
(
    (SELECT id FROM tenants LIMIT 1),
    'diary_entry',
    'Template Padrão - Registro de Aula',
    '**Data:** {{date}}\n**Tema da Aula:** {{lesson_topic}}\n\n**Conteúdo Ministrado:**\n{{content_taught}}\n\n**Atividades Realizadas:**\n{{activities}}\n\n**Tarefas de Casa:**\n{{homework_assigned}}\n\n**Observações:**\n{{observations}}',
    true,
    true
),
-- Template padrão para parecer descritivo
(
    (SELECT id FROM tenants LIMIT 1),
    'descriptive_report',
    'Template Padrão - Parecer Descritivo',
    '**Aluno:** {{student_name}}\n**Período:** {{period}}º Bimestre\n**Ano Letivo:** {{academic_year}}\n\n**Parecer:**\n\n{{report_text}}\n\n**Data:** {{date}}',
    true,
    true
),
-- Template padrão para boletim
(
    (SELECT id FROM tenants LIMIT 1),
    'report_card',
    'Template Padrão - Boletim Escolar',
    '# BOLETIM ESCOLAR\n\n**Aluno:** {{student_name}}\n**Turma:** {{class_name}}\n**Ano Letivo:** {{academic_year}}\n**Período:** {{period}}º Bimestre\n\n## DESEMPENHO ACADÊMICO\n\n{{grades_table}}\n\n## FREQUÊNCIA\n\n{{attendance_summary}}\n\n## PARECERES\n\n{{reports}}',
    true,
    true
)
ON CONFLICT DO NOTHING;

