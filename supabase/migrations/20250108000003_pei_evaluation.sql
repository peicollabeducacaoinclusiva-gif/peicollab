-- ============================================================================
-- MIGRAÇÃO: Avaliação de PEI por Ciclos
-- ============================================================================
-- Sistema de avaliação periódica dos PEIs com acompanhamento de metas
-- Data: 2025-01-08
-- ============================================================================

-- ============================================================================
-- TABELA: pei_evaluations
-- ============================================================================
-- Avaliações periódicas dos PEIs por ciclos
CREATE TABLE IF NOT EXISTS "public"."pei_evaluations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    
    -- Informações do Ciclo
    "cycle_number" integer NOT NULL CHECK ("cycle_number" BETWEEN 1 AND 3),
    "cycle_name" text NOT NULL, -- 'I Ciclo', 'II Ciclo', 'III Ciclo'
    "academic_year" text, -- '2025', '2025/1', etc.
    
    -- Agendamento
    "scheduled_date" date NOT NULL,
    "completed_at" timestamptz,
    "is_completed" boolean DEFAULT false,
    
    -- Alcance das Metas (JSON com detalhes de cada meta)
    "goals_achievement" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"goal_id": "uuid", "goal_title": "string", "status": "achieved|partial|not_achieved", "notes": "text", "percentage": number}]
    
    -- Análise Geral
    "modifications_needed" text,
    "overall_notes" text,
    "next_steps" text,
    "strengths" text,
    "challenges" text,
    "recommendations" text,
    
    -- Responsáveis
    "evaluated_by" uuid REFERENCES "auth"."users"("id"),
    "coordinator_review" text,
    "coordinator_reviewed_by" uuid REFERENCES "auth"."users"("id"),
    "coordinator_reviewed_at" timestamptz,
    
    -- Participantes da avaliação
    "participants" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"user_id": "uuid", "role": "string", "name": "string"}]
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraint: um ciclo por PEI por período
    CONSTRAINT "unique_cycle_per_pei" UNIQUE ("pei_id", "cycle_number", "academic_year")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_pei_evaluations_pei" ON "public"."pei_evaluations"("pei_id");
CREATE INDEX IF NOT EXISTS "idx_pei_evaluations_cycle" ON "public"."pei_evaluations"("cycle_number");
CREATE INDEX IF NOT EXISTS "idx_pei_evaluations_scheduled" ON "public"."pei_evaluations"("scheduled_date");
CREATE INDEX IF NOT EXISTS "idx_pei_evaluations_completed" ON "public"."pei_evaluations"("is_completed");
CREATE INDEX IF NOT EXISTS "idx_pei_evaluations_evaluator" ON "public"."pei_evaluations"("evaluated_by");

-- ============================================================================
-- TABELA: evaluation_schedules
-- ============================================================================
-- Configuração de ciclos de avaliação por escola/rede
CREATE TABLE IF NOT EXISTS "public"."evaluation_schedules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    
    -- Configuração do Ciclo
    "cycle_number" integer NOT NULL CHECK ("cycle_number" BETWEEN 1 AND 3),
    "cycle_name" text NOT NULL,
    "academic_year" text NOT NULL,
    
    -- Datas
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "evaluation_deadline" date NOT NULL,
    
    -- Status
    "is_active" boolean DEFAULT true,
    
    -- Configurações
    "auto_schedule" boolean DEFAULT true, -- Se deve agendar automaticamente avaliações para PEIs novos
    "notification_days_before" integer DEFAULT 7, -- Dias antes para notificar
    
    -- Metadados
    "created_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraint: uma configuração de ciclo por escola/rede por ano
    CONSTRAINT "unique_schedule_per_cycle" UNIQUE ("tenant_id", "school_id", "cycle_number", "academic_year")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_evaluation_schedules_tenant" ON "public"."evaluation_schedules"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_evaluation_schedules_school" ON "public"."evaluation_schedules"("school_id");
CREATE INDEX IF NOT EXISTS "idx_evaluation_schedules_active" ON "public"."evaluation_schedules"("is_active");
CREATE INDEX IF NOT EXISTS "idx_evaluation_schedules_year" ON "public"."evaluation_schedules"("academic_year");

-- ============================================================================
-- RLS POLICIES: pei_evaluations
-- ============================================================================

ALTER TABLE "public"."pei_evaluations" ENABLE ROW LEVEL SECURITY;

-- Professores podem gerenciar avaliações dos seus PEIs
CREATE POLICY "teachers_manage_own_pei_evaluations"
    ON "public"."pei_evaluations"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."peis" p
            WHERE p.id = "pei_evaluations"."pei_id"
            AND (
                p.assigned_teacher_id = auth.uid()
                OR p.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM "public"."pei_teachers" pt
                    WHERE pt.pei_id = p.id
                    AND pt.teacher_id = auth.uid()
                )
            )
        )
    );

-- Coordenadores podem ver e revisar todas as avaliações da rede
CREATE POLICY "coordinators_manage_evaluations"
    ON "public"."pei_evaluations"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."peis" p
            JOIN "public"."students" s ON s.id = p.student_id
            JOIN "public"."profiles" prof ON prof.tenant_id = s.tenant_id
            WHERE p.id = "pei_evaluations"."pei_id"
            AND prof.id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM "public"."user_roles" ur
                WHERE ur.user_id = auth.uid()
                AND ur.role = 'coordinator'
            )
        )
    );

-- Diretores podem ver avaliações da sua escola
CREATE POLICY "directors_view_school_evaluations"
    ON "public"."pei_evaluations"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."peis" p
            JOIN "public"."students" s ON s.id = p.student_id
            JOIN "public"."profiles" prof ON prof.school_id = s.school_id
            WHERE p.id = "pei_evaluations"."pei_id"
            AND prof.id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM "public"."user_roles" ur
                WHERE ur.user_id = auth.uid()
                AND ur.role IN ('school_manager', 'education_secretary')
            )
        )
    );

-- ============================================================================
-- RLS POLICIES: evaluation_schedules
-- ============================================================================

ALTER TABLE "public"."evaluation_schedules" ENABLE ROW LEVEL SECURITY;

-- Coordenadores podem gerenciar cronogramas da rede
CREATE POLICY "coordinators_manage_schedules"
    ON "public"."evaluation_schedules"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."profiles" p
            WHERE p.id = auth.uid()
            AND p.tenant_id = "evaluation_schedules"."tenant_id"
            AND EXISTS (
                SELECT 1 FROM "public"."user_roles" ur
                WHERE ur.user_id = auth.uid()
                AND ur.role = 'coordinator'
            )
        )
    );

-- Diretores podem gerenciar cronogramas da sua escola
CREATE POLICY "directors_manage_school_schedules"
    ON "public"."evaluation_schedules"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."profiles" p
            WHERE p.id = auth.uid()
            AND p.school_id = "evaluation_schedules"."school_id"
            AND EXISTS (
                SELECT 1 FROM "public"."user_roles" ur
                WHERE ur.user_id = auth.uid()
                AND ur.role IN ('school_manager', 'education_secretary')
            )
        )
    );

-- Todos podem ver os cronogramas (leitura)
CREATE POLICY "all_view_schedules"
    ON "public"."evaluation_schedules"
    FOR SELECT
    USING (true);

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_pei_evaluations_updated_at ON "public"."pei_evaluations";
CREATE TRIGGER update_pei_evaluations_updated_at
    BEFORE UPDATE ON "public"."pei_evaluations"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluation_schedules_updated_at ON "public"."evaluation_schedules";
CREATE TRIGGER update_evaluation_schedules_updated_at
    BEFORE UPDATE ON "public"."evaluation_schedules"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para criar avaliações automaticamente quando um novo PEI é criado
CREATE OR REPLACE FUNCTION auto_create_pei_evaluations()
RETURNS TRIGGER AS $$
DECLARE
    schedule_record RECORD;
    current_year text;
BEGIN
    -- Obter ano acadêmico atual
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- Para cada ciclo configurado, criar uma avaliação
    FOR schedule_record IN
        SELECT *
        FROM "public"."evaluation_schedules"
        WHERE (tenant_id = NEW.tenant_id OR school_id = NEW.school_id)
        AND academic_year = current_year
        AND is_active = true
        AND auto_schedule = true
    LOOP
        INSERT INTO "public"."pei_evaluations" (
            pei_id,
            cycle_number,
            cycle_name,
            academic_year,
            scheduled_date
        ) VALUES (
            NEW.id,
            schedule_record.cycle_number,
            schedule_record.cycle_name,
            schedule_record.academic_year,
            schedule_record.evaluation_deadline
        )
        ON CONFLICT (pei_id, cycle_number, academic_year) DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar avaliações automaticamente
DROP TRIGGER IF EXISTS trigger_auto_create_evaluations ON "public"."peis";
CREATE TRIGGER trigger_auto_create_evaluations
    AFTER INSERT ON "public"."peis"
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_pei_evaluations();

-- Função para obter estatísticas de avaliações
CREATE OR REPLACE FUNCTION get_evaluation_statistics(
    p_pei_id uuid DEFAULT NULL,
    p_school_id uuid DEFAULT NULL,
    p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
    total_evaluations bigint,
    completed_evaluations bigint,
    pending_evaluations bigint,
    overdue_evaluations bigint,
    average_goals_achieved numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::bigint AS total_evaluations,
        COUNT(*) FILTER (WHERE is_completed = true)::bigint AS completed_evaluations,
        COUNT(*) FILTER (WHERE is_completed = false AND scheduled_date >= CURRENT_DATE)::bigint AS pending_evaluations,
        COUNT(*) FILTER (WHERE is_completed = false AND scheduled_date < CURRENT_DATE)::bigint AS overdue_evaluations,
        AVG(
            (
                SELECT AVG((item->>'percentage')::numeric)
                FROM jsonb_array_elements(goals_achievement) AS item
                WHERE item->>'status' = 'achieved'
            )
        ) AS average_goals_achieved
    FROM "public"."pei_evaluations" e
    JOIN "public"."peis" p ON p.id = e.pei_id
    JOIN "public"."students" s ON s.id = p.student_id
    WHERE (p_pei_id IS NULL OR e.pei_id = p_pei_id)
    AND (p_school_id IS NULL OR s.school_id = p_school_id)
    AND (p_tenant_id IS NULL OR s.tenant_id = p_tenant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."pei_evaluations" IS 'Avaliações periódicas dos PEIs por ciclos acadêmicos';
COMMENT ON TABLE "public"."evaluation_schedules" IS 'Configuração de cronogramas de avaliação por escola/rede';

COMMENT ON COLUMN "public"."pei_evaluations"."goals_achievement" IS 'Detalhamento do alcance de cada meta em formato JSON';
COMMENT ON COLUMN "public"."pei_evaluations"."cycle_number" IS '1 = I Ciclo, 2 = II Ciclo, 3 = III Ciclo';































