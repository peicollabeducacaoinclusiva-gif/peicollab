-- Controle de Vagas e Lotação
-- Adiciona controle de capacidade em turmas e alertas de lotação

-- ============================================================================
-- PARTE 1: ADICIONAR CAMPO DE CAPACIDADE EM CLASSES
-- ============================================================================

ALTER TABLE "public"."classes"
  ADD COLUMN IF NOT EXISTS "max_capacity" integer,
  ADD COLUMN IF NOT EXISTS "current_enrollments" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "capacity_warning_threshold" integer DEFAULT 80; -- Porcentagem

-- Índice para busca de turmas com vagas
CREATE INDEX IF NOT EXISTS idx_classes_capacity ON "public"."classes"("max_capacity", "current_enrollments", "is_active");

-- ============================================================================
-- PARTE 2: FUNÇÃO PARA ATUALIZAR CONTADOR DE MATRÍCULAS
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."update_class_enrollment_count"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atualizar contador quando matrícula é criada/ativada
    IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
        UPDATE "public"."classes"
        SET current_enrollments = (
            SELECT COUNT(*) FROM "public"."enrollments"
            WHERE class_id = NEW.class_id
                AND is_active = true
                AND academic_year = NEW.academic_year
        )
        WHERE id = NEW.class_id;
    END IF;

    -- Atualizar contador quando matrícula é atualizada
    IF TG_OP = 'UPDATE' THEN
        -- Se status mudou de ativo para inativo ou vice-versa
        IF (OLD.is_active != NEW.is_active) THEN
            UPDATE "public"."classes"
            SET current_enrollments = (
                SELECT COUNT(*) FROM "public"."enrollments"
                WHERE class_id = NEW.class_id
                    AND is_active = true
                    AND academic_year = NEW.academic_year
            )
            WHERE id = NEW.class_id;
        END IF;
    END IF;

    -- Atualizar contador quando matrícula é deletada
    IF TG_OP = 'DELETE' AND OLD.is_active = true THEN
        UPDATE "public"."classes"
        SET current_enrollments = (
            SELECT COUNT(*) FROM "public"."enrollments"
            WHERE class_id = OLD.class_id
                AND is_active = true
                AND academic_year = OLD.academic_year
        )
        WHERE id = OLD.class_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para atualizar contador automaticamente
DROP TRIGGER IF EXISTS trigger_update_class_enrollment_count ON "public"."enrollments";
CREATE TRIGGER trigger_update_class_enrollment_count
    AFTER INSERT OR UPDATE OR DELETE ON "public"."enrollments"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_class_enrollment_count"();

-- ============================================================================
-- PARTE 3: FUNÇÃO PARA VERIFICAR DISPONIBILIDADE DE VAGAS
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."check_class_availability"(
    p_class_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_class "public"."classes"%ROWTYPE;
    v_current_enrollments integer;
    v_available_spots integer;
    v_occupation_percentage numeric;
    v_result jsonb;
BEGIN
    -- Buscar turma
    SELECT * INTO v_class FROM "public"."classes" WHERE id = p_class_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Turma não encontrada');
    END IF;

    -- Se não tem capacidade definida, retornar como disponível
    IF v_class.max_capacity IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'available', true,
            'unlimited', true,
            'message', 'Turma sem limite de capacidade'
        );
    END IF;

    -- Contar matrículas ativas
    SELECT COUNT(*) INTO v_current_enrollments
    FROM "public"."enrollments"
    WHERE class_id = p_class_id
        AND is_active = true;

    -- Calcular vagas disponíveis
    v_available_spots := v_class.max_capacity - v_current_enrollments;
    v_occupation_percentage := (v_current_enrollments::numeric / v_class.max_capacity::numeric) * 100;

    v_result := jsonb_build_object(
        'success', true,
        'available', v_available_spots > 0,
        'unlimited', false,
        'max_capacity', v_class.max_capacity,
        'current_enrollments', v_current_enrollments,
        'available_spots', GREATEST(0, v_available_spots),
        'occupation_percentage', ROUND(v_occupation_percentage, 2),
        'is_full', v_available_spots <= 0,
        'near_capacity', v_occupation_percentage >= COALESCE(v_class.capacity_warning_threshold, 80)
    );

    RETURN v_result;
END;
$$;

-- ============================================================================
-- PARTE 4: TABELA DE ALERTAS DE LOTAÇÃO
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."capacity_alerts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "alert_type" text NOT NULL CHECK ("alert_type" IN ('near_capacity', 'full', 'over_capacity')),
    "occupation_percentage" numeric(5,2) NOT NULL,
    "current_enrollments" integer NOT NULL,
    "max_capacity" integer NOT NULL,
    "message" text,
    "acknowledged" boolean DEFAULT false,
    "acknowledged_at" timestamptz,
    "acknowledged_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capacity_alerts_class ON "public"."capacity_alerts"("class_id", "created_at");
CREATE INDEX IF NOT EXISTS idx_capacity_alerts_school ON "public"."capacity_alerts"("school_id", "acknowledged");
CREATE INDEX IF NOT EXISTS idx_capacity_alerts_tenant ON "public"."capacity_alerts"("tenant_id", "acknowledged");

-- ============================================================================
-- PARTE 5: FUNÇÃO PARA GERAR ALERTAS DE LOTAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."generate_capacity_alerts"(
    p_class_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_class_record "public"."classes"%ROWTYPE;
    v_alert_count integer := 0;
    v_result jsonb;
BEGIN
    -- Processar turma específica ou todas as turmas ativas
    FOR v_class_record IN
        SELECT * FROM "public"."classes"
        WHERE is_active = true
            AND (p_class_id IS NULL OR id = p_class_id)
            AND max_capacity IS NOT NULL
    LOOP
        DECLARE
            v_availability jsonb;
            v_current_enrollments integer;
            v_occupation_percentage numeric;
            v_alert_type text;
        BEGIN
            -- Verificar disponibilidade
            v_availability := "public"."check_class_availability"(v_class_record.id);
            
            IF (v_availability->>'success')::boolean THEN
                v_current_enrollments := (v_availability->>'current_enrollments')::integer;
                v_occupation_percentage := (v_availability->>'occupation_percentage')::numeric;

                -- Determinar tipo de alerta
                IF v_occupation_percentage >= 100 THEN
                    v_alert_type := 'over_capacity';
                ELSIF (v_availability->>'is_full')::boolean THEN
                    v_alert_type := 'full';
                ELSIF (v_availability->>'near_capacity')::boolean THEN
                    v_alert_type := 'near_capacity';
                ELSE
                    CONTINUE; -- Não gerar alerta
                END IF;

                -- Verificar se já existe alerta não reconhecido do mesmo tipo
                IF NOT EXISTS (
                    SELECT 1 FROM "public"."capacity_alerts"
                    WHERE class_id = v_class_record.id
                        AND alert_type = v_alert_type
                        AND acknowledged = false
                        AND created_at > now() - interval '24 hours'
                ) THEN
                    -- Criar alerta
                    INSERT INTO "public"."capacity_alerts" (
                        class_id,
                        school_id,
                        tenant_id,
                        alert_type,
                        occupation_percentage,
                        current_enrollments,
                        max_capacity,
                        message
                    ) VALUES (
                        v_class_record.id,
                        v_class_record.school_id,
                        (SELECT tenant_id FROM "public"."schools" WHERE id = v_class_record.school_id),
                        v_alert_type,
                        v_occupation_percentage,
                        v_current_enrollments,
                        v_class_record.max_capacity,
                        CASE v_alert_type
                            WHEN 'over_capacity' THEN 'Turma acima da capacidade máxima'
                            WHEN 'full' THEN 'Turma sem vagas disponíveis'
                            WHEN 'near_capacity' THEN 'Turma próxima da capacidade máxima (' || ROUND(v_occupation_percentage) || '%)'
                        END
                    );

                    v_alert_count := v_alert_count + 1;
                END IF;
            END IF;
        END;
    END LOOP;

    v_result := jsonb_build_object(
        'success', true,
        'alerts_generated', v_alert_count
    );

    RETURN v_result;
END;
$$;

-- ============================================================================
-- PARTE 6: RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."capacity_alerts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view capacity alerts in their tenant"
    ON "public"."capacity_alerts" FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM "public"."user_tenants" WHERE user_id = auth.uid()
            UNION
            SELECT tenant_id FROM "public"."profiles" WHERE id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE user_id = auth.uid() AND role = 'superadmin'
        )
    );

CREATE POLICY "Admins can manage capacity alerts"
    ON "public"."capacity_alerts" FOR UPDATE
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

COMMENT ON COLUMN "public"."classes"."max_capacity" IS 'Capacidade máxima de alunos na turma';
COMMENT ON COLUMN "public"."classes"."current_enrollments" IS 'Número atual de matrículas ativas (atualizado automaticamente)';
COMMENT ON COLUMN "public"."classes"."capacity_warning_threshold" IS 'Porcentagem de ocupação para gerar alerta (padrão: 80%)';
COMMENT ON FUNCTION "public"."check_class_availability" IS 'Verifica disponibilidade de vagas em uma turma';
COMMENT ON FUNCTION "public"."generate_capacity_alerts" IS 'Gera alertas de lotação para turmas';
COMMENT ON TABLE "public"."capacity_alerts" IS 'Alertas de lotação de turmas';








