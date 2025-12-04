-- Migration: Auto-criar student_access quando PEI é atribuído
-- Created: 2025-02-03
-- Description: Garante que quando um PEI é criado/atualizado com assigned_teacher_id,
--              o professor automaticamente recebe acesso ao aluno via student_access

-- 1. Função para criar/atualizar student_access
CREATE OR REPLACE FUNCTION auto_create_student_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se há um professor atribuído
  IF NEW.assigned_teacher_id IS NOT NULL THEN
    -- Criar ou garantir que existe a entrada em student_access
    INSERT INTO public.student_access (user_id, student_id)
    VALUES (NEW.assigned_teacher_id, NEW.student_id)
    ON CONFLICT (user_id, student_id) DO NOTHING;
    
    -- Log para debug
    RAISE NOTICE 'student_access criado/verificado: teacher=%, student=%', 
      NEW.assigned_teacher_id, NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS auto_create_student_access_trigger ON peis;

-- 3. Criar trigger para INSERT e UPDATE
CREATE TRIGGER auto_create_student_access_trigger
  AFTER INSERT OR UPDATE OF assigned_teacher_id ON peis
  FOR EACH ROW
  WHEN (NEW.assigned_teacher_id IS NOT NULL)
  EXECUTE FUNCTION auto_create_student_access();

-- 4. Função para limpar student_access órfãos (opcional - rodar quando necessário)
CREATE OR REPLACE FUNCTION cleanup_orphaned_student_access()
RETURNS TABLE(removed_count INTEGER) AS $$
DECLARE
  v_removed_count INTEGER;
BEGIN
  -- Remove student_access que não tem PEI correspondente
  DELETE FROM public.student_access sa
  WHERE NOT EXISTS (
    SELECT 1 FROM public.peis p
    WHERE p.assigned_teacher_id = sa.user_id
    AND p.student_id = sa.student_id
  );
  
  GET DIAGNOSTICS v_removed_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_removed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Corrigir dados existentes - Criar student_access para PEIs já existentes
DO $$
DECLARE
  v_affected INTEGER;
BEGIN
  -- Para todos os PEIs que têm assigned_teacher_id, criar student_access
  INSERT INTO public.student_access (user_id, student_id)
  SELECT DISTINCT p.assigned_teacher_id, p.student_id
  FROM public.peis p
  WHERE p.assigned_teacher_id IS NOT NULL
  ON CONFLICT (user_id, student_id) DO NOTHING;
  
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  
  RAISE NOTICE 'Correção aplicada: % registros de student_access criados para PEIs existentes', v_affected;
END $$;

-- 6. Comentários
COMMENT ON FUNCTION auto_create_student_access() IS 
  'Cria automaticamente entrada em student_access quando um professor é atribuído a um PEI';

COMMENT ON TRIGGER auto_create_student_access_trigger ON peis IS 
  'Garante que professores sempre tenham acesso aos alunos dos seus PEIs atribuídos';

COMMENT ON FUNCTION cleanup_orphaned_student_access() IS 
  'Remove entradas órfãs de student_access que não têm PEI correspondente (uso administrativo)';

-- 7. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_peis_assigned_teacher_student 
  ON public.peis(assigned_teacher_id, student_id) 
  WHERE assigned_teacher_id IS NOT NULL;

-- 8. Garantir constraint UNIQUE em student_access
ALTER TABLE public.student_access 
  DROP CONSTRAINT IF EXISTS student_access_user_id_student_id_key;

ALTER TABLE public.student_access 
  ADD CONSTRAINT student_access_user_id_student_id_key 
  UNIQUE (user_id, student_id);

