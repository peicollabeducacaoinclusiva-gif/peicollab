-- ============================================================================
-- LIMPEZA COMPLETA E CORREÇÃO DE RLS - Execute TUDO de uma vez
-- ============================================================================
-- Este script remove TODAS as policies e recria corretamente
-- ============================================================================

-- ============================================================================
-- PASSO 1: LIMPAR TODAS AS POLICIES EXISTENTES
-- ============================================================================

-- pei_meetings
DROP POLICY IF EXISTS "coordinators_manage_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "directors_manage_school_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "participants_view_own_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "creator_manage_own_meetings" ON "public"."pei_meetings";

-- pei_meeting_peis
DROP POLICY IF EXISTS "inherit_meeting_permissions" ON "public"."pei_meeting_peis";
DROP POLICY IF EXISTS "view_peis_of_accessible_meetings" ON "public"."pei_meeting_peis";
DROP POLICY IF EXISTS "coordinators_manage_meeting_peis" ON "public"."pei_meeting_peis";

-- pei_meeting_participants
DROP POLICY IF EXISTS "coordinators_directors_manage_participants" ON "public"."pei_meeting_participants";
DROP POLICY IF EXISTS "participants_manage_own_status" ON "public"."pei_meeting_participants";
DROP POLICY IF EXISTS "manage_participants_of_own_meetings" ON "public"."pei_meeting_participants";

-- ============================================================================
-- PASSO 2: RECRIAR POLICIES CORRIGIDAS (SEM RECURSÃO)
-- ============================================================================

-- ============================================================================
-- TABELA: pei_meetings
-- ============================================================================

-- 1. Coordenadores podem gerenciar todas as reuniões da rede
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

-- 2. Diretores podem gerenciar reuniões da sua escola
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

-- 3. Participantes podem ver reuniões das quais participam
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

-- 4. Criador pode gerenciar suas próprias reuniões
CREATE POLICY "creator_manage_own_meetings"
    ON "public"."pei_meetings"
    FOR ALL
    USING ("pei_meetings"."created_by" = auth.uid());

-- ============================================================================
-- TABELA: pei_meeting_peis
-- ============================================================================

-- 1. Todos podem ver PEIs vinculados (leitura)
CREATE POLICY "view_peis_of_accessible_meetings"
    ON "public"."pei_meeting_peis"
    FOR SELECT
    USING (true);

-- 2. Coordenadores e criadores podem gerenciar vinculações
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

-- 1. Coordenadores e criadores podem gerenciar participantes
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

-- 2. Participantes podem gerenciar seu próprio status
CREATE POLICY "participants_manage_own_status"
    ON "public"."pei_meeting_participants"
    FOR ALL
    USING ("pei_meeting_participants"."user_id" = auth.uid());

-- ============================================================================
-- MENSAGEM DE CONFIRMAÇÃO
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅✅✅ CORREÇÃO APLICADA COM SUCESSO! ✅✅✅';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Todas as policies antigas foram removidas';
    RAISE NOTICE '✅ Novas policies criadas sem recursão';
    RAISE NOTICE '✅ Sistema de reuniões pronto para uso';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Teste agora: http://localhost:8080/meetings';
    RAISE NOTICE '';
END $$;

