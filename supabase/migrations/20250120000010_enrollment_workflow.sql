-- Gestão Completa de Matrículas - Workflow Expandido
-- Implementa workflow completo: pré-matrícula → análise → aprovação → matrícula

-- ============================================================================
-- PARTE 1: EXPANSÃO DA TABELA ENROLLMENT_REQUESTS
-- ============================================================================

-- Adicionar campos necessários para workflow completo
ALTER TABLE "public"."enrollment_requests" 
  ADD COLUMN IF NOT EXISTS "waitlist_position" integer,
  ADD COLUMN IF NOT EXISTS "priority_score" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "required_documents" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "submitted_documents" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "document_status" text CHECK ("document_status" IN ('pending', 'incomplete', 'complete', 'verified')),
  ADD COLUMN IF NOT EXISTS "analysis_notes" text,
  ADD COLUMN IF NOT EXISTS "analysis_by" uuid REFERENCES "auth"."users"("id"),
  ADD COLUMN IF NOT EXISTS "analysis_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "matriculated_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "matriculated_by" uuid REFERENCES "auth"."users"("id"),
  ADD COLUMN IF NOT EXISTS "enrollment_id" uuid REFERENCES "public"."enrollments"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "transfer_from_school_id" uuid REFERENCES "public"."schools"("id"),
  ADD COLUMN IF NOT EXISTS "transfer_from_class_id" uuid REFERENCES "public"."classes"("id"),
  ADD COLUMN IF NOT EXISTS "transfer_reason" text,
  ADD COLUMN IF NOT EXISTS "rematriculation_confirmed" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "rematriculation_confirmed_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "rematriculation_confirmed_by" uuid REFERENCES "auth"."users"("id");

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_waitlist ON "public"."enrollment_requests"("waitlist_position", "priority_score") WHERE "status" = 'pendente';
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_document_status ON "public"."enrollment_requests"("document_status");
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_enrollment ON "public"."enrollment_requests"("enrollment_id");

-- ============================================================================
-- PARTE 2: TABELA DE FILA DE ESPERA
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."enrollment_waitlist" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "enrollment_request_id" uuid NOT NULL REFERENCES "public"."enrollment_requests"("id") ON DELETE CASCADE,
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "position" integer NOT NULL,
    "priority_score" integer DEFAULT 0,
    "added_at" timestamptz DEFAULT now(),
    "notified_at" timestamptz,
    "removed_at" timestamptz,
    "removed_reason" text,
    "created_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_waitlist_class ON "public"."enrollment_waitlist"("class_id", "position");
CREATE INDEX IF NOT EXISTS idx_enrollment_waitlist_request ON "public"."enrollment_waitlist"("enrollment_request_id");

-- ============================================================================
-- PARTE 3: TABELA DE DOCUMENTOS DE MATRÍCULA
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."enrollment_documents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "enrollment_request_id" uuid NOT NULL REFERENCES "public"."enrollment_requests"("id") ON DELETE CASCADE,
    "document_type" text NOT NULL,
    "document_name" text NOT NULL,
    "file_path" text,
    "file_url" text,
    "file_size_bytes" bigint,
    "uploaded_at" timestamptz DEFAULT now(),
    "uploaded_by" uuid REFERENCES "auth"."users"("id"),
    "verified" boolean DEFAULT false,
    "verified_at" timestamptz,
    "verified_by" uuid REFERENCES "auth"."users"("id"),
    "verification_notes" text,
    "created_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_documents_request ON "public"."enrollment_documents"("enrollment_request_id");
CREATE INDEX IF NOT EXISTS idx_enrollment_documents_type ON "public"."enrollment_documents"("document_type");

-- ============================================================================
-- PARTE 4: FUNÇÕES DE WORKFLOW
-- ============================================================================

-- Função para mover solicitação para análise
CREATE OR REPLACE FUNCTION "public"."move_enrollment_to_analysis"(
    p_request_id uuid,
    p_analysis_notes text DEFAULT NULL,
    p_analyst_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request "public"."enrollment_requests"%ROWTYPE;
    v_result jsonb;
BEGIN
    -- Buscar solicitação
    SELECT * INTO v_request FROM "public"."enrollment_requests" WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Solicitação não encontrada');
    END IF;

    IF v_request.status != 'pendente' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Solicitação não está pendente');
    END IF;

    -- Atualizar status
    UPDATE "public"."enrollment_requests"
    SET 
        status = 'em_analise',
        analysis_notes = p_analysis_notes,
        analysis_by = COALESCE(p_analyst_id, auth.uid()),
        analysis_at = now(),
        updated_at = now()
    WHERE id = p_request_id;

    v_result := jsonb_build_object(
        'success', true,
        'request_id', p_request_id,
        'new_status', 'em_analise'
    );

    RETURN v_result;
END;
$$;

-- Função para aprovar solicitação
CREATE OR REPLACE FUNCTION "public"."approve_enrollment_request"(
    p_request_id uuid,
    p_class_id uuid,
    p_approved_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request "public"."enrollment_requests"%ROWTYPE;
    v_class "public"."classes"%ROWTYPE;
    v_enrollment_id uuid;
    v_result jsonb;
BEGIN
    -- Buscar solicitação
    SELECT * INTO v_request FROM "public"."enrollment_requests" WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Solicitação não encontrada');
    END IF;

    IF v_request.status != 'em_analise' AND v_request.status != 'aprovada' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Solicitação não está em análise');
    END IF;

    -- Verificar se há vaga na turma
    SELECT * INTO v_class FROM "public"."classes" WHERE id = p_class_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Turma não encontrada');
    END IF;

    -- Verificar capacidade (se max_capacity estiver definido)
    IF v_class.max_capacity IS NOT NULL THEN
        DECLARE
            v_current_enrollments integer;
        BEGIN
            SELECT COUNT(*) INTO v_current_enrollments
            FROM "public"."enrollments"
            WHERE class_id = p_class_id
                AND is_active = true
                AND academic_year = v_request.academic_year;

            IF v_current_enrollments >= v_class.max_capacity THEN
                RETURN jsonb_build_object(
                    'success', false, 
                    'error', 'Turma sem vagas disponíveis',
                    'current_enrollments', v_current_enrollments,
                    'max_capacity', v_class.max_capacity
                );
            END IF;
        END;
    END IF;

    -- Criar matrícula se ainda não existir
    IF v_request.enrollment_id IS NULL THEN
        INSERT INTO "public"."enrollments" (
            student_id,
            class_id,
            school_id,
            tenant_id,
            academic_year,
            enrollment_date,
            status,
            is_active
        ) VALUES (
            v_request.student_id,
            p_class_id,
            v_request.school_id,
            v_request.tenant_id,
            v_request.academic_year,
            now(),
            'active',
            true
        ) RETURNING id INTO v_enrollment_id;

        -- Atualizar solicitação com enrollment_id
        UPDATE "public"."enrollment_requests"
        SET 
            enrollment_id = v_enrollment_id,
            requested_class_id = p_class_id,
            status = 'aprovada',
            approved_at = now(),
            approved_by_name = (SELECT full_name FROM "public"."profiles" WHERE id = COALESCE(p_approved_by, auth.uid())),
            updated_at = now()
        WHERE id = p_request_id;
    ELSE
        -- Atualizar matrícula existente
        UPDATE "public"."enrollments"
        SET 
            class_id = p_class_id,
            is_active = true,
            status = 'active',
            updated_at = now()
        WHERE id = v_request.enrollment_id;

        -- Atualizar solicitação
        UPDATE "public"."enrollment_requests"
        SET 
            requested_class_id = p_class_id,
            status = 'aprovada',
            approved_at = now(),
            approved_by_name = (SELECT full_name FROM "public"."profiles" WHERE id = COALESCE(p_approved_by, auth.uid())),
            updated_at = now()
        WHERE id = p_request_id;

        v_enrollment_id := v_request.enrollment_id;
    END IF;

    -- Remover da fila de espera se estiver
    UPDATE "public"."enrollment_waitlist"
    SET removed_at = now(), removed_reason = 'Aprovado e matriculado'
    WHERE enrollment_request_id = p_request_id AND removed_at IS NULL;

    v_result := jsonb_build_object(
        'success', true,
        'request_id', p_request_id,
        'enrollment_id', v_enrollment_id,
        'new_status', 'aprovada'
    );

    RETURN v_result;
END;
$$;

-- Função para adicionar à fila de espera
CREATE OR REPLACE FUNCTION "public"."add_to_waitlist"(
    p_request_id uuid,
    p_class_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request "public"."enrollment_requests"%ROWTYPE;
    v_class "public"."classes"%ROWTYPE;
    v_position integer;
    v_result jsonb;
BEGIN
    -- Buscar solicitação
    SELECT * INTO v_request FROM "public"."enrollment_requests" WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Solicitação não encontrada');
    END IF;

    -- Buscar turma
    SELECT * INTO v_class FROM "public"."classes" WHERE id = p_class_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Turma não encontrada');
    END IF;

    -- Verificar se já está na fila
    IF EXISTS (
        SELECT 1 FROM "public"."enrollment_waitlist"
        WHERE enrollment_request_id = p_request_id
            AND class_id = p_class_id
            AND removed_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Solicitação já está na fila de espera');
    END IF;

    -- Calcular posição na fila
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
    FROM "public"."enrollment_waitlist"
    WHERE class_id = p_class_id AND removed_at IS NULL;

    -- Adicionar à fila
    INSERT INTO "public"."enrollment_waitlist" (
        enrollment_request_id,
        class_id,
        position,
        priority_score,
        added_at
    ) VALUES (
        p_request_id,
        p_class_id,
        v_position,
        COALESCE(v_request.priority_score, 0),
        now()
    );

    -- Atualizar solicitação
    UPDATE "public"."enrollment_requests"
    SET 
        waitlist_position = v_position,
        requested_class_id = p_class_id,
        updated_at = now()
    WHERE id = p_request_id;

    v_result := jsonb_build_object(
        'success', true,
        'request_id', p_request_id,
        'position', v_position
    );

    RETURN v_result;
END;
$$;

-- Função para processar fila de espera quando vaga é liberada
CREATE OR REPLACE FUNCTION "public"."process_waitlist_for_class"(
    p_class_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_class "public"."classes"%ROWTYPE;
    v_waitlist_item "public"."enrollment_waitlist"%ROWTYPE;
    v_current_enrollments integer;
    v_available_spots integer;
    v_processed integer := 0;
BEGIN
    -- Buscar turma
    SELECT * INTO v_class FROM "public"."classes" WHERE id = p_class_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Turma não encontrada');
    END IF;

    -- Se não tem capacidade definida, não processar
    IF v_class.max_capacity IS NULL THEN
        RETURN jsonb_build_object('success', true, 'processed', 0, 'message', 'Turma sem limite de capacidade');
    END IF;

    -- Contar matrículas ativas
    SELECT COUNT(*) INTO v_current_enrollments
    FROM "public"."enrollments"
    WHERE class_id = p_class_id
        AND is_active = true;

    -- Calcular vagas disponíveis
    v_available_spots := v_class.max_capacity - v_current_enrollments;

    IF v_available_spots <= 0 THEN
        RETURN jsonb_build_object('success', true, 'processed', 0, 'message', 'Sem vagas disponíveis');
    END IF;

    -- Processar itens da fila em ordem de prioridade
    FOR v_waitlist_item IN
        SELECT * FROM "public"."enrollment_waitlist"
        WHERE class_id = p_class_id
            AND removed_at IS NULL
        ORDER BY priority_score DESC, position ASC
        LIMIT v_available_spots
    LOOP
        DECLARE
            v_request "public"."enrollment_requests"%ROWTYPE;
            v_result jsonb;
        BEGIN
            SELECT * INTO v_request FROM "public"."enrollment_requests" WHERE id = v_waitlist_item.enrollment_request_id;
            
            IF v_request.status = 'pendente' OR v_request.status = 'em_analise' THEN
                -- Tentar aprovar automaticamente
                v_result := "public"."approve_enrollment_request"(
                    v_waitlist_item.enrollment_request_id,
                    p_class_id
                );

                IF (v_result->>'success')::boolean THEN
                    v_processed := v_processed + 1;
                END IF;
            END IF;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'processed', v_processed,
        'available_spots', v_available_spots
    );
END;
$$;

-- ============================================================================
-- PARTE 5: RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."enrollment_waitlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."enrollment_documents" ENABLE ROW LEVEL SECURITY;

-- Políticas para enrollment_waitlist
CREATE POLICY "Users can view waitlist in their tenant"
    ON "public"."enrollment_waitlist" FOR SELECT
    USING (
        class_id IN (
            SELECT id FROM "public"."classes"
            WHERE school_id IN (
                SELECT id FROM "public"."schools"
                WHERE tenant_id IN (
                    SELECT tenant_id FROM "public"."user_tenants" WHERE user_id = auth.uid()
                    UNION
                    SELECT tenant_id FROM "public"."profiles" WHERE id = auth.uid()
                )
            )
        )
        OR EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() AND role = 'superadmin'
        )
    );

-- Políticas para enrollment_documents
CREATE POLICY "Users can view documents in their tenant"
    ON "public"."enrollment_documents" FOR SELECT
    USING (
        enrollment_request_id IN (
            SELECT id FROM "public"."enrollment_requests"
            WHERE tenant_id IN (
                SELECT tenant_id FROM "public"."user_tenants" WHERE user_id = auth.uid()
                UNION
                SELECT tenant_id FROM "public"."profiles" WHERE id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() AND role = 'superadmin'
        )
    );

CREATE POLICY "Admins can manage documents"
    ON "public"."enrollment_documents" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'education_secretary', 'school_manager')
        )
    );

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."enrollment_waitlist" IS 'Fila de espera para matrículas quando vagas estão esgotadas';
COMMENT ON TABLE "public"."enrollment_documents" IS 'Documentos necessários e enviados para matrícula';
COMMENT ON FUNCTION "public"."move_enrollment_to_analysis" IS 'Move solicitação de matrícula para análise';
COMMENT ON FUNCTION "public"."approve_enrollment_request" IS 'Aprova solicitação e cria matrícula';
COMMENT ON FUNCTION "public"."add_to_waitlist" IS 'Adiciona solicitação à fila de espera';
COMMENT ON FUNCTION "public"."process_waitlist_for_class" IS 'Processa fila de espera quando vaga é liberada';








