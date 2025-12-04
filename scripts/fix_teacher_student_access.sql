-- Script para corrigir problema de professores com PEIs mas sem alunos na lista
-- Descrição: Sincroniza a tabela student_access com os PEIs existentes

-- ==================================================
-- PARTE 1: DIAGNÓSTICO
-- ==================================================

-- 1.1 Verificar quantos PEIs existem com assigned_teacher_id
SELECT 
  'Total de PEIs com professor atribuído' as descricao,
  COUNT(*) as quantidade
FROM peis
WHERE assigned_teacher_id IS NOT NULL;

-- 1.2 Verificar quantos registros existem em student_access
SELECT 
  'Total de registros em student_access' as descricao,
  COUNT(*) as quantidade
FROM student_access;

-- 1.3 Identificar PEIs que NÃO têm student_access correspondente
SELECT 
  'PEIs sem student_access correspondente' as descricao,
  COUNT(*) as quantidade
FROM peis p
WHERE p.assigned_teacher_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM student_access sa
  WHERE sa.user_id = p.assigned_teacher_id
  AND sa.student_id = p.student_id
);

-- 1.4 Listar professores afetados
SELECT 
  prof.full_name as professor,
  prof.email,
  COUNT(DISTINCT p.id) as peis_atribuidos,
  COUNT(DISTINCT sa.student_id) as alunos_com_acesso,
  COUNT(DISTINCT p.student_id) as alunos_nos_peis,
  (COUNT(DISTINCT p.student_id) - COUNT(DISTINCT sa.student_id)) as diferenca
FROM peis p
JOIN profiles prof ON prof.id = p.assigned_teacher_id
LEFT JOIN student_access sa ON sa.user_id = p.assigned_teacher_id AND sa.student_id = p.student_id
WHERE p.assigned_teacher_id IS NOT NULL
GROUP BY prof.id, prof.full_name, prof.email
HAVING COUNT(DISTINCT p.student_id) > COUNT(DISTINCT sa.student_id)
ORDER BY diferenca DESC;

-- ==================================================
-- PARTE 2: CORREÇÃO
-- ==================================================

-- 2.1 Criar student_access para todos os PEIs existentes
INSERT INTO student_access (user_id, student_id)
SELECT DISTINCT 
  p.assigned_teacher_id as user_id,
  p.student_id
FROM peis p
WHERE p.assigned_teacher_id IS NOT NULL
  AND p.is_active_version = true  -- Apenas versões ativas
ON CONFLICT (user_id, student_id) DO NOTHING;

-- 2.2 Verificar resultado após correção
SELECT 
  'Registros criados - Verificação Final' as descricao,
  COUNT(*) as total_student_access
FROM student_access;

-- 2.3 Verificar se ainda há PEIs sem student_access
SELECT 
  'PEIs ainda sem student_access (deve ser 0)' as descricao,
  COUNT(*) as quantidade
FROM peis p
WHERE p.assigned_teacher_id IS NOT NULL
AND p.is_active_version = true
AND NOT EXISTS (
  SELECT 1 FROM student_access sa
  WHERE sa.user_id = p.assigned_teacher_id
  AND sa.student_id = p.student_id
);

-- ==================================================
-- PARTE 3: GARANTIR QUE O TRIGGER ESTÁ ATIVO
-- ==================================================

-- 3.1 Verificar se a função existe
SELECT 
  'Função auto_create_student_access existe?' as descricao,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'auto_create_student_access'
  ) THEN 'SIM' ELSE 'NÃO - PROBLEMA!' END as status;

-- 3.2 Verificar se o trigger está ativo
SELECT 
  'Trigger auto_create_student_access_trigger está ativo?' as descricao,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'auto_create_student_access_trigger'
  ) THEN 'SIM' ELSE 'NÃO - PROBLEMA!' END as status;

-- ==================================================
-- PARTE 4: RECRIAR TRIGGER SE NECESSÁRIO
-- ==================================================

-- Recriar a função (caso não exista)
CREATE OR REPLACE FUNCTION auto_create_student_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_teacher_id IS NOT NULL THEN
    INSERT INTO public.student_access (user_id, student_id)
    VALUES (NEW.assigned_teacher_id, NEW.student_id)
    ON CONFLICT (user_id, student_id) DO NOTHING;
    
    RAISE NOTICE 'student_access criado/verificado: teacher=%, student=%', 
      NEW.assigned_teacher_id, NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
DROP TRIGGER IF EXISTS auto_create_student_access_trigger ON peis;

CREATE TRIGGER auto_create_student_access_trigger
  AFTER INSERT OR UPDATE OF assigned_teacher_id ON peis
  FOR EACH ROW
  WHEN (NEW.assigned_teacher_id IS NOT NULL)
  EXECUTE FUNCTION auto_create_student_access();

-- ==================================================
-- MENSAGEM FINAL
-- ==================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Script de correção executado com sucesso!';
  RAISE NOTICE '📊 Verifique os resultados acima para confirmar que tudo está OK.';
  RAISE NOTICE '🔄 O trigger agora está ativo e funcionará automaticamente para novos PEIs.';
END $$;


































