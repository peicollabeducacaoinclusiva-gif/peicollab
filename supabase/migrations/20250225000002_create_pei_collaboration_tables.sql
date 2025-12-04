-- ============================================================================
-- MIGRAÇÃO: Tabelas para Colaboração e Versionamento Completo do PEI
-- Data: 25/02/2025
-- Descrição: Criar tabelas para comentários, colaboradores e melhorar versionamento
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Comentários do PEI
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."pei_comments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "comment" text NOT NULL,
    "parent_id" uuid REFERENCES "public"."pei_comments"("id") ON DELETE CASCADE,
    "resolved_at" timestamptz,
    "resolved_by" uuid REFERENCES "auth"."users"("id"),
    "section" text, -- 'diagnosis', 'planning', 'evaluation', 'general'
    "line_number" integer, -- Para comentários em linhas específicas
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "idx_pei_comments_pei_id" ON "public"."pei_comments"("pei_id");
CREATE INDEX IF NOT EXISTS "idx_pei_comments_user_id" ON "public"."pei_comments"("user_id");
CREATE INDEX IF NOT EXISTS "idx_pei_comments_parent_id" ON "public"."pei_comments"("parent_id");
CREATE INDEX IF NOT EXISTS "idx_pei_comments_resolved" ON "public"."pei_comments"("resolved_at");

-- ============================================================================
-- PARTE 2: Tabela de Colaboradores do PEI
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."pei_collaborators" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "role" text NOT NULL DEFAULT 'viewer', -- 'owner', 'editor', 'reviewer', 'viewer'
    "permissions" jsonb DEFAULT '{}'::jsonb, -- Permissões granulares
    "invited_by" uuid REFERENCES "auth"."users"("id"),
    "invited_at" timestamptz DEFAULT now(),
    "last_active_at" timestamptz,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("pei_id", "user_id")
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "idx_pei_collaborators_pei_id" ON "public"."pei_collaborators"("pei_id");
CREATE INDEX IF NOT EXISTS "idx_pei_collaborators_user_id" ON "public"."pei_collaborators"("user_id");
CREATE INDEX IF NOT EXISTS "idx_pei_collaborators_role" ON "public"."pei_collaborators"("role");

-- ============================================================================
-- PARTE 3: Melhorar PEI_HISTORY com diff completo
-- ============================================================================

-- Adicionar coluna para diff se não existir
ALTER TABLE "public"."pei_history" 
ADD COLUMN IF NOT EXISTS "diff_data" jsonb;

-- Adicionar coluna para indicar se é snapshot completo
ALTER TABLE "public"."pei_history" 
ADD COLUMN IF NOT EXISTS "is_snapshot" boolean DEFAULT false;

-- Índice para diff_data
CREATE INDEX IF NOT EXISTS "idx_pei_history_diff" ON "public"."pei_history" USING gin("diff_data");

-- ============================================================================
-- PARTE 4: Tabela de Sugestões/Revisões
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."pei_suggestions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "suggestion_type" text NOT NULL, -- 'goal', 'strategy', 'adaptation', 'resource'
    "section" text NOT NULL, -- 'diagnosis', 'planning', 'evaluation'
    "original_content" jsonb,
    "suggested_content" jsonb NOT NULL,
    "reason" text,
    "status" text DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    "reviewed_by" uuid REFERENCES "auth"."users"("id"),
    "reviewed_at" timestamptz,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_pei_suggestions_pei_id" ON "public"."pei_suggestions"("pei_id");
CREATE INDEX IF NOT EXISTS "idx_pei_suggestions_user_id" ON "public"."pei_suggestions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_pei_suggestions_status" ON "public"."pei_suggestions"("status");

-- ============================================================================
-- PARTE 5: Função RPC para criar versão com diff
-- ============================================================================

CREATE OR REPLACE FUNCTION create_pei_version_with_diff(
    p_pei_id uuid,
    p_changes jsonb,
    p_change_type text DEFAULT 'updated',
    p_change_summary text DEFAULT ''
)
RETURNS uuid AS $$
DECLARE
    v_new_version_number integer;
    v_previous_version_id uuid;
    v_current_pei record;
    v_diff_data jsonb;
    v_new_history_id uuid;
BEGIN
    -- Buscar versão atual do PEI
    SELECT 
        version_number,
        diagnosis_data,
        planning_data,
        evaluation_data,
        status
    INTO v_current_pei
    FROM peis
    WHERE id = p_pei_id AND is_active_version = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PEI ativo não encontrado';
    END IF;

    -- Calcular novo número de versão
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_new_version_number
    FROM pei_history
    WHERE pei_id = p_pei_id;

    -- Buscar ID da versão anterior
    SELECT id INTO v_previous_version_id
    FROM pei_history
    WHERE pei_id = p_pei_id
    ORDER BY version_number DESC
    LIMIT 1;

    -- Calcular diff
    v_diff_data := jsonb_build_object(
        'diagnosis', p_changes->'diagnosis',
        'planning', p_changes->'planning',
        'evaluation', p_changes->'evaluation',
        'status', p_changes->'status'
    );

    -- Criar entrada no histórico
    INSERT INTO pei_history (
        pei_id,
        version_number,
        changed_by,
        change_type,
        change_summary,
        diagnosis_data,
        planning_data,
        evaluation_data,
        status,
        previous_version_id,
        diff_data,
        is_snapshot
    )
    VALUES (
        p_pei_id,
        v_new_version_number,
        auth.uid(),
        p_change_type,
        p_change_summary,
        COALESCE(p_changes->'diagnosis', v_current_pei.diagnosis_data),
        COALESCE(p_changes->'planning', v_current_pei.planning_data),
        COALESCE(p_changes->'evaluation', v_current_pei.evaluation_data),
        COALESCE((p_changes->>'status')::pei_status, v_current_pei.status),
        v_previous_version_id,
        v_diff_data,
        false
    )
    RETURNING id INTO v_new_history_id;

    RETURN v_new_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 6: Função RPC para obter diff entre versões
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pei_version_diff(
    p_pei_id uuid,
    p_version1 integer,
    p_version2 integer
)
RETURNS jsonb AS $$
DECLARE
    v_version1_data record;
    v_version2_data record;
    v_diff jsonb;
BEGIN
    -- Buscar dados da versão 1
    SELECT 
        diagnosis_data,
        planning_data,
        evaluation_data,
        status
    INTO v_version1_data
    FROM pei_history
    WHERE pei_id = p_pei_id AND version_number = p_version1;

    -- Buscar dados da versão 2
    SELECT 
        diagnosis_data,
        planning_data,
        evaluation_data,
        status
    INTO v_version2_data
    FROM pei_history
    WHERE pei_id = p_pei_id AND version_number = p_version2;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Versão não encontrada';
    END IF;

    -- Calcular diff (simplificado - pode ser melhorado com biblioteca de diff)
    v_diff := jsonb_build_object(
        'diagnosis_changed', v_version1_data.diagnosis_data IS DISTINCT FROM v_version2_data.diagnosis_data,
        'planning_changed', v_version1_data.planning_data IS DISTINCT FROM v_version2_data.planning_data,
        'evaluation_changed', v_version1_data.evaluation_data IS DISTINCT FROM v_version2_data.evaluation_data,
        'status_changed', v_version1_data.status IS DISTINCT FROM v_version2_data.status,
        'version1', jsonb_build_object(
            'diagnosis', v_version1_data.diagnosis_data,
            'planning', v_version1_data.planning_data,
            'evaluation', v_version1_data.evaluation_data,
            'status', v_version1_data.status
        ),
        'version2', jsonb_build_object(
            'diagnosis', v_version2_data.diagnosis_data,
            'planning', v_version2_data.planning_data,
            'evaluation', v_version2_data.evaluation_data,
            'status', v_version2_data.status
        )
    );

    RETURN v_diff;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 7: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON "public"."pei_comments" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."pei_collaborators" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."pei_suggestions" TO authenticated;
GRANT EXECUTE ON FUNCTION create_pei_version_with_diff(uuid, jsonb, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pei_version_diff(uuid, integer, integer) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."pei_comments" IS 'Comentários e sugestões nos PEIs';
COMMENT ON TABLE "public"."pei_collaborators" IS 'Colaboradores com acesso ao PEI';
COMMENT ON TABLE "public"."pei_suggestions" IS 'Sugestões de alteração no PEI';
COMMENT ON FUNCTION create_pei_version_with_diff(uuid, jsonb, text, text) IS 'Cria nova versão do PEI com diff calculado';
COMMENT ON FUNCTION get_pei_version_diff(uuid, integer, integer) IS 'Obtém diff entre duas versões do PEI';

