-- =====================================================
-- SISTEMA DE MÓDULOS
-- Permite ativação/desativação de funcionalidades por tenant
-- =====================================================

-- Tabela de módulos disponíveis
CREATE TABLE IF NOT EXISTS available_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  app TEXT NOT NULL, -- 'gestao-escolar' ou 'pei-collab'
  is_public BOOLEAN DEFAULT false, -- se tem parte pública
  requires_modules TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE available_modules IS 'Catálogo de módulos disponíveis no sistema';
COMMENT ON COLUMN available_modules.is_public IS 'Indica se o módulo tem componentes públicos (ex: blog na landing)';

-- Tabela de módulos habilitados por tenant
CREATE TABLE IF NOT EXISTS tenant_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES profiles(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, module_name)
);

COMMENT ON TABLE tenant_modules IS 'Módulos habilitados para cada tenant com suas configurações';

-- Índices para performance
CREATE INDEX idx_tenant_modules_tenant ON tenant_modules(tenant_id);
CREATE INDEX idx_tenant_modules_enabled ON tenant_modules(tenant_id, is_enabled);
CREATE INDEX idx_tenant_modules_name ON tenant_modules(module_name);

-- =====================================================
-- BLOG POSTS (Tabela já existe - apenas ajustes)
-- =====================================================

-- A tabela blog_posts já existe no banco com estrutura completa
-- Vamos apenas garantir que alguns índices existam

CREATE INDEX IF NOT EXISTS idx_blog_posts_tenant_published ON blog_posts(tenant_id, status, published_at DESC) 
WHERE status = 'published';

-- =====================================================
-- SEED: MÓDULOS DISPONÍVEIS
-- =====================================================

INSERT INTO available_modules (name, display_name, description, icon, app, is_public) VALUES
  -- Módulos Gestão Escolar
  ('atividades', 'Atividades Pedagógicas', 'Geração e gestão de atividades pedagógicas personalizadas', 'clipboard', 'gestao-escolar', false),
  ('blog', 'Blog/Notícias', 'Sistema de publicação de notícias e artigos (visualização pública na landing)', 'newspaper', 'gestao-escolar', true),
  ('merenda', 'Merenda Escolar', 'Gestão de cardápios, alimentação e nutrição escolar', 'utensils', 'gestao-escolar', false),
  ('planejamento', 'Planejamento Pedagógico', 'Planejamento de aulas, projetos e atividades pedagógicas', 'calendar', 'gestao-escolar', false),
  ('transporte', 'Transporte Escolar', 'Gestão de rotas, motoristas e transporte escolar', 'bus', 'gestao-escolar', false),
  
  -- Módulo PEI Collab
  ('plano-aee', 'Plano AEE', 'Planos de Atendimento Educacional Especializado', 'accessibility', 'pei-collab', false)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- RPCs (Remote Procedure Calls)
-- =====================================================

-- RPC para buscar módulos habilitados de um tenant
CREATE OR REPLACE FUNCTION get_enabled_modules(p_tenant_id UUID)
RETURNS TABLE (
  module_name TEXT,
  display_name TEXT,
  icon TEXT,
  is_public BOOLEAN,
  settings JSONB
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.module_name,
    am.display_name,
    am.icon,
    am.is_public,
    tm.settings
  FROM tenant_modules tm
  JOIN available_modules am ON am.name = tm.module_name
  WHERE tm.tenant_id = p_tenant_id 
    AND tm.is_enabled = true;
END;
$$;

COMMENT ON FUNCTION get_enabled_modules IS 'Retorna módulos habilitados para um tenant específico';

-- RPC para buscar posts publicados (acesso público)
CREATE OR REPLACE FUNCTION get_published_posts(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  featured_image TEXT,
  published_at TIMESTAMPTZ,
  author_name TEXT,
  tags TEXT[],
  views_count INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id,
    bp.title,
    bp.slug,
    bp.excerpt,
    bp.featured_image,
    bp.published_at,
    up.full_name as author_name,
    bp.tags,
    bp.views_count
  FROM blog_posts bp
  LEFT JOIN profiles up ON up.id = bp.author_id
  WHERE bp.tenant_id = p_tenant_id 
    AND bp.status = 'published'
    AND bp.published_at <= NOW()
  ORDER BY bp.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION get_published_posts IS 'Retorna posts publicados para exibição pública (landing page)';

-- RPC para buscar um post específico por slug
CREATE OR REPLACE FUNCTION get_post_by_slug(
  p_tenant_id UUID,
  p_slug TEXT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  published_at TIMESTAMPTZ,
  author_name TEXT,
  author_id UUID,
  tags TEXT[],
  views_count INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Incrementar contador de visualizações
  UPDATE blog_posts 
  SET views_count = views_count + 1
  WHERE tenant_id = p_tenant_id AND slug = p_slug;
  
  RETURN QUERY
  SELECT 
    bp.id,
    bp.title,
    bp.slug,
    bp.excerpt,
    bp.content,
    bp.featured_image,
    bp.published_at,
    up.full_name as author_name,
    bp.author_id,
    bp.tags,
    bp.views_count + 1 as views_count
  FROM blog_posts bp
  LEFT JOIN profiles up ON up.id = bp.author_id
  WHERE bp.tenant_id = p_tenant_id 
    AND bp.slug = p_slug
    AND bp.status = 'published';
END;
$$;

COMMENT ON FUNCTION get_post_by_slug IS 'Retorna post específico por slug e incrementa views';

-- RPC para habilitar módulo (apenas superadmin)
CREATE OR REPLACE FUNCTION enable_module_for_tenant(
  p_tenant_id UUID,
  p_module_name TEXT,
  p_enabled_by UUID,
  p_settings JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO tenant_modules (tenant_id, module_name, is_enabled, enabled_at, enabled_by, settings)
  VALUES (p_tenant_id, p_module_name, true, NOW(), p_enabled_by, p_settings)
  ON CONFLICT (tenant_id, module_name) 
  DO UPDATE SET 
    is_enabled = true,
    enabled_at = NOW(),
    enabled_by = p_enabled_by,
    settings = p_settings,
    updated_at = NOW();
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION enable_module_for_tenant IS 'Habilita um módulo para um tenant (apenas superadmin)';

-- RPC para desabilitar módulo (apenas superadmin)
CREATE OR REPLACE FUNCTION disable_module_for_tenant(
  p_tenant_id UUID,
  p_module_name TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tenant_modules
  SET is_enabled = false, updated_at = NOW()
  WHERE tenant_id = p_tenant_id AND module_name = p_module_name;
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION disable_module_for_tenant IS 'Desabilita um módulo para um tenant (apenas superadmin)';

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- available_modules: leitura pública
ALTER TABLE available_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "available_modules_select_all" ON available_modules
  FOR SELECT USING (true);

-- tenant_modules: apenas o próprio tenant
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_modules_select_own" ON tenant_modules
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- blog_posts: RLS já habilitado, vamos adicionar política se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_posts' AND policyname = 'blog_posts_select_published_modules'
  ) THEN
    CREATE POLICY "blog_posts_select_published_modules" ON blog_posts
      FOR SELECT USING (
        status = 'published' AND published_at <= NOW()
      );
  END IF;
END $$;

