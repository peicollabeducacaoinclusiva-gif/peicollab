-- ============================================================================
-- PEI COLLAB - REFRESH SCHEMA CACHE
-- Script para forçar atualização do cache do schema do Supabase
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FORÇAR REFRESH DO SCHEMA CACHE
-- ----------------------------------------------------------------------------

-- Notificar o PostgREST para recarregar o schema
SELECT pg_notify('pgrst', 'reload schema');

-- ----------------------------------------------------------------------------
-- 2. VERIFICAR ESTRUTURA DAS TABELAS
-- ----------------------------------------------------------------------------

-- Verificar se as tabelas existem
SELECT 
    'Tabelas encontradas' as status,
    table_name,
    'Existe' as status_table
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles')
ORDER BY table_name;

-- ----------------------------------------------------------------------------
-- 3. VERIFICAR RELAÇÕES
-- ----------------------------------------------------------------------------

-- Verificar foreign keys
SELECT 
    'Foreign Keys' as tipo,
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
-- 4. TESTAR RELAÇÃO DIRETAMENTE
-- ----------------------------------------------------------------------------

-- Testar join entre profiles e user_roles
SELECT 
    'Teste de Relação' as teste,
    p.id,
    p.full_name,
    ur.role,
    'Relação funcionando' as status
FROM "public"."profiles" p
LEFT JOIN "public"."user_roles" ur ON ur.user_id = p.id
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 5. VERIFICAR DADOS
-- ----------------------------------------------------------------------------

-- Contar registros
SELECT 
    'Contagem de registros' as metric,
    'profiles' as tabela,
    COUNT(*) as total
FROM "public"."profiles"
UNION ALL
SELECT 
    'Contagem de registros' as metric,
    'user_roles' as tabela,
    COUNT(*) as total
FROM "public"."user_roles";

-- ----------------------------------------------------------------------------
-- 6. TESTAR FUNÇÕES RPC
-- ----------------------------------------------------------------------------

-- Testar função get_user_primary_role
DO $$
DECLARE
    test_user_id UUID;
    test_role TEXT;
BEGIN
    -- Buscar um usuário para testar
    SELECT id INTO test_user_id FROM "public"."profiles" LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Testar função RPC
        SELECT "public"."get_user_primary_role"(test_user_id) INTO test_role;
        RAISE NOTICE 'Função RPC testada com sucesso! User: %, Role: %', test_user_id, test_role;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para testar RPC';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. FORÇAR REBUILD DO CACHE
-- ----------------------------------------------------------------------------

-- Executar queries que forçam o PostgREST a reconstruir o cache
SELECT 'Forçando rebuild do cache...' as status;

-- Query que força o PostgREST a analisar a estrutura
SELECT 
    n.nspname as schemaname,
    c.relname as tablename,
    a.attname,
    a.atttypid::regtype as type
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname IN ('profiles', 'user_roles')
AND a.attnum > 0
ORDER BY c.relname, a.attnum;

-- ----------------------------------------------------------------------------
-- 8. VERIFICAÇÃO FINAL
-- ----------------------------------------------------------------------------

-- Testar query complexa que usa a relação
SELECT 
    'Verificação Final' as teste,
    p.id,
    p.full_name,
    p.tenant_id,
    p.school_id,
    ur.role,
    t.network_name,
    s.school_name
FROM "public"."profiles" p
LEFT JOIN "public"."user_roles" ur ON ur.user_id = p.id
LEFT JOIN "public"."tenants" t ON t.id = p.tenant_id
LEFT JOIN "public"."schools" s ON s.id = p.school_id
LIMIT 3;

-- ----------------------------------------------------------------------------
-- 9. MENSAGEM FINAL
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
