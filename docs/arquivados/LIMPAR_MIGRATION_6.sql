-- ============================================================================
-- LIMPEZA TOTAL: Migração 6 - Gestão Escolar
-- ============================================================================
-- Remove completamente as tabelas de Gestão Escolar
-- Execute ESTE SCRIPT primeiro (se der erro na migração 6)
-- ============================================================================

-- Remover triggers
DROP TRIGGER IF EXISTS update_professionals_updated_at ON "public"."professionals";
DROP TRIGGER IF EXISTS update_classes_updated_at ON "public"."classes";
DROP TRIGGER IF EXISTS update_subjects_updated_at ON "public"."subjects";

-- Desabilitar RLS
ALTER TABLE IF EXISTS "public"."professionals" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."classes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."subjects" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."class_subjects" DISABLE ROW LEVEL SECURITY;

-- Remover policies: professionals
DROP POLICY IF EXISTS "admins_manage_professionals" ON "public"."professionals";
DROP POLICY IF EXISTS "all_view_professionals" ON "public"."professionals";

-- Remover policies: classes
DROP POLICY IF EXISTS "admins_manage_classes" ON "public"."classes";
DROP POLICY IF EXISTS "all_view_classes" ON "public"."classes";

-- Remover policies: subjects
DROP POLICY IF EXISTS "admins_manage_subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "all_view_subjects" ON "public"."subjects";

-- Remover policies: class_subjects
DROP POLICY IF EXISTS "admins_manage_class_subjects" ON "public"."class_subjects";

-- REMOVER AS TABELAS (⚠️ APAGA TODOS OS DADOS!)
DROP TABLE IF EXISTS "public"."class_subjects" CASCADE;
DROP TABLE IF EXISTS "public"."subjects" CASCADE;
DROP TABLE IF EXISTS "public"."classes" CASCADE;
DROP TABLE IF EXISTS "public"."professionals" CASCADE;

-- Remover ENUMs
DROP TYPE IF EXISTS "public"."professional_role" CASCADE;
DROP TYPE IF EXISTS "public"."education_level" CASCADE;

-- ============================================================================
-- CONFIRMAÇÃO
-- ============================================================================

SELECT '✅ Limpeza da migração 6 (Gestão Escolar) concluída! Agora execute: 20250108000006_gestao_escolar_CLEAN.sql' AS status;

