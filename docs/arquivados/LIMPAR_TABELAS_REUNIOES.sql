-- ============================================================================
-- SCRIPT DE LIMPEZA - Execute PRIMEIRO antes da migração de reuniões
-- ============================================================================
-- Este script remove completamente as tabelas de reuniões para uma instalação limpa
-- ============================================================================

-- Remover políticas RLS existentes
DROP POLICY IF EXISTS "coordinators_manage_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "directors_manage_school_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "participants_view_own_meetings" ON "public"."pei_meetings";
DROP POLICY IF EXISTS "inherit_meeting_permissions" ON "public"."pei_meeting_peis";
DROP POLICY IF EXISTS "coordinators_directors_manage_participants" ON "public"."pei_meeting_participants";
DROP POLICY IF EXISTS "participants_manage_own_status" ON "public"."pei_meeting_participants";

-- Remover triggers existentes
DROP TRIGGER IF EXISTS update_pei_meetings_updated_at ON "public"."pei_meetings";
DROP TRIGGER IF EXISTS update_pei_meeting_participants_updated_at ON "public"."pei_meeting_participants";

-- Remover tabelas na ordem correta (cascade cuida das dependências)
DROP TABLE IF EXISTS "public"."pei_meeting_participants" CASCADE;
DROP TABLE IF EXISTS "public"."pei_meeting_peis" CASCADE;
DROP TABLE IF EXISTS "public"."pei_meetings" CASCADE;

-- Remover função auxiliar
DROP FUNCTION IF EXISTS notify_meeting_participants(uuid);

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '✅ Limpeza concluída! Agora execute a migração 20250108000002_meetings_system_FIXED.sql';
END $$;






