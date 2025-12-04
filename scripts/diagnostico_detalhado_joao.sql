-- ============================================================
-- DIAGNÓSTICO DETALHADO: Professor João
-- Verificar EXATAMENTE o que está acontecendo
-- ============================================================

-- 1️⃣ Encontrar o ID do professor João
SELECT 
  '👤 PROFESSOR JOÃO' as info,
  id as user_id,
  full_name,
  school_id,
  tenant_id
FROM profiles
WHERE full_name ILIKE '%joão%'
ORDER BY full_name;

-- 2️⃣ Verificar PEIs atribuídos ao João
SELECT 
  '📝 PEIs DO JOÃO' as info,
  p.id as pei_id,
  p.assigned_teacher_id,
  s.name as aluno_nome,
  s.id as aluno_id,
  p.status,
  p.is_active_version
FROM peis p
JOIN students s ON s.id = p.student_id
WHERE p.assigned_teacher_id IN (
  SELECT id FROM profiles WHERE full_name ILIKE '%joão%'
)
ORDER BY s.name;

-- 3️⃣ Verificar se existe student_access para o João
SELECT 
  '✅ REGISTROS EM STUDENT_ACCESS' as info,
  sa.id,
  sa.user_id as professor_id,
  sa.student_id,
  s.name as aluno_nome,
  prof.full_name as professor_nome
FROM student_access sa
JOIN students s ON s.id = sa.student_id
JOIN profiles prof ON prof.id = sa.user_id
WHERE sa.user_id IN (
  SELECT id FROM profiles WHERE full_name ILIKE '%joão%'
);

-- 4️⃣ COMPARAÇÃO: PEIs vs student_access
WITH joao_info AS (
  SELECT id FROM profiles WHERE full_name ILIKE '%joão%' LIMIT 1
)
SELECT 
  '🔍 COMPARAÇÃO' as info,
  'Alunos nos PEIs' as origem,
  s.id as student_id,
  s.name as student_name
FROM peis p
JOIN students s ON s.id = p.student_id
WHERE p.assigned_teacher_id = (SELECT id FROM joao_info)
  AND p.is_active_version = true

UNION ALL

SELECT 
  '🔍 COMPARAÇÃO' as info,
  'Alunos em student_access' as origem,
  s.id as student_id,
  s.name as student_name
FROM student_access sa
JOIN students s ON s.id = sa.student_id
WHERE sa.user_id = (SELECT id FROM joao_info)

ORDER BY student_name;

-- 5️⃣ Identificar alunos FALTANDO em student_access
SELECT 
  '❌ ALUNOS FALTANDO EM STUDENT_ACCESS' as info,
  p.student_id,
  s.name as aluno_nome,
  p.id as pei_id,
  p.assigned_teacher_id as professor_id,
  prof.full_name as professor_nome
FROM peis p
JOIN students s ON s.id = p.student_id
JOIN profiles prof ON prof.id = p.assigned_teacher_id
WHERE p.assigned_teacher_id IN (
  SELECT id FROM profiles WHERE full_name ILIKE '%joão%'
)
AND p.is_active_version = true
AND NOT EXISTS (
  SELECT 1 FROM student_access sa
  WHERE sa.user_id = p.assigned_teacher_id
  AND sa.student_id = p.student_id
);

-- 6️⃣ VERIFICAR se Débora e Carlos existem
SELECT 
  '🎯 DÉBORA E CARLOS' as info,
  s.id as student_id,
  s.name as student_name,
  EXISTS (
    SELECT 1 FROM peis p 
    WHERE p.student_id = s.id 
    AND p.assigned_teacher_id IN (SELECT id FROM profiles WHERE full_name ILIKE '%joão%')
    AND p.is_active_version = true
  ) as tem_pei_com_joao,
  EXISTS (
    SELECT 1 FROM student_access sa
    WHERE sa.student_id = s.id
    AND sa.user_id IN (SELECT id FROM profiles WHERE full_name ILIKE '%joão%')
  ) as tem_student_access
FROM students s
WHERE s.name ILIKE '%débora%' 
   OR s.name ILIKE '%carlos%'
ORDER BY s.name;

-- 7️⃣ CORREÇÃO DIRECIONADA: Criar student_access para João especificamente
DO $$
DECLARE
  v_joao_id UUID;
  v_count INTEGER;
BEGIN
  -- Pegar o ID do João
  SELECT id INTO v_joao_id FROM profiles WHERE full_name ILIKE '%joão%' LIMIT 1;
  
  IF v_joao_id IS NULL THEN
    RAISE NOTICE '❌ Professor João não encontrado!';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ ID do João: %', v_joao_id;
  
  -- Criar student_access para os alunos dos PEIs do João
  INSERT INTO student_access (user_id, student_id)
  SELECT DISTINCT 
    p.assigned_teacher_id,
    p.student_id
  FROM peis p
  WHERE p.assigned_teacher_id = v_joao_id
    AND p.is_active_version = true
  ON CONFLICT (user_id, student_id) DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✅ Registros criados para João: %', v_count;
END $$;

-- 8️⃣ VERIFICAÇÃO FINAL
SELECT 
  '✅ VERIFICAÇÃO FINAL' as info,
  COUNT(*) as total_student_access_joao
FROM student_access sa
WHERE sa.user_id IN (
  SELECT id FROM profiles WHERE full_name ILIKE '%joão%'
);

