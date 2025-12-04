-- ============================================================================
-- MIGRAÇÃO: Integração de Cronogramas AEE com Cronogramas Existentes
-- ============================================================================
-- Sistema de vinculação de cronogramas AEE aos cronogramas existentes
-- (class_schedules e academic_calendars do app Gestão Escolar)
-- Não criar novas tabelas de cronogramas, apenas vincular aos existentes
-- Data: 2025-02-20
-- ============================================================================

-- ============================================================================
-- TABELA: aee_service_schedule_links
-- ============================================================================
-- Vinculação de cronogramas AEE aos cronogramas existentes (class_schedules)
-- Permite que horários de atendimento AEE dialoguem com horários de aulas regulares
CREATE TABLE IF NOT EXISTS "public"."aee_service_schedule_links" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "schedule_id" uuid REFERENCES "public"."class_schedules"("id") ON DELETE SET NULL,
    -- schedule_id pode ser NULL se o horário não estiver vinculado a uma grade existente
    
    -- Identificação do atendimento AEE
    "student_id" uuid REFERENCES "public"."students"("id") ON DELETE SET NULL,
    -- student_id pode ser NULL para atendimentos em grupo
    
    "aee_teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Tipo de atendimento
    "schedule_type" text NOT NULL CHECK ("schedule_type" IN (
        'individual_aee', 
        'group_aee', 
        'co_teaching', 
        'material_production',
        'visit',
        'assessment'
    )),
    
    -- Horário específico (se não vinculado a class_schedule)
    "day_of_week" integer CHECK ("day_of_week" >= 0 AND "day_of_week" <= 6), -- 0=Domingo, 1=Segunda, etc.
    "start_time" time,
    "end_time" time,
    "duration_minutes" integer,
    
    -- Frequência
    "frequency" text DEFAULT 'weekly' CHECK ("frequency" IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')),
    "custom_frequency" jsonb, -- Para frequências customizadas
    
    -- Período
    "start_date" date,
    "end_date" date,
    
    -- Localização específica
    "location_specific" text CHECK ("location_specific" IN (
        'aee_room', 
        'regular_classroom', 
        'library', 
        'lab', 
        'outside', 
        'online',
        'other'
    )),
    "location_details" text,
    
    -- Vinculação a co-ensino ou visita
    "co_teaching_session_id" uuid REFERENCES "public"."aee_co_teaching_sessions"("id") ON DELETE SET NULL,
    "visit_id" uuid, -- Referência a visitas escolares (tabela futura)
    
    -- Alunos do grupo (se for atendimento em grupo)
    "group_students" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"student_id": "uuid", "name": "string"}]
    "max_students" integer,
    
    -- Status
    "status" text DEFAULT 'active' CHECK ("status" IN ('active', 'paused', 'completed', 'cancelled')),
    
    -- Notas e observações
    "notes" text,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_schedule_links_plan" ON "public"."aee_service_schedule_links"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_aee_schedule_links_schedule" ON "public"."aee_service_schedule_links"("schedule_id");
CREATE INDEX IF NOT EXISTS "idx_aee_schedule_links_student" ON "public"."aee_service_schedule_links"("student_id");
CREATE INDEX IF NOT EXISTS "idx_aee_schedule_links_teacher" ON "public"."aee_service_schedule_links"("aee_teacher_id");
CREATE INDEX IF NOT EXISTS "idx_aee_schedule_links_type" ON "public"."aee_service_schedule_links"("schedule_type");
CREATE INDEX IF NOT EXISTS "idx_aee_schedule_links_status" ON "public"."aee_service_schedule_links"("status");
CREATE INDEX IF NOT EXISTS "idx_aee_schedule_links_co_teaching" ON "public"."aee_service_schedule_links"("co_teaching_session_id");
CREATE INDEX IF NOT EXISTS "idx_aee_schedule_links_dates" ON "public"."aee_service_schedule_links"("start_date", "end_date");

-- ============================================================================
-- TABELA: aee_schedule_exceptions
-- ============================================================================
-- Exceções ao cronograma AEE (feriados, ausências, remarcações)
CREATE TABLE IF NOT EXISTS "public"."aee_schedule_exceptions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculação
    "schedule_link_id" uuid NOT NULL REFERENCES "public"."aee_service_schedule_links"("id") ON DELETE CASCADE,
    
    -- Data da exceção
    "exception_date" date NOT NULL,
    
    -- Tipo de exceção
    "exception_type" text NOT NULL CHECK ("exception_type" IN (
        'holiday', 
        'absence', 
        'reschedule', 
        'cancellation',
        'substitute',
        'special_event'
    )),
    
    -- Detalhes
    "reason" text,
    "rescheduled_to" date, -- Para remarcações
    "replacement_date" date, -- Para reposições
    "substitute_teacher_id" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_schedule_exceptions_link" ON "public"."aee_schedule_exceptions"("schedule_link_id");
CREATE INDEX IF NOT EXISTS "idx_aee_schedule_exceptions_date" ON "public"."aee_schedule_exceptions"("exception_date");
CREATE INDEX IF NOT EXISTS "idx_aee_schedule_exceptions_type" ON "public"."aee_schedule_exceptions"("exception_type");

-- ============================================================================
-- VIEWS PARA INTEGRAÇÃO
-- ============================================================================

-- View: Cronogramas AEE com informações de grades regulares
CREATE OR REPLACE VIEW "public"."aee_schedules_with_classes" AS
SELECT 
    sl.id,
    sl.plan_id,
    sl.schedule_id,
    sl.student_id,
    sl.aee_teacher_id,
    sl.schedule_type,
    sl.day_of_week,
    sl.start_time,
    sl.end_time,
    sl.duration_minutes,
    sl.frequency,
    sl.start_date,
    sl.end_date,
    sl.location_specific,
    sl.status,
    sl.notes,
    -- Informações da grade regular (se vinculada)
    cs.class_id,
    c.class_name,
    c.grade as class_grade,
    c.shift as class_shift,
    cs.academic_year,
    cs.monday,
    cs.tuesday,
    cs.wednesday,
    cs.thursday,
    cs.friday,
    cs.saturday,
    -- Informações do aluno
    s.name as student_name,
    -- Informações do professor AEE
    pa.full_name as aee_teacher_name,
    -- Informações do plano
    paee.status as plan_status
FROM "public"."aee_service_schedule_links" sl
LEFT JOIN "public"."class_schedules" cs ON cs.id = sl.schedule_id
LEFT JOIN "public"."classes" c ON c.id = cs.class_id
LEFT JOIN "public"."students" s ON s.id = sl.student_id
LEFT JOIN "public"."profiles" pa ON pa.id = sl.aee_teacher_id
LEFT JOIN "public"."plano_aee" paee ON paee.id = sl.plan_id;

COMMENT ON VIEW "public"."aee_schedules_with_classes" IS 
'View para visualizar cronogramas AEE com informações de grades regulares';

-- ============================================================================
-- RPCs PARA INTEGRAÇÃO COM CRONOGRAMAS
-- ============================================================================

-- RPC: Vincular cronograma AEE a uma grade existente
CREATE OR REPLACE FUNCTION link_aee_to_schedule(
    p_plan_id uuid,
    p_schedule_id uuid,
    p_schedule_type text,
    p_aee_teacher_id uuid,
    p_student_id uuid DEFAULT NULL,
    p_location_specific text DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_link_id uuid;
BEGIN
    INSERT INTO "public"."aee_service_schedule_links" (
        plan_id,
        schedule_id,
        schedule_type,
        aee_teacher_id,
        student_id,
        location_specific,
        notes,
        created_by
    ) VALUES (
        p_plan_id,
        p_schedule_id,
        p_schedule_type,
        p_aee_teacher_id,
        p_student_id,
        p_location_specific,
        p_notes,
        auth.uid()
    )
    RETURNING id INTO v_link_id;
    
    RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION link_aee_to_schedule IS 
'Vincular cronograma AEE a uma grade de horários existente';

-- RPC: Buscar cronogramas vinculados a um plano
CREATE OR REPLACE FUNCTION get_aee_schedules_by_plan(p_plan_id uuid)
RETURNS TABLE (
    id uuid,
    schedule_id uuid,
    schedule_type text,
    day_of_week integer,
    start_time time,
    end_time time,
    duration_minutes integer,
    frequency text,
    start_date date,
    end_date date,
    location_specific text,
    status text,
    class_name text,
    student_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.id,
        sl.schedule_id,
        sl.schedule_type,
        sl.day_of_week,
        sl.start_time,
        sl.end_time,
        sl.duration_minutes,
        sl.frequency,
        sl.start_date,
        sl.end_date,
        sl.location_specific,
        sl.status,
        c.class_name,
        s.name as student_name
    FROM "public"."aee_service_schedule_links" sl
    LEFT JOIN "public"."class_schedules" cs ON cs.id = sl.schedule_id
    LEFT JOIN "public"."classes" c ON c.id = cs.class_id
    LEFT JOIN "public"."students" s ON s.id = sl.student_id
    WHERE sl.plan_id = p_plan_id
    ORDER BY sl.start_date, sl.day_of_week, sl.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_aee_schedules_by_plan IS 
'Buscar todos os cronogramas vinculados a um plano AEE';

-- RPC: Verificar conflitos de horário
CREATE OR REPLACE FUNCTION check_schedule_conflict_for_aee(
    p_teacher_id uuid,
    p_day_of_week integer,
    p_start_time time,
    p_end_time time,
    p_date date DEFAULT NULL,
    p_exclude_link_id uuid DEFAULT NULL
)
RETURNS TABLE (
    has_conflict boolean,
    conflict_type text,
    conflict_details jsonb
) AS $$
DECLARE
    v_conflict boolean := false;
    v_conflict_type text;
    v_conflict_details jsonb;
BEGIN
    -- Verificar conflitos com outros cronogramas AEE
    SELECT 
        true,
        'aee_schedule',
        jsonb_build_object(
            'link_id', sl.id,
            'plan_id', sl.plan_id,
            'student_id', sl.student_id,
            'schedule_type', sl.schedule_type
        )
    INTO v_conflict, v_conflict_type, v_conflict_details
    FROM "public"."aee_service_schedule_links" sl
    WHERE sl.aee_teacher_id = p_teacher_id
    AND sl.status = 'active'
    AND (
        (sl.day_of_week = p_day_of_week AND sl.start_time < p_end_time AND sl.end_time > p_start_time)
        OR (p_date IS NOT NULL AND sl.start_date <= p_date AND (sl.end_date IS NULL OR sl.end_date >= p_date))
    )
    AND (p_exclude_link_id IS NULL OR sl.id != p_exclude_link_id)
    LIMIT 1;
    
    IF v_conflict THEN
        RETURN QUERY SELECT v_conflict, v_conflict_type, v_conflict_details;
        RETURN;
    END IF;
    
    -- Verificar conflitos com grades regulares (se o professor também dá aula regular)
    -- Isso requer verificar class_schedules onde o professor está como teacher_id
    -- Por enquanto retornamos sem conflito, mas pode ser expandido
    
    RETURN QUERY SELECT false, NULL::text, NULL::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_schedule_conflict_for_aee IS 
'Verificar conflitos de horário para cronogramas AEE';

-- RPC: Sugerir horários disponíveis
CREATE OR REPLACE FUNCTION suggest_available_slots_for_aee(
    p_teacher_id uuid,
    p_student_id uuid DEFAULT NULL,
    p_date_from date DEFAULT CURRENT_DATE,
    p_date_to date DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    p_day_of_week integer DEFAULT NULL,
    p_duration_minutes integer DEFAULT 60
)
RETURNS TABLE (
    suggested_date date,
    suggested_day_of_week integer,
    suggested_start_time time,
    suggested_end_time time,
    available boolean
) AS $$
BEGIN
    -- Esta função pode ser expandida com lógica mais complexa
    -- Por enquanto retorna slots básicos
    RETURN QUERY
    SELECT 
        d.suggested_date,
        EXTRACT(DOW FROM d.suggested_date)::integer as suggested_day_of_week,
        '08:00'::time as suggested_start_time,
        ('08:00'::time + (p_duration_minutes || ' minutes')::interval) as suggested_end_time,
        NOT EXISTS (
            SELECT 1 FROM "public"."aee_service_schedule_links" sl
            WHERE sl.aee_teacher_id = p_teacher_id
            AND sl.status = 'active'
            AND sl.day_of_week = EXTRACT(DOW FROM d.suggested_date)::integer
            AND sl.start_time < (('08:00'::time + (p_duration_minutes || ' minutes')::interval))
            AND sl.end_time > '08:00'::time
        ) as available
    FROM generate_series(p_date_from, p_date_to, '1 day'::interval) as d(suggested_date)
    WHERE (p_day_of_week IS NULL OR EXTRACT(DOW FROM d.suggested_date)::integer = p_day_of_week)
    AND d.suggested_date >= CURRENT_DATE
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION suggest_available_slots_for_aee IS 
'Sugerir horários disponíveis para atendimento AEE';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_aee_schedule_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_aee_schedule_links_updated_at_trigger ON "public"."aee_service_schedule_links";
CREATE TRIGGER update_aee_schedule_links_updated_at_trigger
    BEFORE UPDATE ON "public"."aee_service_schedule_links"
    FOR EACH ROW
    EXECUTE FUNCTION update_aee_schedule_links_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."aee_service_schedule_links" ENABLE ROW LEVEL SECURITY;

-- Professores AEE podem ver seus próprios cronogramas
CREATE POLICY "aee_teachers_view_schedules"
    ON "public"."aee_service_schedule_links"
    FOR SELECT
    USING (
        "aee_teacher_id" = auth.uid()
        OR EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_service_schedule_links"."plan_id"
            AND EXISTS (
                SELECT 1 FROM "public"."profiles" p
                JOIN "public"."user_roles" ur ON ur.user_id = p.id
                WHERE p.id = auth.uid()
                AND (
                    ur.role IN ('coordinator', 'school_director', 'school_manager')
                    AND (p.school_id = pa.school_id OR p.tenant_id = pa.tenant_id)
                )
            )
        )
    );

-- Professores AEE podem criar cronogramas
CREATE POLICY "aee_teachers_create_schedules"
    ON "public"."aee_service_schedule_links"
    FOR INSERT
    WITH CHECK (
        "aee_teacher_id" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role = 'aee_teacher'
        )
        AND EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_service_schedule_links"."plan_id"
            AND (
                pa.created_by = auth.uid()
                OR pa.assigned_aee_teacher_id = auth.uid()
            )
        )
    );

-- Professores AEE podem atualizar seus cronogramas
CREATE POLICY "aee_teachers_update_schedules"
    ON "public"."aee_service_schedule_links"
    FOR UPDATE
    USING ("aee_teacher_id" = auth.uid())
    WITH CHECK ("aee_teacher_id" = auth.uid());

ALTER TABLE "public"."aee_schedule_exceptions" ENABLE ROW LEVEL SECURITY;

-- Professores AEE podem ver exceções de seus cronogramas
CREATE POLICY "aee_teachers_view_exceptions"
    ON "public"."aee_schedule_exceptions"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."aee_service_schedule_links" sl
            WHERE sl.id = "aee_schedule_exceptions"."schedule_link_id"
            AND sl.aee_teacher_id = auth.uid()
        )
    );

-- Professores AEE podem criar exceções
CREATE POLICY "aee_teachers_create_exceptions"
    ON "public"."aee_schedule_exceptions"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."aee_service_schedule_links" sl
            WHERE sl.id = "aee_schedule_exceptions"."schedule_link_id"
            AND sl.aee_teacher_id = auth.uid()
        )
    );

-- Professores AEE podem atualizar exceções
CREATE POLICY "aee_teachers_update_exceptions"
    ON "public"."aee_schedule_exceptions"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."aee_service_schedule_links" sl
            WHERE sl.id = "aee_schedule_exceptions"."schedule_link_id"
            AND sl.aee_teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."aee_service_schedule_links" sl
            WHERE sl.id = "aee_schedule_exceptions"."schedule_link_id"
            AND sl.aee_teacher_id = auth.uid()
        )
    );

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."aee_service_schedule_links" IS 
'Vinculação de cronogramas AEE aos cronogramas existentes (class_schedules)';
COMMENT ON TABLE "public"."aee_schedule_exceptions" IS 
'Exceções ao cronograma AEE (feriados, ausências, remarcações)';

COMMENT ON COLUMN "public"."aee_service_schedule_links"."schedule_id" IS 
'ID do cronograma na tabela class_schedules (pode ser NULL se não vinculado)';
COMMENT ON COLUMN "public"."aee_service_schedule_links"."schedule_type" IS 
'Tipo de atendimento: individual_aee, group_aee, co_teaching, material_production, visit, assessment';

