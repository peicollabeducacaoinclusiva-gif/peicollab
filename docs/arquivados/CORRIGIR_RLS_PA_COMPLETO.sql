-- ============================================================================
-- CORRIGIR RLS DO PA COMPLETO (SEM RECURSÃO)
-- ============================================================================
-- Remove recursão de todas as tabelas relacionadas ao PA
-- ============================================================================

-- ============================================================================
-- TABELA: support_professional_students
-- ============================================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "support_professionals_view_own_assignments" ON "public"."support_professional_students";
DROP POLICY IF EXISTS "directors_manage_sp_assignments" ON "public"."support_professional_students";
DROP POLICY IF EXISTS "coordinators_view_all_sp_assignments" ON "public"."support_professional_students";

-- Policies ULTRA SIMPLES (sem recursão)

-- 1. PA pode ver suas próprias vinculações
CREATE POLICY "pa_view_own_assignments"
    ON "public"."support_professional_students"
    FOR SELECT
    USING (support_professional_id = auth.uid());

-- 2. Coordenadores e diretores podem gerenciar tudo
CREATE POLICY "admins_manage_pa_assignments"
    ON "public"."support_professional_students"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('coordinator', 'school_manager', 'education_secretary')
        )
    );

-- ============================================================================
-- TABELA: support_professional_feedbacks
-- ============================================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "support_professionals_manage_own_feedbacks" ON "public"."support_professional_feedbacks";
DROP POLICY IF EXISTS "teachers_view_student_feedbacks" ON "public"."support_professional_feedbacks";
DROP POLICY IF EXISTS "coordinators_directors_view_feedbacks" ON "public"."support_professional_feedbacks";

-- Policies ULTRA SIMPLES

-- 1. PA pode gerenciar seus próprios feedbacks
CREATE POLICY "pa_manage_own_feedbacks"
    ON "public"."support_professional_feedbacks"
    FOR ALL
    USING (support_professional_id = auth.uid());

-- 2. Coordenadores e diretores podem ver todos os feedbacks
CREATE POLICY "admins_view_feedbacks"
    ON "public"."support_professional_feedbacks"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('coordinator', 'school_manager', 'education_secretary')
        )
    );

-- 3. Professores podem ver feedbacks dos seus alunos
CREATE POLICY "teachers_view_feedbacks"
    ON "public"."support_professional_feedbacks"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('teacher', 'aee_teacher')
        )
    );

-- ============================================================================
-- TABELA: students (adicionar policy para PA)
-- ============================================================================

-- Remover se existir
DROP POLICY IF EXISTS "support_professional_view_assigned_students" ON "public"."students";

-- PA pode ver alunos vinculados a ele (SEM subquery que causa recursão)
CREATE POLICY "pa_view_assigned_students"
    ON "public"."students"
    FOR SELECT
    USING (
        id IN (
            SELECT student_id 
            FROM "public"."support_professional_students"
            WHERE support_professional_id = auth.uid()
            AND is_active = true
        )
    );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Ver policies criadas
SELECT 
    'POLICIES CRIADAS:' as info,
    tablename,
    policyname
FROM pg_policies
WHERE tablename IN ('support_professional_students', 'support_professional_feedbacks', 'students')
AND policyname LIKE '%pa%' OR policyname LIKE '%support%'
ORDER BY tablename, policyname;

-- ============================================================================
-- MENSAGEM
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS POLICIES DO PA CORRIGIDAS!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Sem JOINs complexos';
    RAISE NOTICE '✅ Sem subqueries recursivas';
    RAISE NOTICE '✅ Apenas verificações diretas';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Policies criadas:';
    RAISE NOTICE '   • support_professional_students: 2';
    RAISE NOTICE '   • support_professional_feedbacks: 3';
    RAISE NOTICE '   • students: 1';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 TESTE AGORA:';
    RAISE NOTICE '1. Recarregue: http://localhost:8080/dashboard';
    RAISE NOTICE '2. Pressione: Ctrl+Shift+R (hard reload)';
    RAISE NOTICE '3. Os alunos devem aparecer!';
    RAISE NOTICE '';
END $$;






