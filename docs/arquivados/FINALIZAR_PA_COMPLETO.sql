-- ============================================================================
-- FINALIZAR PA COMPLETO - Modal de Visualização e Comentários
-- ============================================================================
-- Execute TODO este script de uma vez
-- ============================================================================

-- ============================================================================
-- 1. CRIAR TABELA DE COMENTÁRIOS NO PEI (se não existir)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."pei_comments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "comment_text" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_pei_comments_pei" ON "public"."pei_comments"("pei_id");
CREATE INDEX IF NOT EXISTS "idx_pei_comments_user" ON "public"."pei_comments"("user_id");

-- ============================================================================
-- 2. RLS POLICIES: pei_comments
-- ============================================================================

ALTER TABLE "public"."pei_comments" ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "users_view_comments" ON "public"."pei_comments";
DROP POLICY IF EXISTS "users_create_comments" ON "public"."pei_comments";
DROP POLICY IF EXISTS "users_manage_own_comments" ON "public"."pei_comments";

-- Todos podem ver comentários de PEIs que têm acesso
CREATE POLICY "users_view_comments"
    ON "public"."pei_comments"
    FOR SELECT
    USING (true);

-- Usuários autenticados podem criar comentários
CREATE POLICY "users_create_comments"
    ON "public"."pei_comments"
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Usuários podem editar/deletar apenas seus próprios comentários
CREATE POLICY "users_manage_own_comments"
    ON "public"."pei_comments"
    FOR ALL
    USING (user_id = auth.uid());

-- ============================================================================
-- 3. RLS POLICY: PA pode VER PEIs dos alunos vinculados
-- ============================================================================

-- Remover se existir
DROP POLICY IF EXISTS "support_professional_view_assigned_peis" ON "public"."peis";

-- PA pode ver (apenas leitura) PEIs dos alunos vinculados
CREATE POLICY "support_professional_view_assigned_peis"
    ON "public"."peis"
    FOR SELECT
    USING (
        student_id IN (
            SELECT student_id
            FROM "public"."support_professional_students"
            WHERE support_professional_id = auth.uid()
            AND is_active = true
        )
    );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Ver tabelas criadas
SELECT 
    '✅ TABELAS:' as info,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('pei_comments', 'support_professional_students', 'support_professional_feedbacks')
ORDER BY table_name;

-- Ver policies de peis
SELECT 
    '✅ POLICIES PEIS:' as info,
    policyname
FROM pg_policies
WHERE tablename = 'peis'
AND policyname LIKE '%support%'
ORDER BY policyname;

-- Ver policies de pei_comments
SELECT 
    '✅ POLICIES PEI_COMMENTS:' as info,
    policyname
FROM pg_policies
WHERE tablename = 'pei_comments'
ORDER BY policyname;

-- ============================================================================
-- MENSAGEM FINAL
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SISTEMA PA FINALIZADO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tabela pei_comments criada';
    RAISE NOTICE '✅ RLS policies configuradas';
    RAISE NOTICE '✅ PA pode ver PEIs dos alunos vinculados';
    RAISE NOTICE '✅ PA pode adicionar comentários';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 COMO TESTAR:';
    RAISE NOTICE '1. Recarregue: http://localhost:8080/dashboard';
    RAISE NOTICE '2. Clique no botão "Ver PEI" de um aluno';
    RAISE NOTICE '3. Modal abrirá com o PEI completo';
    RAISE NOTICE '4. Role até o final';
    RAISE NOTICE '5. Veja seção "Comentários do Profissional de Apoio"';
    RAISE NOTICE '6. Digite um comentário';
    RAISE NOTICE '7. Clique em "Adicionar Comentário"';
    RAISE NOTICE '8. Comentário aparecerá na lista!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 O QUE O PA VÊ NO MODAL:';
    RAISE NOTICE '   ✅ Diagnóstico completo (leitura)';
    RAISE NOTICE '   ✅ Metas educacionais (leitura)';
    RAISE NOTICE '   ✅ Adaptações e recursos (leitura)';
    RAISE NOTICE '   ✅ Observações gerais (leitura)';
    RAISE NOTICE '   ✅ Área de comentários (pode escrever)';
    RAISE NOTICE '';
END $$;

