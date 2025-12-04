-- ============================================================================
-- MIGRAÇÃO V2.0: Fundação do Sistema de Plano de AEE
-- ============================================================================
-- Adiciona 4 novas tabelas para funcionalidades avançadas da V2.0
-- Data: 2025-02-01
-- Versão: 2.0.0
-- ============================================================================

-- ============================================================================
-- 1. CENTROS/SALAS DE AEE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_centers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    
    -- Dados do Centro
    "center_name" text NOT NULL,
    "center_type" text DEFAULT 'sala_recursos', 
    -- 'sala_recursos', 'centro_especializado', 'itinerante'
    "address" text,
    "phone" text,
    
    -- Funcionamento
    "operating_hours" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"seg": "8:00-12:00", "ter": "8:00-12:00", "qua": "8:00-12:00"}
    "capacity" integer DEFAULT 10,
    
    -- Especialidades Atendidas
    "specializations" text[] DEFAULT ARRAY[]::text[],
    -- Exemplos: ['TEA', 'Baixa Visão', 'Deficiência Intelectual', 'Surdez', 'Deficiência Física']
    
    -- Status
    "is_active" boolean DEFAULT true,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_centers_school" ON "public"."aee_centers"("school_id");
CREATE INDEX IF NOT EXISTS "idx_aee_centers_tenant" ON "public"."aee_centers"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_aee_centers_active" ON "public"."aee_centers"("is_active");

-- Comentários
COMMENT ON TABLE "public"."aee_centers" IS 'Centros e Salas de Recurso de AEE';
COMMENT ON COLUMN "public"."aee_centers"."center_type" IS 'Tipo do centro: sala_recursos, centro_especializado ou itinerante';
COMMENT ON COLUMN "public"."aee_centers"."specializations" IS 'Array de especialidades atendidas no centro';

-- ============================================================================
-- 2. METAS DO PLANO (SMART Goals)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_plan_goals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    
    -- Meta SMART
    "goal_description" text NOT NULL,
    "goal_area" text DEFAULT 'geral',
    -- Áreas: 'percepcao', 'linguagem', 'motora', 'socio_emocional', 'autonomia', 'academica', 'geral'
    "is_measurable" boolean DEFAULT true,
    "target_date" date,
    
    -- Acompanhamento de Progresso
    "progress_status" text DEFAULT 'nao_iniciada',
    -- Status: 'nao_iniciada', 'em_andamento', 'alcancada', 'parcialmente_alcancada', 'ajustada', 'cancelada'
    "progress_percentage" integer DEFAULT 0 
        CHECK ("progress_percentage" >= 0 AND "progress_percentage" <= 100),
    
    -- Detalhes da Meta
    "activities" text,
    "materials_needed" text,
    "strategies" text,
    
    -- Critérios de Avaliação
    "success_criteria" text,
    "evaluation_notes" text,
    
    -- Prioridade
    "priority" text DEFAULT 'media',
    -- Prioridades: 'baixa', 'media', 'alta'
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "valid_goal_area" CHECK (
        "goal_area" IN ('percepcao', 'linguagem', 'motora', 'socio_emocional', 'autonomia', 'academica', 'geral')
    ),
    CONSTRAINT "valid_progress_status" CHECK (
        "progress_status" IN ('nao_iniciada', 'em_andamento', 'alcancada', 'parcialmente_alcancada', 'ajustada', 'cancelada')
    ),
    CONSTRAINT "valid_priority" CHECK (
        "priority" IN ('baixa', 'media', 'alta')
    )
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_plan_goals_plan" ON "public"."aee_plan_goals"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_aee_plan_goals_area" ON "public"."aee_plan_goals"("goal_area");
CREATE INDEX IF NOT EXISTS "idx_aee_plan_goals_status" ON "public"."aee_plan_goals"("progress_status");
CREATE INDEX IF NOT EXISTS "idx_aee_plan_goals_priority" ON "public"."aee_plan_goals"("priority");
CREATE INDEX IF NOT EXISTS "idx_aee_plan_goals_target_date" ON "public"."aee_plan_goals"("target_date");

-- Comentários
COMMENT ON TABLE "public"."aee_plan_goals" IS 'Metas SMART dos Planos de AEE';
COMMENT ON COLUMN "public"."aee_plan_goals"."goal_area" IS 'Área de desenvolvimento da meta';
COMMENT ON COLUMN "public"."aee_plan_goals"."progress_status" IS 'Status atual da meta';
COMMENT ON COLUMN "public"."aee_plan_goals"."progress_percentage" IS 'Porcentagem de progresso (0-100)';

-- ============================================================================
-- 3. REGISTRO DE ATENDIMENTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_attendance_records" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    
    -- Data e Hora
    "attendance_date" date NOT NULL,
    "attendance_time" time,
    "duration_minutes" integer DEFAULT 50,
    
    -- Presença
    "attendance_status" text NOT NULL,
    -- Status: 'presente', 'falta_justificada', 'falta_injustificada', 'remarcado'
    "absence_reason" text,
    
    -- Atividades Realizadas (apenas se presente)
    "activities_performed" text,
    "goals_worked" uuid[], -- Array de goal_ids
    "materials_used" text,
    
    -- Observações e Evolução
    "student_performance" text,
    "behavior_observations" text,
    "challenges_faced" text,
    "achievements" text,
    "observations" text,
    "next_steps" text,
    
    -- Evidências
    "attachments" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"nome": "atividade.pdf", "url": "storage-path", "tipo": "foto|video|documento"}]
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "valid_attendance_status" CHECK (
        "attendance_status" IN ('presente', 'falta_justificada', 'falta_injustificada', 'remarcado')
    ),
    CONSTRAINT "positive_duration" CHECK ("duration_minutes" > 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_attendance_plan" ON "public"."aee_attendance_records"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_student" ON "public"."aee_attendance_records"("student_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_teacher" ON "public"."aee_attendance_records"("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "public"."aee_attendance_records"("attendance_date");
CREATE INDEX IF NOT EXISTS "idx_attendance_status" ON "public"."aee_attendance_records"("attendance_status");

-- Comentários
COMMENT ON TABLE "public"."aee_attendance_records" IS 'Registro de Atendimentos com frequência e evolução';
COMMENT ON COLUMN "public"."aee_attendance_records"."goals_worked" IS 'Array de UUIDs das metas trabalhadas no atendimento';
COMMENT ON COLUMN "public"."aee_attendance_records"."attachments" IS 'Evidências (fotos, vídeos, documentos) do atendimento';

-- ============================================================================
-- 4. CICLOS DE AVALIAÇÃO
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_evaluation_cycles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    
    -- Identificação do Ciclo
    "cycle_number" integer NOT NULL CHECK ("cycle_number" BETWEEN 1 AND 3),
    "cycle_name" text,
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    
    -- Avaliação do Ciclo
    "achievements" text,
    "challenges" text,
    "goals_progress" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"goal_id": {"status": "alcancada", "percentage": 100, "observations": "..."}}
    
    -- Frequência no Ciclo
    "total_attendances_planned" integer,
    "total_attendances_actual" integer,
    "attendance_percentage" numeric(5,2),
    
    -- Ajustes Necessários
    "plan_adjustments" text,
    "new_strategies" text,
    "resource_needs" text,
    
    -- Encaminhamentos do Ciclo
    "referrals_made" jsonb DEFAULT '[]'::jsonb,
    
    -- Orientações para Próximo Ciclo
    "recommendations_next_cycle" text,
    
    -- Avaliação
    "evaluation_date" date,
    "evaluated_by" uuid REFERENCES "auth"."users"("id"),
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraint de unicidade
    UNIQUE("plan_id", "cycle_number")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_cycles_plan" ON "public"."aee_evaluation_cycles"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_cycles_number" ON "public"."aee_evaluation_cycles"("cycle_number");
CREATE INDEX IF NOT EXISTS "idx_cycles_dates" ON "public"."aee_evaluation_cycles"("start_date", "end_date");
CREATE INDEX IF NOT EXISTS "idx_cycles_evaluated" ON "public"."aee_evaluation_cycles"("evaluated_by");

-- Comentários
COMMENT ON TABLE "public"."aee_evaluation_cycles" IS 'Ciclos Avaliativos (I, II, III) dos Planos de AEE';
COMMENT ON COLUMN "public"."aee_evaluation_cycles"."cycle_number" IS 'Número do ciclo (1=I, 2=II, 3=III)';
COMMENT ON COLUMN "public"."aee_evaluation_cycles"."goals_progress" IS 'Progresso de cada meta no ciclo (JSONB com goal_id como chave)';

-- ============================================================================
-- EXTENSÃO DA TABELA plano_aee (Adicionar campos V2.0)
-- ============================================================================

-- Adicionar campos de estatísticas (calculados automaticamente)
DO $
BEGIN
    -- Adicionar colunas se não existirem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plano_aee' AND column_name = 'total_attendances'
    ) THEN
        ALTER TABLE "public"."plano_aee" 
        ADD COLUMN "total_attendances" integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plano_aee' AND column_name = 'attendance_percentage'
    ) THEN
        ALTER TABLE "public"."plano_aee" 
        ADD COLUMN "attendance_percentage" numeric(5,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plano_aee' AND column_name = 'goals_achieved'
    ) THEN
        ALTER TABLE "public"."plano_aee" 
        ADD COLUMN "goals_achieved" integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plano_aee' AND column_name = 'total_goals'
    ) THEN
        ALTER TABLE "public"."plano_aee" 
        ADD COLUMN "total_goals" integer DEFAULT 0;
    END IF;
END $;

-- Comentários das novas colunas
COMMENT ON COLUMN "public"."plano_aee"."total_attendances" IS 'Total de atendimentos registrados (calculado automaticamente)';
COMMENT ON COLUMN "public"."plano_aee"."attendance_percentage" IS 'Porcentagem de frequência (calculado automaticamente)';
COMMENT ON COLUMN "public"."plano_aee"."goals_achieved" IS 'Número de metas alcançadas (calculado automaticamente)';
COMMENT ON COLUMN "public"."plano_aee"."total_goals" IS 'Total de metas do plano (calculado automaticamente)';

-- ============================================================================
-- RLS POLICIES: aee_centers
-- ============================================================================

ALTER TABLE "public"."aee_centers" ENABLE ROW LEVEL SECURITY;

-- Usuários podem visualizar centros de sua escola/tenant
CREATE POLICY "users_view_aee_centers"
    ON "public"."aee_centers"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."profiles" p
            WHERE p.id = auth.uid()
            AND (p.school_id = "aee_centers"."school_id" 
                 OR p.tenant_id = "aee_centers"."tenant_id")
        )
    );

-- Coordenadores e gestores podem gerenciar centros
CREATE POLICY "coordinators_manage_aee_centers"
    ON "public"."aee_centers"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            JOIN "public"."profiles" p ON p.id = ur.user_id
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'school_director', 'education_secretary', 'superadmin')
            AND (p.school_id = "aee_centers"."school_id" 
                 OR p.tenant_id = "aee_centers"."tenant_id")
        )
    );

-- ============================================================================
-- RLS POLICIES: aee_plan_goals
-- ============================================================================

ALTER TABLE "public"."aee_plan_goals" ENABLE ROW LEVEL SECURITY;

-- Professores de AEE podem gerenciar metas de seus planos
CREATE POLICY "teachers_manage_plan_goals"
    ON "public"."aee_plan_goals"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_plan_goals"."plan_id"
            AND (pa.created_by = auth.uid() 
                 OR pa.assigned_aee_teacher_id = auth.uid())
        )
    );

-- Outros usuários podem visualizar metas dos planos que acessam
CREATE POLICY "others_view_plan_goals"
    ON "public"."aee_plan_goals"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            JOIN "public"."profiles" p ON p.id = auth.uid()
            WHERE pa.id = "aee_plan_goals"."plan_id"
            AND (p.school_id = pa.school_id OR p.tenant_id = pa.tenant_id)
        )
    );

-- ============================================================================
-- RLS POLICIES: aee_attendance_records
-- ============================================================================

ALTER TABLE "public"."aee_attendance_records" ENABLE ROW LEVEL SECURITY;

-- Professores podem gerenciar seus próprios registros de atendimento
CREATE POLICY "teachers_manage_attendance"
    ON "public"."aee_attendance_records"
    FOR ALL
    USING ("teacher_id" = auth.uid());

-- Outros usuários podem visualizar atendimentos dos planos que acessam
CREATE POLICY "others_view_attendance"
    ON "public"."aee_attendance_records"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            JOIN "public"."profiles" p ON p.id = auth.uid()
            WHERE pa.id = "aee_attendance_records"."plan_id"
            AND (p.school_id = pa.school_id OR p.tenant_id = pa.tenant_id)
        )
    );

-- ============================================================================
-- RLS POLICIES: aee_evaluation_cycles
-- ============================================================================

ALTER TABLE "public"."aee_evaluation_cycles" ENABLE ROW LEVEL SECURITY;

-- Professores de AEE podem gerenciar ciclos de seus planos
CREATE POLICY "teachers_manage_cycles"
    ON "public"."aee_evaluation_cycles"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_evaluation_cycles"."plan_id"
            AND (pa.created_by = auth.uid() 
                 OR pa.assigned_aee_teacher_id = auth.uid())
        )
    );

-- Outros usuários podem visualizar ciclos dos planos que acessam
CREATE POLICY "others_view_cycles"
    ON "public"."aee_evaluation_cycles"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_evaluation_cycles"."plan_id"
        )
    );

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================

-- Trigger para aee_centers
DROP TRIGGER IF EXISTS update_aee_centers_updated_at ON "public"."aee_centers";
CREATE TRIGGER update_aee_centers_updated_at
    BEFORE UPDATE ON "public"."aee_centers"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para aee_plan_goals
DROP TRIGGER IF EXISTS update_aee_plan_goals_updated_at ON "public"."aee_plan_goals";
CREATE TRIGGER update_aee_plan_goals_updated_at
    BEFORE UPDATE ON "public"."aee_plan_goals"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para aee_attendance_records
DROP TRIGGER IF EXISTS update_attendance_updated_at ON "public"."aee_attendance_records";
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON "public"."aee_attendance_records"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para aee_evaluation_cycles
DROP TRIGGER IF EXISTS update_cycles_updated_at ON "public"."aee_evaluation_cycles";
CREATE TRIGGER update_cycles_updated_at
    BEFORE UPDATE ON "public"."aee_evaluation_cycles"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÃO: Criar Ciclos Automaticamente ao Criar Plano
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_evaluation_cycles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    v_cycle_duration interval := INTERVAL '3 months';
    v_cycle_count integer := 3;
    v_cycle_number integer;
    v_cycle_names text[] := ARRAY['I Ciclo', 'II Ciclo', 'III Ciclo'];
    v_start_date date;
BEGIN
    -- Usar start_date do plano ou data atual
    v_start_date := COALESCE(NEW.start_date, CURRENT_DATE);
    
    -- Criar 3 ciclos automaticamente
    FOR v_cycle_number IN 1..v_cycle_count LOOP
        INSERT INTO "public"."aee_evaluation_cycles" (
            "plan_id",
            "cycle_number",
            "cycle_name",
            "start_date",
            "end_date"
        )
        VALUES (
            NEW.id,
            v_cycle_number,
            v_cycle_names[v_cycle_number],
            v_start_date + ((v_cycle_number - 1) * v_cycle_duration),
            v_start_date + (v_cycle_number * v_cycle_duration) - INTERVAL '1 day'
        )
        ON CONFLICT (plan_id, cycle_number) DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_auto_create_cycles ON "public"."plano_aee";
CREATE TRIGGER trigger_auto_create_cycles
    AFTER INSERT ON "public"."plano_aee"
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_evaluation_cycles();

COMMENT ON FUNCTION auto_create_evaluation_cycles() IS 'Cria automaticamente 3 ciclos avaliativos ao criar um plano de AEE';

-- ============================================================================
-- FUNÇÃO: Calcular Estatísticas do Plano
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_plan_statistics(p_plan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    v_total_attendances integer;
    v_present_attendances integer;
    v_attendance_percentage numeric(5,2);
    v_total_goals integer;
    v_achieved_goals integer;
BEGIN
    -- Calcular frequência de atendimentos
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE attendance_status = 'presente')
    INTO v_total_attendances, v_present_attendances
    FROM "public"."aee_attendance_records"
    WHERE plan_id = p_plan_id;
    
    -- Calcular porcentagem de frequência
    v_attendance_percentage := CASE 
        WHEN v_total_attendances > 0 THEN 
            (v_present_attendances::numeric / v_total_attendances::numeric) * 100
        ELSE 0
    END;
    
    -- Calcular metas
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE progress_status = 'alcancada')
    INTO v_total_goals, v_achieved_goals
    FROM "public"."aee_plan_goals"
    WHERE plan_id = p_plan_id;
    
    -- Atualizar estatísticas no plano
    UPDATE "public"."plano_aee"
    SET 
        "total_attendances" = v_total_attendances,
        "attendance_percentage" = v_attendance_percentage,
        "total_goals" = v_total_goals,
        "goals_achieved" = v_achieved_goals,
        "updated_at" = now()
    WHERE id = p_plan_id;
END;
$;

COMMENT ON FUNCTION calculate_plan_statistics(uuid) IS 'Recalcula estatísticas do plano (frequência, metas alcançadas, etc.)';

-- ============================================================================
-- FUNÇÃO: Atualizar Progresso de Metas Automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_update_goal_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    v_goal_id uuid;
    v_total_attendances integer;
    v_new_progress integer;
    v_new_status text;
BEGIN
    -- Apenas se o atendimento foi presente e tem metas trabalhadas
    IF NEW.attendance_status = 'presente' AND NEW.goals_worked IS NOT NULL AND array_length(NEW.goals_worked, 1) > 0 THEN
        
        -- Para cada meta trabalhada
        FOREACH v_goal_id IN ARRAY NEW.goals_worked
        LOOP
            -- Contar quantas vezes essa meta foi trabalhada
            SELECT COUNT(*) INTO v_total_attendances
            FROM "public"."aee_attendance_records"
            WHERE plan_id = NEW.plan_id
              AND v_goal_id = ANY(goals_worked)
              AND attendance_status = 'presente';
            
            -- Calcular progresso (10% por atendimento, máximo 100%)
            v_new_progress := LEAST(100, (v_total_attendances * 10));
            
            -- Determinar novo status baseado na porcentagem
            v_new_status := CASE 
                WHEN v_new_progress >= 100 THEN 'alcancada'
                WHEN v_new_progress >= 50 THEN 'em_andamento'
                WHEN v_new_progress > 0 THEN 'em_andamento'
                ELSE 'nao_iniciada'
            END;
            
            -- Atualizar meta
            UPDATE "public"."aee_plan_goals"
            SET 
                "progress_percentage" = v_new_progress,
                "progress_status" = v_new_status,
                "updated_at" = now()
            WHERE id = v_goal_id;
        END LOOP;
        
        -- Atualizar estatísticas do plano
        PERFORM calculate_plan_statistics(NEW.plan_id);
    END IF;
    
    RETURN NEW;
END;
$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_auto_update_goal_progress ON "public"."aee_attendance_records";
CREATE TRIGGER trigger_auto_update_goal_progress
    AFTER INSERT ON "public"."aee_attendance_records"
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_goal_progress();

COMMENT ON FUNCTION auto_update_goal_progress() IS 'Atualiza automaticamente o progresso das metas quando um atendimento é registrado';

-- ============================================================================
-- TRIGGER: Atualizar Estatísticas ao Modificar Metas
-- ============================================================================

CREATE OR REPLACE FUNCTION update_plan_stats_on_goal_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
    -- Atualizar estatísticas do plano
    PERFORM calculate_plan_statistics(COALESCE(NEW.plan_id, OLD.plan_id));
    RETURN COALESCE(NEW, OLD);
END;
$;

-- Trigger para INSERT, UPDATE e DELETE em metas
DROP TRIGGER IF EXISTS trigger_update_stats_on_goal_change ON "public"."aee_plan_goals";
CREATE TRIGGER trigger_update_stats_on_goal_change
    AFTER INSERT OR UPDATE OR DELETE ON "public"."aee_plan_goals"
    FOR EACH ROW
    EXECUTE FUNCTION update_plan_stats_on_goal_change();

-- ============================================================================
-- SEED DATA: Centro de AEE Exemplo (Opcional)
-- ============================================================================

-- Inserir centro de AEE exemplo (comentado - descomentar se necessário)
/*
INSERT INTO "public"."aee_centers" (
    "school_id",
    "tenant_id",
    "center_name",
    "center_type",
    "capacity",
    "specializations"
)
SELECT 
    s.id as school_id,
    s.tenant_id,
    'Sala de Recursos Multifuncionais - ' || s.name,
    'sala_recursos',
    15,
    ARRAY['TEA', 'Deficiência Intelectual', 'Baixa Visão']
FROM "public"."schools" s
WHERE s.is_active = true
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- VALIDAÇÕES E CONSTRAINTS ADICIONAIS
-- ============================================================================

-- Garantir que attendance_date não seja futuro
ALTER TABLE "public"."aee_attendance_records"
ADD CONSTRAINT "attendance_date_not_future" 
CHECK ("attendance_date" <= CURRENT_DATE);

-- Garantir que cycle end_date seja após start_date
ALTER TABLE "public"."aee_evaluation_cycles"
ADD CONSTRAINT "cycle_end_after_start"
CHECK ("end_date" > "start_date");

-- Garantir que target_date da meta seja futura
ALTER TABLE "public"."aee_plan_goals"
ADD CONSTRAINT "target_date_future"
CHECK ("target_date" IS NULL OR "target_date" >= CURRENT_DATE);

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View: Estatísticas de metas por área
CREATE OR REPLACE VIEW aee_goals_by_area AS
SELECT 
    g.plan_id,
    g.goal_area,
    COUNT(*) as total_goals,
    COUNT(*) FILTER (WHERE g.progress_status = 'alcancada') as achieved_goals,
    COUNT(*) FILTER (WHERE g.progress_status = 'em_andamento') as in_progress_goals,
    AVG(g.progress_percentage) as avg_progress
FROM "public"."aee_plan_goals" g
GROUP BY g.plan_id, g.goal_area;

COMMENT ON VIEW aee_goals_by_area IS 'Estatísticas de metas agrupadas por área de desenvolvimento';

-- View: Frequência mensal por aluno
CREATE OR REPLACE VIEW aee_monthly_attendance AS
SELECT 
    a.student_id,
    a.plan_id,
    DATE_TRUNC('month', a.attendance_date) as month,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE a.attendance_status = 'presente') as present_sessions,
    ROUND(
        (COUNT(*) FILTER (WHERE a.attendance_status = 'presente')::numeric / COUNT(*)::numeric) * 100,
        2
    ) as attendance_rate
FROM "public"."aee_attendance_records" a
GROUP BY a.student_id, a.plan_id, DATE_TRUNC('month', a.attendance_date);

COMMENT ON VIEW aee_monthly_attendance IS 'Frequência mensal de atendimentos por aluno';

-- ============================================================================
-- FINALIZAÇÃO
-- ============================================================================

-- Mensagem de sucesso
DO $
BEGIN
    RAISE NOTICE '✅ Migração V2.0 - Fundação aplicada com sucesso!';
    RAISE NOTICE '📊 4 novas tabelas criadas';
    RAISE NOTICE '🔧 3 funções SQL criadas';
    RAISE NOTICE '⚡ 5 triggers aplicados';
    RAISE NOTICE '🔐 12 políticas RLS ativadas';
    RAISE NOTICE '📈 2 views criadas';
    RAISE NOTICE '✨ Sistema pronto para Fase 1!';
END $;

