-- ============================================================================
-- MIGRAÇÃO: Consolidação de Tabelas de Matrícula
-- Data: 15/02/2025
-- Descrição: 
--   1. Adicionar class_id (FK opcional) em student_enrollments
--   2. Migrar dados de enrollments para student_enrollments
--   3. Deprecar tabela enrollments (manter por compatibilidade temporária)
-- ============================================================================

-- ============================================================================
-- PARTE 1: ADICIONAR class_id EM student_enrollments
-- ============================================================================

-- 1.1. Adicionar coluna class_id (FK opcional para classes)
ALTER TABLE student_enrollments
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES classes(id) ON DELETE SET NULL;

-- 1.2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_id 
  ON student_enrollments(class_id) 
  WHERE class_id IS NOT NULL;

-- 1.3. Comentário
COMMENT ON COLUMN student_enrollments.class_id IS 
  'Referência opcional à tabela classes. Quando presente, vincula a matrícula diretamente à turma. Quando NULL, class_name é usado como texto livre.';

-- ============================================================================
-- PARTE 2: MIGRAR DADOS DE enrollments PARA student_enrollments
-- ============================================================================

-- 2.1. Função para migrar dados de enrollments para student_enrollments
CREATE OR REPLACE FUNCTION migrate_enrollments_to_student_enrollments()
RETURNS TABLE (
  migrated_count INTEGER,
  skipped_count INTEGER,
  errors_count INTEGER
) AS $$
DECLARE
  v_migrated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_errors INTEGER := 0;
  v_enrollment RECORD;
  v_class_id UUID;
  v_existing_enrollment_id UUID;
BEGIN
  -- Iterar sobre todos os registros de enrollments
  FOR v_enrollment IN 
    SELECT 
      e.id,
      e.student_id,
      e.class_id,
      e.school_id,
      e.ano_letivo,
      e.data_matricula,
      e.modalidade,
      e.status,
      e.motivo_saida,
      e.data_saida,
      e.observacoes,
      e.created_by,
      e.created_at,
      c.class_name,
      c.grade,
      c.shift
    FROM enrollments e
    LEFT JOIN classes c ON c.id = e.class_id
  LOOP
    BEGIN
      -- Verificar se já existe matrícula para este aluno/escola/ano
      SELECT id INTO v_existing_enrollment_id
      FROM student_enrollments
      WHERE student_id = v_enrollment.student_id
        AND school_id = v_enrollment.school_id
        AND academic_year = v_enrollment.ano_letivo
      LIMIT 1;
      
      IF v_existing_enrollment_id IS NOT NULL THEN
        -- Atualizar matrícula existente com dados de enrollments
        UPDATE student_enrollments
        SET 
          class_id = v_enrollment.class_id,
          grade = COALESCE(v_enrollment.grade, grade),
          class_name = COALESCE(v_enrollment.class_name, class_name),
          shift = COALESCE(v_enrollment.shift, shift),
          enrollment_date = COALESCE(v_enrollment.data_matricula, enrollment_date),
          status = CASE 
            WHEN v_enrollment.status = 'Matriculado' THEN 'active'
            WHEN v_enrollment.status = 'Transferido' THEN 'transferred'
            WHEN v_enrollment.status = 'Cancelado' THEN 'dropped'
            WHEN v_enrollment.status = 'Concluído' THEN 'completed'
            WHEN v_enrollment.status = 'Abandonou' THEN 'dropped'
            ELSE status
          END,
          end_date = v_enrollment.data_saida,
          notes = COALESCE(
            CONCAT_WS(E'\n', 
              notes, 
              CASE WHEN v_enrollment.modalidade IS NOT NULL 
                THEN 'Modalidade: ' || v_enrollment.modalidade 
                ELSE NULL 
              END,
              CASE WHEN v_enrollment.motivo_saida IS NOT NULL 
                THEN 'Motivo saída: ' || v_enrollment.motivo_saida 
                ELSE NULL 
              END,
              v_enrollment.observacoes
            ),
            notes
          ),
          updated_at = GREATEST(updated_at, v_enrollment.created_at)
        WHERE id = v_existing_enrollment_id;
        
        v_migrated := v_migrated + 1;
      ELSE
        -- Criar nova matrícula em student_enrollments
        INSERT INTO student_enrollments (
          student_id,
          school_id,
          academic_year,
          grade,
          class_name,
          shift,
          class_id,
          enrollment_date,
          status,
          start_date,
          end_date,
          notes,
          created_by,
          created_at,
          updated_at
        ) VALUES (
          v_enrollment.student_id,
          v_enrollment.school_id,
          v_enrollment.ano_letivo,
          COALESCE(v_enrollment.grade, 'Não informado'),
          COALESCE(v_enrollment.class_name, 'Não informado'),
          COALESCE(v_enrollment.shift, 'Manhã'),
          v_enrollment.class_id,
          v_enrollment.data_matricula,
          CASE 
            WHEN v_enrollment.status = 'Matriculado' THEN 'active'
            WHEN v_enrollment.status = 'Transferido' THEN 'transferred'
            WHEN v_enrollment.status = 'Cancelado' THEN 'dropped'
            WHEN v_enrollment.status = 'Concluído' THEN 'completed'
            WHEN v_enrollment.status = 'Abandonou' THEN 'dropped'
            ELSE 'active'
          END,
          v_enrollment.data_matricula,
          v_enrollment.data_saida,
          CONCAT_WS(E'\n',
            CASE WHEN v_enrollment.modalidade IS NOT NULL 
              THEN 'Modalidade: ' || v_enrollment.modalidade 
              ELSE NULL 
            END,
            CASE WHEN v_enrollment.motivo_saida IS NOT NULL 
              THEN 'Motivo saída: ' || v_enrollment.motivo_saida 
              ELSE NULL 
            END,
            v_enrollment.observacoes
          ),
          v_enrollment.created_by,
          v_enrollment.created_at,
          v_enrollment.created_at
        );
        
        v_migrated := v_migrated + 1;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Registrar erro mas continuar
        v_errors := v_errors + 1;
        RAISE WARNING 'Erro ao migrar enrollment %: %', v_enrollment.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_migrated, v_skipped, v_errors;
END;
$$ LANGUAGE plpgsql;

-- 2.2. Executar migração (comentado por padrão - descomentar quando necessário)
-- ATENÇÃO: Descomentar apenas após revisar os dados e fazer backup
/*
DO $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM migrate_enrollments_to_student_enrollments();
  RAISE NOTICE 'Migração concluída: % migrados, % ignorados, % erros', 
    v_result.migrated_count, 
    v_result.skipped_count, 
    v_result.errors_count;
END $$;
*/

-- ============================================================================
-- PARTE 3: DEPRECAR TABELA enrollments (MANTER POR COMPATIBILIDADE)
-- ============================================================================

-- 3.1. Adicionar comentário de deprecação
COMMENT ON TABLE enrollments IS 
  'DEPRECATED: Esta tabela está sendo substituída por student_enrollments. '
  'Não criar novos registros aqui. Use student_enrollments para novas matrículas. '
  'Esta tabela será removida em versão futura após migração completa.';

-- 3.2. Criar view de compatibilidade (opcional - para código legado)
CREATE OR REPLACE VIEW enrollments_legacy AS
SELECT 
  se.id,
  se.student_id,
  se.class_id,
  se.school_id,
  se.academic_year AS ano_letivo,
  se.enrollment_date AS data_matricula,
  CASE 
    WHEN se.status = 'active' THEN 'Matriculado'
    WHEN se.status = 'transferred' THEN 'Transferido'
    WHEN se.status = 'dropped' THEN 'Cancelado'
    WHEN se.status = 'completed' THEN 'Concluído'
    ELSE 'Matriculado'
  END AS status,
  se.notes AS observacoes,
  se.created_by,
  se.created_at,
  se.updated_at
FROM student_enrollments se;

COMMENT ON VIEW enrollments_legacy IS 
  'View de compatibilidade para código legado que ainda referencia enrollments. '
  'Use student_enrollments diretamente em novo código.';

-- ============================================================================
-- PARTE 4: ATUALIZAR FUNÇÕES EXISTENTES
-- ============================================================================

-- 4.1. Atualizar função get_active_enrollment para considerar class_id
DROP FUNCTION IF EXISTS get_active_enrollment(UUID, INTEGER) CASCADE;
CREATE FUNCTION get_active_enrollment(p_student_id UUID, p_academic_year INTEGER DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  grade VARCHAR(50),
  class_name VARCHAR(10),
  shift VARCHAR(20),
  enrollment_number VARCHAR(50),
  school_id UUID,
  school_name TEXT,
  class_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.grade,
    e.class_name,
    e.shift,
    e.enrollment_number,
    e.school_id,
    s.school_name,
    e.class_id
  FROM student_enrollments e
  LEFT JOIN schools s ON s.id = e.school_id
  WHERE e.student_id = p_student_id
  AND e.status = 'active'
  AND (p_academic_year IS NULL OR e.academic_year = p_academic_year)
  ORDER BY e.academic_year DESC, e.start_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4.2. Atualizar função create_student_enrollment para aceitar class_id
DROP FUNCTION IF EXISTS create_student_enrollment(UUID, UUID, INTEGER, VARCHAR, VARCHAR, VARCHAR, VARCHAR) CASCADE;
CREATE FUNCTION create_student_enrollment(
  p_student_id UUID,
  p_school_id UUID,
  p_academic_year INTEGER,
  p_grade VARCHAR(50),
  p_class_name VARCHAR(10),
  p_shift VARCHAR(20),
  p_enrollment_number VARCHAR(50) DEFAULT NULL,
  p_class_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_new_enrollment_id UUID;
BEGIN
  -- Validar que class_id pertence à escola correta (se fornecido)
  IF p_class_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM classes 
      WHERE id = p_class_id 
      AND school_id = p_school_id
    ) THEN
      RAISE EXCEPTION 'class_id fornecido não pertence à escola especificada';
    END IF;
  END IF;
  
  -- Desativar matrículas anteriores do mesmo ano letivo
  UPDATE student_enrollments
  SET 
    status = 'completed',
    end_date = CURRENT_DATE
  WHERE student_id = p_student_id
  AND academic_year = p_academic_year
  AND status = 'active';
  
  -- Criar nova matrícula
  INSERT INTO student_enrollments (
    student_id,
    school_id,
    academic_year,
    grade,
    class_name,
    shift,
    enrollment_number,
    class_id,
    status,
    start_date
  ) VALUES (
    p_student_id,
    p_school_id,
    p_academic_year,
    p_grade,
    p_class_name,
    p_shift,
    p_enrollment_number,
    p_class_id,
    'active',
    CURRENT_DATE
  )
  RETURNING id INTO v_new_enrollment_id;
  
  RETURN v_new_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 5: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de consolidação de matrículas concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Adicionada coluna class_id em student_enrollments';
  RAISE NOTICE '  2. ✅ Criada função de migração de dados (migrate_enrollments_to_student_enrollments)';
  RAISE NOTICE '  3. ✅ Tabela enrollments marcada como DEPRECATED';
  RAISE NOTICE '  4. ✅ Criada view de compatibilidade (enrollments_legacy)';
  RAISE NOTICE '  5. ✅ Funções atualizadas para considerar class_id';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Revisar dados em enrollments';
  RAISE NOTICE '  - Executar migração (descomentar código na PARTE 2.2)';
  RAISE NOTICE '  - Validar dados migrados';
  RAISE NOTICE '  - Atualizar código para usar student_enrollments';
  RAISE NOTICE '  - Remover tabela enrollments após período de transição';
END $$;

