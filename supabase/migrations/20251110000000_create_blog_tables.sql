-- Criar tabela de categorias do blog
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de posts do blog
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- RLS (Row Level Security) Policies
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias
-- Todos podem ler
CREATE POLICY "Categorias são públicas para leitura"
  ON blog_categories FOR SELECT
  USING (true);

-- Apenas admins podem criar/editar/deletar categorias
CREATE POLICY "Apenas admins podem gerenciar categorias"
  ON blog_categories FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'super_admin'
    )
  );

-- Políticas para posts
-- Todos podem ler posts publicados
CREATE POLICY "Posts publicados são públicos para leitura"
  ON blog_posts FOR SELECT
  USING (published = true OR auth.uid() = author_id);

-- Apenas o autor ou admin podem criar posts
CREATE POLICY "Usuários autenticados podem criar posts"
  ON blog_posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = author_id
  );

-- Apenas o autor ou admin podem editar posts
CREATE POLICY "Autor ou admin podem editar posts"
  ON blog_posts FOR UPDATE
  USING (
    auth.uid() = author_id OR
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'super_admin'
    )
  );

-- Apenas o autor ou admin podem deletar posts
CREATE POLICY "Autor ou admin podem deletar posts"
  ON blog_posts FOR DELETE
  USING (
    auth.uid() = author_id OR
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'super_admin'
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_blog_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_blog_post_updated_at ON blog_posts;
CREATE TRIGGER trigger_update_blog_post_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_updated_at();

-- Inserir categorias padrão
INSERT INTO blog_categories (name, slug, description) VALUES
  ('Educação Inclusiva', 'educacao-inclusiva', 'Artigos sobre práticas de educação inclusiva'),
  ('PEI Colaborativo', 'pei-colaborativo', 'Informações sobre o sistema PEI Colaborativo'),
  ('Tutoriais', 'tutoriais', 'Guias práticos e tutoriais'),
  ('Novidades', 'novidades', 'Atualizações e novidades do sistema'),
  ('Dicas', 'dicas', 'Dicas e boas práticas para educadores')
ON CONFLICT (slug) DO NOTHING;

-- Comentário nas tabelas
COMMENT ON TABLE blog_categories IS 'Categorias dos posts do blog';
COMMENT ON TABLE blog_posts IS 'Posts do blog educacional';















