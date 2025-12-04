-- ============================================================================
-- MIGRAÇÃO: Linha do Tempo da Turma
-- Data: 25/02/2025
-- Descrição: Criar estrutura para timeline visual da turma
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Eventos da Turma
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."class_timeline_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "event_type" text NOT NULL, -- 'activity', 'evaluation', 'event', 'attendance', 'pei_update', 'aee_session'
    "event_date" date NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_class_timeline_events_class" ON "public"."class_timeline_events"("class_id");
CREATE INDEX IF NOT EXISTS "idx_class_timeline_events_date" ON "public"."class_timeline_events"("event_date");
CREATE INDEX IF NOT EXISTS "idx_class_timeline_events_type" ON "public"."class_timeline_events"("event_type");

-- ============================================================================
-- PARTE 2: Função para buscar timeline da turma
-- ============================================================================

CREATE OR REPLACE FUNCTION get_class_timeline(
    p_class_id uuid,
    p_start_date date DEFAULT CURRENT_DATE - interval '30 days',
    p_end_date date DEFAULT CURRENT_DATE + interval '30 days'
)
RETURNS TABLE (
    id uuid,
    event_type text,
    event_date date,
    title text,
    description text,
    metadata jsonb,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cte.id,
        cte.event_type,
        cte.event_date,
        cte.title,
        cte.description,
        cte.metadata,
        cte.created_at
    FROM "public"."class_timeline_events" cte
    WHERE cte.class_id = p_class_id
    AND cte.event_date BETWEEN p_start_date AND p_end_date
    ORDER BY cte.event_date ASC, cte.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 3: Trigger para criar eventos automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION create_timeline_event_from_planning()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um planejamento é criado, criar evento na timeline
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "public"."class_timeline_events" (
            class_id,
            event_type,
            event_date,
            title,
            description,
            metadata,
            created_by
        )
        VALUES (
            NEW.class_id,
            'activity',
            NEW.start_date,
            COALESCE(NEW.subject, 'Planejamento'),
            'Novo planejamento criado',
            jsonb_build_object(
                'planning_id', NEW.id,
                'planning_type', NEW.planning_type
            ),
            NEW.teacher_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_timeline_from_planning
AFTER INSERT ON "public"."pedagogical_plannings"
FOR EACH ROW
EXECUTE FUNCTION create_timeline_event_from_planning();

-- ============================================================================
-- PARTE 4: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."class_timeline_events" TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_timeline(uuid, date, date) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."class_timeline_events" IS 'Eventos da linha do tempo da turma';
COMMENT ON FUNCTION get_class_timeline(uuid, date, date) IS 'Retorna eventos da timeline de uma turma';

