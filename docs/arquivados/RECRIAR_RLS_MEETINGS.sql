-- ============================================================================
-- RECRIAR RLS POLICIES - Execute DEPOIS de LIMPAR_RLS_TOTAL.sql
-- ============================================================================
-- Execute este arquivo SOMENTE após executar LIMPAR_RLS_TOTAL.sql
-- ============================================================================

-- ============================================================================
-- TABELA: pei_meetings
-- ============================================================================

CREATE POLICY "coordinators_manage_meetings"
    ON "public"."pei_meetings"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM "public"."user_roles" ur
            JOIN "public"."profiles" p ON p.id = ur.user_id
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'coordinator'
            AND p.tenant_id = "pei_meetings"."tenant_id"
        )
    );

CREATE POLICY "directors_manage_school_meetings"
    ON "public"."pei_meetings"
    FOR ALL
    USING (
        "pei_meetings"."school_id" IN (
            SELECT p.school_id
            FROM "public"."profiles" p
            JOIN "public"."user_roles" ur ON ur.user_id = p.id
            WHERE p.id = auth.uid()
            AND ur.role IN ('school_manager', 'education_secretary')
            AND p.school_id IS NOT NULL
        )
    );

CREATE POLICY "participants_view_own_meetings"
    ON "public"."pei_meetings"
    FOR SELECT
    USING (
        "pei_meetings"."id" IN (
            SELECT pmp.meeting_id
            FROM "public"."pei_meeting_participants" pmp
            WHERE pmp.user_id = auth.uid()
        )
    );

CREATE POLICY "creator_manage_own_meetings"
    ON "public"."pei_meetings"
    FOR ALL
    USING ("pei_meetings"."created_by" = auth.uid());

-- ============================================================================
-- TABELA: pei_meeting_peis
-- ============================================================================

CREATE POLICY "view_peis_of_accessible_meetings"
    ON "public"."pei_meeting_peis"
    FOR SELECT
    USING (true);

CREATE POLICY "coordinators_manage_meeting_peis"
    ON "public"."pei_meeting_peis"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'school_manager')
        )
        OR
        EXISTS (
            SELECT 1
            FROM "public"."pei_meetings" pm
            WHERE pm.id = "pei_meeting_peis"."meeting_id"
            AND pm.created_by = auth.uid()
        )
    );

-- ============================================================================
-- TABELA: pei_meeting_participants
-- ============================================================================

CREATE POLICY "manage_participants_of_own_meetings"
    ON "public"."pei_meeting_participants"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'school_manager')
        )
        OR
        EXISTS (
            SELECT 1
            FROM "public"."pei_meetings" pm
            WHERE pm.id = "pei_meeting_participants"."meeting_id"
            AND pm.created_by = auth.uid()
        )
    );

CREATE POLICY "participants_manage_own_status"
    ON "public"."pei_meeting_participants"
    FOR ALL
    USING ("pei_meeting_participants"."user_id" = auth.uid());

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Listar policies criadas
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('pei_meetings', 'pei_meeting_peis', 'pei_meeting_participants')
ORDER BY tablename, policyname;

-- Deve retornar exatamente 8 policies

-- ============================================================================
-- MENSAGEM DE SUCESSO
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅✅✅ POLICIES RLS RECRIADAS COM SUCESSO! ✅✅✅';
    RAISE NOTICE '';
    RAISE NOTICE '✅ 4 policies em pei_meetings';
    RAISE NOTICE '✅ 2 policies em pei_meeting_peis';
    RAISE NOTICE '✅ 2 policies em pei_meeting_participants';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Reinicie o servidor: npm run dev';
    RAISE NOTICE '🚀 Teste: http://localhost:8080/meetings';
    RAISE NOTICE '';
END $$;

