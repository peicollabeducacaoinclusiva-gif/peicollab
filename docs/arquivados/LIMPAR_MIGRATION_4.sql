-- ============================================================================
-- LIMPEZA TOTAL: Migração 4 - Plano de AEE
-- ============================================================================
-- Remove completamente as tabelas para recriação limpa
-- Execute ESTE SCRIPT primeiro
-- ============================================================================

-- Remover triggers
DROP TRIGGER IF EXISTS update_plano_aee_updated_at ON "public"."plano_aee";
DROP TRIGGER IF EXISTS update_plano_aee_comments_updated_at ON "public"."plano_aee_comments";

-- Desabilitar RLS
ALTER TABLE IF EXISTS "public"."plano_aee" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."plano_aee_comments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."plano_aee_attachments" DISABLE ROW LEVEL SECURITY;

-- Remover todas as policies
DROP POLICY IF EXISTS "aee_teachers_manage_own_plans" ON "public"."plano_aee";
DROP POLICY IF EXISTS "others_view_aee_plans" ON "public"."plano_aee";

DROP POLICY IF EXISTS "users_comment_on_visible_plans" ON "public"."plano_aee_comments";
DROP POLICY IF EXISTS "users_view_comments_on_accessible_plans" ON "public"."plano_aee_comments";
DROP POLICY IF EXISTS "users_manage_own_comments" ON "public"."plano_aee_comments";
DROP POLICY IF EXISTS "users_delete_own_comments" ON "public"."plano_aee_comments";

DROP POLICY IF EXISTS "aee_teachers_manage_attachments" ON "public"."plano_aee_attachments";
DROP POLICY IF EXISTS "others_view_attachments" ON "public"."plano_aee_attachments";

-- REMOVER AS TABELAS COMPLETAMENTE (⚠️ APAGA TODOS OS DADOS!)
DROP TABLE IF EXISTS "public"."plano_aee_attachments" CASCADE;
DROP TABLE IF EXISTS "public"."plano_aee_comments" CASCADE;
DROP TABLE IF EXISTS "public"."plano_aee" CASCADE;

-- ============================================================================
-- CONFIRMAÇÃO
-- ============================================================================

SELECT '✅ Limpeza da migração 4 concluída! Agora execute: 20250108000004_plano_aee_CLEAN.sql' AS status;

