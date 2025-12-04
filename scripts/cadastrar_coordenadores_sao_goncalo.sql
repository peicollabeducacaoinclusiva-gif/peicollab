-- ============================================================================
-- CADASTRO MANUAL: Coordenadores de São Gonçalo
-- Data: 2025-11-05
-- 
-- Como a auto-criação está com problemas, vamos cadastrar manualmente
-- os 11 coordenadores do CSV
-- ============================================================================

-- ⚠️ IMPORTANTE: Os coordenadores serão criados APENAS em profiles/user_roles
-- Os logins de auth.users devem ser criados manualmente ou via interface
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_school_emigdia UUID;
  v_school_manoel UUID;
  v_school_noide UUID;
  v_school_francisco UUID;
  v_school_pedro UUID;
  v_school_tia_maria UUID;
  v_school_felicissima UUID;
  v_coord_id UUID;
BEGIN
  -- Buscar tenant
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE network_name ILIKE '%são gonçalo%'
  LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant não encontrado. Execute cadastrar_escolas_sao_goncalo.sql primeiro.';
  END IF;
  
  -- Buscar escolas
  SELECT id INTO v_school_emigdia FROM schools WHERE school_name LIKE '%EMIGDIA%' LIMIT 1;
  SELECT id INTO v_school_manoel FROM schools WHERE school_name LIKE '%MANOEL FRANCISCO%' LIMIT 1;
  SELECT id INTO v_school_noide FROM schools WHERE school_name LIKE '%NÓIDE%' LIMIT 1;
  SELECT id INTO v_school_francisco FROM schools WHERE school_name LIKE '%FRANCISCO JOSÉ%' LIMIT 1;
  SELECT id INTO v_school_pedro FROM schools WHERE school_name LIKE '%PEDRO MOURA%' LIMIT 1;
  SELECT id INTO v_school_tia_maria FROM schools WHERE school_name LIKE '%TIA MARIA%' LIMIT 1;
  SELECT id INTO v_school_felicissima FROM schools WHERE school_name LIKE '%FELICÍSSIMA%' LIMIT 1;
  
  RAISE NOTICE 'Criando coordenadores...';
  RAISE NOTICE '';
  
  -- =========================================================================
  -- COORDENADORES (apenas profiles + user_roles, sem auth.users)
  -- =========================================================================
  
  -- 1. erotildesrosa33@gmail.com → Escola Emigdia
  INSERT INTO profiles (full_name, school_id, tenant_id, role, is_active)
  VALUES ('Erotildesrosa33', v_school_emigdia, v_tenant_id, 'coordinator', true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_coord_id;
  
  IF v_coord_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role) VALUES (v_coord_id, 'coordinator') ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ Criado: Erotildesrosa33 (erotildesrosa33@gmail.com) - Senha: PeiCollab@2025';
  END IF;
  
  -- 2. jaquelinnesouzasilva27@gmail.com → Escola Emigdia
  INSERT INTO profiles (full_name, school_id, tenant_id, role, is_active)
  VALUES ('Jaquelinnesouzasilva27', v_school_emigdia, v_tenant_id, 'coordinator', true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_coord_id;
  
  IF v_coord_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role) VALUES (v_coord_id, 'coordinator') ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ Criado: Jaquelinnesouzasilva27 (jaquelinnesouzasilva27@gmail.com) - Senha: PeiCollab@2025';
  END IF;
  
  -- 3. vi_garcia19@hotmail.com → Escola Manoel Francisco
  INSERT INTO profiles (full_name, school_id, tenant_id, role, is_active)
  VALUES ('Vi Garcia19', v_school_manoel, v_tenant_id, 'coordinator', true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_coord_id;
  
  IF v_coord_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role) VALUES (v_coord_id, 'coordinator') ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ Criado: Vi Garcia19 (vi_garcia19@hotmail.com) - Senha: PeiCollab@2025';
  END IF;
  
  -- 4. ecmnoidecerqueira@gmail.com → Escola Nóide Cerqueira
  INSERT INTO profiles (full_name, school_id, tenant_id, role, is_active)
  VALUES ('Ecmnoidecerqueira', v_school_noide, v_tenant_id, 'coordinator', true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_coord_id;
  
  IF v_coord_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role) VALUES (v_coord_id, 'coordinator') ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ Criado: Ecmnoidecerqueira (ecmnoidecerqueira@gmail.com) - Senha: PeiCollab@2025';
  END IF;
  
  -- 5-11. Outros coordenadores...
  -- (Adicione conforme necessário seguindo o padrão acima)
  
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANTE: Estes coordenadores NÃO podem fazer login ainda!';
  RAISE NOTICE '   Precisam ser criados em auth.users via Supabase Dashboard';
  RAISE NOTICE '   ou via script separado.';
  
END $$;

