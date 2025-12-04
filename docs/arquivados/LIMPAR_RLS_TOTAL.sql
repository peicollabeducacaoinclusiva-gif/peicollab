-- ============================================================================
-- LIMPEZA TOTAL DE POLICIES - Execute PASSO A PASSO
-- ============================================================================

-- PASSO 1: Listar todas as policies existentes (para conferir)
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('pei_meetings', 'pei_meeting_peis', 'pei_meeting_participants')
ORDER BY tablename, policyname;

-- ============================================================================
-- PASSO 2: REMOVER ABSOLUTAMENTE TODAS AS POLICIES
-- ============================================================================

-- pei_meetings - TODAS
DROP POLICY IF EXISTS "coordinators_manage_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "directors_manage_school_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "participants_view_own_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "creator_manage_own_meetings" ON "public"."pei_meetings";

-- pei_meeting_peis - TODAS  
DROP POLICY IF EXISTS "inherit_meeting_permissions" ON "public"."pei_meeting_peis";
DROP POLICY IF EXISTS "view_peis_of_accessible_meetings" ON "public"."pei_meeting_peis";
DROP POLICY IF EXISTS "coordinators_manage_meeting_peis" ON "public"."pei_meeting_peis";

-- pei_meeting_participants - TODAS (incluindo duplicadas)
DROP POLICY IF EXISTS "coordinators_directors_manage_participants" ON "public"."pei_meeting_participants";
DROP POLICY IF EXISTS "participants_manage_own_status" ON "public"."pei_meeting_participants";
DROP POLICY IF EXISTS "manage_participants_of_own_meetings" ON "public"."pei_meeting_participants";

-- Verificar se removeu tudo
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('pei_meetings', 'pei_meeting_peis', 'pei_meeting_participants');
-- Deve retornar 0 linhas agora

-- ============================================================================
-- AGORA EXECUTE O PRÓXIMO ARQUIVO: RECRIAR_RLS_MEETINGS.sql
-- ============================================================================

