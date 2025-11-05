-- ============================================================
-- CORREÇÃO SIMPLES: Professor sem alunos na lista
-- APENAS SINCRONIZA student_access COM PEIs EXISTENTES
-- SEGURO: Não cria/altera policies, triggers ou schemas
-- ============================================================

-- PASSO 1: Ver o problema (DIAGNÓSTICO)
SELECT 
  '🔍 DIAGNÓSTICO - Professores Afetados' as etapa,
  prof.full_name as professor,
  COUNT(DISTINCT p.student_id) as alunos_nos_peis,
  COUNT(DISTINCT sa.student_id) as alunos_com_acesso,
  (COUNT(DISTINCT p.student_id) - COUNT(DISTINCT sa.student_id)) as faltando
FROM peis p
JOIN profiles prof ON prof.id = p.assigned_teacher_id
LEFT JOIN student_access sa ON sa.user_id = p.assigned_teacher_id 
  AND sa.student_id = p.student_id
WHERE p.assigned_teacher_id IS NOT NULL
  AND p.is_active_version = true
GROUP BY prof.id, prof.full_name
HAVING COUNT(DISTINCT p.student_id) > COUNT(DISTINCT sa.student_id)
ORDER BY faltando DESC;

-- PASSO 2: Aplicar a correção
INSERT INTO student_access (user_id, student_id)
SELECT DISTINCT 
  p.assigned_teacher_id as user_id,
  p.student_id
FROM peis p
WHERE p.assigned_teacher_id IS NOT NULL
  AND p.is_active_version = true
  -- Evitar duplicatas: só inserir se não existir
  AND NOT EXISTS (
    SELECT 1 FROM student_access sa
    WHERE sa.user_id = p.assigned_teacher_id
    AND sa.student_id = p.student_id
  );

-- PASSO 3: Verificar resultado
SELECT 
  '✅ RESULTADO' as etapa,
  COUNT(*) as total_student_access_criados
FROM student_access
WHERE created_at > NOW() - INTERVAL '1 minute';

-- PASSO 4: Confirmar que não há mais PEIs sem acesso
SELECT 
  '✅ VERIFICAÇÃO FINAL' as etapa,
  COUNT(*) as peis_ainda_sem_acesso,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PROBLEMA RESOLVIDO!'
    ELSE '⚠️ Ainda há ' || COUNT(*) || ' PEIs sem acesso'
  END as status
FROM peis p
WHERE p.assigned_teacher_id IS NOT NULL
  AND p.is_active_version = true
  AND NOT EXISTS (
    SELECT 1 FROM student_access sa
    WHERE sa.user_id = p.assigned_teacher_id
    AND sa.student_id = p.student_id
  );

