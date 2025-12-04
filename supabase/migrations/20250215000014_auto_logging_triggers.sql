-- ============================================================================
-- MIGRAÇÃO: Logging Automático em RPCs Críticos
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar função wrapper para logging automático de RPCs
--   2. Criar triggers para auditoria automática em tabelas críticas
--   3. Integrar logging de performance em operações críticas
-- ============================================================================

-- ============================================================================
-- PARTE 1: FUNÇÃO WRAPPER PARA LOGGING DE RPCs
-- ============================================================================

-- Função genérica para envolver RPCs com logging automático
CREATE OR REPLACE FUNCTION execute_with_logging(
  p_function_name text,
  p_function_params jsonb,
  p_operation_type text DEFAULT 'rpc'
)
RETURNS jsonb AS $$
DECLARE
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_execution_time_ms numeric;
  v_result jsonb;
  v_error_message text;
  v_user_id uuid;
  v_tenant_id uuid;
  v_school_id uuid;
BEGIN
  v_start_time := clock_timestamp();
  v_user_id := auth.uid();
  
  -- Buscar tenant_id e school_id do usuário
  SELECT tenant_id, school_id INTO v_tenant_id, v_school_id
  FROM profiles
  WHERE id = v_user_id
  LIMIT 1;
  
  BEGIN
    -- Executar função dinamicamente
    EXECUTE format('SELECT %I($1)', p_function_name)
    USING p_function_params
    INTO v_result;
    
    v_end_time := clock_timestamp();
    v_execution_time_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    -- Registrar métrica de sucesso
    PERFORM log_performance_metric(
      p_endpoint := p_function_name,
      p_operation_type := p_operation_type,
      p_execution_time_ms := v_execution_time_ms,
      p_status := 'success',
      p_user_id := v_user_id,
      p_tenant_id := v_tenant_id,
      p_school_id := v_school_id,
      p_metadata := jsonb_build_object('params', p_function_params)
    );
    
    RETURN jsonb_build_object('success', true, 'data', v_result);
    
  EXCEPTION WHEN OTHERS THEN
    v_end_time := clock_timestamp();
    v_execution_time_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    v_error_message := SQLERRM;
    
    -- Registrar métrica de erro
    PERFORM log_performance_metric(
      p_endpoint := p_function_name,
      p_operation_type := p_operation_type,
      p_execution_time_ms := v_execution_time_ms,
      p_status := 'error',
      p_user_id := v_user_id,
      p_tenant_id := v_tenant_id,
      p_school_id := v_school_id,
      p_error_message := v_error_message,
      p_metadata := jsonb_build_object('params', p_function_params, 'error', v_error_message)
    );
    
    -- Registrar evento de segurança se for erro crítico
    IF v_error_message LIKE '%permission%' OR v_error_message LIKE '%unauthorized%' THEN
      PERFORM log_security_event(
        p_event_type := 'unauthorized_access',
        p_severity := 'high',
        p_event_description := format('Tentativa de acesso não autorizado à função %s', p_function_name),
        p_user_id := v_user_id,
        p_event_details := jsonb_build_object('function', p_function_name, 'error', v_error_message)
      );
    END IF;
    
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 2: TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- ============================================================================

-- Função de trigger para auditoria automática (já existe, mas vamos melhorar)
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
  v_school_id uuid;
  v_changed_fields text[] := ARRAY[]::text[];
  v_field text;
  v_old_value text;
  v_new_value text;
BEGIN
  v_user_id := auth.uid();
  
  -- Buscar tenant_id e school_id
  SELECT tenant_id, school_id INTO v_tenant_id, v_school_id
  FROM profiles
  WHERE id = v_user_id
  LIMIT 1;
  
  IF TG_OP = 'UPDATE' THEN
    -- Identificar campos alterados
    FOR v_field IN SELECT column_name FROM information_schema.columns 
      WHERE table_name = TG_TABLE_NAME 
      AND column_name NOT IN ('created_at', 'updated_at', 'id')
    LOOP
      EXECUTE format('SELECT ($1.%I)::text, ($2.%I)::text', v_field, v_field)
      USING OLD, NEW
      INTO v_old_value, v_new_value;
      
      IF v_old_value IS DISTINCT FROM v_new_value THEN
        v_changed_fields := v_changed_fields || v_field;
      END IF;
    END LOOP;
    
    -- Registrar log de auditoria
    PERFORM log_audit_event(
      p_action_type := 'update',
      p_entity_type := TG_TABLE_NAME,
      p_entity_id := NEW.id,
      p_action_description := format('Atualização de %s', TG_TABLE_NAME),
      p_old_values := to_jsonb(OLD),
      p_new_values := to_jsonb(NEW),
      p_changed_fields := v_changed_fields,
      p_user_id := v_user_id,
      p_tenant_id := v_tenant_id,
      p_school_id := v_school_id
    );
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      p_action_type := 'delete',
      p_entity_type := TG_TABLE_NAME,
      p_entity_id := OLD.id,
      p_action_description := format('Exclusão de %s', TG_TABLE_NAME),
      p_old_values := to_jsonb(OLD),
      p_new_values := NULL,
      p_changed_fields := NULL,
      p_user_id := v_user_id,
      p_tenant_id := v_tenant_id,
      p_school_id := v_school_id
    );
    
    RETURN OLD;
    
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      p_action_type := 'create',
      p_entity_type := TG_TABLE_NAME,
      p_entity_id := NEW.id,
      p_action_description := format('Criação de %s', TG_TABLE_NAME),
      p_old_values := NULL,
      p_new_values := to_jsonb(NEW),
      p_changed_fields := NULL,
      p_user_id := v_user_id,
      p_tenant_id := v_tenant_id,
      p_school_id := v_school_id
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers em tabelas críticas
DROP TRIGGER IF EXISTS audit_students_trigger ON students;
CREATE TRIGGER audit_students_trigger
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_professionals_trigger ON professionals;
CREATE TRIGGER audit_professionals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_peis_trigger ON peis;
CREATE TRIGGER audit_peis_trigger
  AFTER INSERT OR UPDATE OR DELETE ON peis
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_classes_trigger ON classes;
CREATE TRIGGER audit_classes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_schools_trigger ON schools;
CREATE TRIGGER audit_schools_trigger
  AFTER INSERT OR UPDATE OR DELETE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_student_enrollments_trigger ON student_enrollments;
CREATE TRIGGER audit_student_enrollments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON student_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- PARTE 3: FUNÇÃO PARA LOGGING AUTOMÁTICO EM RPCs CRÍTICOS
-- ============================================================================

-- Wrapper para RPCs críticos com logging automático
CREATE OR REPLACE FUNCTION create_professional_with_logging(
  p_tenant_id uuid,
  p_school_id uuid,
  p_payload jsonb
)
RETURNS uuid AS $$
DECLARE
  v_start_time timestamptz;
  v_result uuid;
BEGIN
  v_start_time := clock_timestamp();
  
  -- Chamar RPC original
  SELECT create_professional_for_network(p_tenant_id, p_school_id, p_payload) INTO v_result;
  
  -- Logging automático de performance
  PERFORM log_performance_metric(
    p_endpoint := 'create_professional_for_network',
    p_operation_type := 'mutation',
    p_execution_time_ms := EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
    p_status := 'success',
    p_user_id := auth.uid(),
    p_tenant_id := p_tenant_id,
    p_school_id := p_school_id,
    p_records_processed := 1
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Similar para outras RPCs críticas
CREATE OR REPLACE FUNCTION create_student_enrollment_with_logging(
  p_student_id uuid,
  p_school_id uuid,
  p_academic_year integer,
  p_grade text,
  p_class_name text,
  p_shift text,
  p_class_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_start_time timestamptz;
  v_result uuid;
BEGIN
  v_start_time := clock_timestamp();
  
  SELECT create_student_enrollment(
    p_student_id, p_school_id, p_academic_year, p_grade, p_class_name, p_shift, p_class_id
  ) INTO v_result;
  
  PERFORM log_performance_metric(
    p_endpoint := 'create_student_enrollment',
    p_operation_type := 'mutation',
    p_execution_time_ms := EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
    p_status := 'success',
    p_user_id := auth.uid(),
    p_school_id := p_school_id,
    p_records_processed := 1
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 4: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de logging automático concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada função execute_with_logging para wrapper genérico';
  RAISE NOTICE '  2. ✅ Melhorada função audit_trigger_function';
  RAISE NOTICE '  3. ✅ Aplicados triggers de auditoria em 6 tabelas críticas';
  RAISE NOTICE '  4. ✅ Criadas funções wrapper com logging para RPCs críticos';
  RAISE NOTICE '';
  RAISE NOTICE 'Tabelas com auditoria automática:';
  RAISE NOTICE '  - students';
  RAISE NOTICE '  - professionals';
  RAISE NOTICE '  - peis';
  RAISE NOTICE '  - classes';
  RAISE NOTICE '  - schools';
  RAISE NOTICE '  - student_enrollments';
END $$;

