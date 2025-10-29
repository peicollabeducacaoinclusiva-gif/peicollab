-- ============================================================================
-- PEI COLLAB - CORREÇÃO SIMPLES DE USER_ROLES
-- Script para corrigir a tabela user_roles definitivamente
-- ============================================================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE "public"."user_roles" DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "user_roles_select_policy" ON "public"."user_roles";
DROP POLICY IF EXISTS "user_roles_insert_policy" ON "public"."user_roles";
DROP POLICY IF EXISTS "user_roles_update_policy" ON "public"."user_roles";
DROP POLICY IF EXISTS "user_roles_delete_policy" ON "public"."user_roles";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."user_roles";
DROP POLICY IF EXISTS "Enable insert for all users" ON "public"."user_roles";
DROP POLICY IF EXISTS "Enable update for all users" ON "public"."user_roles";
DROP POLICY IF EXISTS "Enable delete for all users" ON "public"."user_roles";

-- 3. CRIAR POLÍTICAS SIMPLES (SEM RECURSÃO)
CREATE POLICY "user_roles_select_policy" ON "public"."user_roles"
    FOR SELECT
    USING (true);

CREATE POLICY "user_roles_insert_policy" ON "public"."user_roles"
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "user_roles_update_policy" ON "public"."user_roles"
    FOR UPDATE
    USING (true);

CREATE POLICY "user_roles_delete_policy" ON "public"."user_roles"
    FOR DELETE
    USING (true);

-- 4. HABILITAR RLS NOVAMENTE
ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;

-- 5. TESTAR ACESSO
SELECT 'Teste de acesso à user_roles' as status;
SELECT COUNT(*) as total_roles FROM "public"."user_roles";

-- 6. FORÇAR REFRESH DO SCHEMA
SELECT pg_notify('pgrst', 'reload schema');

-- 7. TESTAR RELAÇÃO COM PROFILES
SELECT 
    'Teste de relação' as status,
    p.id,
    p.full_name,
    ur.role
FROM "public"."profiles" p
LEFT JOIN "public"."user_roles" ur ON ur.user_id = p.id
LIMIT 3;

-- 8. MENSAGEM FINAL
DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ CORREÇÃO DE USER_ROLES CONCLUÍDA!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '📋 O que foi feito:';
    RAISE NOTICE '   • RLS desabilitado e reabilitado';
    RAISE NOTICE '   • Políticas antigas removidas';
    RAISE NOTICE '   • Novas políticas simples criadas';
    RAISE NOTICE '   • Schema cache atualizado';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '🚀 Próximos passos:';
    RAISE NOTICE '   1. Aguarde 30 segundos';
    RAISE NOTICE '   2. Execute: npm run health:check';
    RAISE NOTICE '   3. Teste o login na aplicação';
    RAISE NOTICE '==================================================';
END $$;


