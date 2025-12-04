-- ============================================================================
-- LIMPEZA TOTAL: Migração 5 - Blog
-- ============================================================================
-- Remove completamente as tabelas do blog para recriação limpa
-- Execute ESTE SCRIPT primeiro
-- ============================================================================

-- Remover triggers de contadores
DROP TRIGGER IF EXISTS trigger_update_comments_count ON "public"."blog_comments";
DROP TRIGGER IF EXISTS trigger_update_likes_count ON "public"."blog_post_likes";

-- Remover triggers de updated_at
DROP TRIGGER IF EXISTS update_blog_categories_updated_at ON "public"."blog_categories";
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON "public"."blog_posts";
DROP TRIGGER IF EXISTS update_blog_comments_updated_at ON "public"."blog_comments";

-- Remover funções
DROP FUNCTION IF EXISTS update_post_comments_count();
DROP FUNCTION IF EXISTS update_post_likes_count();

-- Desabilitar RLS
ALTER TABLE IF EXISTS "public"."blog_categories" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."blog_posts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."blog_comments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."blog_post_likes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."blog_post_views" DISABLE ROW LEVEL SECURITY;

-- Remover policies: blog_categories
DROP POLICY IF EXISTS "all_view_active_categories" ON "public"."blog_categories";
DROP POLICY IF EXISTS "admins_manage_categories" ON "public"."blog_categories";

-- Remover policies: blog_posts
DROP POLICY IF EXISTS "all_view_published_posts" ON "public"."blog_posts";
DROP POLICY IF EXISTS "authors_manage_own_posts" ON "public"."blog_posts";
DROP POLICY IF EXISTS "coordinators_manage_all_posts" ON "public"."blog_posts";
DROP POLICY IF EXISTS "directors_manage_school_posts" ON "public"."blog_posts";

-- Remover policies: blog_comments
DROP POLICY IF EXISTS "all_view_approved_comments" ON "public"."blog_comments";
DROP POLICY IF EXISTS "authenticated_users_create_comments" ON "public"."blog_comments";
DROP POLICY IF EXISTS "users_manage_own_comments" ON "public"."blog_comments";
DROP POLICY IF EXISTS "moderators_manage_all_comments" ON "public"."blog_comments";

-- Remover policies: blog_post_likes
DROP POLICY IF EXISTS "all_view_likes" ON "public"."blog_post_likes";
DROP POLICY IF EXISTS "authenticated_users_like_posts" ON "public"."blog_post_likes";
DROP POLICY IF EXISTS "users_remove_own_likes" ON "public"."blog_post_likes";

-- Remover policies: blog_post_views
DROP POLICY IF EXISTS "all_register_views" ON "public"."blog_post_views";
DROP POLICY IF EXISTS "admins_view_analytics" ON "public"."blog_post_views";

-- REMOVER AS TABELAS COMPLETAMENTE (⚠️ APAGA TODOS OS DADOS!)
DROP TABLE IF EXISTS "public"."blog_post_views" CASCADE;
DROP TABLE IF EXISTS "public"."blog_post_likes" CASCADE;
DROP TABLE IF EXISTS "public"."blog_comments" CASCADE;
DROP TABLE IF EXISTS "public"."blog_posts" CASCADE;
DROP TABLE IF EXISTS "public"."blog_categories" CASCADE;

-- ============================================================================
-- CONFIRMAÇÃO
-- ============================================================================

SELECT '✅ Limpeza da migração 5 (Blog) concluída! Agora execute: 20250108000005_blog_CLEAN.sql' AS status;

