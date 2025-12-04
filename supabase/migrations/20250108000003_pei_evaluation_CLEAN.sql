-- ============================================================================
-- MIGRAÇÃO LIMPA: Avaliações Cíclicas do PEI
-- ============================================================================
-- Sistema completo de avaliações por ciclo (I, II, III)
-- Data: 2025-01-08
-- Versão: CLEAN - Sem blocos DO complexos
-- ⚠️ Execute LIMPAR_TOTAL_MIGRATION_3.sql ANTES deste arquivo
-- ============================================================================

-- ============================================================================
-- TABELA: pei_evaluations
-- ============================================================================

CREATE TABLE "public"."pei_evaluations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    
    -- Ciclo
    "cycle_number" integer NOT NULL,
    "cycle_name" text NOT NULL,
    "academic_year" text NOT NULL,
    
    -- Dados da Avaliação
    "evaluation_data" jsonb DEFAULT '{}'::jsonb,
    "goals_achieved" jsonb DEFAULT '[]'::jsonb,
    "goals_partially_achieved" jsonb DEFAULT '[]'::jsonb,
    "goals_not_achieved" jsonb DEFAULT '[]'::jsonb,
    "modifications_needed" text,
    "new_goals" jsonb DEFAULT '[]'::jsonb,
    "next_steps" text,
    "observations" text,
    
    -- Aspectos Específicos
    "academic_progress" text,
    "social_progress" text,
    "behavioral_progress" text,
    "autonomy_progress" text,
    
    -- Recomendações
    "teacher_recommendations" text,
    "coordinator_recommendations" text,
    "family_feedback" text,
    
    -- Responsáveis
    "evaluated_by" uuid REFERENCES "auth"."users"("id"),
    "evaluated_at" timestamptz,
    "reviewed_by" uuid REFERENCES "auth"."users"("id"),
    "reviewed_at" timestamptz,
    
    -- Status
    "status" text DEFAULT 'pending',
    "is_completed" boolean DEFAULT false,
    
    -- Agendamento
    "scheduled_date" date,
    "completion_date" date,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "pei_evaluations_cycle_check" CHECK (cycle_number BETWEEN 1 AND 3),
    CONSTRAINT "pei_evaluations_status_check" CHECK (status IN ('pending', 'in_progress', 'completed', 'reviewed')),
    CONSTRAINT "unique_pei_cycle_year" UNIQUE ("pei_id", "cycle_number", "academic_year")
);

-- Índices
CREATE INDEX "idx_pei_evaluations_pei" ON "public"."pei_evaluations"("pei_id");
CREATE INDEX "idx_pei_evaluations_cycle" ON "public"."pei_evaluations"("cycle_number");
CREATE INDEX "idx_pei_evaluations_year" ON "public"."pei_evaluations"("academic_year");
CREATE INDEX "idx_pei_evaluations_status" ON "public"."pei_evaluations"("status");
CREATE INDEX "idx_pei_evaluations_scheduled" ON "public"."pei_evaluations"("scheduled_date");

-- ============================================================================
-- TABELA: evaluation_schedules
-- ============================================================================

CREATE TABLE "public"."evaluation_schedules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuração do Ciclo
    "cycle_number" integer NOT NULL,
    "cycle_name" text NOT NULL,
    "academic_year" text NOT NULL,
    
    -- Período
    "start_date" date,
    "end_date" date,
    "evaluation_deadline" date,
    
    -- Escopo
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    
    -- Configurações
    "description" text,
    "notification_days_before" integer DEFAULT 7,
    "auto_schedule" boolean DEFAULT true,
    
    -- Status
    "is_active" boolean DEFAULT true,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id"),
    
    -- Constraints
    CONSTRAINT "evaluation_schedules_cycle_check" CHECK (cycle_number BETWEEN 1 AND 3)
);

-- Índices
CREATE INDEX "idx_evaluation_schedules_tenant" ON "public"."evaluation_schedules"("tenant_id");
CREATE INDEX "idx_evaluation_schedules_school" ON "public"."evaluation_schedules"("school_id");
CREATE INDEX "idx_evaluation_schedules_year" ON "public"."evaluation_schedules"("academic_year");
CREATE INDEX "idx_evaluation_schedules_active" ON "public"."evaluation_schedules"("is_active");

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
                p.created_by = auth.uid()
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
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'coordinator'
        )
    );

-- Diretores podem ver avaliações da sua escola
CREATE POLICY "directors_view_school_evaluations"
    ON "public"."pei_evaluations"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('school_manager', 'education_secretary')
        )
    );

-- ============================================================================
-- RLS POLICIES: evaluation_schedules
-- ============================================================================

ALTER TABLE "public"."evaluation_schedules" ENABLE ROW LEVEL SECURITY;

-- Coordenadores podem gerenciar cronogramas
CREATE POLICY "coordinators_manage_schedules"
    ON "public"."evaluation_schedules"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'coordinator'
        )
    );

-- Diretores podem gerenciar cronogramas da sua escola
CREATE POLICY "directors_manage_school_schedules"
    ON "public"."evaluation_schedules"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('school_manager', 'education_secretary')
        )
    );

-- Todos podem ver os cronogramas
CREATE POLICY "all_view_schedules"
    ON "public"."evaluation_schedules"
    FOR SELECT
    USING (true);

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================

CREATE TRIGGER update_pei_evaluations_updated_at
    BEFORE UPDATE ON "public"."pei_evaluations"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_schedules_updated_at
    BEFORE UPDATE ON "public"."evaluation_schedules"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para criar avaliações automaticamente
CREATE OR REPLACE FUNCTION auto_create_pei_evaluations()
RETURNS TRIGGER AS $$
DECLARE
    schedule_record RECORD;
    current_year text;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
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
CREATE TRIGGER trigger_auto_create_evaluations
    AFTER INSERT ON "public"."peis"
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_pei_evaluations();

-- Função para estatísticas
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
        AVG((evaluation_data->>'goals_achieved_percentage')::numeric) AS average_goals_achieved
    FROM "public"."pei_evaluations" pe
    JOIN "public"."peis" p ON p.id = pe.pei_id
    JOIN "public"."students" s ON s.id = p.student_id
    WHERE
        (p_pei_id IS NULL OR pe.pei_id = p_pei_id)
        AND (p_school_id IS NULL OR s.school_id = p_school_id)
        AND (p_tenant_id IS NULL OR s.tenant_id = p_tenant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DADOS INICIAIS: Cronograma 2025
-- ============================================================================

INSERT INTO "public"."evaluation_schedules" (
    cycle_number,
    cycle_name,
    academic_year,
    start_date,
    end_date,
    evaluation_deadline,
    tenant_id,
    description,
    auto_schedule
)
SELECT 
    cycle_num,
    cycle_nm,
    '2025',
    start_dt,
    end_dt,
    eval_deadline,
    t.id,
    description_text,
    true
FROM tenants t, (VALUES
    (1, 'I Ciclo', '2025-02-01'::date, '2025-04-30'::date, '2025-05-15'::date, 'Avaliação do primeiro ciclo - Início do ano letivo'),
    (2, 'II Ciclo', '2025-05-01'::date, '2025-08-31'::date, '2025-09-15'::date, 'Avaliação do segundo ciclo - Meio do ano letivo'),
    (3, 'III Ciclo', '2025-09-01'::date, '2025-12-20'::date, '2025-12-31'::date, 'Avaliação do terceiro ciclo - Final do ano letivo')
) AS cycles(cycle_num, cycle_nm, start_dt, end_dt, eval_deadline, description_text)
WHERE t.is_active = true;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."pei_evaluations" IS 'Avaliações cíclicas dos PEIs (I, II, III Ciclo)';
COMMENT ON TABLE "public"."evaluation_schedules" IS 'Cronograma e configuração dos ciclos de avaliação';

-- ============================================================================
-- CONFIRMAÇÃO
-- ============================================================================

SELECT '✅ Migração 3 aplicada com sucesso! (CLEAN VERSION)' AS status;

