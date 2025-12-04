-- ============================================================================
-- MIGRAÇÃO: Calendários Escolares e Grades de Horários
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar tabela academic_calendars (Calendário Escolar)
--   2. Criar tabela class_schedules (Grades de Horários)
--   3. Criar RPCs para gerenciar calendários e horários
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA academic_calendars (Calendário Escolar)
-- ============================================================================

CREATE TABLE IF NOT EXISTS academic_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  academic_year integer NOT NULL,
  
  -- Estrutura do calendário
  calendar_data jsonb NOT NULL DEFAULT '{}'::jsonb, -- Estrutura completa do calendário
  
  -- Períodos letivos
  school_days jsonb DEFAULT '[]'::jsonb, -- [{date, type: 'class', 'holiday', 'recess', 'event', description}]
  holidays jsonb DEFAULT '[]'::jsonb, -- [{date, name, type}]
  recess_periods jsonb DEFAULT '[]'::jsonb, -- [{start_date, end_date, name, type}]
  
  -- Eventos escolares
  events jsonb DEFAULT '[]'::jsonb, -- [{date, title, description, type, target_audience}]
  
  -- Metadados
  total_school_days integer, -- Total de dias letivos
  total_instructional_hours numeric(6,2), -- Total de horas-aula
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  
  UNIQUE(school_id, academic_year)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_academic_calendars_school ON academic_calendars(school_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_academic_calendars_tenant ON academic_calendars(tenant_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_academic_calendars_year ON academic_calendars(academic_year);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_academic_calendars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS academic_calendars_updated_at_trigger ON academic_calendars;
CREATE TRIGGER academic_calendars_updated_at_trigger
  BEFORE UPDATE ON academic_calendars
  FOR EACH ROW
  EXECUTE FUNCTION update_academic_calendars_updated_at();

-- Comentários
COMMENT ON TABLE academic_calendars IS 
  'Calendário escolar com dias letivos, feriados, recessos e eventos.';

COMMENT ON COLUMN academic_calendars.calendar_data IS 
  'Estrutura completa: {start_date, end_date, semesters: [...], bimesters: [...], etc.}';

COMMENT ON COLUMN academic_calendars.school_days IS 
  'Array de dias: [{date, type: "class"|"holiday"|"recess"|"event", description}]';

-- ============================================================================
-- PARTE 2: TABELA class_schedules (Grades de Horários)
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year integer NOT NULL,
  
  -- Estrutura da grade
  schedule_data jsonb NOT NULL DEFAULT '{}'::jsonb, -- Grade completa
  
  -- Horários por dia da semana
  monday jsonb DEFAULT '[]'::jsonb, -- [{time_start, time_end, subject_id, teacher_id, room}]
  tuesday jsonb DEFAULT '[]'::jsonb,
  wednesday jsonb DEFAULT '[]'::jsonb,
  thursday jsonb DEFAULT '[]'::jsonb,
  friday jsonb DEFAULT '[]'::jsonb,
  saturday jsonb DEFAULT '[]'::jsonb,
  
  -- Metadados
  total_weekly_hours numeric(5,2), -- Total de horas semanais
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  
  UNIQUE(class_id, academic_year)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_class_schedules_class ON class_schedules(class_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_class_schedules_year ON class_schedules(academic_year);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_class_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS class_schedules_updated_at_trigger ON class_schedules;
CREATE TRIGGER class_schedules_updated_at_trigger
  BEFORE UPDATE ON class_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_class_schedules_updated_at();

-- Comentários
COMMENT ON TABLE class_schedules IS 
  'Grades de horários das turmas. Define horários de cada disciplina por dia da semana.';

COMMENT ON COLUMN class_schedules.schedule_data IS 
  'Estrutura completa: {periods: [...], breaks: [...], total_hours: ...}';

-- ============================================================================
-- PARTE 3: RPCs PARA GERENCIAR CALENDÁRIOS E HORÁRIOS
-- ============================================================================

-- 3.1. Criar calendário escolar
CREATE OR REPLACE FUNCTION create_academic_calendar(
  p_school_id uuid,
  p_tenant_id uuid,
  p_academic_year integer,
  p_calendar_data jsonb DEFAULT '{}'::jsonb,
  p_school_days jsonb DEFAULT '[]'::jsonb,
  p_holidays jsonb DEFAULT '[]'::jsonb,
  p_recess_periods jsonb DEFAULT '[]'::jsonb,
  p_events jsonb DEFAULT '[]'::jsonb,
  p_total_school_days integer DEFAULT NULL,
  p_total_instructional_hours numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_calendar_id uuid;
BEGIN
  INSERT INTO academic_calendars (
    school_id,
    tenant_id,
    academic_year,
    calendar_data,
    school_days,
    holidays,
    recess_periods,
    events,
    total_school_days,
    total_instructional_hours,
    created_by
  ) VALUES (
    p_school_id,
    p_tenant_id,
    p_academic_year,
    p_calendar_data,
    p_school_days,
    p_holidays,
    p_recess_periods,
    p_events,
    p_total_school_days,
    p_total_instructional_hours,
    auth.uid()
  )
  ON CONFLICT (school_id, academic_year)
  DO UPDATE SET
    calendar_data = EXCLUDED.calendar_data,
    school_days = EXCLUDED.school_days,
    holidays = EXCLUDED.holidays,
    recess_periods = EXCLUDED.recess_periods,
    events = EXCLUDED.events,
    total_school_days = EXCLUDED.total_school_days,
    total_instructional_hours = EXCLUDED.total_instructional_hours,
    updated_at = NOW()
  RETURNING id INTO v_calendar_id;
  
  RETURN v_calendar_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2. Criar grade de horários
CREATE OR REPLACE FUNCTION create_class_schedule(
  p_class_id uuid,
  p_academic_year integer,
  p_schedule_data jsonb DEFAULT '{}'::jsonb,
  p_monday jsonb DEFAULT '[]'::jsonb,
  p_tuesday jsonb DEFAULT '[]'::jsonb,
  p_wednesday jsonb DEFAULT '[]'::jsonb,
  p_thursday jsonb DEFAULT '[]'::jsonb,
  p_friday jsonb DEFAULT '[]'::jsonb,
  p_saturday jsonb DEFAULT '[]'::jsonb,
  p_total_weekly_hours numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_schedule_id uuid;
BEGIN
  INSERT INTO class_schedules (
    class_id,
    academic_year,
    schedule_data,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    total_weekly_hours,
    created_by
  ) VALUES (
    p_class_id,
    p_academic_year,
    p_schedule_data,
    p_monday,
    p_tuesday,
    p_wednesday,
    p_thursday,
    p_friday,
    p_saturday,
    p_total_weekly_hours,
    auth.uid()
  )
  ON CONFLICT (class_id, academic_year)
  DO UPDATE SET
    schedule_data = EXCLUDED.schedule_data,
    monday = EXCLUDED.monday,
    tuesday = EXCLUDED.tuesday,
    wednesday = EXCLUDED.wednesday,
    thursday = EXCLUDED.thursday,
    friday = EXCLUDED.friday,
    saturday = EXCLUDED.saturday,
    total_weekly_hours = EXCLUDED.total_weekly_hours,
    updated_at = NOW()
  RETURNING id INTO v_schedule_id;
  
  RETURN v_schedule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3. Verificar conflitos de horário
CREATE OR REPLACE FUNCTION check_schedule_conflicts(
  p_teacher_id uuid DEFAULT NULL,
  p_class_id uuid DEFAULT NULL,
  p_subject_id uuid DEFAULT NULL,
  p_day_of_week text,
  p_time_start time,
  p_time_end time,
  p_exclude_schedule_id uuid DEFAULT NULL
)
RETURNS TABLE (
  has_conflict boolean,
  conflict_type text,
  conflict_details jsonb
) AS $$
DECLARE
  v_conflicts jsonb := '[]'::jsonb;
BEGIN
  -- Verificar conflitos de professor
  IF p_teacher_id IS NOT NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', 'teacher_conflict',
        'class_id', cs.class_id,
        'class_name', c.class_name,
        'day', p_day_of_week,
        'time_start', slot->>'time_start',
        'time_end', slot->>'time_end'
      )
    ) INTO v_conflicts
    FROM class_schedules cs
    JOIN classes c ON c.id = cs.class_id
    CROSS JOIN jsonb_array_elements(
      CASE p_day_of_week
        WHEN 'monday' THEN cs.monday
        WHEN 'tuesday' THEN cs.tuesday
        WHEN 'wednesday' THEN cs.wednesday
        WHEN 'thursday' THEN cs.thursday
        WHEN 'friday' THEN cs.friday
        WHEN 'saturday' THEN cs.saturday
        ELSE '[]'::jsonb
      END
    ) AS slot
    WHERE (slot->>'teacher_id')::uuid = p_teacher_id
    AND (p_exclude_schedule_id IS NULL OR cs.id != p_exclude_schedule_id)
    AND (
      (p_time_start::time >= (slot->>'time_start')::time AND p_time_start::time < (slot->>'time_end')::time)
      OR (p_time_end::time > (slot->>'time_start')::time AND p_time_end::time <= (slot->>'time_end')::time)
      OR (p_time_start::time <= (slot->>'time_start')::time AND p_time_end::time >= (slot->>'time_end')::time)
    );
  END IF;
  
  -- Verificar conflitos de turma
  IF p_class_id IS NOT NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', 'class_conflict',
        'subject_id', slot->>'subject_id',
        'teacher_id', slot->>'teacher_id',
        'day', p_day_of_week,
        'time_start', slot->>'time_start',
        'time_end', slot->>'time_end'
      )
    ) INTO v_conflicts
    FROM class_schedules cs
    CROSS JOIN jsonb_array_elements(
      CASE p_day_of_week
        WHEN 'monday' THEN cs.monday
        WHEN 'tuesday' THEN cs.tuesday
        WHEN 'wednesday' THEN cs.wednesday
        WHEN 'thursday' THEN cs.thursday
        WHEN 'friday' THEN cs.friday
        WHEN 'saturday' THEN cs.saturday
        ELSE '[]'::jsonb
      END
    ) AS slot
    WHERE cs.class_id = p_class_id
    AND (p_exclude_schedule_id IS NULL OR cs.id != p_exclude_schedule_id)
    AND (
      (p_time_start::time >= (slot->>'time_start')::time AND p_time_start::time < (slot->>'time_end')::time)
      OR (p_time_end::time > (slot->>'time_start')::time AND p_time_end::time <= (slot->>'time_end')::time)
      OR (p_time_start::time <= (slot->>'time_start')::time AND p_time_end::time >= (slot->>'time_end')::time)
    );
  END IF;
  
  RETURN QUERY SELECT
    (v_conflicts IS NOT NULL AND jsonb_array_length(v_conflicts) > 0) as has_conflict,
    CASE 
      WHEN v_conflicts IS NULL OR jsonb_array_length(v_conflicts) = 0 THEN 'none'::text
      WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(v_conflicts) AS c WHERE c->>'type' = 'teacher_conflict') THEN 'teacher'::text
      WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(v_conflicts) AS c WHERE c->>'type' = 'class_conflict') THEN 'class'::text
      ELSE 'unknown'::text
    END,
    COALESCE(v_conflicts, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3.4. Listar calendários
CREATE OR REPLACE FUNCTION get_academic_calendars(
  p_school_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL,
  p_academic_year integer DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  school_id uuid,
  school_name text,
  tenant_id uuid,
  academic_year integer,
  calendar_data jsonb,
  school_days jsonb,
  holidays jsonb,
  recess_periods jsonb,
  events jsonb,
  total_school_days integer,
  total_instructional_hours numeric,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.school_id,
    sch.school_name,
    ac.tenant_id,
    ac.academic_year,
    ac.calendar_data,
    ac.school_days,
    ac.holidays,
    ac.recess_periods,
    ac.events,
    ac.total_school_days,
    ac.total_instructional_hours,
    ac.created_at,
    ac.updated_at
  FROM academic_calendars ac
  LEFT JOIN schools sch ON sch.id = ac.school_id
  WHERE 
    (p_school_id IS NULL OR ac.school_id = p_school_id)
    AND (p_tenant_id IS NULL OR ac.tenant_id = p_tenant_id)
    AND (p_academic_year IS NULL OR ac.academic_year = p_academic_year)
  ORDER BY ac.academic_year DESC, sch.school_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3.5. Listar grades de horários
CREATE OR REPLACE FUNCTION get_class_schedules(
  p_class_id uuid DEFAULT NULL,
  p_school_id uuid DEFAULT NULL,
  p_academic_year integer DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  class_id uuid,
  class_name text,
  academic_year integer,
  schedule_data jsonb,
  monday jsonb,
  tuesday jsonb,
  wednesday jsonb,
  thursday jsonb,
  friday jsonb,
  saturday jsonb,
  total_weekly_hours numeric,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.class_id,
    c.class_name,
    cs.academic_year,
    cs.schedule_data,
    cs.monday,
    cs.tuesday,
    cs.wednesday,
    cs.thursday,
    cs.friday,
    cs.saturday,
    cs.total_weekly_hours,
    cs.created_at,
    cs.updated_at
  FROM class_schedules cs
  LEFT JOIN classes c ON c.id = cs.class_id
  WHERE 
    (p_class_id IS NULL OR cs.class_id = p_class_id)
    AND (p_school_id IS NULL OR c.school_id = p_school_id)
    AND (p_academic_year IS NULL OR cs.academic_year = p_academic_year)
  ORDER BY c.class_name, cs.academic_year DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 4: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE academic_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to academic_calendars" ON academic_calendars;
CREATE POLICY "Superadmin full access to academic_calendars"
  ON academic_calendars FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Usuários veem calendários da sua escola/rede
DROP POLICY IF EXISTS "Users can view calendars in their scope" ON academic_calendars;
CREATE POLICY "Users can view calendars in their scope"
  ON academic_calendars FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    OR tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can manage calendars" ON academic_calendars;
CREATE POLICY "School staff can manage calendars"
  ON academic_calendars FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('school_director', 'coordinator', 'school_manager')
    )
  );

-- Grades: mesmas regras
DROP POLICY IF EXISTS "Superadmin full access to class_schedules" ON class_schedules;
CREATE POLICY "Superadmin full access to class_schedules"
  ON class_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Users can view schedules in their scope" ON class_schedules;
CREATE POLICY "Users can view schedules in their scope"
  ON class_schedules FOR SELECT
  USING (
    class_id IN (
      SELECT c.id FROM classes c
      INNER JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can manage schedules" ON class_schedules;
CREATE POLICY "School staff can manage schedules"
  ON class_schedules FOR ALL
  USING (
    class_id IN (
      SELECT c.id FROM classes c
      INNER JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = p.id
        AND ur.role IN ('school_director', 'coordinator', 'school_manager')
      )
    )
  );

-- ============================================================================
-- PARTE 5: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de calendários e grades de horários concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela academic_calendars (calendário escolar)';
  RAISE NOTICE '  2. ✅ Criada tabela class_schedules (grades de horários)';
  RAISE NOTICE '  3. ✅ Criados RPCs: create_academic_calendar, create_class_schedule, check_schedule_conflicts, get_academic_calendars, get_class_schedules';
  RAISE NOTICE '  4. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Criar interface no app Gestão Escolar (/calendars, /schedules)';
  RAISE NOTICE '  - Implementar visualização de calendário mensal/semanal';
  RAISE NOTICE '  - Implementar editor visual de grade de horários';
END $$;

