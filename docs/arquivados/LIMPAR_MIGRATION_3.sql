-- ============================================================================
-- SCRIPT DE LIMPEZA: Migração 3 - Avaliações do PEI
-- ============================================================================
-- Remove todas as policies e tabelas da migração 3 para reaplicar limpo
-- Execute ESTE SCRIPT PRIMEIRO, depois execute a migração corrigida
-- ============================================================================

-- Desabilitar RLS temporariamente
ALTER TABLE IF EXISTS "public"."pei_evaluations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."evaluation_schedules" DISABLE ROW LEVEL SECURITY;

-- Remover todas as policies
DROP POLICY IF EXISTS "teachers_manage_own_pei_evaluations" ON "public"."pei_evaluations";
DROP POLICY IF EXISTS "coordinators_manage_all_evaluations" ON "public"."pei_evaluations";
DROP POLICY IF EXISTS "all_view_evaluations" ON "public"."pei_evaluations";
DROP POLICY IF EXISTS "coordinators_manage_schedules" ON "public"."evaluation_schedules";
DROP POLICY IF EXISTS "teachers_view_own_schedules" ON "public"."evaluation_schedules";

-- Remover triggers
DROP TRIGGER IF EXISTS update_pei_evaluations_updated_at ON "public"."pei_evaluations";
DROP TRIGGER IF EXISTS update_evaluation_schedules_updated_at ON "public"."evaluation_schedules";

-- Remover tabelas (CUIDADO: Isso apaga os dados!)
-- Comente as linhas abaixo se quiser preservar os dados
-- DROP TABLE IF EXISTS "public"."pei_evaluations" CASCADE;
-- DROP TABLE IF EXISTS "public"."evaluation_schedules" CASCADE;

-- Se não quiser apagar as tabelas, pelo menos limpe os dados
TRUNCATE TABLE "public"."pei_evaluations" CASCADE;
TRUNCATE TABLE "public"."evaluation_schedules" CASCADE;

-- ============================================================================
-- CONFIRMAÇÃO
-- ============================================================================

SELECT 'Limpeza concluída! Agora execute: 20250108000003_pei_evaluation_FIXED.sql' AS status;

