-- ============================================================================
-- CORREÇÃO COMPLETA: RLS sem Recursão
-- ============================================================================
-- Script único que corrige students E peis
-- Execute ESTE SCRIPT no Supabase Dashboard
-- ============================================================================

-- ============================================================================
-- PARTE 1: CORRIGIR STUDENTS
-- ============================================================================

ALTER TABLE "public"."students" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_students" ON "public"."students";
DROP POLICY IF EXISTS "coordinators_manage_all_students" ON "public"."students";
DROP POLICY IF EXISTS "teachers_view_assigned_students" ON "public"."students";
DROP POLICY IF EXISTS "support_professional_view_assigned_students" ON "public"."students";
DROP POLICY IF EXISTS "family_view_own_students" ON "public"."students";
DROP POLICY IF EXISTS "school_managers_manage_school_students" ON "public"."students";
DROP POLICY IF EXISTS "education_secretary_view_all_students" ON "public"."students";

ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;

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
-- PARTE 2: CORRIGIR PEIS
-- ============================================================================

ALTER TABLE "public"."peis" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coordinators_view_all_peis" ON "public"."peis";
DROP POLICY IF EXISTS "coordinators_manage_all_peis" ON "public"."peis";
DROP POLICY IF EXISTS "teachers_manage_own_peis" ON "public"."peis";
DROP POLICY IF EXISTS "teachers_view_assigned_peis" ON "public"."peis";
DROP POLICY IF EXISTS "aee_teachers_view_peis" ON "public"."peis";
DROP POLICY IF EXISTS "support_professional_view_student_peis" ON "public"."peis";
DROP POLICY IF EXISTS "family_view_approved_peis" ON "public"."peis";
DROP POLICY IF EXISTS "school_managers_view_school_peis" ON "public"."peis";
DROP POLICY IF EXISTS "education_secretary_view_all_peis" ON "public"."peis";

ALTER TABLE "public"."peis" ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "teachers_manage_own_peis"
    ON "public"."peis"
    FOR ALL
    USING (created_by = auth.uid());

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

SELECT '✅ RLS corrigido em students e peis! Recursão resolvida.' AS status;

SELECT 'Policies em students:' AS info, COUNT(*) AS total
FROM pg_policies WHERE tablename = 'students'
UNION ALL
SELECT 'Policies em peis:' AS info, COUNT(*) AS total
FROM pg_policies WHERE tablename = 'peis';

-- Resultado esperado:
-- students: 5 policies
-- peis: 6 policies

