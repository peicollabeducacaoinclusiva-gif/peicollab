-- ============================================================================
-- SOLUÇÃO FINAL: RLS SUPER SIMPLES (SEM RECURSÃO)
-- ============================================================================
-- Execute TODO este script de uma vez
-- ============================================================================

-- PASSO 1: REMOVER TODAS AS POLICIES
DROP POLICY IF EXISTS "coordinators_manage_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "directors_manage_school_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "participants_view_own_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "creator_manage_own_meetings" ON "public"."pei_meetings";

DROP POLICY IF EXISTS "inherit_meeting_permissions" ON "public"."pei_meeting_peis";
DROP POLICY IF EXISTS "view_peis_of_accessible_meetings" ON "public"."pei_meeting_peis";
DROP POLICY IF EXISTS "coordinators_manage_meeting_peis" ON "public"."pei_meeting_peis";

DROP POLICY IF EXISTS "coordinators_directors_manage_participants" ON "public"."pei_meeting_participants";
DROP POLICY IF EXISTS "participants_manage_own_status" ON "public"."pei_meeting_participants";
DROP POLICY IF EXISTS "manage_participants_of_own_meetings" ON "public"."pei_meeting_participants";

-- ============================================================================
-- PASSO 2: CRIAR POLICIES SUPER SIMPLES (SEM RECURSÃO)
-- ============================================================================

-- ============================================================================
-- TABELA: pei_meetings - POLICIES SIMPLIFICADAS
-- ============================================================================

-- 1. Coordenadores podem tudo (verificação direta na user_roles)
CREATE POLICY "coordinators_full_access"
    ON "public"."pei_meetings"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role = 'coordinator'
        )
    );

-- 2. School managers podem tudo (verificação direta)
CREATE POLICY "managers_full_access"
    ON "public"."pei_meetings"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('school_manager', 'education_secretary')
        )
    );

-- 3. Criador pode gerenciar (verificação direta sem JOIN)
CREATE POLICY "creator_full_access"
    ON "public"."pei_meetings"
    FOR ALL
    USING (created_by = auth.uid());

-- 4. Participantes podem VER (sem subquery recursiva)
CREATE POLICY "participants_view"
    ON "public"."pei_meetings"
    FOR SELECT
    USING (
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('coordinator', 'school_manager', 'teacher', 'aee_teacher')
        )
    );

-- ============================================================================
-- TABELA: pei_meeting_peis - POLICIES SUPER SIMPLES
-- ============================================================================

-- Todos com roles autorizados podem acessar
CREATE POLICY "authorized_users_access"
    ON "public"."pei_meeting_peis"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('coordinator', 'school_manager', 'teacher', 'aee_teacher')
        )
    );

-- ============================================================================
-- TABELA: pei_meeting_participants - POLICIES SUPER SIMPLES
-- ============================================================================

-- Todos com roles autorizados podem gerenciar
CREATE POLICY "authorized_manage_participants"
    ON "public"."pei_meeting_participants"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('coordinator', 'school_manager', 'teacher', 'aee_teacher')
        )
    );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Listar policies criadas (deve mostrar 6 policies)
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('pei_meetings', 'pei_meeting_peis', 'pei_meeting_participants')
ORDER BY tablename, policyname;

-- ============================================================================
-- MENSAGEM DE SUCESSO
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ POLICIES RLS ULTRA SIMPLES CRIADAS!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Sem JOINs complexos';
    RAISE NOTICE '✅ Sem subqueries recursivas';
    RAISE NOTICE '✅ Sem referências circulares';
    RAISE NOTICE '✅ Acesso baseado apenas em user_roles';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Total: 6 policies criadas';
    RAISE NOTICE '🎯 pei_meetings: 4 policies';
    RAISE NOTICE '🎯 pei_meeting_peis: 1 policy';
    RAISE NOTICE '🎯 pei_meeting_participants: 1 policy';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 REINICIE O SERVIDOR AGORA!';
    RAISE NOTICE '🚀 npm run dev';
    RAISE NOTICE '';
END $$;

