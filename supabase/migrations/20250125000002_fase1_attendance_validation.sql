-- ============================================================================
-- FASE 1 - ISSUE #1: Validação de Frequência Mínima (75%)
-- Data: 2025-01-25
-- Descrição: Implementar validação automática de frequência mínima conforme legislação
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAR TABELA DE ALERTAS DE FREQUÊNCIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.attendance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  attendance_percentage decimal(5,2) NOT NULL,
  total_classes integer NOT NULL,
  present_classes integer NOT NULL,
  absent_classes integer NOT NULL,
  justified_absences integer DEFAULT 0,
  status text NOT NULL CHECK (status IN ('OK', 'ALERTA', 'CRÍTICO')),
  notified_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Garantir apenas um alerta por aluno/período
  UNIQUE(student_id, enrollment_id, period_start, period_end)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_attendance_alerts_student ON public.attendance_alerts(student_id, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_alerts_enrollment ON public.attendance_alerts(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_alerts_status ON public.attendance_alerts(status) WHERE status != 'OK';
CREATE INDEX IF NOT EXISTS idx_attendance_alerts_period ON public.attendance_alerts(period_start, period_end);

COMMENT ON TABLE public.attendance_alerts IS 'Alertas de frequência abaixo do mínimo legal (75%)';
COMMENT ON COLUMN public.attendance_alerts.status IS 'OK: >=75%, ALERTA: 50-74%, CRÍTICO: <50%';

-- ============================================================================
-- PARTE 2: FUNÇÃO PARA CALCULAR FREQUÊNCIA
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_student_attendance_percentage(
  p_student_id uuid,
  p_enrollment_id uuid,
  p_period_start date,
  p_period_end date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_classes integer;
  v_present_classes integer;
  v_absent_classes integer;
  v_justified_absences integer;
  v_attendance_percentage decimal(5,2);
  v_status text;
  v_result jsonb;
BEGIN
  -- Contar total de aulas no período
  SELECT 
    COUNT(*) FILTER (WHERE a.data BETWEEN p_period_start AND p_period_end),
    COUNT(*) FILTER (WHERE a.presenca = true AND a.data BETWEEN p_period_start AND p_period_end),
    COUNT(*) FILTER (WHERE a.presenca = false AND a.data BETWEEN p_period_start AND p_period_end),
    COUNT(*) FILTER (WHERE a.presenca = false AND a.justificativa IS NOT NULL AND a.data BETWEEN p_period_start AND p_period_end)
  INTO v_total_classes, v_present_classes, v_absent_classes, v_justified_absences
  FROM public.attendance a
  WHERE a.student_id = p_student_id
    AND a.data BETWEEN p_period_start AND p_period_end;

  -- Se não houver aulas registradas, retornar null
  IF v_total_classes = 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Nenhuma aula registrada no período'
    );
  END IF;

  -- Calcular frequência (faltas justificadas não contam)
  -- Frequência = (presentes + justificadas) / total
  v_attendance_percentage := ROUND(
    ((v_present_classes + v_justified_absences)::decimal / v_total_classes::decimal) * 100,
    2
  );

  -- Determinar status
  IF v_attendance_percentage >= 75 THEN
    v_status := 'OK';
  ELSIF v_attendance_percentage >= 50 THEN
    v_status := 'ALERTA';
  ELSE
    v_status := 'CRÍTICO';
  END IF;

  -- Construir resultado
  v_result := jsonb_build_object(
    'attendance_percentage', v_attendance_percentage,
    'total_classes', v_total_classes,
    'present_classes', v_present_classes,
    'absent_classes', v_absent_classes,
    'justified_absences', v_justified_absences,
    'status', v_status,
    'period_start', p_period_start,
    'period_end', p_period_end
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.calculate_student_attendance_percentage IS 'Calcula frequência do aluno no período especificado, considerando faltas justificadas';

-- ============================================================================
-- PARTE 3: FUNÇÃO PARA VERIFICAR E CRIAR ALERTAS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_and_create_attendance_alert(
  p_student_id uuid,
  p_enrollment_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start date;
  v_period_end date;
  v_attendance_data jsonb;
  v_attendance_percentage decimal(5,2);
  v_status text;
  v_alert_id uuid;
BEGIN
  -- Período: mês atual
  v_period_start := date_trunc('month', CURRENT_DATE)::date;
  v_period_end := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;

  -- Calcular frequência
  v_attendance_data := public.calculate_student_attendance_percentage(
    p_student_id,
    p_enrollment_id,
    v_period_start,
    v_period_end
  );

  -- Se não houver dados válidos, retornar
  IF (v_attendance_data->>'valid')::boolean = false THEN
    RETURN NULL;
  END IF;

  v_attendance_percentage := (v_attendance_data->>'attendance_percentage')::decimal;
  v_status := v_attendance_data->>'status';

  -- Se frequência >= 75%, não criar alerta (ou remover se existir)
  IF v_status = 'OK' THEN
    -- Remover alerta existente se houver
    DELETE FROM public.attendance_alerts
    WHERE student_id = p_student_id
      AND enrollment_id = p_enrollment_id
      AND period_start = v_period_start;
    RETURN NULL;
  END IF;

  -- Criar ou atualizar alerta
  INSERT INTO public.attendance_alerts (
    student_id,
    enrollment_id,
    period_start,
    period_end,
    attendance_percentage,
    total_classes,
    present_classes,
    absent_classes,
    justified_absences,
    status
  )
  VALUES (
    p_student_id,
    p_enrollment_id,
    v_period_start,
    v_period_end,
    v_attendance_percentage,
    (v_attendance_data->>'total_classes')::integer,
    (v_attendance_data->>'present_classes')::integer,
    (v_attendance_data->>'absent_classes')::integer,
    (v_attendance_data->>'justified_absences')::integer,
    v_status
  )
  ON CONFLICT (student_id, enrollment_id, period_start, period_end)
  DO UPDATE SET
    attendance_percentage = EXCLUDED.attendance_percentage,
    total_classes = EXCLUDED.total_classes,
    present_classes = EXCLUDED.present_classes,
    absent_classes = EXCLUDED.absent_classes,
    justified_absences = EXCLUDED.justified_absences,
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$;

COMMENT ON FUNCTION public.check_and_create_attendance_alert IS 'Verifica frequência do aluno e cria/atualiza alerta se necessário';

-- ============================================================================
-- PARTE 4: TRIGGER PARA VERIFICAR FREQUÊNCIA APÓS REGISTRO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_check_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment_id uuid;
BEGIN
  -- Buscar matrícula ativa do aluno
  SELECT e.id INTO v_enrollment_id
  FROM public.enrollments e
  WHERE e.student_id = NEW.student_id
    AND e.status = 'Matriculado'
    AND e.ano_letivo = EXTRACT(YEAR FROM CURRENT_DATE)
  ORDER BY e.created_at DESC
  LIMIT 1;

  -- Se encontrou matrícula, verificar frequência
  IF v_enrollment_id IS NOT NULL THEN
    PERFORM public.check_and_create_attendance_alert(NEW.student_id, v_enrollment_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_check_attendance_after_insert ON public.attendance;
CREATE TRIGGER trigger_check_attendance_after_insert
AFTER INSERT ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.trigger_check_attendance();

DROP TRIGGER IF EXISTS trigger_check_attendance_after_update ON public.attendance;
CREATE TRIGGER trigger_check_attendance_after_update
AFTER UPDATE OF presenca, justificativa ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.trigger_check_attendance();

-- ============================================================================
-- PARTE 5: FUNÇÃO PARA BUSCAR ALUNOS ABAIXO DO THRESHOLD
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_students_below_attendance_threshold(
  p_school_id uuid DEFAULT NULL,
  p_threshold decimal DEFAULT 75.0,
  p_period_start date DEFAULT NULL,
  p_period_end date DEFAULT NULL
)
RETURNS TABLE (
  student_id uuid,
  student_name text,
  enrollment_id uuid,
  class_name text,
  attendance_percentage decimal,
  status text,
  total_classes integer,
  absent_classes integer,
  period_start date,
  period_end date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se período não especificado, usar mês atual
  IF p_period_start IS NULL THEN
    p_period_start := date_trunc('month', CURRENT_DATE)::date;
  END IF;
  
  IF p_period_end IS NULL THEN
    p_period_end := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;
  END IF;

  RETURN QUERY
  SELECT 
    aa.student_id,
    s.name as student_name,
    aa.enrollment_id,
    c.class_name,
    aa.attendance_percentage,
    aa.status,
    aa.total_classes,
    aa.absent_classes,
    aa.period_start,
    aa.period_end
  FROM public.attendance_alerts aa
  JOIN public.students s ON s.id = aa.student_id
  JOIN public.enrollments e ON e.id = aa.enrollment_id
  LEFT JOIN public.classes c ON c.id = e.class_id
  WHERE aa.attendance_percentage < p_threshold
    AND aa.period_start = p_period_start
    AND (p_school_id IS NULL OR s.school_id = p_school_id)
  ORDER BY aa.attendance_percentage ASC, s.name;
END;
$$;

COMMENT ON FUNCTION public.get_students_below_attendance_threshold IS 'Retorna lista de alunos abaixo do threshold de frequência';

-- ============================================================================
-- PARTE 6: FUNÇÃO PARA VALIDAR FREQUÊNCIA ANTES DE APROVAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_approve_student(
  p_student_id uuid,
  p_enrollment_id uuid,
  p_academic_year integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academic_year integer;
  v_year_start date;
  v_year_end date;
  v_attendance_data jsonb;
  v_attendance_percentage decimal(5,2);
  v_result jsonb;
BEGIN
  -- Se ano não especificado, usar ano atual
  IF p_academic_year IS NULL THEN
    v_academic_year := EXTRACT(YEAR FROM CURRENT_DATE);
  ELSE
    v_academic_year := p_academic_year;
  END IF;

  -- Definir período do ano letivo (aproximado: fev-dez)
  v_year_start := make_date(v_academic_year, 2, 1);
  v_year_end := make_date(v_academic_year, 12, 31);

  -- Calcular frequência anual
  v_attendance_data := public.calculate_student_attendance_percentage(
    p_student_id,
    p_enrollment_id,
    v_year_start,
    v_year_end
  );

  -- Se não houver dados válidos
  IF (v_attendance_data->>'valid')::boolean = false THEN
    RETURN jsonb_build_object(
      'can_approve', false,
      'reason', 'Dados de frequência insuficientes',
      'attendance_data', v_attendance_data
    );
  END IF;

  v_attendance_percentage := (v_attendance_data->>'attendance_percentage')::decimal;

  -- Verificar se frequência >= 75%
  IF v_attendance_percentage < 75.0 THEN
    RETURN jsonb_build_object(
      'can_approve', false,
      'reason', format('Frequência abaixo do mínimo legal: %.2f%% (mínimo: 75%%)', v_attendance_percentage),
      'attendance_percentage', v_attendance_percentage,
      'attendance_data', v_attendance_data
    );
  END IF;

  -- Pode aprovar
  RETURN jsonb_build_object(
    'can_approve', true,
    'attendance_percentage', v_attendance_percentage,
    'attendance_data', v_attendance_data
  );
END;
$$;

COMMENT ON FUNCTION public.can_approve_student IS 'Valida se aluno pode ser aprovado baseado na frequência mínima (75%)';

-- ============================================================================
-- PARTE 7: HABILITAR RLS
-- ============================================================================

ALTER TABLE public.attendance_alerts ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver alertas de suas escolas
CREATE POLICY "Users can view attendance alerts of their schools"
ON public.attendance_alerts
FOR SELECT
USING (
  student_id IN (
    SELECT s.id FROM public.students s
    JOIN public.user_schools us ON us.school_id = s.school_id
    WHERE us.user_id = auth.uid()
  )
);

-- Política: Coordenadores e diretores podem gerenciar alertas
CREATE POLICY "Admins can manage attendance alerts"
ON public.attendance_alerts
FOR ALL
USING (
  student_id IN (
    SELECT s.id FROM public.students s
    JOIN public.user_schools us ON us.school_id = s.school_id
    WHERE us.user_id = auth.uid()
  )
  AND (
    public.has_role(auth.uid(), 'coordinator')
    OR public.has_role(auth.uid(), 'school_director')
    OR public.has_role(auth.uid(), 'education_secretary')
  )
);

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

