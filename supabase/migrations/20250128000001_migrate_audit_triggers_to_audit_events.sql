-- ============================================================================
-- MIGRAÇÃO DE TRIGGERS DE AUDITORIA PARA audit_events
-- Atualiza triggers para usar tabela canônica audit_events via log_audit_event
-- ============================================================================
-- Data: 2025-01-28
-- Descrição: Migra função de trigger audit_trigger_function para usar audit_events
--            ao invés de audit_log, garantindo padronização e conformidade LGPD
-- ============================================================================

-- ============================================================================
-- PARTE 1: FUNÇÃO HELPER PARA OBTER TENANT_ID
-- ============================================================================

-- Função auxiliar para obter tenant_id de uma entidade
CREATE OR REPLACE FUNCTION "public"."get_tenant_id_from_entity"(
    p_table_name text,
    p_entity_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
BEGIN
    -- Mapear tabela para obter tenant_id
    CASE p_table_name
        WHEN 'students' THEN
            SELECT tenant_id INTO v_tenant_id
            FROM "public"."students"
            WHERE id = p_entity_id;
            
        WHEN 'peis' THEN
            SELECT tenant_id INTO v_tenant_id
            FROM "public"."peis"
            WHERE id = p_entity_id;
            
        WHEN 'schools' THEN
            SELECT tenant_id INTO v_tenant_id
            FROM "public"."schools"
            WHERE id = p_entity_id;
            
        WHEN 'professionals' THEN
            SELECT tenant_id INTO v_tenant_id
            FROM "public"."professionals"
            WHERE id = p_entity_id;
            
        WHEN 'classes' THEN
            SELECT s.tenant_id INTO v_tenant_id
            FROM "public"."classes" c
            JOIN "public"."schools" s ON s.id = c.school_id
            WHERE c.id = p_entity_id;
            
        WHEN 'enrollments' THEN
            SELECT st.tenant_id INTO v_tenant_id
            FROM "public"."enrollments" e
            JOIN "public"."students" st ON st.id = e.student_id
            WHERE e.id = p_entity_id;
            
        WHEN 'grades' THEN
            SELECT st.tenant_id INTO v_tenant_id
            FROM "public"."grades" g
            JOIN "public"."students" st ON st.id = g.student_id
            WHERE g.id = p_entity_id;
            
        WHEN 'attendance' THEN
            SELECT st.tenant_id INTO v_tenant_id
            FROM "public"."attendance" a
            JOIN "public"."students" st ON st.id = a.student_id
            WHERE a.id = p_entity_id;
            
        WHEN 'tenants' THEN
            SELECT id INTO v_tenant_id
            FROM "public"."tenants"
            WHERE id = p_entity_id;
            
        ELSE
            -- Tentar obter de profiles (usuários)
            BEGIN
                SELECT tenant_id INTO v_tenant_id
                FROM "public"."profiles"
                WHERE id = p_entity_id;
            EXCEPTION WHEN OTHERS THEN
                v_tenant_id := NULL;
            END;
    END CASE;
    
    -- Se ainda não encontrou, tentar via actor_id
    IF v_tenant_id IS NULL THEN
        BEGIN
            SELECT tenant_id INTO v_tenant_id
            FROM "public"."profiles"
            WHERE id = auth.uid()
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            v_tenant_id := NULL;
        END;
    END IF;
    
    RETURN v_tenant_id;
END;
$$;

COMMENT ON FUNCTION "public"."get_tenant_id_from_entity" IS 'Obtém tenant_id de uma entidade baseado na tabela e ID';

-- ============================================================================
-- PARTE 2: FUNÇÃO DE TRIGGER ATUALIZADA PARA audit_events
-- ============================================================================

-- Nova função de trigger que usa audit_events
CREATE OR REPLACE FUNCTION "public"."audit_trigger_function"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_action text;
    v_entity_id uuid;
    v_entity_type text;
    v_tenant_id uuid;
    v_old_values jsonb;
    v_new_values jsonb;
    v_metadata jsonb;
BEGIN
    -- Mapear TG_OP para action
    v_action := CASE TG_OP
        WHEN 'INSERT' THEN 'INSERT'
        WHEN 'UPDATE' THEN 'UPDATE'
        WHEN 'DELETE' THEN 'DELETE'
        ELSE 'READ'
    END;
    
    -- Obter entity_id
    v_entity_id := COALESCE((NEW.id)::uuid, (OLD.id)::uuid);
    
    -- Mapear table_name para entity_type
    v_entity_type := CASE TG_TABLE_NAME
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
        ELSE LOWER(TG_TABLE_NAME)
    END;
    
    -- Preparar valores antigos e novos
    IF TG_OP = 'DELETE' THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        v_old_values := NULL;
        v_new_values := to_jsonb(NEW);
    END IF;
    
    -- Obter tenant_id
    v_tenant_id := "public"."get_tenant_id_from_entity"(TG_TABLE_NAME, v_entity_id);
    
    -- Se não conseguiu obter tenant_id, tentar logar com tenant_id NULL (será rejeitado se RLS exigir)
    -- Mas vamos tentar obter do perfil do usuário
    IF v_tenant_id IS NULL THEN
        BEGIN
            SELECT tenant_id INTO v_tenant_id
            FROM "public"."profiles"
            WHERE id = auth.uid()
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            -- Se ainda não encontrou, usar NULL e deixar RLS decidir
            v_tenant_id := NULL;
        END;
    END IF;
    
    -- Se ainda não tem tenant_id, não podemos gravar (audit_events requer tenant_id)
    -- Mas vamos tentar uma última vez com uma busca mais ampla
    IF v_tenant_id IS NULL AND TG_OP = 'INSERT' AND NEW IS NOT NULL THEN
        -- Tentar obter de tenant_id direto do NEW (se existir)
        BEGIN
            IF TG_TABLE_NAME = 'tenants' THEN
                v_tenant_id := NEW.id;
            ELSIF TG_TABLE_NAME IN ('students', 'peis', 'schools') THEN
                v_tenant_id := NEW.tenant_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
    
    -- Preparar metadata
    v_metadata := jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'trigger_source', 'audit_trigger_function',
        'old_values', v_old_values,
        'new_values', v_new_values
    );
    
    -- Gravar evento de auditoria usando RPC (se tiver tenant_id)
    IF v_tenant_id IS NOT NULL THEN
        BEGIN
            PERFORM "public"."log_audit_event"(
                p_tenant_id := v_tenant_id,
                p_entity_type := v_entity_type,
                p_entity_id := v_entity_id,
                p_action := v_action,
                p_metadata := v_metadata
            );
        EXCEPTION WHEN OTHERS THEN
            -- Em caso de erro, logar mas não interromper operação
            RAISE WARNING 'Erro ao gravar evento de auditoria: %', SQLERRM;
        END;
    ELSE
        -- Avisar que não foi possível obter tenant_id
        RAISE WARNING 'Não foi possível obter tenant_id para auditoria da tabela % com entity_id %', TG_TABLE_NAME, v_entity_id;
    END IF;
    
    -- Retornar registro apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

COMMENT ON FUNCTION "public"."audit_trigger_function"() IS 
    'Função de trigger atualizada para gravar eventos em audit_events (tabela canônica) via log_audit_event';

-- ============================================================================
-- PARTE 3: COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION "public"."get_tenant_id_from_entity" IS 
    'Função auxiliar para obter tenant_id de uma entidade baseado na tabela e ID. Usada por triggers de auditoria.';

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- Esta migração atualiza a função audit_trigger_function() para usar
-- audit_events (tabela canônica) ao invés de audit_log (tabela antiga).
--
-- Os triggers existentes continuarão funcionando normalmente, mas agora
-- gravarão eventos na tabela canônica audit_events via RPC log_audit_event.
--
-- A função get_tenant_id_from_entity() foi criada para obter o tenant_id
-- de forma automática baseado na tabela e ID da entidade.
--
-- Se não for possível obter tenant_id, um WARNING será logado mas a
-- operação principal não será interrompida (fail-safe).
-- ============================================================================

