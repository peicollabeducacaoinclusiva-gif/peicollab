-- ============================================================================
-- ADICIONAR RLS POLICY PARA PA VER ALUNOS (SINTAXE CORRETA)
-- ============================================================================

-- Remover se existir
DROP POLICY IF EXISTS "support_professional_view_assigned_students" ON "public"."students";

-- Criar policy para PA ver seus alunos
CREATE POLICY "support_professional_view_assigned_students"
    ON "public"."students"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM "public"."support_professional_students" sps
            WHERE sps.student_id = "students"."id"
            AND sps.support_professional_id = auth.uid()
            AND sps.is_active = true
        )
    );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Ver todas as policies de students
SELECT 
    'RLS POLICIES DE STUDENTS:' as info,
    policyname
FROM pg_policies
WHERE tablename = 'students'
ORDER BY policyname;

-- Testar se PA consegue ver alunos
SELECT 
    'TESTE - O PA CONSEGUE VER ESTES ALUNOS:' as info,
    s.id,
    s.name,
    s.class_name
FROM students s
WHERE EXISTS (
    SELECT 1 
    FROM support_professional_students sps
    WHERE sps.student_id = s.id
    AND sps.support_professional_id = (SELECT id FROM auth.users WHERE email = 'pa@escola.com')
    AND sps.is_active = true
);

-- ============================================================================
-- MENSAGEM
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Policy RLS criada com sucesso!';
    RAISE NOTICE '✅ PA agora pode ver os alunos vinculados';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 TESTE AGORA:';
    RAISE NOTICE '1. Recarregue a página: http://localhost:8080/dashboard';
    RAISE NOTICE '2. Pressione Ctrl+R no navegador';
    RAISE NOTICE '3. Os alunos devem aparecer corretamente!';
    RAISE NOTICE '';
END $$;

