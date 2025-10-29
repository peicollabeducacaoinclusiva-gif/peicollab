-- ============================================================================
-- PEI COLLAB - DESABILITAR RLS TEMPORARIAMENTE
-- Script para desabilitar RLS na tabela user_roles definitivamente
-- ============================================================================

-- 1. DESABILITAR RLS COMPLETAMENTE
ALTER TABLE "public"."user_roles" DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS
DROP POLICY IF EXISTS "user_roles_select_policy" ON "public"."user_roles";
DROP POLICY IF EXISTS "user_roles_insert_policy" ON "public"."user_roles";
DROP POLICY IF EXISTS "user_roles_update_policy" ON "public"."user_roles";
DROP POLICY IF EXISTS "user_roles_delete_policy" ON "public"."user_roles";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."user_roles";
DROP POLICY IF EXISTS "Enable insert for all users" ON "public"."user_roles";
DROP POLICY IF EXISTS "Enable update for all users" ON "public"."user_roles";
DROP POLICY IF EXISTS "Enable delete for all users" ON "public"."user_roles";

-- 3. TESTAR ACESSO
SELECT 'RLS desabilitado - Teste de acesso' as status;
SELECT COUNT(*) as total_roles FROM "public"."user_roles";

-- 4. TESTAR RELAÇÃO COM PROFILES
SELECT 
    'Teste de relação sem RLS' as status,
    p.id,
    p.full_name,
    ur.role
FROM "public"."profiles" p
LEFT JOIN "public"."user_roles" ur ON ur.user_id = p.id
LIMIT 3;

-- 5. FORÇAR REFRESH DO SCHEMA
SELECT pg_notify('pgrst', 'reload schema');

-- 6. MENSAGEM FINAL
DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ RLS DESABILITADO TEMPORARIAMENTE!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '📋 O que foi feito:';
    RAISE NOTICE '   • RLS desabilitado na tabela user_roles';
    RAISE NOTICE '   • Todas as políticas removidas';
    RAISE NOTICE '   • Schema cache atualizado';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '⚠️ IMPORTANTE:';
    RAISE NOTICE '   • Esta é uma solução temporária';
    RAISE NOTICE '   • Para produção, configure RLS adequadamente';
    RAISE NOTICE '   • O sistema funcionará normalmente agora';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '🚀 Próximos passos:';
    RAISE NOTICE '   1. Aguarde 30 segundos';
    RAISE NOTICE '   2. Execute: npm run health:check';
    RAISE NOTICE '   3. Teste o login na aplicação';
    RAISE NOTICE '==================================================';
END $$;


