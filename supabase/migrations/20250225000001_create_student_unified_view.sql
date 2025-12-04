-- ============================================================================
-- MIGRAÇÃO: View e RPC para Ficha do Estudante Unificada
-- Data: 25/02/2025
-- Descrição: Criar view e função RPC para buscar dados completos do estudante
-- ============================================================================

-- ============================================================================
-- PARTE 1: View para dados unificados do estudante
-- ============================================================================

CREATE OR REPLACE VIEW student_unified_view AS
SELECT 
  s.id as student_id,
  s.name as student_name,
  s.date_of_birth,
  s.student_id as registration_number,
  s.class_name,
  s.mother_name,
  s.father_name,
  s.email,
  s.phone,
  s.necessidades_especiais,
  s.tipo_necessidade,
  s.school_id,
  s.tenant_id,
  s.is_active,
  s.created_at as student_created_at,
  s.updated_at as student_updated_at,
  
  -- Dados da escola
  sc.school_name,
  sc.school_address,
  sc.school_email,
  sc.school_phone,
  
  -- Dados da rede
  t.network_name,
  
  -- PEI ativo
  p.id as pei_id,
  p.status as pei_status,
  p.version_number as pei_version,
  p.created_at as pei_created_at,
  p.updated_at as pei_updated_at,
  
  -- Plano AEE ativo
  aee.id as aee_id,
  aee.status as aee_status,
  aee.created_at as aee_created_at,
  aee.updated_at as aee_updated_at,
  
  -- Matrícula atual
  e.id as enrollment_id,
  e.grade,
  e.shift,
  e.academic_year,
  e.status as enrollment_status,
  
  -- Contadores
  (SELECT COUNT(*) FROM peis WHERE student_id = s.id AND is_active_version = true) as pei_count,
  (SELECT COUNT(*) FROM plano_aee WHERE student_id = s.id) as aee_count,
  (SELECT COUNT(*) FROM student_enrollments WHERE student_id = s.id) as enrollment_count

FROM students s
LEFT JOIN schools sc ON sc.id = s.school_id
LEFT JOIN tenants t ON t.id = s.tenant_id
LEFT JOIN peis p ON p.student_id = s.id AND p.is_active_version = true
LEFT JOIN plano_aee aee ON aee.student_id = s.id
LEFT JOIN student_enrollments e ON e.student_id = s.id AND e.status = 'active'
WHERE s.is_active = true;

-- ============================================================================
-- PARTE 2: Função RPC para buscar dados unificados do estudante
-- ============================================================================

CREATE OR REPLACE FUNCTION get_student_unified_data(p_student_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'student', (
      SELECT jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'date_of_birth', s.date_of_birth,
        'registration_number', s.student_id,
        'class_name', s.class_name,
        'mother_name', s.mother_name,
        'father_name', s.father_name,
        'email', s.email,
        'phone', s.phone,
        'necessidades_especiais', s.necessidades_especiais,
        'tipo_necessidade', s.tipo_necessidade,
        'school_id', s.school_id,
        'tenant_id', s.tenant_id,
        'is_active', s.is_active,
        'created_at', s.created_at,
        'updated_at', s.updated_at
      )
      FROM students s
      WHERE s.id = p_student_id
    ),
    'school', (
      SELECT jsonb_build_object(
        'id', sc.id,
        'school_name', sc.school_name,
        'school_address', sc.school_address,
        'school_email', sc.school_email,
        'school_phone', sc.school_phone
      )
      FROM schools sc
      INNER JOIN students s ON s.school_id = sc.id
      WHERE s.id = p_student_id
    ),
    'tenant', (
      SELECT jsonb_build_object(
        'id', t.id,
        'network_name', t.network_name
      )
      FROM tenants t
      INNER JOIN students s ON s.tenant_id = t.id
      WHERE s.id = p_student_id
    ),
    'active_pei', (
      SELECT jsonb_build_object(
        'id', p.id,
        'status', p.status,
        'version_number', p.version_number,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'goals_count', (SELECT COUNT(*) FROM pei_goals WHERE pei_id = p.id),
        'barriers_count', (SELECT COUNT(*) FROM pei_barriers WHERE pei_id = p.id)
      )
      FROM peis p
      WHERE p.student_id = p_student_id AND p.is_active_version = true
      ORDER BY p.created_at DESC
      LIMIT 1
    ),
    'active_aee', (
      SELECT jsonb_build_object(
        'id', aee.id,
        'status', aee.status,
        'created_at', aee.created_at,
        'updated_at', aee.updated_at
      )
      FROM plano_aee aee
      WHERE aee.student_id = p_student_id
      ORDER BY aee.created_at DESC
      LIMIT 1
    ),
    'current_enrollment', (
      SELECT jsonb_build_object(
        'id', e.id,
        'grade', e.grade,
        'shift', e.shift,
        'academic_year', e.academic_year,
        'status', e.status,
        'class_id', e.class_id
      )
      FROM student_enrollments e
      WHERE e.student_id = p_student_id AND e.status = 'active'
      ORDER BY e.academic_year DESC
      LIMIT 1
    ),
    'documents', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'type', d.document_type,
          'title', d.title,
          'created_at', d.created_at
        )
      ), '[]'::jsonb)
      FROM official_documents d
      WHERE d.student_id = p_student_id
    ),
    'academic_history', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'academic_year', e.academic_year,
          'grade', e.grade,
          'shift', e.shift,
          'status', e.status,
          'created_at', e.created_at
        )
        ORDER BY e.academic_year DESC
      ), '[]'::jsonb)
      FROM student_enrollments e
      WHERE e.student_id = p_student_id
    ),
    'accessibility_indicators', (
      SELECT jsonb_build_object(
        'has_pei', EXISTS(SELECT 1 FROM peis WHERE student_id = p_student_id AND is_active_version = true),
        'has_aee', EXISTS(SELECT 1 FROM plano_aee WHERE student_id = p_student_id),
        'has_adaptations', EXISTS(SELECT 1 FROM pei_barriers WHERE pei_id IN (SELECT id FROM peis WHERE student_id = p_student_id)),
        'needs_special_attention', (
          SELECT s.necessidades_especiais
          FROM students s
          WHERE s.id = p_student_id
        )
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 3: Permissões
-- ============================================================================

GRANT SELECT ON student_unified_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_unified_data(uuid) TO authenticated;

-- Comentários
COMMENT ON VIEW student_unified_view IS 'View unificada com dados completos do estudante';
COMMENT ON FUNCTION get_student_unified_data(uuid) IS 'Função RPC para buscar dados completos do estudante em formato JSON';

