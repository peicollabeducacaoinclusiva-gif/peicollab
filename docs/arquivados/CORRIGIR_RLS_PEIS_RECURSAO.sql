-- ============================================================================
-- CORREÇÃO: Infinite Recursion em peis
-- ============================================================================
-- Simplificar policies da tabela peis para evitar recursão
-- Execute este script no Supabase Dashboard após CORRIGIR_RLS_STUDENTS_RECURSAO.sql
-- ============================================================================

-- Desabilitar RLS temporariamente
ALTER TABLE "public"."peis" DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as policies antigas
DROP POLICY IF EXISTS "coordinators_view_all_peis" ON "public"."peis";
DROP POLICY IF EXISTS "coordinators_manage_all_peis" ON "public"."peis";
DROP POLICY IF EXISTS "teachers_manage_own_peis" ON "public"."peis";
DROP POLICY IF EXISTS "teachers_view_assigned_peis" ON "public"."peis";
DROP POLICY IF EXISTS "aee_teachers_view_peis" ON "public"."peis";
DROP POLICY IF EXISTS "support_professional_view_student_peis" ON "public"."peis";
DROP POLICY IF EXISTS "family_view_approved_peis" ON "public"."peis";
DROP POLICY IF EXISTS "school_managers_view_school_peis" ON "public"."peis";
DROP POLICY IF EXISTS "education_secretary_view_all_peis" ON "public"."peis";

-- Reabilitar RLS
ALTER TABLE "public"."peis" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES SIMPLIFICADAS (SEM RECURSÃO)
-- ============================================================================

-- 1. Coordenadores podem gerenciar todos os PEIs
CREATE POLICY "coordinators_manage_all_peis"
    ON "public"."peis"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'coordinator'
        )
    );

-- 2. Diretores e Secretários podem gerenciar
CREATE POLICY "admins_manage_peis"
    ON "public"."peis"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('school_manager', 'education_secretary')
        )
    );

-- 3. Professores podem gerenciar PEIs que criaram
CREATE POLICY "teachers_manage_own_peis"
    ON "public"."peis"
    FOR ALL
    USING (
        created_by = auth.uid()
    );

-- 4. Professores podem ver PEIs onde estão atribuídos
CREATE POLICY "teachers_view_assigned_peis"
    ON "public"."peis"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."pei_teachers" pt
            WHERE pt.pei_id = "peis"."id"
            AND pt.teacher_id = auth.uid()
        )
    );

-- 5. Profissional de Apoio vê PEIs dos seus alunos
CREATE POLICY "support_professional_view_peis"
    ON "public"."peis"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."support_professional_students" sps
            WHERE sps.student_id = "peis"."student_id"
            AND sps.support_professional_id = auth.uid()
        )
    );

-- 6. Família vê PEIs aprovados dos seus filhos
CREATE POLICY "family_view_approved_peis"
    ON "public"."peis"
    FOR SELECT
    USING (
        status = 'approved'
        AND EXISTS (
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
WHERE tablename = 'peis'
ORDER BY policyname;

-- Resultado esperado: 6 policies

SELECT '✅ RLS da tabela peis corrigido! Recursão resolvida.' AS status;

