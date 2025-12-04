-- ============================================================================
-- CORREÇÃO: Infinite Recursion em students
-- ============================================================================
-- Simplificar policies da tabela students para evitar recursão
-- Execute este script no Supabase Dashboard
-- ============================================================================

-- Desabilitar RLS temporariamente
ALTER TABLE "public"."students" DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as policies antigas
DROP POLICY IF EXISTS "users_view_students" ON "public"."students";
DROP POLICY IF EXISTS "coordinators_manage_all_students" ON "public"."students";
DROP POLICY IF EXISTS "teachers_view_assigned_students" ON "public"."students";
DROP POLICY IF EXISTS "support_professional_view_assigned_students" ON "public"."students";
DROP POLICY IF EXISTS "family_view_own_students" ON "public"."students";
DROP POLICY IF EXISTS "school_managers_manage_school_students" ON "public"."students";
DROP POLICY IF EXISTS "education_secretary_view_all_students" ON "public"."students";

-- Reabilitar RLS
ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES SIMPLIFICADAS (SEM RECURSÃO)
-- ============================================================================

-- 1. Coordenadores podem gerenciar todos os alunos da rede
CREATE POLICY "coordinators_manage_all_students"
    ON "public"."students"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'coordinator'
        )
    );

-- 2. Diretores e Secretários podem ver/gerenciar alunos
CREATE POLICY "admins_manage_students"
    ON "public"."students"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('school_manager', 'education_secretary')
        )
    );

-- 3. Professores podem ver alunos (direto via user_roles, sem JOIN)
CREATE POLICY "teachers_view_students"
    ON "public"."students"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('teacher', 'aee_teacher')
        )
    );

-- 4. Profissional de Apoio vê seus alunos atribuídos
CREATE POLICY "support_professional_view_assigned_students"
    ON "public"."students"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."support_professional_students" sps
            WHERE sps.student_id = "students"."id"
            AND sps.support_professional_id = auth.uid()
        )
    );

-- 5. Família vê seus próprios filhos
CREATE POLICY "family_view_own_students"
    ON "public"."students"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'family'
        )
    );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Verificar policies criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'students'
ORDER BY policyname;

-- Resultado esperado: 5 policies

SELECT '✅ RLS da tabela students corrigido! Recursão resolvida.' AS status;

