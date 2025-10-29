-- ============================================================================
-- PEI COLLAB - REFRESH SCHEMA CACHE (VERSÃO SIMPLIFICADA)
-- Script simplificado para forçar atualização do cache do schema
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FORÇAR REFRESH DO SCHEMA CACHE
-- ----------------------------------------------------------------------------

-- Notificar o PostgREST para recarregar o schema
SELECT pg_notify('pgrst', 'reload schema');

-- ----------------------------------------------------------------------------
-- 2. VERIFICAR TABELAS EXISTENTES
-- ----------------------------------------------------------------------------

-- Verificar se as tabelas existem
SELECT 
    'Tabelas encontradas' as status,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles')
ORDER BY table_name;

-- ----------------------------------------------------------------------------
-- 3. VERIFICAR DADOS NAS TABELAS
-- ----------------------------------------------------------------------------

-- Contar registros em cada tabela
SELECT 
    'profiles' as tabela,
    COUNT(*) as total_registros
FROM "public"."profiles"
UNION ALL
SELECT 
    'user_roles' as tabela,
    COUNT(*) as total_registros
FROM "public"."user_roles";

-- ----------------------------------------------------------------------------
-- 4. TESTAR RELAÇÃO SIMPLES
-- ----------------------------------------------------------------------------

-- Testar join básico entre profiles e user_roles
SELECT 
    'Teste de Relação' as teste,
    p.id,
    p.full_name,
    ur.role
FROM "public"."profiles" p
LEFT JOIN "public"."user_roles" ur ON ur.user_id = p.id
LIMIT 3;

-- ----------------------------------------------------------------------------
-- 5. TESTAR FUNÇÃO RPC
-- ----------------------------------------------------------------------------

-- Testar função get_user_primary_role se existir
DO $$
DECLARE
    test_user_id UUID;
    test_role TEXT;
BEGIN
    -- Buscar um usuário para testar
    SELECT id INTO test_user_id FROM "public"."profiles" LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        BEGIN
            -- Testar função RPC
            SELECT "public"."get_user_primary_role"(test_user_id) INTO test_role;
            RAISE NOTICE 'Função RPC funcionando! User: %, Role: %', test_user_id, test_role;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Função RPC não disponível ou com erro: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para testar RPC';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6. FORÇAR REBUILD DO CACHE COM QUERIES SIMPLES
-- ----------------------------------------------------------------------------

-- Executar queries simples que forçam o PostgREST a reconstruir o cache
SELECT 'Forçando rebuild do cache...' as status;

-- Query 1: Verificar estrutura da tabela profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Query 2: Verificar estrutura da tabela user_roles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Query 3: Verificar foreign keys
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('profiles', 'user_roles')
ORDER BY tc.table_name, kcu.column_name;

-- ----------------------------------------------------------------------------
-- 7. VERIFICAÇÃO FINAL
-- ----------------------------------------------------------------------------

-- Testar query que usa a relação (esta é a que deve funcionar na aplicação)
SELECT 
    'Verificação Final' as teste,
    p.id,
    p.full_name,
    ur.role,
    CASE 
        WHEN p.tenant_id IS NOT NULL AND p.school_id IS NULL THEN 'Network Admin'
        WHEN p.school_id IS NOT NULL THEN 'School User'
        ELSE 'Global Admin'
    END as user_type
FROM "public"."profiles" p
LEFT JOIN "public"."user_roles" ur ON ur.user_id = p.id
LIMIT 3;

-- ----------------------------------------------------------------------------
-- 8. MENSAGEM FINAL
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ Cache do schema atualizado!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '📋 Próximos passos:';
    RAISE NOTICE '1. Aguarde 30 segundos para o cache ser aplicado';
    RAISE NOTICE '2. Reinicie a aplicação';
    RAISE NOTICE '3. Teste o login no admin';
    RAISE NOTICE '4. Verifique se os dashboards estão funcionando';
    RAISE NOTICE '==================================================';
END $$;


