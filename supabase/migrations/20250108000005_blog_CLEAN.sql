-- ============================================================================
-- MIGRAÇÃO LIMPA: Mini Blog Institucional
-- ============================================================================
-- Sistema de blog para comunicação institucional por escola/rede
-- Data: 2025-01-08
-- Versão: CLEAN
-- ⚠️ Execute LIMPAR_MIGRATION_5.sql ANTES deste arquivo
-- ============================================================================

-- ============================================================================
-- TABELA: blog_categories
-- ============================================================================

CREATE TABLE "public"."blog_categories" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "slug" text UNIQUE NOT NULL,
    "description" text,
    "color" text DEFAULT '#3b82f6',
    "icon" text,
    "parent_category_id" uuid REFERENCES "public"."blog_categories"("id") ON DELETE SET NULL,
    "order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX "idx_blog_categories_slug" ON "public"."blog_categories"("slug");
CREATE INDEX "idx_blog_categories_parent" ON "public"."blog_categories"("parent_category_id");
CREATE INDEX "idx_blog_categories_active" ON "public"."blog_categories"("is_active");

-- ============================================================================
-- TABELA: blog_posts
-- ============================================================================

CREATE TABLE "public"."blog_posts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Conteúdo
    "title" text NOT NULL,
    "slug" text NOT NULL,
    "excerpt" text,
    "content" text NOT NULL,
    "featured_image" text,
    
    -- Autoria
    "author_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    
    -- Categorização
    "category_id" uuid REFERENCES "public"."blog_categories"("id") ON DELETE SET NULL,
    "tags" text[] DEFAULT '{}',
    
    -- Multi-tenant
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    
    -- Publicação
    "status" text DEFAULT 'draft',
    "published" boolean DEFAULT false,
    "published_at" timestamptz,
    "scheduled_for" timestamptz,
    
    -- SEO
    "meta_description" text,
    "meta_keywords" text[],
    
    -- Métricas
    "views_count" integer DEFAULT 0,
    "likes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    
    -- Configurações
    "allow_comments" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "is_pinned" boolean DEFAULT false,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "last_edited_by" uuid REFERENCES "auth"."users"("id"),
    
    -- Constraints
    CONSTRAINT "blog_posts_status_check" CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT "unique_slug_per_tenant" UNIQUE (tenant_id, slug)
);

CREATE INDEX "idx_blog_posts_slug" ON "public"."blog_posts"("slug");
CREATE INDEX "idx_blog_posts_author" ON "public"."blog_posts"("author_id");
CREATE INDEX "idx_blog_posts_category" ON "public"."blog_posts"("category_id");
CREATE INDEX "idx_blog_posts_tenant" ON "public"."blog_posts"("tenant_id");
CREATE INDEX "idx_blog_posts_school" ON "public"."blog_posts"("school_id");
CREATE INDEX "idx_blog_posts_status" ON "public"."blog_posts"("status");
CREATE INDEX "idx_blog_posts_published" ON "public"."blog_posts"("published", "published_at");
CREATE INDEX "idx_blog_posts_featured" ON "public"."blog_posts"("is_featured");
CREATE INDEX "idx_blog_posts_tags" ON "public"."blog_posts" USING GIN ("tags");

-- ============================================================================
-- TABELA: blog_comments
-- ============================================================================

CREATE TABLE "public"."blog_comments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "post_id" uuid NOT NULL REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Conteúdo
    "comment_text" text NOT NULL,
    
    -- Thread
    "parent_comment_id" uuid REFERENCES "public"."blog_comments"("id") ON DELETE CASCADE,
    
    -- Moderação
    "status" text DEFAULT 'pending',
    "moderated_by" uuid REFERENCES "auth"."users"("id"),
    "moderated_at" timestamptz,
    "moderation_reason" text,
    
    -- Métricas
    "likes_count" integer DEFAULT 0,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "blog_comments_status_check" CHECK (status IN ('pending', 'approved', 'rejected', 'flagged'))
);

CREATE INDEX "idx_blog_comments_post" ON "public"."blog_comments"("post_id");
CREATE INDEX "idx_blog_comments_user" ON "public"."blog_comments"("user_id");
CREATE INDEX "idx_blog_comments_parent" ON "public"."blog_comments"("parent_comment_id");
CREATE INDEX "idx_blog_comments_status" ON "public"."blog_comments"("status");

-- ============================================================================
-- TABELA: blog_post_likes
-- ============================================================================

CREATE TABLE "public"."blog_post_likes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "post_id" uuid NOT NULL REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now(),
    
    CONSTRAINT "unique_like_per_user_post" UNIQUE (post_id, user_id)
);

CREATE INDEX "idx_blog_post_likes_post" ON "public"."blog_post_likes"("post_id");
CREATE INDEX "idx_blog_post_likes_user" ON "public"."blog_post_likes"("user_id");

-- ============================================================================
-- TABELA: blog_post_views
-- ============================================================================

CREATE TABLE "public"."blog_post_views" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "post_id" uuid NOT NULL REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "ip_address" inet,
    "user_agent" text,
    "viewed_at" timestamptz DEFAULT now()
);

CREATE INDEX "idx_blog_post_views_post" ON "public"."blog_post_views"("post_id");
CREATE INDEX "idx_blog_post_views_date" ON "public"."blog_post_views"("viewed_at");

-- ============================================================================
-- RLS POLICIES: blog_categories
-- ============================================================================

ALTER TABLE "public"."blog_categories" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_view_active_categories"
    ON "public"."blog_categories"
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "admins_manage_categories"
    ON "public"."blog_categories"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'school_manager', 'education_secretary')
        )
    );

-- ============================================================================
-- RLS POLICIES: blog_posts
-- ============================================================================

ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_view_published_posts"
    ON "public"."blog_posts"
    FOR SELECT
    USING (
        published = true 
        AND status = 'published'
        AND published_at <= now()
    );

CREATE POLICY "authors_manage_own_posts"
    ON "public"."blog_posts"
    FOR ALL
    USING (author_id = auth.uid());

CREATE POLICY "coordinators_manage_all_posts"
    ON "public"."blog_posts"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'education_secretary')
        )
    );

CREATE POLICY "directors_manage_school_posts"
    ON "public"."blog_posts"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'school_manager'
        )
    );

-- ============================================================================
-- RLS POLICIES: blog_comments
-- ============================================================================

ALTER TABLE "public"."blog_comments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_view_approved_comments"
    ON "public"."blog_comments"
    FOR SELECT
    USING (status = 'approved');

CREATE POLICY "authenticated_users_create_comments"
    ON "public"."blog_comments"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_manage_own_comments"
    ON "public"."blog_comments"
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "users_delete_own_comments"
    ON "public"."blog_comments"
    FOR DELETE
    USING (user_id = auth.uid());

CREATE POLICY "moderators_manage_all_comments"
    ON "public"."blog_comments"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'school_manager')
        )
    );

-- ============================================================================
-- RLS POLICIES: blog_post_likes
-- ============================================================================

ALTER TABLE "public"."blog_post_likes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_view_likes"
    ON "public"."blog_post_likes"
    FOR SELECT
    USING (true);

CREATE POLICY "authenticated_users_like_posts"
    ON "public"."blog_post_likes"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_remove_own_likes"
    ON "public"."blog_post_likes"
    FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: blog_post_views
-- ============================================================================

ALTER TABLE "public"."blog_post_views" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_register_views"
    ON "public"."blog_post_views"
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "admins_view_analytics"
    ON "public"."blog_post_views"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'school_manager', 'education_secretary')
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_blog_categories_updated_at
    BEFORE UPDATE ON "public"."blog_categories"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON "public"."blog_posts"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_comments_updated_at
    BEFORE UPDATE ON "public"."blog_comments"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar contador de comentários
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "public"."blog_posts"
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "public"."blog_posts"
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_comments_count
    AFTER INSERT OR DELETE ON "public"."blog_comments"
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comments_count();

-- Função para atualizar contador de curtidas
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "public"."blog_posts"
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "public"."blog_posts"
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_likes_count
    AFTER INSERT OR DELETE ON "public"."blog_post_likes"
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."blog_categories" IS 'Categorias de posts do blog institucional';
COMMENT ON TABLE "public"."blog_posts" IS 'Posts do blog para comunicação institucional';
COMMENT ON TABLE "public"."blog_comments" IS 'Comentários nos posts do blog com moderação';
COMMENT ON TABLE "public"."blog_post_likes" IS 'Curtidas nos posts do blog';
COMMENT ON TABLE "public"."blog_post_views" IS 'Registro de visualizações para analytics';

-- ============================================================================
-- CONFIRMAÇÃO
-- ============================================================================

SELECT '✅ Migração 5 (Blog) aplicada com sucesso! (CLEAN VERSION)' AS status;

