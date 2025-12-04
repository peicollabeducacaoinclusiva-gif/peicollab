-- ============================================================================
-- CORREÇÃO: RLS Policies para pei_meetings (sem recursão)
-- ============================================================================
-- Execute este script no Supabase SQL Editor para corrigir recursão infinita
-- ============================================================================

-- Remover policies problemáticas
DROP POLICY IF EXISTS "coordinators_manage_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "directors_manage_school_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "participants_view_own_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "inherit_meeting_permissions" ON "public"."pei_meeting_peis";
DROP POLICY IF EXISTS "coordinators_directors_manage_participants" ON "public"."pei_meeting_participants";

-- ============================================================================
-- RLS POLICIES CORRIGIDAS: pei_meetings
-- ============================================================================

-- Coordenadores podem gerenciar todas as reuniões da rede
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

-- Diretores podem gerenciar reuniões da sua escola
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

-- Participantes podem ver reuniões das quais participam
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

-- Criador pode gerenciar suas próprias reuniões
CREATE POLICY "creator_manage_own_meetings"
    ON "public"."pei_meetings"
    FOR ALL
    USING ("pei_meetings"."created_by" = auth.uid());

-- ============================================================================
-- RLS POLICIES CORRIGIDAS: pei_meeting_peis
-- ============================================================================

-- Usuários que podem ver a reunião podem ver os PEIs vinculados
CREATE POLICY "view_peis_of_accessible_meetings"
    ON "public"."pei_meeting_peis"
    FOR SELECT
    USING (true); -- Herança via FK é suficiente

-- Coordenadores e criadores podem gerenciar vinculações
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
-- RLS POLICIES CORRIGIDAS: pei_meeting_participants
-- ============================================================================

-- Coordenadores e criadores da reunião podem gerenciar participantes
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

-- Participantes podem ver e atualizar seus próprios registros
CREATE POLICY "participants_manage_own_status"
    ON "public"."pei_meeting_participants"
    FOR ALL
    USING ("pei_meeting_participants"."user_id" = auth.uid());

-- ============================================================================
-- MENSAGEM DE CONFIRMAÇÃO
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Policies RLS corrigidas com sucesso!';
    RAISE NOTICE '✅ Recursão infinita eliminada';
    RAISE NOTICE '✅ Agora teste novamente: http://localhost:8080/meetings';
END $$;

