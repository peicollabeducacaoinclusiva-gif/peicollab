-- ============================================================================
-- CONSOLIDAÇÃO DE AUDITORIA
-- Migra dados de audit_log e audit_logs (antigas) para audit_events (nova)
-- ============================================================================

-- PARTE 1: MIGRAR DADOS DE audit_log (antiga) - se ambas existirem
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_events'
    ) AND EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_log'
    ) THEN
        INSERT INTO "public"."audit_events" (
            tenant_id,
            actor_id,
            entity_type,
            entity_id,
            action,
            ip_address,
            user_agent,
            metadata,
            created_at
        )
        SELECT 
            COALESCE(
                al.tenant_id,
                (SELECT tenant_id FROM "public"."profiles" WHERE id = al.changed_by LIMIT 1),
                (SELECT tenant_id FROM "public"."user_tenants" WHERE user_id = al.changed_by LIMIT 1)
            ) as tenant_id,
            al.changed_by as actor_id,
            COALESCE(
                al.entity_type,
                al.table_name,
                'unknown'
            ) as entity_type,
            COALESCE(
                al.record_id::uuid,
                gen_random_uuid()
            ) as entity_id,
            CASE 
                WHEN al.action = 'INSERT' THEN 'INSERT'
                WHEN al.action = 'UPDATE' THEN 'UPDATE'
                WHEN al.action = 'DELETE' THEN 'DELETE'
                ELSE 'READ'
            END as action,
            NULL as ip_address,
            NULL as user_agent,
            jsonb_build_object(
                'source', 'audit_log_migration',
                'original_id', al.id,
                'table_name', al.table_name,
                'record_id', al.record_id,
                'old_values', al.old_values,
                'new_values', al.new_values,
                'change_summary', al.change_summary
            ) as metadata,
            COALESCE(al.changed_at, al.created_at, now()) as created_at
        FROM "public"."audit_log" al
        WHERE NOT EXISTS (
            SELECT 1 FROM "public"."audit_events" ae
            WHERE ae.actor_id = al.changed_by
                AND ae.created_at = COALESCE(al.changed_at, al.created_at)
                AND ae.metadata->>'original_id' = al.id::text
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Dados migrados de audit_log para audit_events';
    END IF;
END $$;

-- PARTE 2: MIGRAR DADOS DE audit_logs (intermediária) - se ambas existirem
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_events'
    ) AND EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
    ) THEN
        INSERT INTO "public"."audit_events" (
            tenant_id,
            actor_id,
            entity_type,
            entity_id,
            action,
            ip_address,
            user_agent,
            metadata,
            created_at
        )
        SELECT 
            COALESCE(
                al.tenant_id,
                (SELECT tenant_id FROM "public"."profiles" WHERE id = al.user_id LIMIT 1)
            ) as tenant_id,
            al.user_id as actor_id,
            COALESCE(al.entity_type, 'unknown') as entity_type,
            COALESCE(al.entity_id::uuid, gen_random_uuid()) as entity_id,
            CASE 
                WHEN al.action_type = 'create' THEN 'INSERT'
                WHEN al.action_type = 'update' THEN 'UPDATE'
                WHEN al.action_type = 'delete' THEN 'DELETE'
                WHEN al.action_type = 'view' THEN 'READ'
                WHEN al.action_type = 'export' THEN 'EXPORT'
                ELSE 'READ'
            END as action,
            al.ip_address,
            NULL as user_agent,
            jsonb_build_object(
                'source', 'audit_logs_migration',
                'original_id', al.id,
                'action_type', al.action_type,
                'severity', al.severity,
                'details', al.details,
                'user_email', al.user_email
            ) as metadata,
            al.created_at
        FROM "public"."audit_logs" al
        WHERE NOT EXISTS (
            SELECT 1 FROM "public"."audit_events" ae
            WHERE ae.actor_id = al.user_id
                AND ae.created_at = al.created_at
                AND ae.metadata->>'original_id' = al.id::text
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Dados migrados de audit_logs para audit_events';
    END IF;
END $$;

-- PARTE 3: CRIAR VIEW DE COMPATIBILIDADE (se audit_events existir)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_events'
    ) THEN
        CREATE OR REPLACE VIEW "public"."audit_log_compat" AS
        SELECT 
            ae.id,
            ae.entity_type as table_name,
            ae.entity_id::text as record_id,
            ae.actor_id as changed_by,
            CASE 
                WHEN ae.action = 'INSERT' THEN 'INSERT'
                WHEN ae.action = 'UPDATE' THEN 'UPDATE'
                WHEN ae.action = 'DELETE' THEN 'DELETE'
                ELSE 'SELECT'
            END as action,
            (ae.metadata->>'old_values')::jsonb as old_values,
            (ae.metadata->>'new_values')::jsonb as new_values,
            ae.metadata->>'change_summary' as change_summary,
            ae.created_at as changed_at,
            ae.tenant_id,
            ae.created_at
        FROM "public"."audit_events" ae
        WHERE ae.metadata->>'source' = 'audit_log_migration';

        COMMENT ON VIEW "public"."audit_log_compat" IS 
        'View de compatibilidade para audit_log. Use a tabela audit_events diretamente. DEPRECATED';
        
        RAISE NOTICE '✅ View de compatibilidade criada';
    ELSE
        RAISE NOTICE '⚠️  Tabela audit_events não existe. View de compatibilidade não criada.';
    END IF;
END $$;

-- PARTE 4: MARCAR TABELAS COMO DEPRECATED (se existirem)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_log'
    ) THEN
        COMMENT ON TABLE "public"."audit_log" IS 
        '[DEPRECATED] Esta tabela foi substituída por "audit_events". Use a tabela audit_events para novas operações.';
        
        RAISE NOTICE '✅ Tabela audit_log marcada como DEPRECATED';
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
    ) THEN
        COMMENT ON TABLE "public"."audit_logs" IS 
        '[DEPRECATED] Esta tabela foi substituída por "audit_events". Use a tabela audit_events para novas operações.';
        
        RAISE NOTICE '✅ Tabela audit_logs marcada como DEPRECATED';
    END IF;
END $$;

-- PARTE 5: LOG FINAL DA MIGRAÇÃO
-- ============================================================================

DO $$
DECLARE
    v_audit_log_count INTEGER := 0;
    v_audit_logs_count INTEGER := 0;
    v_audit_events_count INTEGER := 0;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
        SELECT COUNT(*) INTO v_audit_log_count FROM "public"."audit_log";
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
        SELECT COUNT(*) INTO v_audit_logs_count FROM "public"."audit_logs";
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_events') THEN
        SELECT COUNT(*) INTO v_audit_events_count FROM "public"."audit_events";
    END IF;
    
    RAISE NOTICE '✅ Migração de auditoria concluída';
    RAISE NOTICE '   - audit_log: % registros', v_audit_log_count;
    RAISE NOTICE '   - audit_logs: % registros', v_audit_logs_count;
    RAISE NOTICE '   - audit_events: % registros (total)', v_audit_events_count;
    RAISE NOTICE '   ⚠️  Atualize o código para usar a tabela audit_events';
END $$;
