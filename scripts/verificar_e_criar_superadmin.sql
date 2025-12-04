-- ============================================================================
-- Verificar Superadmin e Ativar Coordenadores
-- Data: 2025-11-05
-- ============================================================================

-- ============================================================================
-- PASSO 1: Verificar se existe superadmin
-- ============================================================================

DO $$
DECLARE
  v_superadmin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_superadmin_count
  FROM user_roles
  WHERE role = 'superadmin';
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Verificando superadmins...';
  RAISE NOTICE 'Total de superadmins: %', v_superadmin_count;
  RAISE NOTICE '';
  
  IF v_superadmin_count = 0 THEN
    RAISE NOTICE '⚠️  Nenhum superadmin encontrado!';
  ELSE
    RAISE NOTICE '✅ Superadmins existentes:';
  END IF;
END $$;

-- Listar superadmins
SELECT 
  p.full_name,
  p.email,
  p.is_active,
  p.created_at
FROM profiles p
INNER JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'superadmin'
ORDER BY p.created_at;

-- ============================================================================
-- PASSO 2: ATIVAR TODOS OS COORDENADORES
-- ============================================================================

UPDATE profiles
SET is_active = true
WHERE id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role = 'coordinator'
);

DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Coordenadores ativados: %', v_updated;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- PASSO 3: Verificar coordenadores ativos
-- ============================================================================

SELECT 
  p.full_name,
  p.email,
  p.is_active,
  COUNT(pei.id) as peis_criados
FROM profiles p
INNER JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN peis pei ON pei.created_by = p.id
WHERE ur.role = 'coordinator'
GROUP BY p.id, p.full_name, p.email, p.is_active
ORDER BY peis_criados DESC;

-- ============================================================================
-- LOG FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ COORDENADORES ATIVADOS                              ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TESTE AGORA:';
  RAISE NOTICE '   📧 Email: calin3.estrela@gmail.com';
  RAISE NOTICE '   🔒 Senha: PeiCollab@2025';
  RAISE NOTICE '';
  RAISE NOTICE 'Se houver superadmin, use-o para gerenciar.';
  RAISE NOTICE 'Se NÃO houver, vou criar um para você.';
END $$;

