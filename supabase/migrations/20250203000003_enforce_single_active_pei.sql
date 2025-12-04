-- Migration: Enforce Single Active PEI per Student
-- Created: 2025-02-03
-- Description: Garante que apenas 1 PEI ativo existe por aluno e 
--              previne criação de múltiplos PEIs concorrentes

-- 1. Corrigir dados existentes - Marcar apenas o mais recente como ativo
DO $$
DECLARE
  v_student RECORD;
  v_latest_pei UUID;
  v_affected INTEGER := 0;
BEGIN
  -- Para cada aluno
  FOR v_student IN 
    SELECT DISTINCT student_id FROM peis
  LOOP
    -- Encontrar o PEI mais recente do aluno
    SELECT id INTO v_latest_pei
    FROM peis
    WHERE student_id = v_student.student_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Desativar todos os PEIs deste aluno
    UPDATE peis
    SET is_active_version = false
    WHERE student_id = v_student.student_id;
    
    -- Ativar apenas o mais recente
    UPDATE peis
    SET is_active_version = true
    WHERE id = v_latest_pei;
    
    GET DIAGNOSTICS v_affected = ROW_COUNT;
  END LOOP;
  
  RAISE NOTICE 'Correção aplicada: PEIs duplicados limpos para % alunos', 
    (SELECT COUNT(DISTINCT student_id) FROM peis);
END $$;

-- 2. Garantir que o trigger exists e funciona corretamente
DROP TRIGGER IF EXISTS ensure_single_active_pei_trigger ON peis;

CREATE TRIGGER ensure_single_active_pei_trigger
  BEFORE INSERT OR UPDATE ON peis
  FOR EACH ROW
  WHEN (NEW.is_active_version = true)
  EXECUTE FUNCTION ensure_single_active_pei();

-- 3. Criar função para verificar se aluno já tem PEI ativo
CREATE OR REPLACE FUNCTION has_active_pei(p_student_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM peis
    WHERE student_id = p_student_id
    AND is_active_version = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Criar função para obter PEI ativo de um aluno
CREATE OR REPLACE FUNCTION get_active_pei(p_student_id UUID)
RETURNS TABLE (
  id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  assigned_teacher_id UUID,
  version_number INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.status::TEXT,
    p.created_at,
    p.updated_at,
    p.assigned_teacher_id,
    p.version_number
  FROM peis p
  WHERE p.student_id = p_student_id
  AND p.is_active_version = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Criar função para criar nova versão de PEI (arquivando a anterior)
CREATE OR REPLACE FUNCTION create_new_pei_version(
  p_student_id UUID,
  p_teacher_id UUID,
  p_school_id UUID,
  p_tenant_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_old_pei_id UUID;
  v_new_pei_id UUID;
  v_next_version INTEGER := 1;
BEGIN
  -- Verificar se já existe PEI ativo
  SELECT id INTO v_old_pei_id
  FROM peis
  WHERE student_id = p_student_id
  AND is_active_version = true;
  
  -- Se existe, obter próximo número de versão
  IF v_old_pei_id IS NOT NULL THEN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
    FROM peis
    WHERE student_id = p_student_id;
    
    -- Desativar versão antiga
    UPDATE peis
    SET is_active_version = false
    WHERE id = v_old_pei_id;
  END IF;
  
  -- Criar nova versão
  INSERT INTO peis (
    student_id,
    school_id,
    tenant_id,
    assigned_teacher_id,
    created_by,
    status,
    version_number,
    is_active_version,
    diagnosis_data,
    planning_data,
    evaluation_data
  ) VALUES (
    p_student_id,
    p_school_id,
    p_tenant_id,
    p_teacher_id,
    p_teacher_id,
    'draft',
    v_next_version,
    true,
    '{}',
    '{}',
    '{}'
  )
  RETURNING id INTO v_new_pei_id;
  
  RETURN v_new_pei_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. View para listar apenas PEIs ativos (facilita queries)
CREATE OR REPLACE VIEW active_peis AS
SELECT 
  p.*,
  s.name as student_name,
  s.date_of_birth,
  sch.school_name,
  t.network_name
FROM peis p
INNER JOIN students s ON s.id = p.student_id
LEFT JOIN schools sch ON sch.id = p.school_id
LEFT JOIN tenants t ON t.id = p.tenant_id
WHERE p.is_active_version = true;

-- 7. Comentários
COMMENT ON FUNCTION has_active_pei(UUID) IS 
  'Verifica se um aluno já possui um PEI ativo';

COMMENT ON FUNCTION get_active_pei(UUID) IS 
  'Retorna o PEI ativo de um aluno (apenas 1 por aluno)';

COMMENT ON FUNCTION create_new_pei_version(UUID, UUID, UUID, UUID) IS 
  'Cria uma nova versão de PEI, arquivando automaticamente a versão anterior';

COMMENT ON VIEW active_peis IS 
  'View que mostra apenas PEIs ativos (is_active_version = true) com dados relacionados';

-- 8. Garantir que todas as inserções são com is_active_version = true por padrão
ALTER TABLE peis ALTER COLUMN is_active_version SET DEFAULT true;

-- 9. Log de correção
DO $$
DECLARE
  v_total_peis INTEGER;
  v_active_peis INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_peis FROM peis;
  SELECT COUNT(*) INTO v_active_peis FROM peis WHERE is_active_version = true;
  
  RAISE NOTICE 'Sistema de versionamento configurado:';
  RAISE NOTICE '  Total de PEIs no sistema: %', v_total_peis;
  RAISE NOTICE '  PEIs ativos (1 por aluno): %', v_active_peis;
  RAISE NOTICE '  PEIs arquivados (versões antigas): %', v_total_peis - v_active_peis;
END $$;

