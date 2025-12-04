-- ============================================================================
-- MIGRAÇÃO: Expansão de Regras de Alertas
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar funções de validação para novos tipos de condições
--   2. Registrar 10+ novas regras de alerta
--   3. Expandir tipos de condições suportados
-- ============================================================================

-- ============================================================================
-- PARTE 1: FUNÇÕES DE VALIDAÇÃO ADICIONAIS
-- ============================================================================

-- 1.1. Baixo desempenho acadêmico
CREATE OR REPLACE FUNCTION validate_alert_low_performance(
  p_student_id uuid,
  p_threshold numeric DEFAULT 60.0
)
RETURNS jsonb AS $$
DECLARE
  v_avg_grade numeric;
  v_evaluations_count integer;
BEGIN
  -- Calcular média de notas do aluno (exemplo simplificado)
  SELECT 
    AVG(grade)::numeric,
    COUNT(*)
  INTO v_avg_grade, v_evaluations_count
  FROM evaluations
  WHERE student_id = p_student_id
  AND date >= CURRENT_DATE - INTERVAL '3 months';
  
  IF v_evaluations_count = 0 THEN
    RETURN jsonb_build_object('status', 'passed'); -- Sem avaliações ainda
  END IF;
  
  IF v_avg_grade < p_threshold THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error', format('Aluno com desempenho abaixo do esperado (média: %.1f)', v_avg_grade),
      'suggested_fix', 'Verificar necessidade de intervenção pedagógica',
      'data', jsonb_build_object('avg_grade', v_avg_grade, 'threshold', p_threshold)
    );
  END IF;
  
  RETURN jsonb_build_object('status', 'passed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.2. Taxa de ausência elevada (>20%)
CREATE OR REPLACE FUNCTION validate_alert_high_absence_rate(
  p_student_id uuid,
  p_threshold_percent numeric DEFAULT 20.0
)
RETURNS jsonb AS $$
DECLARE
  v_total_days integer;
  v_absent_days integer;
  v_absence_rate numeric;
BEGIN
  -- Calcular taxa de ausência nos últimos 30 dias
  SELECT 
    COUNT(*) FILTER (WHERE presente = false),
    COUNT(*)
  INTO v_absent_days, v_total_days
  FROM attendance
  WHERE student_id = p_student_id
  AND data >= CURRENT_DATE - INTERVAL '30 days';
  
  IF v_total_days = 0 THEN
    RETURN jsonb_build_object('status', 'passed');
  END IF;
  
  v_absence_rate := (v_absent_days::numeric / v_total_days::numeric) * 100;
  
  IF v_absence_rate > p_threshold_percent THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error', format('Taxa de ausência elevada: %.1f%% (limite: %.1f%%)', v_absence_rate, p_threshold_percent),
      'suggested_fix', 'Verificar situação do aluno e contatar família',
      'data', jsonb_build_object('absence_rate', v_absence_rate, 'absent_days', v_absent_days, 'total_days', v_total_days)
    );
  END IF;
  
  RETURN jsonb_build_object('status', 'passed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.3. Documentos pendentes
CREATE OR REPLACE FUNCTION validate_alert_missing_documents(
  p_student_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_missing_docs text[];
BEGIN
  -- Verificar documentos obrigatórios (exemplo simplificado)
  SELECT ARRAY_AGG(doc_type)
  INTO v_missing_docs
  FROM (
    SELECT 'cpf' as doc_type WHERE NOT EXISTS (SELECT 1 FROM students WHERE id = p_student_id AND cpf IS NOT NULL AND cpf != '')
    UNION ALL
    SELECT 'rg' as doc_type WHERE NOT EXISTS (SELECT 1 FROM students WHERE id = p_student_id AND rg IS NOT NULL AND rg != '')
    UNION ALL
    SELECT 'certidao_nascimento' as doc_type WHERE NOT EXISTS (SELECT 1 FROM students WHERE id = p_student_id AND certidao_nascimento IS NOT NULL)
  ) missing;
  
  IF array_length(v_missing_docs, 1) > 0 THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error', format('Documentos pendentes: %s', array_to_string(v_missing_docs, ', ')),
      'suggested_fix', 'Solicitar documentos faltantes à família',
      'data', jsonb_build_object('missing_documents', v_missing_docs)
    );
  END IF;
  
  RETURN jsonb_build_object('status', 'passed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.4. PEI próximo ao vencimento
CREATE OR REPLACE FUNCTION validate_alert_pei_expiring(
  p_student_id uuid,
  p_days_before_expiry integer DEFAULT 30
)
RETURNS jsonb AS $$
DECLARE
  v_pei RECORD;
  v_days_until_expiry integer;
BEGIN
  -- Buscar PEI ativo mais recente
  SELECT id, valid_until, status
  INTO v_pei
  FROM peis
  WHERE student_id = p_student_id
  AND status = 'approved'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'passed'); -- Sem PEI aprovado
  END IF;
  
  IF v_pei.valid_until IS NULL THEN
    RETURN jsonb_build_object('status', 'passed'); -- PEI sem data de vencimento
  END IF;
  
  v_days_until_expiry := EXTRACT(DAY FROM (v_pei.valid_until - CURRENT_DATE));
  
  IF v_days_until_expiry <= p_days_before_expiry AND v_days_until_expiry > 0 THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error', format('PEI vence em %s dias', v_days_until_expiry),
      'suggested_fix', 'Iniciar processo de renovação do PEI',
      'data', jsonb_build_object('days_until_expiry', v_days_until_expiry, 'valid_until', v_pei.valid_until)
    );
  END IF;
  
  IF v_days_until_expiry <= 0 THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error', 'PEI vencido',
      'suggested_fix', 'Renovar PEI urgentemente',
      'data', jsonb_build_object('days_until_expiry', v_days_until_expiry, 'valid_until', v_pei.valid_until)
    );
  END IF;
  
  RETURN jsonb_build_object('status', 'passed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.5. Orçamento excedido
CREATE OR REPLACE FUNCTION validate_alert_budget_exceeded(
  p_school_id uuid,
  p_budget_category text DEFAULT NULL,
  p_threshold_percent numeric DEFAULT 90.0
)
RETURNS jsonb AS $$
DECLARE
  v_budget RECORD;
  v_usage_percent numeric;
BEGIN
  -- Verificar orçamentos da escola
  FOR v_budget IN
    SELECT 
      id,
      category,
      allocated_amount,
      COALESCE(spent_amount, 0) as spent_amount,
      (COALESCE(spent_amount, 0) / NULLIF(allocated_amount, 0) * 100) as usage_percent
    FROM budgets
    WHERE school_id = p_school_id
    AND (p_budget_category IS NULL OR category = p_budget_category)
    AND allocated_amount > 0
  LOOP
    v_usage_percent := v_budget.usage_percent;
    
    IF v_usage_percent >= p_threshold_percent THEN
      RETURN jsonb_build_object(
        'status', 'failed',
        'error', format('Orçamento %s com %.1f%% utilizado (limite: %.1f%%)', v_budget.category, v_usage_percent, p_threshold_percent),
        'suggested_fix', 'Revisar gastos ou solicitar realocação de recursos',
        'data', jsonb_build_object(
          'category', v_budget.category,
          'usage_percent', v_usage_percent,
          'allocated', v_budget.allocated_amount,
          'spent', v_budget.spent_amount
        )
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('status', 'passed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.6. Atrasos no transporte
CREATE OR REPLACE FUNCTION validate_alert_transport_delays(
  p_route_id uuid,
  p_days_to_check integer DEFAULT 7,
  p_max_delays integer DEFAULT 3
)
RETURNS jsonb AS $$
DECLARE
  v_delay_count integer;
BEGIN
  -- Contar atrasos nos últimos N dias
  SELECT COUNT(*)
  INTO v_delay_count
  FROM transport_attendance
  WHERE route_id = p_route_id
  AND attendance_date >= CURRENT_DATE - (p_days_to_check || ' days')::interval
  AND status = 'late';
  
  IF v_delay_count >= p_max_delays THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error', format('%s atrasos registrados nos últimos %s dias', v_delay_count, p_days_to_check),
      'suggested_fix', 'Verificar rota e horários do transporte',
      'data', jsonb_build_object('delay_count', v_delay_count, 'days_checked', p_days_to_check)
    );
  END IF;
  
  RETURN jsonb_build_object('status', 'passed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.7. Problemas com merenda
CREATE OR REPLACE FUNCTION validate_alert_meal_issues(
  p_school_id uuid,
  p_days_to_check integer DEFAULT 7,
  p_min_complaints integer DEFAULT 5
)
RETURNS jsonb AS $$
DECLARE
  v_complaint_count integer;
BEGIN
  -- Contar reclamações sobre merenda (exemplo - criar tabela meal_complaints se necessário)
  -- Por enquanto, verificar baixa taxa de consumo
  SELECT COUNT(*)
  INTO v_complaint_count
  FROM student_meal_attendance
  WHERE school_id = p_school_id
  AND meal_date >= CURRENT_DATE - (p_days_to_check || ' days')::interval
  AND consumed = false;
  
  IF v_complaint_count >= p_min_complaints THEN
    RETURN jsonb_build_object(
      'status', 'warning',
      'error', format('Alto número de refeições não consumidas nos últimos %s dias: %s', p_days_to_check, v_complaint_count),
      'suggested_fix', 'Verificar qualidade e aceitação do cardápio',
      'data', jsonb_build_object('non_consumed_count', v_complaint_count, 'days_checked', p_days_to_check)
    );
  END IF;
  
  RETURN jsonb_build_object('status', 'passed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 2: REGISTRAR NOVAS REGRAS DE ALERTA
-- ============================================================================

DO $$
BEGIN
  -- Regra 1: Baixo desempenho acadêmico
  INSERT INTO alert_rules (
    rule_name,
    rule_description,
    rule_code,
    entity_type,
    condition_type,
    condition_config,
    alert_type,
    alert_message_template,
    notification_channels,
    target_roles,
    check_frequency
  ) VALUES (
    'Baixo Desempenho Acadêmico',
    'Alerta quando aluno tem média abaixo de 60%',
    'ALERT_LOW_PERFORMANCE',
    'student',
    'performance',
    jsonb_build_object('threshold', 60.0, 'field', 'avg_grade'),
    'warning',
    'Aluno {entity_id} está com desempenho abaixo do esperado',
    ARRAY['dashboard', 'email'],
    ARRAY['school_director', 'coordinator', 'teacher'],
    'daily'
  )
  ON CONFLICT (rule_code) DO NOTHING;
  
  -- Regra 2: Taxa de ausência elevada
  INSERT INTO alert_rules (
    rule_name,
    rule_description,
    rule_code,
    entity_type,
    condition_type,
    condition_config,
    alert_type,
    alert_message_template,
    notification_channels,
    target_roles,
    check_frequency
  ) VALUES (
    'Taxa de Ausência Elevada',
    'Alerta quando aluno tem mais de 20% de ausências',
    'ALERT_HIGH_ABSENCE_RATE',
    'student',
    'absence',
    jsonb_build_object('threshold_percent', 20.0, 'period_days', 30),
    'warning',
    'Aluno {entity_id} tem taxa de ausência elevada',
    ARRAY['dashboard', 'email', 'sms'],
    ARRAY['school_director', 'coordinator'],
    'daily'
  )
  ON CONFLICT (rule_code) DO NOTHING;
  
  -- Regra 3: Documentos pendentes
  INSERT INTO alert_rules (
    rule_name,
    rule_description,
    rule_code,
    entity_type,
    condition_type,
    condition_config,
    alert_type,
    alert_message_template,
    notification_channels,
    target_roles,
    check_frequency
  ) VALUES (
    'Documentos Pendentes',
    'Alerta quando aluno possui documentos obrigatórios pendentes',
    'ALERT_MISSING_DOCUMENTS',
    'student',
    'compliance',
    jsonb_build_object('required_docs', ARRAY['cpf', 'rg', 'certidao_nascimento']),
    'info',
    'Aluno {entity_id} possui documentos pendentes',
    ARRAY['dashboard'],
    ARRAY['school_director', 'secretary'],
    'weekly'
  )
  ON CONFLICT (rule_code) DO NOTHING;
  
  -- Regra 4: PEI próximo ao vencimento
  INSERT INTO alert_rules (
    rule_name,
    rule_description,
    rule_code,
    entity_type,
    condition_type,
    condition_config,
    alert_type,
    alert_message_template,
    notification_channels,
    target_roles,
    check_frequency
  ) VALUES (
    'PEI Próximo ao Vencimento',
    'Alerta quando PEI está próximo ao vencimento (30 dias)',
    'ALERT_PEI_EXPIRING',
    'student',
    'expiry',
    jsonb_build_object('days_before_expiry', 30),
    'warning',
    'PEI do aluno {entity_id} vence em breve',
    ARRAY['dashboard', 'email'],
    ARRAY['education_secretary', 'school_director', 'coordinator'],
    'daily'
  )
  ON CONFLICT (rule_code) DO NOTHING;
  
  -- Regra 5: PEI vencido
  INSERT INTO alert_rules (
    rule_name,
    rule_description,
    rule_code,
    entity_type,
    condition_type,
    condition_config,
    alert_type,
    alert_message_template,
    notification_channels,
    target_roles,
    check_frequency
  ) VALUES (
    'PEI Vencido',
    'Alerta quando PEI está vencido',
    'ALERT_PEI_EXPIRED',
    'student',
    'expiry',
    jsonb_build_object('days_before_expiry', 0),
    'critical',
    'PEI do aluno {entity_id} está vencido',
    ARRAY['dashboard', 'email', 'sms'],
    ARRAY['education_secretary', 'school_director', 'coordinator'],
    'daily'
  )
  ON CONFLICT (rule_code) DO NOTHING;
  
  -- Regra 6: Orçamento próximo ao limite
  INSERT INTO alert_rules (
    rule_name,
    rule_description,
    rule_code,
    entity_type,
    condition_type,
    condition_config,
    alert_type,
    alert_message_template,
    notification_channels,
    target_roles,
    check_frequency
  ) VALUES (
    'Orçamento Próximo ao Limite',
    'Alerta quando orçamento está com mais de 90% utilizado',
    'ALERT_BUDGET_EXCEEDED',
    'school',
    'budget',
    jsonb_build_object('threshold_percent', 90.0),
    'warning',
    'Escola {entity_id} está com orçamento próximo ao limite',
    ARRAY['dashboard', 'email'],
    ARRAY['education_secretary', 'school_director'],
    'weekly'
  )
  ON CONFLICT (rule_code) DO NOTHING;
  
  -- Regra 7: Atrasos no transporte
  INSERT INTO alert_rules (
    rule_name,
    rule_description,
    rule_code,
    entity_type,
    condition_type,
    condition_config,
    alert_type,
    alert_message_template,
    notification_channels,
    target_roles,
    check_frequency
  ) VALUES (
    'Atrasos no Transporte',
    'Alerta quando rota tem muitos atrasos',
    'ALERT_TRANSPORT_DELAYS',
    'school',
    'transport',
    jsonb_build_object('days_to_check', 7, 'max_delays', 3),
    'warning',
    'Rota de transporte {entity_id} está com muitos atrasos',
    ARRAY['dashboard', 'email'],
    ARRAY['school_director', 'transport_coordinator'],
    'daily'
  )
  ON CONFLICT (rule_code) DO NOTHING;
  
  -- Regra 8: Problemas com merenda
  INSERT INTO alert_rules (
    rule_name,
    rule_description,
    rule_code,
    entity_type,
    condition_type,
    condition_config,
    alert_type,
    alert_message_template,
    notification_channels,
    target_roles,
    check_frequency
  ) VALUES (
    'Problemas com Merenda',
    'Alerta quando há alto número de refeições não consumidas',
    'ALERT_MEAL_ISSUES',
    'school',
    'meal',
    jsonb_build_object('days_to_check', 7, 'min_complaints', 5),
    'info',
    'Escola {entity_id} está com problemas na aceitação da merenda',
    ARRAY['dashboard'],
    ARRAY['school_director', 'meal_coordinator'],
    'weekly'
  )
  ON CONFLICT (rule_code) DO NOTHING;
  
  -- Regra 9: Aluno sem matrícula ativa
  INSERT INTO alert_rules (
    rule_name,
    rule_description,
    rule_code,
    entity_type,
    condition_type,
    condition_config,
    alert_type,
    alert_message_template,
    notification_channels,
    target_roles,
    check_frequency
  ) VALUES (
    'Aluno sem Matrícula Ativa',
    'Alerta quando aluno não possui matrícula ativa no ano letivo',
    'ALERT_NO_ACTIVE_ENROLLMENT',
    'student',
    'compliance',
    jsonb_build_object('academic_year', EXTRACT(YEAR FROM CURRENT_DATE)),
    'critical',
    'Aluno {entity_id} não possui matrícula ativa',
    ARRAY['dashboard', 'email'],
    ARRAY['school_director', 'secretary'],
    'daily'
  )
  ON CONFLICT (rule_code) DO NOTHING;
  
  -- Regra 10: Baixa taxa de aprovação de PEIs
  INSERT INTO alert_rules (
    rule_name,
    rule_description,
    rule_code,
    entity_type,
    condition_type,
    condition_config,
    alert_type,
    alert_message_template,
    notification_channels,
    target_roles,
    check_frequency
  ) VALUES (
    'Baixa Taxa de Aprovação de PEIs',
    'Alerta quando escola tem menos de 70% de PEIs aprovados',
    'ALERT_LOW_PEI_APPROVAL_RATE',
    'school',
    'performance',
    jsonb_build_object('threshold_percent', 70.0),
    'warning',
    'Escola {entity_id} está com baixa taxa de aprovação de PEIs',
    ARRAY['dashboard', 'email'],
    ARRAY['education_secretary', 'school_director'],
    'weekly'
  )
  ON CONFLICT (rule_code) DO NOTHING;
  
  RAISE NOTICE '✅ 10 novas regras de alerta registradas!';
END $$;

-- ============================================================================
-- PARTE 3: ATUALIZAR FUNÇÃO check_and_generate_alerts
-- ============================================================================

-- Adicionar suporte para novos tipos de condições na função existente
CREATE OR REPLACE FUNCTION check_and_generate_alerts(p_rule_id uuid)
RETURNS integer AS $$
DECLARE
  v_rule RECORD;
  v_entity RECORD;
  v_count integer := 0;
  v_result jsonb;
BEGIN
  SELECT * INTO v_rule FROM alert_rules WHERE id = p_rule_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Executar validação baseada no tipo de condição
  CASE v_rule.condition_type
    WHEN 'absence' THEN
      -- Alerta de ausência prolongada (já implementado)
      FOR v_entity IN 
        SELECT DISTINCT s.id as student_id, s.school_id
        FROM students s
        LEFT JOIN attendance a ON a.student_id = s.id 
          AND a.data >= CURRENT_DATE - INTERVAL '15 days'
        WHERE s.is_active = true
        GROUP BY s.id, s.school_id
        HAVING COUNT(a.id) = 0 OR COUNT(a.id) FILTER (WHERE a.presente = true) = 0
      LOOP
        PERFORM generate_automatic_alert(
          p_rule_id,
          'student',
          v_entity.student_id,
          jsonb_build_object('school_id', v_entity.school_id, 'days_absent', 15)
        );
        v_count := v_count + 1;
      END LOOP;
      
    WHEN 'performance' THEN
      -- Baixo desempenho ou baixa taxa de aprovação
      IF v_rule.rule_code = 'ALERT_LOW_PERFORMANCE' THEN
        FOR v_entity IN
          SELECT s.id as student_id, s.school_id
          FROM students s
          WHERE s.is_active = true
        LOOP
          SELECT validate_alert_low_performance(
            v_entity.student_id,
            (v_rule.condition_config->>'threshold')::numeric
          ) INTO v_result;
          
          IF v_result->>'status' = 'failed' THEN
            PERFORM generate_automatic_alert(
              p_rule_id,
              'student',
              v_entity.student_id,
              v_result->'data'
            );
            v_count := v_count + 1;
          END IF;
        END LOOP;
      ELSIF v_rule.rule_code = 'ALERT_LOW_PEI_APPROVAL_RATE' THEN
        -- Verificar taxa de aprovação por escola
        FOR v_entity IN
          SELECT 
            s.id as school_id,
            COUNT(*) FILTER (WHERE p.status = 'approved')::numeric / NULLIF(COUNT(*), 0) * 100 as approval_rate
          FROM schools s
          LEFT JOIN students st ON st.school_id = s.id
          LEFT JOIN peis p ON p.student_id = st.id
          WHERE s.is_active = true
          GROUP BY s.id
          HAVING COUNT(*) FILTER (WHERE p.status = 'approved')::numeric / NULLIF(COUNT(*), 0) * 100 < 
            (v_rule.condition_config->>'threshold_percent')::numeric
        LOOP
          PERFORM generate_automatic_alert(
            p_rule_id,
            'school',
            v_entity.school_id,
            jsonb_build_object('approval_rate', v_entity.approval_rate)
          );
          v_count := v_count + 1;
        END LOOP;
      END IF;
      
    WHEN 'compliance' THEN
      -- Documentos pendentes ou matrícula
      IF v_rule.rule_code = 'ALERT_MISSING_DOCUMENTS' THEN
        FOR v_entity IN
          SELECT s.id as student_id, s.school_id
          FROM students s
          WHERE s.is_active = true
        LOOP
          SELECT validate_alert_missing_documents(v_entity.student_id) INTO v_result;
          
          IF v_result->>'status' = 'failed' THEN
            PERFORM generate_automatic_alert(
              p_rule_id,
              'student',
              v_entity.student_id,
              v_result->'data'
            );
            v_count := v_count + 1;
          END IF;
        END LOOP;
      END IF;
      
    WHEN 'expiry' THEN
      -- PEI vencendo ou vencido
      IF v_rule.rule_code IN ('ALERT_PEI_EXPIRING', 'ALERT_PEI_EXPIRED') THEN
        FOR v_entity IN
          SELECT DISTINCT s.id as student_id, s.school_id
          FROM students s
          INNER JOIN peis p ON p.student_id = s.id AND p.status = 'approved'
          WHERE s.is_active = true
        LOOP
          SELECT validate_alert_pei_expiring(
            v_entity.student_id,
            (v_rule.condition_config->>'days_before_expiry')::integer
          ) INTO v_result;
          
          IF v_result->>'status' = 'failed' THEN
            PERFORM generate_automatic_alert(
              p_rule_id,
              'student',
              v_entity.student_id,
              v_result->'data'
            );
            v_count := v_count + 1;
          END IF;
        END LOOP;
      END IF;
      
    WHEN 'budget' THEN
      -- Orçamento excedido
      FOR v_entity IN
        SELECT s.id as school_id
        FROM schools s
        WHERE s.is_active = true
      LOOP
        SELECT validate_alert_budget_exceeded(
          v_entity.school_id,
          NULL,
          (v_rule.condition_config->>'threshold_percent')::numeric
        ) INTO v_result;
        
        IF v_result->>'status' = 'failed' THEN
          PERFORM generate_automatic_alert(
            p_rule_id,
            'school',
            v_entity.school_id,
            v_result->'data'
          );
          v_count := v_count + 1;
        END IF;
      END LOOP;
      
    WHEN 'transport' THEN
      -- Atrasos no transporte
      FOR v_entity IN
        SELECT tr.id as route_id, tr.school_id
        FROM transport_routes tr
        WHERE tr.is_active = true
      LOOP
        SELECT validate_alert_transport_delays(
          v_entity.route_id,
          (v_rule.condition_config->>'days_to_check')::integer,
          (v_rule.condition_config->>'max_delays')::integer
        ) INTO v_result;
        
        IF v_result->>'status' = 'failed' THEN
          PERFORM generate_automatic_alert(
            p_rule_id,
            'school',
            v_entity.school_id,
            jsonb_build_object('route_id', v_entity.route_id) || (v_result->'data')
          );
          v_count := v_count + 1;
        END IF;
      END LOOP;
      
    WHEN 'meal' THEN
      -- Problemas com merenda
      FOR v_entity IN
        SELECT s.id as school_id
        FROM schools s
        WHERE s.is_active = true
      LOOP
        SELECT validate_alert_meal_issues(
          v_entity.school_id,
          (v_rule.condition_config->>'days_to_check')::integer,
          (v_rule.condition_config->>'min_complaints')::integer
        ) INTO v_result;
        
        IF v_result->>'status' IN ('failed', 'warning') THEN
          PERFORM generate_automatic_alert(
            p_rule_id,
            'school',
            v_entity.school_id,
            v_result->'data'
          );
          v_count := v_count + 1;
        END IF;
      END LOOP;
      
    ELSE
      -- Outros tipos de condições
      NULL;
  END CASE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 4: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Expansão de regras de alertas concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criadas 7 funções de validação adicionais';
  RAISE NOTICE '  2. ✅ Registradas 10 novas regras de alerta';
  RAISE NOTICE '  3. ✅ Atualizada função check_and_generate_alerts para suportar novos tipos';
  RAISE NOTICE '';
  RAISE NOTICE 'Novas regras criadas:';
  RAISE NOTICE '  - ALERT_LOW_PERFORMANCE (baixo desempenho)';
  RAISE NOTICE '  - ALERT_HIGH_ABSENCE_RATE (ausência elevada)';
  RAISE NOTICE '  - ALERT_MISSING_DOCUMENTS (documentos pendentes)';
  RAISE NOTICE '  - ALERT_PEI_EXPIRING (PEI vencendo)';
  RAISE NOTICE '  - ALERT_PEI_EXPIRED (PEI vencido)';
  RAISE NOTICE '  - ALERT_BUDGET_EXCEEDED (orçamento)';
  RAISE NOTICE '  - ALERT_TRANSPORT_DELAYS (transporte)';
  RAISE NOTICE '  - ALERT_MEAL_ISSUES (merenda)';
  RAISE NOTICE '  - ALERT_NO_ACTIVE_ENROLLMENT (matrícula)';
  RAISE NOTICE '  - ALERT_LOW_PEI_APPROVAL_RATE (aprovação PEIs)';
END $$;

