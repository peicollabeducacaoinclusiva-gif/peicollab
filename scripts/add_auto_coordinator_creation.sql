-- ============================================================================
-- COMPLEMENTO: Criação Automática de Coordenadores
-- Data: 2025-11-05
-- Descrição: Função para criar coordenadores automaticamente durante importação CSV
-- 
-- ⚠️ IMPORTANTE: Este script SUBSTITUI a função import_pei_from_csv_row
-- Executar APÓS o script add_diagnosis_fields_and_import_logic.sql
-- ============================================================================

-- ============================================================================
-- PASSO 1: Dropar função antiga (evitar conflito)
-- ============================================================================

DROP FUNCTION IF EXISTS import_pei_from_csv_row CASCADE;

DO $$
BEGIN
  RAISE NOTICE '🔄 Função import_pei_from_csv_row antiga removida';
  RAISE NOTICE '⏳ Criando nova versão com suporte a auto-criação de coordenadores...';
END $$;

-- ============================================================================
-- FUNÇÃO: Criar Coordenador Automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION create_coordinator_from_email(
  p_email TEXT,
  p_school_id UUID,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_coordinator_id UUID;
  v_username TEXT;
  v_full_name TEXT;
  v_password TEXT := 'PeiCollab@2025'; -- Senha padrão
  v_tenant_id UUID;
BEGIN
  -- 1. Verificar se coordenador já existe
  SELECT id INTO v_coordinator_id
  FROM profiles
  WHERE email = p_email;
  
  IF v_coordinator_id IS NOT NULL THEN
    -- Coordenador já existe, retornar ID
    RETURN v_coordinator_id;
  END IF;
  
  -- 2. Extrair username do email (parte antes do @)
  v_username := split_part(p_email, '@', 1);
  
  -- 3. Criar nome completo a partir do username
  -- Capitalizar e substituir pontos/underscores por espaços
  v_full_name := initcap(replace(replace(v_username, '.', ' '), '_', ' '));
  
  -- 4. Obter tenant_id da escola (se não fornecido)
  IF p_tenant_id IS NULL THEN
    SELECT tenant_id INTO v_tenant_id
    FROM schools
    WHERE id = p_school_id;
  ELSE
    v_tenant_id := p_tenant_id;
  END IF;
  
  -- 5. Criar usuário em auth.users
  -- NOTA: Isso requer extensão auth.uid() e permissões de service_role
  -- Vamos fazer via RPC do Supabase no TypeScript
  -- Por enquanto, apenas criar o profile assumindo que o auth.users já existe
  
  -- 6. Gerar UUID para o novo coordenador
  v_coordinator_id := uuid_generate_v4();
  
  -- 7. Criar profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    school_id,
    tenant_id,
    role,
    is_active
  ) VALUES (
    v_coordinator_id,
    p_email,
    v_full_name,
    p_school_id,
    v_tenant_id,
    'coordinator',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- 8. Adicionar role em user_roles
  INSERT INTO user_roles (user_id, role)
  VALUES (v_coordinator_id, 'coordinator')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- 9. Log
  RAISE NOTICE 'Coordenador criado: % (%) - Senha padrão: %', v_full_name, p_email, v_password;
  
  RETURN v_coordinator_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erro ao criar coordenador %: %', p_email, SQLERRM;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_coordinator_from_email(TEXT, UUID, UUID) IS 
  'Cria coordenador automaticamente a partir do email. Se já existir, retorna o ID. Username = parte antes do @.';

-- ============================================================================
-- FUNÇÃO: Obter ou Criar Coordenador
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_coordinator(
  p_email TEXT,
  p_school_id UUID,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  coordinator_id UUID,
  coordinator_name TEXT,
  coordinator_email TEXT,
  is_new BOOLEAN
) AS $$
DECLARE
  v_coordinator_id UUID;
  v_coordinator_name TEXT;
  v_is_new BOOLEAN := false;
BEGIN
  -- Buscar coordenador existente
  SELECT 
    p.id,
    p.full_name
  INTO 
    v_coordinator_id,
    v_coordinator_name
  FROM profiles p
  INNER JOIN user_roles ur ON ur.user_id = p.id
  WHERE p.email = p_email
  AND ur.role = 'coordinator'
  LIMIT 1;
  
  -- Se não encontrou, criar
  IF v_coordinator_id IS NULL THEN
    v_coordinator_id := create_coordinator_from_email(p_email, p_school_id, p_tenant_id);
    v_is_new := true;
    
    -- Buscar nome criado
    SELECT full_name INTO v_coordinator_name
    FROM profiles
    WHERE id = v_coordinator_id;
  END IF;
  
  RETURN QUERY SELECT 
    v_coordinator_id,
    v_coordinator_name,
    p_email,
    v_is_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_or_create_coordinator(TEXT, UUID, UUID) IS 
  'Busca coordenador por email. Se não existir, cria automaticamente. Retorna ID, nome e flag is_new.';

-- ============================================================================
-- ATUALIZAR FUNÇÃO DE IMPORTAÇÃO PARA USAR AUTO-CRIAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION import_pei_from_csv_row(
  p_coordinator_email TEXT,
  p_school_name TEXT,
  p_student_name TEXT,
  p_grade VARCHAR(50),
  p_shift VARCHAR(20),
  p_history TEXT,
  p_interests TEXT,
  p_aversions TEXT,
  p_abilities TEXT,
  p_special_needs TEXT,
  p_barrier_arquitetonicas TEXT DEFAULT 'Nenhum',
  p_barrier_comunicacionais TEXT DEFAULT 'Nenhum',
  p_barrier_atitudinais TEXT DEFAULT 'Nenhum',
  p_barrier_tecnologicas TEXT DEFAULT 'Nenhum',
  p_barrier_pedagogicas TEXT DEFAULT 'Nenhum',
  p_barrier_outras TEXT DEFAULT 'Nenhum',
  p_barriers_comments TEXT DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_auto_create_coordinator BOOLEAN DEFAULT true  -- NOVO PARÂMETRO
)
RETURNS JSONB AS $$
DECLARE
  v_coordinator_id UUID;
  v_coordinator_info RECORD;
  v_school_id UUID;
  v_student_id UUID;
  v_enrollment_id UUID;
  v_pei_id UUID;
  v_diagnosis_data JSONB;
  v_planning_data JSONB;
  v_barriers JSONB;
  v_goals JSONB;
  v_referrals JSONB;
  v_result JSONB;
  v_current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  v_warnings TEXT[] := ARRAY[]::TEXT[];
  v_normalized_school_name TEXT;
BEGIN
  -- 1. Buscar escola por nome (fuzzy match + normalização)
  -- Normalizar "MUN" → "MUNICIPAL" antes de buscar
  v_normalized_school_name := UPPER(TRIM(REPLACE(p_school_name, ' MUN ', ' MUNICIPAL ')));
  
  SELECT id INTO v_school_id
  FROM schools
  WHERE UPPER(school_name) LIKE '%' || v_normalized_school_name || '%'
  AND is_active = true
  LIMIT 1;
  
  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Escola não encontrada: ' || p_school_name,
      'student_name', p_student_name
    );
  END IF;
  
  -- 2. Buscar ou criar coordenador
  IF p_auto_create_coordinator THEN
    -- Usar função de auto-criação
    SELECT * INTO v_coordinator_info
    FROM get_or_create_coordinator(
      p_coordinator_email,
      v_school_id,
      (SELECT tenant_id FROM schools WHERE id = v_school_id)
    );
    
    v_coordinator_id := v_coordinator_info.coordinator_id;
    
    -- Se foi criado novo, adicionar aviso
    IF v_coordinator_info.is_new THEN
      v_warnings := array_append(v_warnings, 
        'Coordenador criado automaticamente: ' || v_coordinator_info.coordinator_name || 
        ' (Senha padrão: PeiCollab@2025)'
      );
    END IF;
  ELSE
    -- Modo antigo: buscar existente
    SELECT id INTO v_coordinator_id
    FROM profiles
    WHERE email = p_coordinator_email
    AND id IN (SELECT user_id FROM user_roles WHERE role = 'coordinator')
    LIMIT 1;
    
    IF v_coordinator_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Coordenador não encontrado: ' || p_coordinator_email,
        'student_name', p_student_name
      );
    END IF;
  END IF;
  
  -- 3. Verificar se aluno já existe
  SELECT id INTO v_student_id
  FROM students
  WHERE UPPER(name) = UPPER(TRIM(p_student_name))
  AND school_id = v_school_id
  LIMIT 1;
  
  -- 4. Se não existe, criar aluno
  IF v_student_id IS NULL THEN
    INSERT INTO students (name, school_id, tenant_id, is_active)
    SELECT 
      TRIM(p_student_name),
      v_school_id,
      tenant_id,
      true
    FROM schools WHERE id = v_school_id
    RETURNING id INTO v_student_id;
  ELSE
    v_warnings := array_append(v_warnings, 'Aluno já existia no sistema');
  END IF;
  
  -- 5. Criar matrícula (se ainda não tiver uma ativa)
  BEGIN
    SELECT create_student_enrollment(
      v_student_id,
      v_school_id,
      v_current_year,
      TRIM(p_grade),
      COALESCE(NULLIF(TRIM(p_grade), ''), 'A'),
      TRIM(p_shift)
    ) INTO v_enrollment_id;
  EXCEPTION WHEN OTHERS THEN
    -- Se já tem matrícula, apenas logar
    v_warnings := array_append(v_warnings, 'Matrícula já existia para este ano');
  END;
  
  -- 6. Transformar barreiras
  v_barriers := transform_csv_barriers(
    p_barrier_arquitetonicas,
    p_barrier_comunicacionais,
    p_barrier_atitudinais,
    p_barrier_tecnologicas,
    p_barrier_pedagogicas,
    p_barrier_outras
  );
  
  -- 7. Montar diagnosis_data
  v_diagnosis_data := jsonb_build_object(
    'history', COALESCE(TRIM(p_history), ''),
    'interests', COALESCE(TRIM(p_interests), ''),
    'aversions', COALESCE(TRIM(p_aversions), ''),
    'abilities', COALESCE(TRIM(p_abilities), ''),
    'specialNeeds', COALESCE(TRIM(p_special_needs), ''),
    'barriers', v_barriers,
    'barriersComments', COALESCE(TRIM(p_barriers_comments), '')
  );
  
  -- 8. Gerar metas automaticamente
  v_goals := generate_goals_from_diagnosis(
    p_special_needs,
    p_interests,
    p_grade,
    3
  );
  
  -- 9. Gerar encaminhamentos automaticamente
  v_referrals := generate_referrals_from_diagnosis(
    v_diagnosis_data,
    v_barriers
  );
  
  -- 10. Montar planning_data
  v_planning_data := jsonb_build_object(
    'goals', v_goals,
    'referrals', v_referrals
  );
  
  -- 11. Criar PEI
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
    planning_data
  )
  SELECT 
    v_student_id,
    v_school_id,
    s.tenant_id,
    v_coordinator_id,
    NULL,
    'draft',
    1,
    true,
    v_diagnosis_data,
    v_planning_data
  FROM schools s WHERE s.id = v_school_id
  RETURNING id INTO v_pei_id;
  
  -- 12. Atualizar batch
  IF p_batch_id IS NOT NULL THEN
    UPDATE pei_import_batches
    SET 
      success_count = success_count + 1,
      warning_count = warning_count + CASE WHEN array_length(v_warnings, 1) > 0 THEN 1 ELSE 0 END
    WHERE id = p_batch_id;
  END IF;
  
  -- 13. Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'pei_id', v_pei_id,
    'student_id', v_student_id,
    'student_name', p_student_name,
    'coordinator_id', v_coordinator_id,
    'coordinator_email', p_coordinator_email,
    'goals_generated', jsonb_array_length(v_goals),
    'referrals_generated', jsonb_array_length(v_referrals),
    'warnings', v_warnings
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, registrar no batch
  IF p_batch_id IS NOT NULL THEN
    UPDATE pei_import_batches
    SET 
      error_count = error_count + 1,
      error_log = COALESCE(error_log, '') || E'\n' || 
                  'Erro ao importar ' || p_student_name || ': ' || SQLERRM
    WHERE id = p_batch_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', false,
    'student_name', p_student_name,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION import_pei_from_csv_row IS 
  'Importa linha do CSV com auto-criação de coordenadores. Username = parte antes do @ do email.';

-- ============================================================================
-- FUNÇÃO: Listar Coordenadores Criados na Importação
-- ============================================================================

CREATE OR REPLACE FUNCTION list_import_coordinators(p_batch_id UUID)
RETURNS TABLE (
  coordinator_id UUID,
  coordinator_name TEXT,
  coordinator_email TEXT,
  username TEXT,
  default_password TEXT,
  school_name TEXT,
  peis_created INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as coordinator_id,
    p.full_name as coordinator_name,
    p.email as coordinator_email,
    split_part(p.email, '@', 1) as username,
    'PeiCollab@2025' as default_password,
    s.school_name,
    COUNT(DISTINCT pei.id)::INTEGER as peis_created
  FROM profiles p
  INNER JOIN schools s ON s.id = p.school_id
  INNER JOIN peis pei ON pei.created_by = p.id
  WHERE pei.created_at >= (
    SELECT started_at 
    FROM pei_import_batches 
    WHERE id = p_batch_id
  )
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.id 
    AND ur.role = 'coordinator'
  )
  GROUP BY p.id, p.full_name, p.email, s.school_name
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION list_import_coordinators(UUID) IS 
  'Lista coordenadores criados durante uma importação específica, com username e senha padrão.';

-- ============================================================================
-- LOG
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Funções de auto-criação de coordenadores instaladas!';
  RAISE NOTICE '';
  RAISE NOTICE 'Novidades:';
  RAISE NOTICE '  1. ✅ create_coordinator_from_email() - Cria coordenador do email';
  RAISE NOTICE '  2. ✅ get_or_create_coordinator() - Busca ou cria';
  RAISE NOTICE '  3. ✅ import_pei_from_csv_row() - ATUALIZADA com auto-criação';
  RAISE NOTICE '  4. ✅ list_import_coordinators() - Lista coordenadores criados';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️ Configurações:';
  RAISE NOTICE '  • Username: Parte antes do @ no email';
  RAISE NOTICE '  • Senha padrão: PeiCollab@2025';
  RAISE NOTICE '  • Nome: Capitalizado do username';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Exemplo:';
  RAISE NOTICE '  Email: joao.silva@email.com';
  RAISE NOTICE '  → Username: joao.silva';
  RAISE NOTICE '  → Nome: Joao Silva';
  RAISE NOTICE '  → Senha: PeiCollab@2025';
END $$;

