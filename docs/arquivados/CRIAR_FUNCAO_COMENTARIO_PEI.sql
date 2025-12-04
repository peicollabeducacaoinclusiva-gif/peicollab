-- ============================================================================
-- CRIAR FUNÇÃO RPC PARA ADICIONAR COMENTÁRIOS
-- ============================================================================
-- Contorna problema de cache de tipos do Supabase
-- ============================================================================

-- Criar função para adicionar comentário
CREATE OR REPLACE FUNCTION add_pei_comment(
    p_pei_id uuid,
    p_comment_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comment_id uuid;
    v_user_id uuid;
    v_user_name text;
BEGIN
    -- Obter usuário atual
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Buscar nome do usuário
    SELECT full_name INTO v_user_name
    FROM profiles
    WHERE id = v_user_id;

    -- Inserir comentário
    INSERT INTO pei_comments (pei_id, user_id, comment_text)
    VALUES (p_pei_id, v_user_id, p_comment_text)
    RETURNING id INTO v_comment_id;

    -- Retornar comentário criado
    RETURN jsonb_build_object(
        'id', v_comment_id,
        'pei_id', p_pei_id,
        'user_id', v_user_id,
        'comment_text', p_comment_text,
        'created_at', now(),
        'user_name', v_user_name
    );
END;
$$;

-- Criar função para buscar comentários de um PEI
CREATE OR REPLACE FUNCTION get_pei_comments(p_pei_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comments jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'comment_text', c.comment_text,
            'created_at', c.created_at,
            'user_name', p.full_name
        ) ORDER BY c.created_at DESC
    )
    INTO v_comments
    FROM pei_comments c
    JOIN profiles p ON p.id = c.user_id
    WHERE c.pei_id = p_pei_id;

    RETURN COALESCE(v_comments, '[]'::jsonb);
END;
$$;

-- ============================================================================
-- TESTE
-- ============================================================================

-- Testar a função (substitua o UUID por um PEI real)
-- SELECT add_pei_comment('pei-id-aqui', 'Comentário de teste');

-- ============================================================================
-- MENSAGEM
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Funções RPC criadas:';
    RAISE NOTICE '   • add_pei_comment(pei_id, texto)';
    RAISE NOTICE '   • get_pei_comments(pei_id)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Agora os comentários funcionarão!';
    RAISE NOTICE '🚀 Recarregue a página e teste!';
    RAISE NOTICE '';
END $$;






