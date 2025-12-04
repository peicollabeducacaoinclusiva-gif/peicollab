-- ============================================================================
-- MIGRAÇÃO: PEI por Ciclos
-- Data: 25/02/2025
-- Descrição: Criar estrutura para PEI organizado em ciclos avaliativos
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Ciclos do PEI
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."pei_cycles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "cycle_number" integer NOT NULL,
    "cycle_name" text, -- 'I Ciclo', 'II Ciclo', 'III Ciclo', etc.
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "evaluation" jsonb DEFAULT '{}'::jsonb,
    "goals_summary" jsonb DEFAULT '[]'::jsonb,
    "observations" text,
    "status" text DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("pei_id", "cycle_number")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_pei_cycles_pei" ON "public"."pei_cycles"("pei_id");
CREATE INDEX IF NOT EXISTS "idx_pei_cycles_number" ON "public"."pei_cycles"("cycle_number");
CREATE INDEX IF NOT EXISTS "idx_pei_cycles_status" ON "public"."pei_cycles"("status");

-- ============================================================================
-- PARTE 2: Adicionar coluna cycle em pei_goals
-- ============================================================================

ALTER TABLE "public"."pei_goals" 
ADD COLUMN IF NOT EXISTS "cycle_id" uuid REFERENCES "public"."pei_cycles"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_pei_goals_cycle" ON "public"."pei_goals"("cycle_id");

-- ============================================================================
-- PARTE 3: Função para criar ciclo padrão baseado em BNCC
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_pei_cycles(p_pei_id uuid)
RETURNS void AS $$
DECLARE
    v_student_id uuid;
    v_academic_year integer;
    v_cycle1_start date;
    v_cycle1_end date;
    v_cycle2_start date;
    v_cycle2_end date;
    v_cycle3_start date;
    v_cycle3_end date;
BEGIN
    -- Buscar dados do PEI
    SELECT student_id INTO v_student_id
    FROM "public"."peis"
    WHERE id = p_pei_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PEI não encontrado';
    END IF;

    -- Determinar ano letivo (assumindo ano atual)
    v_academic_year := EXTRACT(YEAR FROM now())::integer;

    -- Definir datas dos ciclos (padrão: 3 ciclos por ano)
    -- Ciclo I: Fevereiro a Maio
    v_cycle1_start := make_date(v_academic_year, 2, 1);
    v_cycle1_end := make_date(v_academic_year, 5, 31);
    
    -- Ciclo II: Junho a Setembro
    v_cycle2_start := make_date(v_academic_year, 6, 1);
    v_cycle2_end := make_date(v_academic_year, 9, 30);
    
    -- Ciclo III: Outubro a Dezembro
    v_cycle3_start := make_date(v_academic_year, 10, 1);
    v_cycle3_end := make_date(v_academic_year, 12, 31);

    -- Criar ciclos
    INSERT INTO "public"."pei_cycles" (pei_id, cycle_number, cycle_name, start_date, end_date, status)
    VALUES
        (p_pei_id, 1, 'I Ciclo', v_cycle1_start, v_cycle1_end, 'active'),
        (p_pei_id, 2, 'II Ciclo', v_cycle2_start, v_cycle2_end, 'pending'),
        (p_pei_id, 3, 'III Ciclo', v_cycle3_start, v_cycle3_end, 'pending')
    ON CONFLICT (pei_id, cycle_number) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 4: Função para obter ciclo atual
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_pei_cycle(p_pei_id uuid)
RETURNS TABLE (
    id uuid,
    cycle_number integer,
    cycle_name text,
    start_date date,
    end_date date,
    status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.cycle_number,
        pc.cycle_name,
        pc.start_date,
        pc.end_date,
        pc.status
    FROM "public"."pei_cycles" pc
    WHERE pc.pei_id = p_pei_id
    AND pc.status = 'active'
    AND CURRENT_DATE BETWEEN pc.start_date AND pc.end_date
    ORDER BY pc.cycle_number DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 5: Função para finalizar ciclo e iniciar próximo
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_pei_cycle(p_cycle_id uuid)
RETURNS void AS $$
DECLARE
    v_pei_id uuid;
    v_cycle_number integer;
    v_next_cycle_id uuid;
BEGIN
    -- Buscar dados do ciclo
    SELECT pei_id, cycle_number
    INTO v_pei_id, v_cycle_number
    FROM "public"."pei_cycles"
    WHERE id = p_cycle_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ciclo não encontrado';
    END IF;

    -- Finalizar ciclo atual
    UPDATE "public"."pei_cycles"
    SET 
        status = 'completed',
        updated_at = now()
    WHERE id = p_cycle_id;

    -- Ativar próximo ciclo
    SELECT id INTO v_next_cycle_id
    FROM "public"."pei_cycles"
    WHERE pei_id = v_pei_id
    AND cycle_number = v_cycle_number + 1;

    IF v_next_cycle_id IS NOT NULL THEN
        UPDATE "public"."pei_cycles"
        SET 
            status = 'active',
            updated_at = now()
        WHERE id = v_next_cycle_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 6: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON "public"."pei_cycles" TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_pei_cycles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_pei_cycle(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_pei_cycle(uuid) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."pei_cycles" IS 'Ciclos avaliativos do PEI conforme BNCC';
COMMENT ON FUNCTION create_default_pei_cycles(uuid) IS 'Cria ciclos padrão (I, II, III) para um PEI';
COMMENT ON FUNCTION get_current_pei_cycle(uuid) IS 'Obtém o ciclo ativo atual do PEI';
COMMENT ON FUNCTION complete_pei_cycle(uuid) IS 'Finaliza um ciclo e ativa o próximo';

