-- ============================================================
-- CORREÇÃO: student_access baseado em pei_teachers
-- Problema: Sistema mudou para múltiplos professores por PEI
--           mas student_access só considera assigned_teacher_id
-- Solução: Criar student_access para TODOS os professores 
--          que estão na tabela pei_teachers
-- ============================================================

-- 1️⃣ DIAGNÓSTICO: Ver a situação atual
SELECT 
  '🔍 PROFESSORES EM PEI_TEACHERS' as info,
  prof.full_name as professor,
  s.name as aluno,
  pt.subject as disciplina,
  pt.is_primary as eh_responsavel,
  EXISTS (
    SELECT 1 FROM student_access sa
    WHERE sa.user_id = pt.teacher_id
    AND sa.student_id = p.student_id
  ) as tem_student_access
FROM pei_teachers pt
JOIN peis p ON p.id = pt.pei_id
JOIN profiles prof ON prof.id = pt.teacher_id
JOIN students s ON s.id = p.student_id
WHERE prof.full_name ILIKE '%joão%'
  OR prof.id IN (
    SELECT teacher_id FROM pei_teachers
    WHERE pei_id IN (
      SELECT id FROM peis WHERE student_id IN (
        SELECT id FROM students WHERE name ILIKE '%débora%' OR name ILIKE '%carlos%'
      )
    )
  )
ORDER BY s.name, prof.full_name;

-- 2️⃣ IDENTIFICAR FALTANTES
SELECT 
  '❌ FALTANDO EM STUDENT_ACCESS' as info,
  prof.full_name as professor,
  prof.id as professor_id,
  s.name as aluno,
  s.id as aluno_id,
  COUNT(*) as peis_sem_acesso
FROM pei_teachers pt
JOIN peis p ON p.id = pt.pei_id
JOIN profiles prof ON prof.id = pt.teacher_id
JOIN students s ON s.id = p.student_id
WHERE NOT EXISTS (
  SELECT 1 FROM student_access sa
  WHERE sa.user_id = pt.teacher_id
  AND sa.student_id = p.student_id
)
GROUP BY prof.id, prof.full_name, s.id, s.name
ORDER BY prof.full_name, s.name;

-- 3️⃣ CORREÇÃO: Criar student_access para todos os pei_teachers
INSERT INTO student_access (user_id, student_id)
SELECT DISTINCT 
  pt.teacher_id as user_id,
  p.student_id
FROM pei_teachers pt
JOIN peis p ON p.id = pt.pei_id
WHERE p.is_active_version = true
  AND NOT EXISTS (
    SELECT 1 FROM student_access sa
    WHERE sa.user_id = pt.teacher_id
    AND sa.student_id = p.student_id
  );

-- 4️⃣ VERIFICAÇÃO: Confirmar resultado
SELECT 
  '✅ RESULTADO' as info,
  'Professor João' as descricao,
  COUNT(DISTINCT sa.student_id) as total_alunos_acessiveis
FROM student_access sa
JOIN profiles prof ON prof.id = sa.user_id
WHERE prof.full_name ILIKE '%joão%';

-- 5️⃣ VERIFICAR Débora e Carlos especificamente
SELECT 
  '🎯 DÉBORA E CARLOS - VERIFICAÇÃO FINAL' as info,
  s.name as aluno,
  STRING_AGG(DISTINCT prof.full_name, ', ' ORDER BY prof.full_name) as professores_com_acesso
FROM students s
JOIN student_access sa ON sa.student_id = s.id
JOIN profiles prof ON prof.id = sa.user_id
WHERE s.name ILIKE '%débora%' OR s.name ILIKE '%carlos%'
GROUP BY s.id, s.name
ORDER BY s.name;

-- 6️⃣ GARANTIR SINCRONIZAÇÃO CONTÍNUA
-- Recriar trigger para considerar pei_teachers
CREATE OR REPLACE FUNCTION auto_create_student_access_from_pei_teachers()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar student_access para o professor e aluno do PEI
  INSERT INTO public.student_access (user_id, student_id)
  SELECT DISTINCT pt.teacher_id, p.student_id
  FROM pei_teachers pt
  JOIN peis p ON p.id = pt.pei_id
  WHERE pt.pei_id = NEW.pei_id
    AND pt.teacher_id = NEW.teacher_id
  ON CONFLICT (user_id, student_id) DO NOTHING;
  
  RAISE NOTICE 'student_access criado para professor % e aluno do PEI %', 
    NEW.teacher_id, NEW.pei_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para quando novo professor é adicionado ao PEI
DROP TRIGGER IF EXISTS auto_create_student_access_pei_teachers_trigger ON pei_teachers;
CREATE TRIGGER auto_create_student_access_pei_teachers_trigger
  AFTER INSERT ON pei_teachers
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_student_access_from_pei_teachers();

-- 7️⃣ MENSAGEM FINAL
DO $$
DECLARE
  v_count_before INTEGER;
  v_count_after INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_before FROM student_access;
  
  -- Aguardar que as inserções sejam processadas
  PERFORM pg_sleep(0.1);
  
  SELECT COUNT(*) INTO v_count_after FROM student_access;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORREÇÃO APLICADA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Registros em student_access:';
  RAISE NOTICE '   Total: %', v_count_after;
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Trigger criado:';
  RAISE NOTICE '   Novos professores em pei_teachers';
  RAISE NOTICE '   = student_access automático';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Faça LOGOUT/LOGIN como João';
  RAISE NOTICE '   2. Limpe o cache do navegador (Ctrl+Shift+R)';
  RAISE NOTICE '   3. Tente editar os PEIs';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Agora deve funcionar!';
  RAISE NOTICE '========================================';
END $$;

