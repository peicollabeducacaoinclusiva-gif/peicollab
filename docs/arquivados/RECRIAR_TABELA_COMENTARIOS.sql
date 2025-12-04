-- ============================================================================
-- RECRIAR TABELA DE COMENTÁRIOS CORRETAMENTE
-- ============================================================================

-- Ver estrutura atual da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pei_comments';

-- Dropar e recriar a tabela do zero
DROP TABLE IF EXISTS "public"."pei_comments" CASCADE;

-- Criar tabela correta
CREATE TABLE "public"."pei_comments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "comment_text" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX "idx_pei_comments_pei" ON "public"."pei_comments"("pei_id");
CREATE INDEX "idx_pei_comments_user" ON "public"."pei_comments"("user_id");

-- RLS
ALTER TABLE "public"."pei_comments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_comments" ON "public"."pei_comments" FOR SELECT USING (true);
CREATE POLICY "users_create_comments" ON "public"."pei_comments" FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_manage_own_comments" ON "public"."pei_comments" FOR ALL USING (user_id = auth.uid());

-- Recriar funções RPC
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
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    SELECT full_name INTO v_user_name FROM profiles WHERE id = v_user_id;

    INSERT INTO pei_comments (pei_id, user_id, comment_text)
    VALUES (p_pei_id, v_user_id, p_comment_text)
    RETURNING id INTO v_comment_id;

    RETURN jsonb_build_object(
        'id', v_comment_id,
        'comment_text', p_comment_text,
        'created_at', now(),
        'user_name', v_user_name
    );
END;
$$;

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

-- Verificar
SELECT 'Colunas da tabela pei_comments:' as info, column_name 
FROM information_schema.columns 
WHERE table_name = 'pei_comments'
ORDER BY ordinal_position;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tabela pei_comments recriada!';
    RAISE NOTICE '✅ Coluna comment_text criada corretamente';
    RAISE NOTICE '✅ Funções RPC recriadas';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Recarregue a página e teste!';
    RAISE NOTICE '';
END $$;

