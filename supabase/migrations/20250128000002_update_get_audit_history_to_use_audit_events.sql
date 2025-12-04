-- ============================================================================
-- ATUALIZAÇÃO DA FUNÇÃO get_audit_history PARA USAR audit_events
-- Atualiza função RPC para usar tabela canônica audit_events
-- ============================================================================
-- Data: 2025-01-28
-- Descrição: Atualiza get_audit_history para usar audit_events ao invés de audit_log
-- ============================================================================

-- ============================================================================
-- PARTE 1: ATUALIZAR FUNÇÃO get_audit_history
-- ============================================================================

-- Função atualizada para buscar histórico usando audit_events
CREATE OR REPLACE FUNCTION "public"."get_audit_history"(
    p_table_name text,
    p_record_id text,
    p_limit integer DEFAULT 50
)
RETURNS TABLE (
    id uuid,
    action text,
    old_data jsonb,
    new_data jsonb,
    changed_by uuid,
    changed_at timestamptz,
    changed_by_name text,
    changed_by_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_entity_type text;
    v_entity_id uuid;
    v_tenant_id uuid;
BEGIN
    -- Converter table_name para entity_type
    v_entity_type := CASE p_table_name
        WHEN 'students' THEN 'student'
        WHEN 'peis' THEN 'pei'
        WHEN 'schools' THEN 'school'
        WHEN 'professionals' THEN 'professional'
        WHEN 'classes' THEN 'class'
        WHEN 'enrollments' THEN 'enrollment'
        WHEN 'enrollment_requests' THEN 'enrollment_request'
        WHEN 'grades' THEN 'grade'
        WHEN 'attendance' THEN 'attendance'
        WHEN 'daily_attendance_records' THEN 'daily_attendance'
        WHEN 'descriptive_reports' THEN 'descriptive_report'
        WHEN 'evaluation_configs' THEN 'evaluation_config'
        WHEN 'certificates' THEN 'certificate'
        WHEN 'class_diary' THEN 'class_diary'
        WHEN 'diary_occurrences' THEN 'diary_occurrence'
        WHEN 'tenants' THEN 'tenant'
        ELSE LOWER(p_table_name)
    END;
    
    -- Converter record_id para uuid
    BEGIN
        v_entity_id := p_record_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid record_id format: %', p_record_id;
    END;
    
    -- Tentar obter tenant_id do registro (para filtrar corretamente)
    -- Isso é necessário porque audit_events requer tenant_id
    BEGIN
        CASE v_entity_type
            WHEN 'student' THEN
                SELECT tenant_id INTO v_tenant_id
                FROM "public"."students"
                WHERE id = v_entity_id;
                
            WHEN 'pei' THEN
                SELECT tenant_id INTO v_tenant_id
                FROM "public"."peis"
                WHERE id = v_entity_id;
                
            WHEN 'school' THEN
                SELECT tenant_id INTO v_tenant_id
                FROM "public"."schools"
                WHERE id = v_entity_id;
                
            WHEN 'professional' THEN
                SELECT tenant_id INTO v_tenant_id
                FROM "public"."professionals"
                WHERE id = v_entity_id;
                
            WHEN 'class' THEN
                SELECT s.tenant_id INTO v_tenant_id
                FROM "public"."classes" c
                JOIN "public"."schools" s ON s.id = c.school_id
                WHERE c.id = v_entity_id;
                
            WHEN 'tenant' THEN
                v_tenant_id := v_entity_id;
                
            ELSE
                -- Tentar obter do perfil do usuário atual como fallback
                SELECT tenant_id INTO v_tenant_id
                FROM "public"."profiles"
                WHERE id = auth.uid()
                LIMIT 1;
        END CASE;
    EXCEPTION WHEN OTHERS THEN
        -- Se não conseguir obter tenant_id, usar NULL
        -- A função get_audit_trail pode retornar vazio se não tiver tenant_id
        v_tenant_id := NULL;
    END;
    
    -- Se não tiver tenant_id, tentar retornar vazio ou usar get_audit_trail com tenant_id NULL
    -- Mas para compatibilidade, vamos tentar buscar em audit_log se ainda existir
    IF v_tenant_id IS NULL THEN
        -- Fallback: buscar em audit_log (tabela antiga) se ainda existir
        -- Isso garante compatibilidade durante a transição
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'audit_log'
        ) THEN
            RETURN QUERY
            SELECT 
                al.id,
                al.action,
                al.old_data,
                al.new_data,
                al.changed_by,
                al.changed_at,
                p.full_name as changed_by_name,
                p.email as changed_by_email
            FROM "public"."audit_log" al
            LEFT JOIN "public"."profiles" p ON p.id = al.changed_by
            WHERE al.table_name = p_table_name
                AND al.record_id = p_record_id
            ORDER BY al.changed_at DESC
            LIMIT p_limit;
            RETURN;
        END IF;
        
        -- Se não tiver tenant_id nem audit_log, retornar vazio
        RETURN;
    END IF;
    
    -- Usar get_audit_trail para buscar em audit_events
    RETURN QUERY
    SELECT 
        ae.id,
        ae.action::text,
        ae.metadata->'old_values' as old_data,
        ae.metadata->'new_values' as new_data,
        ae.actor_id as changed_by,
        ae.created_at as changed_at,
        p.full_name as changed_by_name,
        p.email as changed_by_email
    FROM "public"."audit_events" ae
    LEFT JOIN "public"."profiles" p ON p.id = ae.actor_id
    WHERE ae.tenant_id = v_tenant_id
        AND ae.entity_type = v_entity_type
        AND ae.entity_id = v_entity_id
    ORDER BY ae.created_at DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION "public"."get_audit_history" IS 
    'Retorna histórico de alterações de um registro específico usando audit_events (tabela canônica). '
    'Mantém compatibilidade com audit_log durante transição.';

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- Esta migração atualiza a função get_audit_history para usar audit_events.
--
-- Funcionalidades:
-- 1. Mapeia table_name para entity_type
-- 2. Obtém tenant_id automaticamente da entidade
-- 3. Usa audit_events (tabela canônica) para buscar histórico
-- 4. Mantém fallback para audit_log durante transição (compatibilidade)
--
-- Compatibilidade:
-- - Mantém interface antiga (p_table_name, p_record_id, p_limit)
-- - Retorna formato idêntico ao anterior
-- - Fallback para audit_log se tenant_id não for encontrado
-- ============================================================================

