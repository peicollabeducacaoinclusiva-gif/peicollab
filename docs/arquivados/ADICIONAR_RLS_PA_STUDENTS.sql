-- ============================================================================
-- ADICIONAR RLS POLICY PARA PA VER ALUNOS
-- ============================================================================
-- PA precisa poder ver os dados dos alunos vinculados a ele
-- ============================================================================

-- Criar policy para PA ver seus alunos
CREATE POLICY IF NOT EXISTS "support_professional_view_assigned_students"
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

-- Verificar policies criadas
SELECT 
    'RLS POLICIES DE STUDENTS:' as info,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'students'
ORDER BY policyname;

-- ============================================================================
-- MENSAGEM
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Policy RLS criada para PA ver alunos vinculados';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 TESTE AGORA:';
    RAISE NOTICE '1. Recarregue a página: http://localhost:8080/dashboard';
    RAISE NOTICE '2. Os alunos devem aparecer corretamente agora!';
    RAISE NOTICE '';
END $$;






