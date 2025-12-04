-- ============================================================================
-- LIMPEZA TOTAL: Migração 3 - Remover TUDO
-- ============================================================================
-- Remove completamente as tabelas para recriação limpa
-- Execute ESTE SCRIPT primeiro
-- ============================================================================

-- Remover triggers primeiro
DROP TRIGGER IF EXISTS trigger_auto_create_evaluations ON "public"."peis";
DROP TRIGGER IF EXISTS update_pei_evaluations_updated_at ON "public"."pei_evaluations";
DROP TRIGGER IF EXISTS update_evaluation_schedules_updated_at ON "public"."evaluation_schedules";

-- Remover funções
DROP FUNCTION IF EXISTS auto_create_pei_evaluations();
DROP FUNCTION IF EXISTS get_evaluation_statistics(uuid, uuid, uuid);

-- Desabilitar RLS
ALTER TABLE IF EXISTS "public"."pei_evaluations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."evaluation_schedules" DISABLE ROW LEVEL SECURITY;

-- Remover todas as policies
DROP POLICY IF EXISTS "teachers_manage_own_pei_evaluations" ON "public"."pei_evaluations";
DROP POLICY IF EXISTS "coordinators_manage_all_evaluations" ON "public"."pei_evaluations";
DROP POLICY IF EXISTS "coordinators_manage_evaluations" ON "public"."pei_evaluations";
DROP POLICY IF EXISTS "directors_view_school_evaluations" ON "public"."pei_evaluations";
DROP POLICY IF EXISTS "all_view_evaluations" ON "public"."pei_evaluations";

DROP POLICY IF EXISTS "coordinators_manage_schedules" ON "public"."evaluation_schedules";
DROP POLICY IF EXISTS "directors_manage_school_schedules" ON "public"."evaluation_schedules";
DROP POLICY IF EXISTS "all_view_schedules" ON "public"."evaluation_schedules";
DROP POLICY IF EXISTS "teachers_view_own_schedules" ON "public"."evaluation_schedules";

-- REMOVER AS TABELAS COMPLETAMENTE (⚠️ APAGA TODOS OS DADOS!)
DROP TABLE IF EXISTS "public"."pei_evaluations" CASCADE;
DROP TABLE IF EXISTS "public"."evaluation_schedules" CASCADE;

-- ============================================================================
-- CONFIRMAÇÃO
-- ============================================================================

SELECT '✅ Limpeza total concluída! Agora execute: 20250108000003_pei_evaluation_FINAL.sql' AS status;

