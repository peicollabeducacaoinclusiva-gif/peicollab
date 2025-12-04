-- ============================================================
-- CORREÇÃO: Permitir coordenador criar PEI sem assigned_teacher_id
-- Problema: Policy não tem WITH CHECK adequado
-- ============================================================

-- 1. DIAGNÓSTICO: Ver policy atual
SELECT 
  '🔍 POLICY ATUAL' as info,
  polname as policy_name,
  polcmd as command,
  pg_get_expr(polqual, polrelid) as using_clause,
  pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy
WHERE polrelid = 'public.peis'::regclass
  AND polname = 'coordinators_manage_school_peis';

-- 2. RECRIAR POLICY com WITH CHECK adequado
DROP POLICY IF EXISTS "coordinators_manage_school_peis" ON public.peis;

CREATE POLICY "coordinators_manage_school_peis" ON public.peis
  FOR ALL
  USING (
    has_role_direct('coordinator')
    AND school_id = get_user_school_direct()
  )
  WITH CHECK (
    has_role_direct('coordinator')
    AND school_id = get_user_school_direct()
    AND created_by = auth.uid()
  );

-- 3. ADICIONAR policy específica para education_secretary gerenciar PEIs também
DROP POLICY IF EXISTS "education_secretary_manage_peis" ON public.peis;

CREATE POLICY "education_secretary_manage_peis" ON public.peis
  FOR ALL
  USING (
    has_role_direct('education_secretary')
    AND (
      school_id IN (
        SELECT id FROM schools WHERE tenant_id IN (
          SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
      )
      OR school_id = get_user_school_direct()
    )
  )
  WITH CHECK (
    has_role_direct('education_secretary')
    AND (
      school_id IN (
        SELECT id FROM schools WHERE tenant_id IN (
          SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
      )
      OR school_id = get_user_school_direct()
    )
    AND created_by = auth.uid()
  );

-- 4. VERIFICAÇÃO: Confirmar que policies foram criadas
SELECT 
  '✅ POLICIES ATUALIZADAS' as info,
  polname as policy_name,
  polcmd as applies_to,
  CASE 
    WHEN pg_get_expr(polwithcheck, polrelid) IS NOT NULL THEN 'TEM WITH CHECK ✅'
    ELSE 'SEM WITH CHECK ❌'
  END as tem_with_check
FROM pg_policy
WHERE polrelid = 'public.peis'::regclass
  AND polname IN ('coordinators_manage_school_peis', 'education_secretary_manage_peis')
ORDER BY polname;

-- 5. COMENTÁRIOS
COMMENT ON POLICY "coordinators_manage_school_peis" ON public.peis IS 
  'Coordenadores podem gerenciar (criar, editar, deletar, visualizar) PEIs da sua escola, incluindo criar sem assigned_teacher_id em situações especiais';

COMMENT ON POLICY "education_secretary_manage_peis" ON public.peis IS 
  'Secretários de Educação podem gerenciar PEIs de todas as escolas da sua rede';

-- 6. MENSAGEM FINAL
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ POLICIES CORRIGIDAS!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 O que foi feito:';
  RAISE NOTICE '  1. ✅ Policy de coordinator recriada com WITH CHECK';
  RAISE NOTICE '  2. ✅ Policy de education_secretary adicionada';
  RAISE NOTICE '  3. ✅ Validação de created_by incluída';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ AGORA COORDENADORES PODEM:';
  RAISE NOTICE '  • Criar PEIs sem assigned_teacher_id (NULL)';
  RAISE NOTICE '  • Atribuir professor depois';
  RAISE NOTICE '  • Ver todos os PEIs da escola';
  RAISE NOTICE '  • Editar e gerenciar PEIs';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 PRÓXIMO PASSO:';
  RAISE NOTICE '  Teste criar PEI como coordenador novamente!';
  RAISE NOTICE '========================================';
END $$;


































