-- ============================================================================
-- Migração: Atualizar check_active_consents para usar consents (tabela canônica)
-- Data: 2025-01-28
-- ============================================================================
-- Esta migração atualiza a função check_active_consents para usar a tabela
-- canônica "consents" ao invés de "data_consents" (tabela antiga).
-- Mantém compatibilidade de assinatura para código legado.
-- ============================================================================

-- Atualizar função check_active_consents para usar consents
CREATE OR REPLACE FUNCTION "public"."check_active_consents"(
    p_student_id uuid,
    p_consent_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_result jsonb;
    v_consents jsonb;
    v_tenant_id uuid;
BEGIN
    -- Obter tenant_id do estudante
    SELECT tenant_id INTO v_tenant_id
    FROM "public"."students"
    WHERE id = p_student_id;

    -- Se não encontrou tenant_id, retornar resultado vazio
    IF v_tenant_id IS NULL THEN
        RETURN jsonb_build_object(
            'student_id', p_student_id,
            'consents', '[]'::jsonb,
            'has_active_consents', false
        );
    END IF;

    -- Buscar consentimentos da tabela canônica "consents"
    SELECT jsonb_agg(
        jsonb_build_object(
            'consent_type', c.consent_type,
            'consent_given', c.granted,
            'consent_date', c.granted_at,
            'withdrawn_at', c.revoked_at,
            'metadata', c.metadata
        )
    ) INTO v_consents
    FROM "public"."consents" c
    WHERE c.tenant_id = v_tenant_id
        AND c.student_id = p_student_id
        AND (p_consent_type IS NULL OR c.consent_type = p_consent_type)
        AND c.granted = true
        AND (c.revoked_at IS NULL OR c.revoked_at > c.granted_at)
    ORDER BY c.granted_at DESC;

    -- Construir resultado no formato esperado
    v_result := jsonb_build_object(
        'student_id', p_student_id,
        'consents', COALESCE(v_consents, '[]'::jsonb),
        'has_active_consents', COALESCE(jsonb_array_length(v_consents), 0) > 0
    );

    RETURN v_result;
END;
$$;

-- Atualizar comentário da função
COMMENT ON FUNCTION "public"."check_active_consents" IS 
    'Verifica consentimentos ativos de um aluno usando a tabela canônica consents (atualizado para usar consents ao invés de data_consents)';

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- Esta migração atualiza check_active_consents para usar "consents" (canônica)
-- ao invés de "data_consents" (antiga).
--
-- A função mantém a mesma assinatura e formato de retorno para compatibilidade
-- com código legado que ainda pode chamar esta RPC.
--
-- O formato de retorno é mantido:
-- {
--   "student_id": uuid,
--   "consents": [...],
--   "has_active_consents": boolean
-- }
--
-- Diferenças em relação à versão antiga:
-- - Usa tabela "consents" ao invés de "data_consents"
-- - Usa campo "granted" ao invés de "consent_given"
-- - Usa campo "granted_at" ao invés de "consent_date"
-- - Inclui metadata completo no retorno
-- ============================================================================

