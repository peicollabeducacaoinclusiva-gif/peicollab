-- Migration: Fix PEI History Tracking
-- Created: 2025-02-03
-- Description: Adiciona trigger para automaticamente popular a tabela pei_history 
--              quando um PEI for criado ou atualizado

-- 1. Criar função para obter próximo número de versão
CREATE OR REPLACE FUNCTION get_next_pei_version_number(p_pei_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) INTO v_max_version
  FROM pei_history
  WHERE pei_id = p_pei_id;
  
  RETURN v_max_version + 1;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar função para gerar resumo das mudanças
CREATE OR REPLACE FUNCTION generate_pei_change_summary(
  p_old_diagnosis JSONB,
  p_new_diagnosis JSONB,
  p_old_planning JSONB,
  p_new_planning JSONB,
  p_old_evaluation JSONB,
  p_new_evaluation JSONB,
  p_old_status TEXT,
  p_new_status TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_changes TEXT[] := ARRAY[]::TEXT[];
  v_summary TEXT;
BEGIN
  -- Detectar mudanças no diagnóstico
  IF p_old_diagnosis IS DISTINCT FROM p_new_diagnosis THEN
    v_changes := array_append(v_changes, 'Diagnóstico atualizado');
  END IF;
  
  -- Detectar mudanças no planejamento
  IF p_old_planning IS DISTINCT FROM p_new_planning THEN
    v_changes := array_append(v_changes, 'Planejamento modificado');
  END IF;
  
  -- Detectar mudanças nos encaminhamentos
  IF p_old_evaluation IS DISTINCT FROM p_new_evaluation THEN
    v_changes := array_append(v_changes, 'Encaminhamentos alterados');
  END IF;
  
  -- Detectar mudanças de status
  IF p_old_status IS DISTINCT FROM p_new_status THEN
    v_changes := array_append(v_changes, format('Status alterado de "%s" para "%s"', p_old_status, p_new_status));
  END IF;
  
  -- Se não houver mudanças detectadas
  IF array_length(v_changes, 1) IS NULL THEN
    RETURN 'Sem alterações significativas detectadas';
  END IF;
  
  -- Juntar todas as mudanças
  v_summary := array_to_string(v_changes, '; ');
  
  RETURN v_summary;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar função trigger para salvar histórico de PEI
CREATE OR REPLACE FUNCTION save_pei_history()
RETURNS TRIGGER AS $$
DECLARE
  v_version_number INTEGER;
  v_change_type TEXT;
  v_change_summary TEXT;
  v_changed_by UUID;
BEGIN
  -- Obter o ID do usuário que fez a mudança (do contexto ou do registro)
  v_changed_by := COALESCE(
    current_setting('app.current_user_id', TRUE)::UUID,
    NEW.created_by,
    auth.uid()
  );
  
  -- Determinar tipo de mudança
  IF TG_OP = 'INSERT' THEN
    v_change_type := 'created';
    v_version_number := 1;
    v_change_summary := 'PEI criado';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Obter próximo número de versão
    v_version_number := get_next_pei_version_number(NEW.id);
    
    -- Determinar se foi mudança de status ou atualização geral
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_change_type := 'status_changed';
    ELSE
      v_change_type := 'updated';
    END IF;
    
    -- Gerar resumo das mudanças
    v_change_summary := generate_pei_change_summary(
      OLD.diagnosis_data,
      NEW.diagnosis_data,
      OLD.planning_data,
      NEW.planning_data,
      OLD.evaluation_data,
      NEW.evaluation_data,
      OLD.status::TEXT,
      NEW.status::TEXT
    );
  ELSE
    RETURN NEW;
  END IF;
  
  -- Inserir registro de histórico
  INSERT INTO pei_history (
    pei_id,
    version_number,
    changed_by,
    changed_at,
    change_type,
    change_summary,
    diagnosis_data,
    planning_data,
    evaluation_data,
    status
  ) VALUES (
    NEW.id,
    v_version_number,
    v_changed_by,
    NOW(),
    v_change_type,
    v_change_summary,
    NEW.diagnosis_data,
    NEW.planning_data,
    NEW.evaluation_data,
    NEW.status
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS save_pei_history_trigger ON peis;

-- 5. Criar novo trigger
CREATE TRIGGER save_pei_history_trigger
  AFTER INSERT OR UPDATE ON peis
  FOR EACH ROW
  EXECUTE FUNCTION save_pei_history();

-- 6. Comentários
COMMENT ON FUNCTION get_next_pei_version_number(UUID) IS 'Retorna o próximo número de versão para um PEI';
COMMENT ON FUNCTION generate_pei_change_summary(JSONB, JSONB, JSONB, JSONB, JSONB, JSONB, TEXT, TEXT) IS 'Gera um resumo legível das mudanças em um PEI';
COMMENT ON FUNCTION save_pei_history() IS 'Trigger function para salvar automaticamente o histórico de alterações de PEIs';
COMMENT ON TRIGGER save_pei_history_trigger ON peis IS 'Automaticamente salva uma entrada no histórico quando um PEI é criado ou atualizado';


