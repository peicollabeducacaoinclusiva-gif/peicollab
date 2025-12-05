-- Script para habilitar módulos de teste
-- Execute este script no Supabase SQL Editor após identificar os IDs dos tenants

-- 1. VERIFICAR TENANTS DISPONÍVEIS
-- SELECT id, network_name FROM tenants WHERE is_active = true;

-- 2. HABILITAR MÓDULOS PARA UM TENANT ESPECÍFICO
-- Substitua 'TENANT_ID_AQUI' pelo ID real do tenant

-- Exemplo: Habilitar todos os módulos para tenant de teste
DO $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- Buscar primeiro tenant ativo (ajuste conforme necessário)
  SELECT id INTO v_tenant_id FROM tenants WHERE is_active = true LIMIT 1;
  
  -- Buscar primeiro superadmin (ajuste conforme necessário)
  SELECT id INTO v_user_id FROM profiles WHERE role = 'superadmin' LIMIT 1;
  
  IF v_tenant_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    -- Habilitar módulos do Gestão Escolar
    PERFORM enable_module_for_tenant(v_tenant_id, 'atividades', v_user_id, '{}'::jsonb);
    PERFORM enable_module_for_tenant(v_tenant_id, 'blog', v_user_id, '{}'::jsonb);
    PERFORM enable_module_for_tenant(v_tenant_id, 'merenda', v_user_id, '{}'::jsonb);
    PERFORM enable_module_for_tenant(v_tenant_id, 'planejamento', v_user_id, '{}'::jsonb);
    PERFORM enable_module_for_tenant(v_tenant_id, 'transporte', v_user_id, '{}'::jsonb);
    
    -- Habilitar módulo do PEI Collab
    PERFORM enable_module_for_tenant(v_tenant_id, 'plano-aee', v_user_id, '{}'::jsonb);
    
    RAISE NOTICE 'Módulos habilitados para tenant: %', v_tenant_id;
  ELSE
    RAISE NOTICE 'Tenant ou usuário não encontrado';
  END IF;
END $$;

-- 3. VERIFICAR MÓDULOS HABILITADOS
-- SELECT tm.*, am.display_name 
-- FROM tenant_modules tm
-- JOIN available_modules am ON am.name = tm.module_name
-- WHERE tm.is_enabled = true
-- ORDER BY tm.tenant_id, am.app;

-- 4. HABILITAR MÓDULO ESPECÍFICO (Alternativa Manual)
/*
-- Substitua os valores conforme necessário
SELECT enable_module_for_tenant(
  'TENANT_ID_AQUI'::UUID,     -- ID do tenant
  'atividades',                -- Nome do módulo
  'USER_ID_AQUI'::UUID,        -- ID do usuário que está habilitando
  '{}'::JSONB                  -- Configurações (vazio por padrão)
);
*/

-- 5. DESABILITAR MÓDULO ESPECÍFICO
/*
SELECT disable_module_for_tenant(
  'TENANT_ID_AQUI'::UUID,     -- ID do tenant
  'atividades'                 -- Nome do módulo
);
*/

-- 6. HABILITAR PARA TODOS OS TENANTS (Use com cuidado!)
/*
DO $$
DECLARE
  v_tenant RECORD;
  v_user_id UUID;
BEGIN
  -- Buscar primeiro superadmin
  SELECT id INTO v_user_id FROM profiles WHERE role = 'superadmin' LIMIT 1;
  
  -- Iterar sobre todos os tenants ativos
  FOR v_tenant IN SELECT id FROM tenants WHERE is_active = true LOOP
    -- Habilitar módulos essenciais
    PERFORM enable_module_for_tenant(v_tenant.id, 'blog', v_user_id, '{}'::jsonb);
    PERFORM enable_module_for_tenant(v_tenant.id, 'atividades', v_user_id, '{}'::jsonb);
  END LOOP;
  
  RAISE NOTICE 'Módulos habilitados para todos os tenants';
END $$;
*/

