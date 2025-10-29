-- ============================================================================
-- PEI COLLAB - QUICK FIX SCHEMA CACHE
-- Script rápido para resolver o problema de cache do schema
-- ============================================================================

-- 1. Forçar refresh do schema
SELECT pg_notify('pgrst', 'reload schema');

-- 2. Verificar se as tabelas existem
SELECT 'Tabelas:' as info, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles');

-- 3. Verificar dados
SELECT 'Dados:' as info, 
       (SELECT COUNT(*) FROM profiles) as profiles_count,
       (SELECT COUNT(*) FROM user_roles) as user_roles_count;

-- 4. Testar relação
SELECT 'Teste:' as info, p.id, p.full_name, ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LIMIT 2;

-- 5. Aguardar um pouco e testar novamente
SELECT 'Aguarde 30 segundos e teste a aplicação' as mensagem;


