-- ============================================================================
-- MIGRAÇÃO: Materiais de Acessibilidade - Plano de AEE
-- ============================================================================
-- Sistema de registro de produção de materiais de acessibilidade
-- Nota: A biblioteca de materiais adaptados fica no app responsável (Gestão Escolar ou app específico)
-- Este módulo apenas registra sessões de produção e uso de materiais no contexto do AEE
-- Data: 2025-02-20
-- ============================================================================

-- ============================================================================
-- TABELA: aee_material_production_sessions
-- ============================================================================
-- Sessões de produção de materiais de acessibilidade pelo professor AEE
CREATE TABLE IF NOT EXISTS "public"."aee_material_production_sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "student_id" uuid REFERENCES "public"."students"("id") ON DELETE SET NULL,
    "created_by" uuid NOT NULL REFERENCES "auth"."users"("id"),
    
    -- Identificação do material (pode estar em biblioteca externa)
    "material_name" text NOT NULL,
    "material_type" text NOT NULL CHECK ("material_type" IN ('visual', 'tactile', 'audio', 'digital', 'adaptation', 'other')),
    "material_reference_id" uuid, -- ID do material na biblioteca externa (se existir)
    "material_reference_url" text, -- URL do material na biblioteca externa
    
    -- Descrição
    "description" text,
    "purpose" text NOT NULL,
    "target_disability" jsonb DEFAULT '[]'::jsonb,
    -- Formato: ["TEA", "Deficiência Visual", "TDAH", etc.]
    
    -- Sessão de produção
    "session_date" date NOT NULL,
    "duration_minutes" integer NOT NULL,
    "production_steps" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"step": "string", "description": "string", "duration_minutes": "integer"}]
    
    -- Recursos usados
    "resources_used" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"resource": "string", "quantity": "integer", "unit": "string", "cost": "numeric"}]
    
    -- Custos e tempo
    "cost_estimate" numeric(10, 2),
    "time_spent_minutes" integer,
    "materials_cost" numeric(10, 2),
    
    -- Arquivo do material (se produzido localmente)
    "file_url" text, -- URL no Supabase Storage
    "file_type" text,
    "file_size" integer,
    
    -- Status e notas
    "notes" text,
    "status" text DEFAULT 'in_progress' CHECK ("status" IN ('planned', 'in_progress', 'completed', 'cancelled')),
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_material_production_plan" ON "public"."aee_material_production_sessions"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_aee_material_production_student" ON "public"."aee_material_production_sessions"("student_id");
CREATE INDEX IF NOT EXISTS "idx_aee_material_production_created_by" ON "public"."aee_material_production_sessions"("created_by");
CREATE INDEX IF NOT EXISTS "idx_aee_material_production_date" ON "public"."aee_material_production_sessions"("session_date");
CREATE INDEX IF NOT EXISTS "idx_aee_material_production_type" ON "public"."aee_material_production_sessions"("material_type");
CREATE INDEX IF NOT EXISTS "idx_aee_material_production_status" ON "public"."aee_material_production_sessions"("status");

-- ============================================================================
-- TABELA: aee_materials_usage_log
-- ============================================================================
-- Registro de uso de materiais de acessibilidade em atendimentos AEE
-- Materiais podem vir da biblioteca externa ou serem produzidos localmente
CREATE TABLE IF NOT EXISTS "public"."aee_materials_usage_log" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "attendance_id" uuid, -- Referência a registros de atendimento (tabela futura ou externa)
    "co_teaching_session_id" uuid REFERENCES "public"."aee_co_teaching_sessions"("id") ON DELETE SET NULL,
    "production_session_id" uuid REFERENCES "public"."aee_material_production_sessions"("id") ON DELETE SET NULL,
    
    -- Referência ao material (pode estar em biblioteca externa)
    "material_name" text NOT NULL,
    "material_type" text,
    "material_reference_id" uuid, -- ID do material na biblioteca externa
    "material_reference_url" text, -- URL do material na biblioteca externa
    
    -- Uso do material
    "used_date" date NOT NULL,
    "used_by" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "context" text, -- 'individual_aee', 'group_aee', 'co_teaching', 'material_production'
    "how_used" text, -- Como o material foi utilizado
    "duration_minutes" integer, -- Tempo de uso
    
    -- Feedback e eficácia
    "effectiveness_feedback" text,
    "effectiveness_rating" integer CHECK ("effectiveness_rating" >= 1 AND "effectiveness_rating" <= 5),
    "student_response" text, -- Como o aluno respondeu ao material
    "student_engagement" text CHECK ("student_engagement" IN ('low', 'medium', 'high')),
    "learning_outcomes" text,
    "improvements_suggested" text,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_materials_usage_plan" ON "public"."aee_materials_usage_log"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_aee_materials_usage_student" ON "public"."aee_materials_usage_log"("student_id");
CREATE INDEX IF NOT EXISTS "idx_aee_materials_usage_attendance" ON "public"."aee_materials_usage_log"("attendance_id");
CREATE INDEX IF NOT EXISTS "idx_aee_materials_usage_co_teaching" ON "public"."aee_materials_usage_log"("co_teaching_session_id");
CREATE INDEX IF NOT EXISTS "idx_aee_materials_usage_date" ON "public"."aee_materials_usage_log"("used_date");
CREATE INDEX IF NOT EXISTS "idx_aee_materials_usage_material_ref" ON "public"."aee_materials_usage_log"("material_reference_id");

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_aee_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_aee_material_production_updated_at ON "public"."aee_material_production_sessions";
CREATE TRIGGER update_aee_material_production_updated_at
    BEFORE UPDATE ON "public"."aee_material_production_sessions"
    FOR EACH ROW
    EXECUTE FUNCTION update_aee_materials_updated_at();

DROP TRIGGER IF EXISTS update_aee_materials_usage_updated_at ON "public"."aee_materials_usage_log";
CREATE TRIGGER update_aee_materials_usage_updated_at
    BEFORE UPDATE ON "public"."aee_materials_usage_log"
    FOR EACH ROW
    EXECUTE FUNCTION update_aee_materials_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."aee_material_production_sessions" ENABLE ROW LEVEL SECURITY;

-- Professores AEE podem ver suas sessões de produção
CREATE POLICY "aee_teachers_view_production_sessions"
    ON "public"."aee_material_production_sessions"
    FOR SELECT
    USING (
        "created_by" = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_material_production_sessions"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role IN ('coordinator', 'school_director', 'school_manager')
            AND (
                p.school_id IN (
                    SELECT school_id FROM "public"."plano_aee" WHERE id = "aee_material_production_sessions"."plan_id"
                )
                OR p.tenant_id IN (
                    SELECT tenant_id FROM "public"."plano_aee" WHERE id = "aee_material_production_sessions"."plan_id"
                )
            )
        )
    );

-- Professores AEE podem criar sessões de produção
CREATE POLICY "aee_teachers_create_production_sessions"
    ON "public"."aee_material_production_sessions"
    FOR INSERT
    WITH CHECK (
        "created_by" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role = 'aee_teacher'
        )
        AND EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_material_production_sessions"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
    );

-- Professores AEE podem atualizar suas próprias sessões
CREATE POLICY "aee_teachers_update_production_sessions"
    ON "public"."aee_material_production_sessions"
    FOR UPDATE
    USING ("created_by" = auth.uid())
    WITH CHECK ("created_by" = auth.uid());

ALTER TABLE "public"."aee_materials_usage_log" ENABLE ROW LEVEL SECURITY;

-- Professores AEE podem ver logs de uso de materiais
CREATE POLICY "aee_teachers_view_usage_log"
    ON "public"."aee_materials_usage_log"
    FOR SELECT
    USING (
        "used_by" = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_materials_usage_log"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role IN ('coordinator', 'school_director', 'school_manager')
            AND (
                p.school_id IN (
                    SELECT school_id FROM "public"."plano_aee" WHERE id = "aee_materials_usage_log"."plan_id"
                )
                OR p.tenant_id IN (
                    SELECT tenant_id FROM "public"."plano_aee" WHERE id = "aee_materials_usage_log"."plan_id"
                )
            )
        )
    );

-- Professores AEE podem criar logs de uso
CREATE POLICY "aee_teachers_create_usage_log"
    ON "public"."aee_materials_usage_log"
    FOR INSERT
    WITH CHECK (
        "used_by" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role = 'aee_teacher'
        )
        AND EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_materials_usage_log"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
    );

-- Professores AEE podem atualizar seus próprios logs
CREATE POLICY "aee_teachers_update_usage_log"
    ON "public"."aee_materials_usage_log"
    FOR UPDATE
    USING ("used_by" = auth.uid())
    WITH CHECK ("used_by" = auth.uid());

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."aee_material_production_sessions" IS 'Sessões de produção de materiais de acessibilidade pelo professor AEE';
COMMENT ON TABLE "public"."aee_materials_usage_log" IS 'Registro de uso de materiais de acessibilidade em atendimentos AEE';

COMMENT ON COLUMN "public"."aee_material_production_sessions"."material_reference_id" IS 'ID do material na biblioteca externa (se existir)';
COMMENT ON COLUMN "public"."aee_material_production_sessions"."material_reference_url" IS 'URL do material na biblioteca externa';
COMMENT ON COLUMN "public"."aee_materials_usage_log"."material_reference_id" IS 'ID do material na biblioteca externa (se existir)';
COMMENT ON COLUMN "public"."aee_materials_usage_log"."material_reference_url" IS 'URL do material na biblioteca externa';
COMMENT ON COLUMN "public"."aee_materials_usage_log"."context" IS 'Contexto de uso: individual_aee, group_aee, co_teaching, material_production';

