-- ============================================================
-- VERIFICAR RLS: Por que coordenador não consegue criar PEI
-- ============================================================

-- 1. Ver todas as policies ativas na tabela peis
SELECT 
  '🔐 POLICIES ATIVAS EM PEIS' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'peis'
ORDER BY policyname;

-- 2. Verificar se RLS está habilitado
SELECT 
  '🔐 RLS HABILITADO?' as info,
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'peis';

-- 3. Testar função get_user_school_direct() para coordenador
SELECT 
  '👤 COORDENADOR INFO' as info,
  auth.uid() as current_user_id,
  get_user_school_direct() as school_id_from_function;

-- 4. Verificar se coordenador tem role correto
SELECT 
  '👔 ROLE DO COORDENADOR' as info,
  has_role_direct('coordinator') as tem_role_coordinator;

-- 5. Ver perfil completo do coordenador atual
SELECT 
  '👤 PERFIL COMPLETO' as info,
  p.id,
  p.full_name,
  p.school_id,
  p.tenant_id,
  STRING_AGG(ur.role, ', ') as roles
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.id = auth.uid()
GROUP BY p.id, p.full_name, p.school_id, p.tenant_id;

-- 6. Simular criação de PEI (sem executar) para ver qual policy bloquearia
-- Note: Esta query só simula, não cria nada
EXPLAIN (VERBOSE, COSTS OFF)
SELECT 
  '🔍 SIMULAÇÃO DE INSERT' as info
FROM peis
WHERE false; -- Não executa, só explica

-- 7. Ver se há constraint em assigned_teacher_id
SELECT 
  '🔐 CONSTRAINTS EM PEIS' as info,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.peis'::regclass
ORDER BY conname;

-- 8. Ver triggers que podem estar bloqueando
SELECT 
  '🔥 TRIGGERS EM PEIS' as info,
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'public.peis'::regclass
  AND tgname NOT LIKE 'RI_%' -- Excluir triggers de integridade referencial
ORDER BY tgname;

-- 9. TESTE REAL: Tentar criar PEI de teste
-- ATENÇÃO: Isto vai tentar realmente criar. Comente se não quiser executar.
/*
DO $$
DECLARE
  v_student_id UUID;
  v_school_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Pegar um aluno qualquer da escola do coordenador
  SELECT s.id, s.school_id, s.tenant_id 
  INTO v_student_id, v_school_id, v_tenant_id
  FROM students s
  WHERE s.school_id = get_user_school_direct()
  LIMIT 1;
  
  IF v_student_id IS NULL THEN
    RAISE NOTICE '❌ Nenhum aluno encontrado na escola do coordenador';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Tentando criar PEI para aluno: %', v_student_id;
  
  -- Tentar criar PEI sem assigned_teacher_id
  INSERT INTO peis (
    student_id,
    school_id,
    tenant_id,
    created_by,
    assigned_teacher_id,
    status,
    version_number,
    is_active_version,
    diagnosis_data,
    planning_data,
    evaluation_data
  ) VALUES (
    v_student_id,
    v_school_id,
    v_tenant_id,
    auth.uid(),
    NULL,  -- SEM PROFESSOR ATRIBUÍDO
    'draft',
    1,
    true,
    '{}',
    '{}',
    '{}'
  );
  
  RAISE NOTICE '✅ PEI criado com sucesso sem assigned_teacher_id!';
  
  -- Desfazer (rollback) para não deixar PEI de teste
  RAISE EXCEPTION 'Rollback intencional - PEI de teste não será salvo';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO: %', SQLERRM;
    RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
END $$;
*/

-- 10. Verificar se WITH CHECK está presente na policy de coordinator
SELECT 
  '🔍 POLICY DETALHES - coordinators_manage_school_peis' as info,
  polname,
  polcmd,
  polpermissive,
  polroles::regrole[],
  pg_get_expr(polqual, polrelid) as using_clause,
  pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy
WHERE polrelid = 'public.peis'::regclass
  AND polname = 'coordinators_manage_school_peis';


































