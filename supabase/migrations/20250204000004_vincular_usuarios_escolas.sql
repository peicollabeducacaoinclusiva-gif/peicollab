-- ============================================================================
-- Vincular Usuários a Escolas
-- ============================================================================
-- Data: 04/11/2024
-- Problema: Coordenadores, Professores e Diretores sem school_id
-- Solução: Vincular usuários às primeiras escolas disponíveis
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Vinculando usuários a escolas...';
END $$;

-- 1. Buscar primeira escola disponível (ou criar escola demo se não houver)
DO $$
DECLARE
  v_school_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Buscar primeira escola
  SELECT id, tenant_id INTO v_school_id, v_tenant_id
  FROM public.schools
  WHERE is_active = true
  LIMIT 1;
  
  -- Se não houver escola, criar uma escola demo
  IF v_school_id IS NULL THEN
    RAISE NOTICE 'Nenhuma escola encontrada. Criando escola demo...';
    
    -- Buscar ou criar tenant demo
    SELECT id INTO v_tenant_id
    FROM public.tenants
    WHERE network_name LIKE '%Demo%' OR network_name LIKE '%Teste%'
    LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
      -- Criar tenant demo
      INSERT INTO public.tenants (network_name, is_active)
      VALUES ('Rede Municipal Demo', true)
      RETURNING id INTO v_tenant_id;
      
      RAISE NOTICE '✓ Tenant demo criado: %', v_tenant_id;
    END IF;
    
    -- Criar escola demo
    INSERT INTO public.schools (tenant_id, school_name, is_active)
    VALUES (v_tenant_id, 'Escola Municipal Demo', true)
    RETURNING id INTO v_school_id;
    
    RAISE NOTICE '✓ Escola demo criada: %', v_school_id;
  ELSE
    RAISE NOTICE '✓ Escola encontrada: %', v_school_id;
  END IF;
  
  -- 2. Atualizar coordenadores sem school_id
  UPDATE public.profiles
  SET school_id = v_school_id,
      tenant_id = COALESCE(tenant_id, v_tenant_id)
  WHERE id IN (
    SELECT user_id FROM public.user_roles
    WHERE role::text IN ('coordinator', 'teacher', 'aee_teacher', 'school_director', 'school_manager')
  )
  AND school_id IS NULL;
  
  RAISE NOTICE '✓ Usuários vinculados à escola';
  
END $$;

-- 3. Validação
DO $$
DECLARE
  v_users_without_school INTEGER;
  v_total_non_admin INTEGER;
BEGIN
  -- Contar usuários que precisam de escola mas não têm
  SELECT COUNT(*) INTO v_users_without_school
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role::text NOT IN ('superadmin', 'education_secretary', 'family', 'specialist')
  AND p.school_id IS NULL;
  
  -- Total de usuários que não são admin/secretary
  SELECT COUNT(*) INTO v_total_non_admin
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role::text NOT IN ('superadmin', 'education_secretary');
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESULTADO:';
  RAISE NOTICE 'Total usuários (exceto admin/secretary): %', v_total_non_admin;
  RAISE NOTICE 'Usuários sem escola: %', v_users_without_school;
  
  IF v_users_without_school = 0 THEN
    RAISE NOTICE '✅ Todos os usuários estão vinculados a escolas!';
  ELSE
    RAISE WARNING '⚠️ Ainda há % usuários sem escola', v_users_without_school;
  END IF;
END $$;

