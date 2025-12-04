-- ============================================================================
-- MIGRAÇÃO: Configuração de Apps por Tenant
-- Data: 15/02/2025
-- Descrição: Sistema para gerenciar apps ativos por tenant e filtrar por roles
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela tenant_apps
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  app_id text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, app_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tenant_apps_tenant_id ON public.tenant_apps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_apps_app_id ON public.tenant_apps(app_id);
CREATE INDEX IF NOT EXISTS idx_tenant_apps_active ON public.tenant_apps(tenant_id, is_active) WHERE is_active = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_tenant_apps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_apps_updated_at
  BEFORE UPDATE ON public.tenant_apps
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_apps_updated_at();

-- ============================================================================
-- PARTE 2: RPC para buscar apps disponíveis para o usuário
-- ============================================================================

CREATE OR REPLACE FUNCTION get_available_apps_for_user(p_user_id uuid)
RETURNS TABLE (
  app_id text,
  app_name text,
  app_url text,
  app_icon text,
  display_order integer
) AS $$
DECLARE
  v_user_roles text[];
  v_tenant_id uuid;
  v_app_config RECORD;
BEGIN
  -- Buscar roles do usuário
  SELECT ARRAY_AGG(role::text) INTO v_user_roles
  FROM public.user_roles
  WHERE user_id = p_user_id;

  -- Buscar tenant_id do usuário
  SELECT get_user_tenant_safe(p_user_id) INTO v_tenant_id;

  -- Se não tem roles ou tenant, retornar vazio
  IF v_user_roles IS NULL OR array_length(v_user_roles, 1) = 0 OR v_tenant_id IS NULL THEN
    RETURN;
  END IF;

  -- Definir configuração de apps com roles permitidas
  -- Esta é a lista master de apps e suas permissões
  RETURN QUERY
  WITH app_configs AS (
    SELECT 
      'pei-collab'::text as app_id,
      'PEI Collab'::text as app_name,
      COALESCE(
        current_setting('app.pei_collab_url', true),
        'http://localhost:8080'
      )::text || '/dashboard' as app_url,
      'GraduationCap'::text as app_icon,
      ARRAY['superadmin', 'education_secretary', 'school_manager', 'school_director', 'coordinator', 'teacher', 'aee_teacher', 'specialist', 'family']::text[] as allowed_roles,
      1::integer as default_order
    UNION ALL
    SELECT 
      'gestao-escolar'::text,
      'Gestão Escolar'::text,
      COALESCE(
        current_setting('app.gestao_escolar_url', true),
        'http://localhost:5174'
      )::text,
      'School'::text,
      ARRAY['superadmin', 'education_secretary', 'school_manager', 'school_director', 'coordinator']::text[],
      2::integer
    UNION ALL
    SELECT 
      'plano-aee'::text,
      'Plano de AEE'::text,
      COALESCE(
        current_setting('app.plano_aee_url', true),
        'http://localhost:5175'
      )::text,
      'FileText'::text,
      ARRAY['superadmin', 'school_manager', 'school_director', 'coordinator', 'aee_teacher']::text[],
      3::integer
    UNION ALL
    SELECT 
      'planejamento'::text,
      'Planejamento'::text,
      COALESCE(
        current_setting('app.planejamento_url', true),
        'http://localhost:5176'
      )::text,
      'Calendar'::text,
      ARRAY['superadmin', 'school_manager', 'school_director', 'coordinator', 'teacher']::text[],
      4::integer
    UNION ALL
    SELECT 
      'atividades'::text,
      'Atividades'::text,
      COALESCE(
        current_setting('app.atividades_url', true),
        'http://localhost:5178'
      )::text,
      'BookOpen'::text,
      ARRAY['superadmin', 'teacher', 'aee_teacher']::text[],
      5::integer
    UNION ALL
    SELECT 
      'blog'::text,
      'Blog'::text,
      COALESCE(
        current_setting('app.blog_url', true),
        'http://localhost:5179'
      )::text,
      'Newspaper'::text,
      ARRAY['superadmin', 'education_secretary']::text[],
      6::integer
    UNION ALL
    SELECT 
      'portal-responsavel'::text,
      'Portal do Responsável'::text,
      COALESCE(
        current_setting('app.portal_responsavel_url', true),
        'http://localhost:5180'
      )::text,
      'Users'::text,
      ARRAY['family']::text[],
      7::integer
    UNION ALL
    SELECT 
      'transporte-escolar'::text,
      'Transporte Escolar'::text,
      COALESCE(
        current_setting('app.transporte_escolar_url', true),
        'http://localhost:5181'
      )::text,
      'Bus'::text,
      ARRAY['superadmin', 'education_secretary', 'school_manager', 'school_director']::text[],
      8::integer
    UNION ALL
    SELECT 
      'merenda-escolar'::text,
      'Merenda Escolar'::text,
      COALESCE(
        current_setting('app.merenda_escolar_url', true),
        'http://localhost:5182'
      )::text,
      'Utensils'::text,
      ARRAY['superadmin', 'education_secretary', 'school_manager', 'school_director']::text[],
      9::integer
  )
  SELECT 
    ac.app_id,
    ac.app_name,
    ac.app_url,
    ac.app_icon,
    COALESCE(ta.display_order, ac.default_order) as display_order
  FROM app_configs ac
  LEFT JOIN public.tenant_apps ta ON ta.tenant_id = v_tenant_id 
    AND ta.app_id = ac.app_id
  WHERE 
    -- App está ativo para o tenant (ou não tem configuração específica, então usa padrão)
    (ta.is_active IS NULL OR ta.is_active = true)
    -- E usuário tem role permitida
    AND EXISTS (
      SELECT 1 
      FROM unnest(v_user_roles) as user_role
      WHERE user_role = ANY(ac.allowed_roles)
    )
  ORDER BY COALESCE(ta.display_order, ac.default_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 3: Função para popular apps padrão para tenants
-- ============================================================================

CREATE OR REPLACE FUNCTION populate_default_tenant_apps(p_tenant_id uuid)
RETURNS void AS $$
BEGIN
  -- Inserir apps padrão para o tenant se não existirem
  INSERT INTO public.tenant_apps (tenant_id, app_id, is_active, display_order)
  VALUES
    (p_tenant_id, 'pei-collab', true, 1),
    (p_tenant_id, 'gestao-escolar', true, 2),
    (p_tenant_id, 'plano-aee', true, 3),
    (p_tenant_id, 'planejamento', true, 4),
    (p_tenant_id, 'atividades', true, 5),
    (p_tenant_id, 'blog', true, 6),
    (p_tenant_id, 'portal-responsavel', true, 7),
    (p_tenant_id, 'transporte-escolar', true, 8),
    (p_tenant_id, 'merenda-escolar', true, 9)
  ON CONFLICT (tenant_id, app_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 4: Popular apps padrão para tenants existentes
-- ============================================================================

DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM public.tenants
  LOOP
    PERFORM populate_default_tenant_apps(tenant_record.id);
  END LOOP;
  
  RAISE NOTICE '✅ Apps padrão populados para todos os tenants existentes';
END $$;

-- ============================================================================
-- PARTE 5: Comentários e documentação
-- ============================================================================

COMMENT ON TABLE public.tenant_apps IS 'Configuração de apps disponíveis por tenant';
COMMENT ON COLUMN public.tenant_apps.app_id IS 'Identificador do app (pei-collab, gestao-escolar, etc.)';
COMMENT ON COLUMN public.tenant_apps.is_active IS 'Se o app está ativo para o tenant';
COMMENT ON COLUMN public.tenant_apps.display_order IS 'Ordem de exibição no seletor de apps';

COMMENT ON FUNCTION get_available_apps_for_user IS 'Retorna apps disponíveis para o usuário baseado em roles e configuração do tenant';

-- ============================================================================
-- PARTE 6: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de configuração de apps por tenant concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tabelas criadas:';
  RAISE NOTICE '  1. ✅ tenant_apps - Configuração de apps por tenant';
  RAISE NOTICE '';
  RAISE NOTICE 'RPCs criados:';
  RAISE NOTICE '  1. ✅ get_available_apps_for_user - Busca apps disponíveis para usuário';
  RAISE NOTICE '  2. ✅ populate_default_tenant_apps - Popula apps padrão para tenant';
  RAISE NOTICE '';
  RAISE NOTICE 'Dados:';
  RAISE NOTICE '  - Apps padrão populados para todos os tenants existentes';
END $$;

