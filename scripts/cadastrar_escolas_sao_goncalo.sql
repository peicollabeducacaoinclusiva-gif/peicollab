-- ============================================================================
-- CADASTRO: Escolas de São Gonçalo do Amarante/CE
-- Data: 2025-11-05
-- Descrição: Cadastra as 7 escolas identificadas no CSV
-- ============================================================================

-- ⚠️ IMPORTANTE: Substitua 'SEU-TENANT-ID' pelo ID real da rede de São Gonçalo

-- ============================================================================
-- Verificar tenant existente ou criar
-- ============================================================================

-- Opção 1: Usar tenant existente
-- Copie o ID do tenant de São Gonçalo:
-- SELECT id, network_name FROM tenants WHERE network_name ILIKE '%são gonçalo%';

-- Opção 2: Criar novo tenant
INSERT INTO tenants (
  network_name,
  network_address,
  network_email,
  is_active
) VALUES (
  'Rede Municipal de Ensino - São Gonçalo do Amarante/CE',
  'São Gonçalo do Amarante - CE',
  'educacao@saogoncalo.ce.gov.br',
  true
)
ON CONFLICT DO NOTHING
RETURNING id;

-- Pegar o ID do tenant (ajuste se necessário)
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Buscar tenant de São Gonçalo
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE network_name ILIKE '%são gonçalo%'
  LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant de São Gonçalo não encontrado. Execute o INSERT acima primeiro.';
  END IF;
  
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
  
  -- ============================================================================
  -- CADASTRAR AS 7 ESCOLAS
  -- ============================================================================
  
  -- 1. ESCOLA MUNICIPAL EMIGDIA PEDREIRA DE SOUZA
  INSERT INTO schools (
    tenant_id,
    school_name,
    is_active
  ) VALUES (
    v_tenant_id,
    'ESCOLA MUNICIPAL EMIGDIA PEDREIRA DE SOUZA',
    true
  )
  ON CONFLICT DO NOTHING;
  
  -- 2. ESCOLA MUNICIPAL MANOEL FRANCISCO DE OLIVEIRA
  INSERT INTO schools (
    tenant_id,
    school_name,
    is_active
  ) VALUES (
    v_tenant_id,
    'ESCOLA MUNICIPAL MANOEL FRANCISCO DE OLIVEIRA',
    true
  )
  ON CONFLICT DO NOTHING;
  
  -- 3. ESCOLA MUNICIPAL DEPUTADO NÓIDE CERQUEIRA
  INSERT INTO schools (
    tenant_id,
    school_name,
    is_active
  ) VALUES (
    v_tenant_id,
    'ESCOLA MUNICIPAL DEPUTADO NÓIDE CERQUEIRA',
    true
  )
  ON CONFLICT DO NOTHING;
  
  -- 4. ESCOLA MUNICIPAL FRANCISCO JOSÉ DA SILVA
  INSERT INTO schools (
    tenant_id,
    school_name,
    is_active
  ) VALUES (
    v_tenant_id,
    'ESCOLA MUNICIPAL FRANCISCO JOSÉ DA SILVA',
    true
  )
  ON CONFLICT DO NOTHING;
  
  -- 5. ESCOLA MUNICIPAL PEDRO MOURA (cadastrar apenas versão completa)
  INSERT INTO schools (
    tenant_id,
    school_name,
    is_active
  ) VALUES (
    v_tenant_id,
    'ESCOLA MUNICIPAL PEDRO MOURA',
    true
  )
  ON CONFLICT DO NOTHING;
  
  -- 6. CRECHE ESCOLA TIA MARIA ANTÔNIA FALCÃO
  INSERT INTO schools (
    tenant_id,
    school_name,
    is_active
  ) VALUES (
    v_tenant_id,
    'CRECHE ESCOLA TIA MARIA ANTÔNIA FALCÃO',
    true
  )
  ON CONFLICT DO NOTHING;
  
  -- 7. ESCOLA MUNICIPAL PROFESSORA FELICÍSSIMA GUIMARÃES PINTO
  INSERT INTO schools (
    tenant_id,
    school_name,
    is_active
  ) VALUES (
    v_tenant_id,
    'ESCOLA MUNICIPAL PROFESSORA FELICÍSSIMA GUIMARÃES PINTO',
    true
  )
  ON CONFLICT DO NOTHING;
  
  -- ============================================================================
  -- VERIFICAÇÃO
  -- ============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Escolas cadastradas com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE 'Escolas de São Gonçalo:';
  RAISE NOTICE '  1. ESCOLA MUNICIPAL EMIGDIA PEDREIRA DE SOUZA';
  RAISE NOTICE '  2. ESCOLA MUNICIPAL MANOEL FRANCISCO DE OLIVEIRA';
  RAISE NOTICE '  3. ESCOLA MUNICIPAL DEPUTADO NÓIDE CERQUEIRA';
  RAISE NOTICE '  4. ESCOLA MUNICIPAL FRANCISCO JOSÉ DA SILVA';
  RAISE NOTICE '  5. ESCOLA MUNICIPAL PEDRO MOURA';
  RAISE NOTICE '  6. CRECHE ESCOLA TIA MARIA ANTÔNIA FALCÃO';
  RAISE NOTICE '  7. ESCOLA MUNICIPAL PROFESSORA FELICÍSSIMA GUIMARÃES PINTO';
  RAISE NOTICE '';
  RAISE NOTICE 'Total: 7 escolas cadastradas';
  
END $$;

