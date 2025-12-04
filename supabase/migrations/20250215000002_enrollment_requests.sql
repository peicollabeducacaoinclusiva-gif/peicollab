-- ============================================================================
-- MIGRAÇÃO: Sistema de Matrículas Online
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar tabela enrollment_requests para solicitações de matrícula
--   2. Criar RPCs para gerenciar solicitações
--   3. Integrar com student_enrollments
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA enrollment_requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Tipo de solicitação
  request_type text NOT NULL CHECK (request_type IN ('pre_matricula', 'rematricula', 'transferencia')),
  
  -- Status da solicitação
  status text NOT NULL DEFAULT 'pendente' 
    CHECK (status IN ('pendente', 'em_analise', 'aprovada', 'rejeitada', 'cancelada')),
  
  -- Ano letivo
  academic_year integer NOT NULL,
  
  -- Dados da solicitação
  requested_class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  requested_grade text,
  requested_class_name text,
  requested_shift text,
  
  -- Responsável pela solicitação
  requested_by uuid REFERENCES profiles(id),
  requested_by_name text,
  requested_by_cpf text,
  requested_by_relationship text, -- 'pai', 'mae', 'responsavel', 'diretor', etc.
  
  -- Documentos anexados
  documents jsonb DEFAULT '[]'::jsonb, -- [{type, url, name, uploaded_at}]
  
  -- Dados para integração com Censo
  censo_data jsonb DEFAULT '{}'::jsonb,
  
  -- Motivo de rejeição (se aplicável)
  rejection_reason text,
  rejection_details text,
  
  -- Aprovação
  approved_at timestamptz,
  approved_by uuid REFERENCES profiles(id),
  
  -- Rejeição
  rejected_at timestamptz,
  rejected_by uuid REFERENCES profiles(id),
  
  -- Observações
  notes text,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_student ON enrollment_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_school ON enrollment_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_tenant ON enrollment_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_status ON enrollment_requests(status);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_type ON enrollment_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_academic_year ON enrollment_requests(academic_year);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_requested_by ON enrollment_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_school_status_year ON enrollment_requests(school_id, status, academic_year);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_enrollment_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollment_requests_updated_at_trigger ON enrollment_requests;
CREATE TRIGGER enrollment_requests_updated_at_trigger
  BEFORE UPDATE ON enrollment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_requests_updated_at();

-- Comentários
COMMENT ON TABLE enrollment_requests IS 
  'Solicitações de matrícula, rematrícula e transferência. Permite que responsáveis e diretores solicitem matrículas online.';

COMMENT ON COLUMN enrollment_requests.request_type IS 
  'Tipo de solicitação: pre_matricula (nova matrícula), rematricula (renovação), transferencia (mudança de escola)';

COMMENT ON COLUMN enrollment_requests.status IS 
  'Status: pendente (aguardando análise), em_analise (sendo analisada), aprovada (criada matrícula), rejeitada (negada), cancelada (cancelada pelo solicitante)';

COMMENT ON COLUMN enrollment_requests.documents IS 
  'Array de documentos anexados: [{type: "cpf", url: "...", name: "...", uploaded_at: "..."}]';

COMMENT ON COLUMN enrollment_requests.censo_data IS 
  'Dados adicionais para integração com Censo Escolar/EducaCenso';

-- ============================================================================
-- PARTE 2: RPCs PARA GERENCIAR SOLICITAÇÕES
-- ============================================================================

-- 2.1. Criar solicitação de matrícula
CREATE OR REPLACE FUNCTION create_enrollment_request(
  p_student_id uuid,
  p_school_id uuid,
  p_academic_year integer,
  p_request_type text,
  p_requested_class_id uuid DEFAULT NULL,
  p_requested_grade text DEFAULT NULL,
  p_requested_class_name text DEFAULT NULL,
  p_requested_shift text DEFAULT NULL,
  p_requested_by uuid DEFAULT NULL,
  p_requested_by_name text DEFAULT NULL,
  p_requested_by_cpf text DEFAULT NULL,
  p_requested_by_relationship text DEFAULT NULL,
  p_documents jsonb DEFAULT '[]'::jsonb,
  p_censo_data jsonb DEFAULT '{}'::jsonb,
  p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_request_id uuid;
  v_tenant_id uuid;
  v_student_exists boolean;
BEGIN
  -- Validar tipo de solicitação
  IF p_request_type NOT IN ('pre_matricula', 'rematricula', 'transferencia') THEN
    RAISE EXCEPTION 'Tipo de solicitação inválido: %', p_request_type;
  END IF;
  
  -- Obter tenant_id da escola
  SELECT tenant_id INTO v_tenant_id
  FROM schools
  WHERE id = p_school_id;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Escola não encontrada';
  END IF;
  
  -- Validar student_id (pode ser NULL para pré-matrícula de novo aluno)
  IF p_student_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM students WHERE id = p_student_id) INTO v_student_exists;
    IF NOT v_student_exists THEN
      RAISE EXCEPTION 'Aluno não encontrado';
    END IF;
  END IF;
  
  -- Validar class_id se fornecido
  IF p_requested_class_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM classes 
      WHERE id = p_requested_class_id 
      AND school_id = p_school_id
    ) THEN
      RAISE EXCEPTION 'Turma não pertence à escola especificada';
    END IF;
  END IF;
  
  -- Criar solicitação
  INSERT INTO enrollment_requests (
    student_id,
    school_id,
    tenant_id,
    academic_year,
    request_type,
    status,
    requested_class_id,
    requested_grade,
    requested_class_name,
    requested_shift,
    requested_by,
    requested_by_name,
    requested_by_cpf,
    requested_by_relationship,
    documents,
    censo_data,
    notes,
    created_by
  ) VALUES (
    p_student_id,
    p_school_id,
    v_tenant_id,
    p_academic_year,
    p_request_type,
    'pendente',
    p_requested_class_id,
    p_requested_grade,
    p_requested_class_name,
    p_requested_shift,
    p_requested_by,
    p_requested_by_name,
    p_requested_by_cpf,
    p_requested_by_relationship,
    p_documents,
    p_censo_data,
    p_notes,
    COALESCE(p_requested_by, auth.uid())
  )
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2. Aprovar solicitação e criar matrícula
CREATE OR REPLACE FUNCTION approve_enrollment_request(
  p_request_id uuid,
  p_approved_by uuid DEFAULT NULL,
  p_class_id uuid DEFAULT NULL,
  p_grade text DEFAULT NULL,
  p_class_name text DEFAULT NULL,
  p_shift text DEFAULT NULL,
  p_enrollment_number text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_request enrollment_requests%ROWTYPE;
  v_enrollment_id uuid;
  v_student_id uuid;
  v_new_student_id uuid;
BEGIN
  -- Buscar solicitação
  SELECT * INTO v_request
  FROM enrollment_requests
  WHERE id = p_request_id;
  
  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;
  
  IF v_request.status != 'pendente' AND v_request.status != 'em_analise' THEN
    RAISE EXCEPTION 'Solicitação não pode ser aprovada. Status atual: %', v_request.status;
  END IF;
  
  -- Se for pré-matrícula e não tiver student_id, criar aluno primeiro
  IF v_request.request_type = 'pre_matricula' AND v_request.student_id IS NULL THEN
    -- Criar aluno básico (dados completos serão preenchidos depois)
    INSERT INTO students (
      school_id,
      tenant_id,
      name,
      is_active
    ) VALUES (
      v_request.school_id,
      v_request.tenant_id,
      COALESCE(v_request.requested_by_name, 'Aluno a ser cadastrado'),
      true
    )
    RETURNING id INTO v_new_student_id;
    
    -- Atualizar solicitação com student_id
    UPDATE enrollment_requests
    SET student_id = v_new_student_id
    WHERE id = p_request_id;
    
    v_student_id := v_new_student_id;
  ELSE
    v_student_id := v_request.student_id;
    
    IF v_student_id IS NULL THEN
      RAISE EXCEPTION 'Solicitação não possui aluno vinculado';
    END IF;
  END IF;
  
  -- Criar matrícula usando função existente
  SELECT create_student_enrollment(
    v_student_id,
    v_request.school_id,
    v_request.academic_year,
    COALESCE(p_grade, v_request.requested_grade, 'Não informado'),
    COALESCE(p_class_name, v_request.requested_class_name, 'Não informado'),
    COALESCE(p_shift, v_request.requested_shift, 'Manhã'),
    p_enrollment_number,
    COALESCE(p_class_id, v_request.requested_class_id)
  ) INTO v_enrollment_id;
  
  -- Atualizar solicitação como aprovada
  UPDATE enrollment_requests
  SET 
    status = 'aprovada',
    approved_at = NOW(),
    approved_by = COALESCE(p_approved_by, auth.uid()),
    notes = COALESCE(
      CONCAT_WS(E'\n', notes, p_notes),
      p_notes,
      notes
    ),
    requested_class_id = COALESCE(p_class_id, requested_class_id),
    requested_grade = COALESCE(p_grade, requested_grade),
    requested_class_name = COALESCE(p_class_name, requested_class_name),
    requested_shift = COALESCE(p_shift, requested_shift)
  WHERE id = p_request_id;
  
  RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.3. Rejeitar solicitação
CREATE OR REPLACE FUNCTION reject_enrollment_request(
  p_request_id uuid,
  p_rejection_reason text,
  p_rejection_details text DEFAULT NULL,
  p_rejected_by uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_request enrollment_requests%ROWTYPE;
BEGIN
  -- Buscar solicitação
  SELECT * INTO v_request
  FROM enrollment_requests
  WHERE id = p_request_id;
  
  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;
  
  IF v_request.status NOT IN ('pendente', 'em_analise') THEN
    RAISE EXCEPTION 'Solicitação não pode ser rejeitada. Status atual: %', v_request.status;
  END IF;
  
  -- Atualizar solicitação como rejeitada
  UPDATE enrollment_requests
  SET 
    status = 'rejeitada',
    rejection_reason = p_rejection_reason,
    rejection_details = p_rejection_details,
    rejected_at = NOW(),
    rejected_by = COALESCE(p_rejected_by, auth.uid())
  WHERE id = p_request_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.4. Cancelar solicitação
CREATE OR REPLACE FUNCTION cancel_enrollment_request(
  p_request_id uuid,
  p_cancelled_by uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_request enrollment_requests%ROWTYPE;
BEGIN
  -- Buscar solicitação
  SELECT * INTO v_request
  FROM enrollment_requests
  WHERE id = p_request_id;
  
  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;
  
  IF v_request.status NOT IN ('pendente', 'em_analise') THEN
    RAISE EXCEPTION 'Solicitação não pode ser cancelada. Status atual: %', v_request.status;
  END IF;
  
  -- Atualizar solicitação como cancelada
  UPDATE enrollment_requests
  SET 
    status = 'cancelada',
    updated_at = NOW()
  WHERE id = p_request_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.5. Listar solicitações
CREATE OR REPLACE FUNCTION get_enrollment_requests(
  p_school_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_academic_year integer DEFAULT NULL,
  p_request_type text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  student_id uuid,
  student_name text,
  school_id uuid,
  school_name text,
  tenant_id uuid,
  request_type text,
  status text,
  academic_year integer,
  requested_class_id uuid,
  requested_grade text,
  requested_class_name text,
  requested_shift text,
  requested_by uuid,
  requested_by_name text,
  requested_by_cpf text,
  requested_by_relationship text,
  documents jsonb,
  rejection_reason text,
  rejection_details text,
  approved_at timestamptz,
  approved_by uuid,
  approved_by_name text,
  rejected_at timestamptz,
  rejected_by uuid,
  rejected_by_name text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.id,
    er.student_id,
    s.name as student_name,
    er.school_id,
    sch.school_name,
    er.tenant_id,
    er.request_type,
    er.status,
    er.academic_year,
    er.requested_class_id,
    er.requested_grade,
    er.requested_class_name,
    er.requested_shift,
    er.requested_by,
    er.requested_by_name,
    er.requested_by_cpf,
    er.requested_by_relationship,
    er.documents,
    er.rejection_reason,
    er.rejection_details,
    er.approved_at,
    er.approved_by,
    approver.full_name as approved_by_name,
    er.rejected_at,
    er.rejected_by,
    rejector.full_name as rejected_by_name,
    er.notes,
    er.created_at,
    er.updated_at
  FROM enrollment_requests er
  LEFT JOIN students s ON s.id = er.student_id
  LEFT JOIN schools sch ON sch.id = er.school_id
  LEFT JOIN profiles approver ON approver.id = er.approved_by
  LEFT JOIN profiles rejector ON rejector.id = er.rejected_by
  WHERE 
    (p_school_id IS NULL OR er.school_id = p_school_id)
    AND (p_tenant_id IS NULL OR er.tenant_id = p_tenant_id)
    AND (p_status IS NULL OR er.status = p_status)
    AND (p_academic_year IS NULL OR er.academic_year = p_academic_year)
    AND (p_request_type IS NULL OR er.request_type = p_request_type)
  ORDER BY er.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 3: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to enrollment_requests" ON enrollment_requests;
CREATE POLICY "Superadmin full access to enrollment_requests"
  ON enrollment_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Secretário de educação vê todas as solicitações da rede
DROP POLICY IF EXISTS "Education secretary can view all requests in network" ON enrollment_requests;
CREATE POLICY "Education secretary can view all requests in network"
  ON enrollment_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid()
      AND ur.role = 'education_secretary'
      AND p.tenant_id = enrollment_requests.tenant_id
    )
  );

-- Diretores e coordenadores veem solicitações da sua escola
DROP POLICY IF EXISTS "School staff can view requests in their school" ON enrollment_requests;
CREATE POLICY "School staff can view requests in their school"
  ON enrollment_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid()
      AND p.school_id = enrollment_requests.school_id
      AND ur.role IN ('school_director', 'coordinator', 'school_manager')
    )
  );

-- Diretores e coordenadores podem gerenciar solicitações da sua escola
DROP POLICY IF EXISTS "School staff can manage requests in their school" ON enrollment_requests;
CREATE POLICY "School staff can manage requests in their school"
  ON enrollment_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid()
      AND p.school_id = enrollment_requests.school_id
      AND ur.role IN ('school_director', 'coordinator', 'school_manager')
    )
  );

-- Responsáveis podem ver suas próprias solicitações
DROP POLICY IF EXISTS "Family can view their own requests" ON enrollment_requests;
CREATE POLICY "Family can view their own requests"
  ON enrollment_requests FOR SELECT
  USING (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM student_family sf
      WHERE sf.family_user_id = auth.uid()
      AND sf.student_id = enrollment_requests.student_id
    )
  );

-- Responsáveis podem criar e cancelar suas próprias solicitações
DROP POLICY IF EXISTS "Family can create and cancel their own requests" ON enrollment_requests;
CREATE POLICY "Family can create and cancel their own requests"
  ON enrollment_requests FOR INSERT, UPDATE
  USING (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM student_family sf
      WHERE sf.family_user_id = auth.uid()
      AND sf.student_id = enrollment_requests.student_id
    )
  )
  WITH CHECK (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM student_family sf
      WHERE sf.family_user_id = auth.uid()
      AND sf.student_id = enrollment_requests.student_id
    )
  );

-- ============================================================================
-- PARTE 4: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de sistema de matrículas online concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela enrollment_requests';
  RAISE NOTICE '  2. ✅ Criados RPCs: create_enrollment_request, approve_enrollment_request, reject_enrollment_request, cancel_enrollment_request, get_enrollment_requests';
  RAISE NOTICE '  3. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Criar interface no app Gestão Escolar (/enrollments)';
  RAISE NOTICE '  - Criar formulário de pré-matrícula para responsáveis';
  RAISE NOTICE '  - Implementar upload de documentos';
  RAISE NOTICE '  - Adicionar notificações para mudanças de status';
END $$;

