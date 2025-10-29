-- ============================================================================
-- PEI COLLAB - CORREÇÃO DE RLS PARA USER_ROLES
-- Script para corrigir recursão infinita nas políticas RLS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. REMOVER POLÍTICAS RLS PROBLEMÁTICAS
-- ----------------------------------------------------------------------------

-- Desabilitar RLS temporariamente para user_roles
ALTER TABLE "public"."user_roles" DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes da tabela user_roles
DROP POLICY IF EXISTS "user_roles_select_policy" ON "public"."user_roles";
DROP POLICY IF EXISTS "user_roles_insert_policy" ON "public"."user_roles";
DROP POLICY IF EXISTS "user_roles_update_policy" ON "public"."user_roles";
DROP POLICY IF EXISTS "user_roles_delete_policy" ON "public"."user_roles";

-- ----------------------------------------------------------------------------
-- 2. CRIAR POLÍTICAS RLS SIMPLES E SEGURAS
-- ----------------------------------------------------------------------------

-- Política de SELECT: Usuários podem ver seus próprios roles
CREATE POLICY "user_roles_select_policy" ON "public"."user_roles"
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política de INSERT: Apenas superadmins podem inserir roles
CREATE POLICY "user_roles_insert_policy" ON "public"."user_roles"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'superadmin'
        )
    );

-- Política de UPDATE: Apenas superadmins podem atualizar roles
CREATE POLICY "user_roles_update_policy" ON "public"."user_roles"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'superadmin'
        )
    );

-- Política de DELETE: Apenas superadmins podem deletar roles
CREATE POLICY "user_roles_delete_policy" ON "public"."user_roles"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'superadmin'
        )
    );

-- ----------------------------------------------------------------------------
-- 3. HABILITAR RLS NOVAMENTE
-- ----------------------------------------------------------------------------

-- Habilitar RLS na tabela user_roles
ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ----------------------------------------------------------------------------

-- Listar políticas da tabela user_roles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- 5. TESTAR ACESSO À TABELA
-- ----------------------------------------------------------------------------

-- Testar se a tabela user_roles está acessível
SELECT 
    'Teste de acesso' as status,
    COUNT(*) as total_roles
FROM "public"."user_roles";

-- ----------------------------------------------------------------------------
-- 6. MENSAGEM FINAL
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ Políticas RLS corrigidas para user_roles!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '📋 Políticas criadas:';
    RAISE NOTICE '   • SELECT: Usuários veem apenas seus roles';
    RAISE NOTICE '   • INSERT/UPDATE/DELETE: Apenas superadmins';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '🚀 Próximos passos:';
    RAISE NOTICE '   1. Teste o health check: npm run health:check';
    RAISE NOTICE '   2. Teste o login no admin';
    RAISE NOTICE '   3. Verifique se os dashboards funcionam';
    RAISE NOTICE '==================================================';
END $$;


