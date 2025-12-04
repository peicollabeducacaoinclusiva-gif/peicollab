-- ============================================================================
-- SCRIPT DE VALIDAÇÃO DA PADRONIZAÇÃO DE AUDITORIA
-- Verifica que todas as estruturas estão usando audit_events
-- ============================================================================
-- Data: 2025-01-28
-- Uso: Execute este script para validar que a padronização está completa
-- ============================================================================

DO $$
DECLARE
    v_check_count integer;
    v_error_count integer := 0;
    v_warning_count integer := 0;
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'VALIDAÇÃO DA PADRONIZAÇÃO DE AUDITORIA';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';

    -- ========================================================================
    -- 1. VERIFICAR SE audit_events EXISTE
    -- ========================================================================
    RAISE NOTICE '1. Verificando estrutura canônica audit_events...';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_events'
    ) THEN
        SELECT COUNT(*) INTO v_check_count FROM "public"."audit_events";
        RAISE NOTICE '   ✅ audit_events existe (% registros)', v_check_count;
    ELSE
        RAISE WARNING '   ❌ audit_events NÃO existe!';
        v_error_count := v_error_count + 1;
    END IF;
    
    -- ========================================================================
    -- 2. VERIFICAR SE FUNÇÃO log_audit_event EXISTE
    -- ========================================================================
    RAISE NOTICE '';
    RAISE NOTICE '2. Verificando função RPC log_audit_event...';
    
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname = 'log_audit_event'
    ) THEN
        RAISE NOTICE '   ✅ log_audit_event existe';
    ELSE
        RAISE WARNING '   ❌ log_audit_event NÃO existe!';
        v_error_count := v_error_count + 1;
    END IF;
    
    -- ========================================================================
    -- 3. VERIFICAR SE FUNÇÃO get_audit_trail EXISTE
    -- ========================================================================
    RAISE NOTICE '';
    RAISE NOTICE '3. Verificando função RPC get_audit_trail...';
    
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname = 'get_audit_trail'
    ) THEN
        RAISE NOTICE '   ✅ get_audit_trail existe';
    ELSE
        RAISE WARNING '   ❌ get_audit_trail NÃO existe!';
        v_error_count := v_error_count + 1;
    END IF;
    
    -- ========================================================================
    -- 4. VERIFICAR SE FUNÇÃO audit_trigger_function USA audit_events
    -- ========================================================================
    RAISE NOTICE '';
    RAISE NOTICE '4. Verificando se audit_trigger_function usa audit_events...';
    
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname = 'audit_trigger_function'
    ) THEN
        -- Verificar se a função chama log_audit_event
        IF EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            JOIN pg_proc_info pi ON pi.proc_id = p.oid
            WHERE n.nspname = 'public'
            AND p.proname = 'audit_trigger_function'
            AND (
                pg_get_functiondef(p.oid) LIKE '%log_audit_event%'
                OR pg_get_functiondef(p.oid) LIKE '%audit_events%'
            )
        ) THEN
            RAISE NOTICE '   ✅ audit_trigger_function usa audit_events';
        ELSE
            RAISE WARNING '   ⚠️  audit_trigger_function pode não estar usando audit_events';
            RAISE WARNING '       Verifique se está chamando log_audit_event';
            v_warning_count := v_warning_count + 1;
        END IF;
    ELSE
        RAISE WARNING '   ⚠️  audit_trigger_function não existe';
        v_warning_count := v_warning_count + 1;
    END IF;
    
    -- ========================================================================
    -- 5. VERIFICAR SE FUNÇÃO get_audit_history FOI ATUALIZADA
    -- ========================================================================
    RAISE NOTICE '';
    RAISE NOTICE '5. Verificando se get_audit_history usa audit_events...';
    
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname = 'get_audit_history'
    ) THEN
        -- Verificar se usa audit_events
        IF EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
            AND p.proname = 'get_audit_history'
            AND (
                pg_get_functiondef(p.oid) LIKE '%audit_events%'
                OR pg_get_functiondef(p.oid) LIKE '%get_audit_trail%'
            )
        ) THEN
            RAISE NOTICE '   ✅ get_audit_history usa audit_events';
        ELSE
            RAISE WARNING '   ⚠️  get_audit_history pode ainda estar usando audit_log';
            RAISE WARNING '       Execute migração 20250128000002_update_get_audit_history_to_use_audit_events.sql';
            v_warning_count := v_warning_count + 1;
        END IF;
    ELSE
        RAISE NOTICE '   ℹ️  get_audit_history não existe (não é obrigatório)';
    END IF;
    
    -- ========================================================================
    -- 6. CONTAR TRIGGERS QUE USAM audit_trigger_function
    -- ========================================================================
    RAISE NOTICE '';
    RAISE NOTICE '6. Contando triggers que usam audit_trigger_function...';
    
    SELECT COUNT(*) INTO v_check_count
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname = 'audit_trigger_function'
    AND t.tgname LIKE 'audit_%';
    
    RAISE NOTICE '   ✅ % triggers encontrados usando audit_trigger_function', v_check_count;
    
    -- ========================================================================
    -- 7. VERIFICAR VIEWS DE COMPATIBILIDADE
    -- ========================================================================
    RAISE NOTICE '';
    RAISE NOTICE '7. Verificando views de compatibilidade...';
    
    -- audit_log_compat (deve existir para compatibilidade)
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_log_compat'
    ) THEN
        RAISE NOTICE '   ✅ audit_log_compat existe (view de compatibilidade)';
    ELSE
        RAISE NOTICE '   ℹ️  audit_log_compat não existe (pode não ser necessário)';
    END IF;
    
    -- ========================================================================
    -- 8. RESUMO FINAL
    -- ========================================================================
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'RESUMO DA VALIDAÇÃO';
    RAISE NOTICE '============================================================================';
    
    IF v_error_count = 0 AND v_warning_count = 0 THEN
        RAISE NOTICE '✅ VALIDAÇÃO PASSOU: Padronização completa!';
        RAISE NOTICE '';
        RAISE NOTICE 'Todos os componentes estão usando audit_events (tabela canônica).';
    ELSIF v_error_count = 0 THEN
        RAISE NOTICE '⚠️  VALIDAÇÃO PASSOU COM AVISOS: % aviso(s)', v_warning_count;
        RAISE NOTICE '';
        RAISE NOTICE 'Revisar os avisos acima para garantir padronização completa.';
    ELSE
        RAISE WARNING '❌ VALIDAÇÃO FALHOU: % erro(s) encontrado(s)', v_error_count;
        RAISE WARNING '';
        RAISE WARNING 'Corrija os erros acima antes de considerar padronização completa.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    
END $$;

