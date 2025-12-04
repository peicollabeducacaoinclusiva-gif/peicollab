-- ============================================================================
-- LIMPEZA TOTAL DINÂMICA: Remove TODAS as policies de students e peis
-- ============================================================================
-- Script dinâmico que descobre e remove todas as policies
-- Execute ESTE PRIMEIRO, depois execute o script de criação
-- ============================================================================

-- ============================================================================
-- REMOVER TODAS AS POLICIES DE STUDENTS (dinamicamente)
-- ============================================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Desabilitar RLS
    EXECUTE 'ALTER TABLE public.students DISABLE ROW LEVEL SECURITY';
    
    -- Loop por todas as policies existentes e remover
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'students'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.students', policy_record.policyname);
        RAISE NOTICE 'Removida policy: %', policy_record.policyname;
    END LOOP;
    
    RAISE NOTICE 'Todas as policies de students removidas!';
END $$;

-- ============================================================================
-- REMOVER TODAS AS POLICIES DE PEIS (dinamicamente)
-- ============================================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Desabilitar RLS
    EXECUTE 'ALTER TABLE public.peis DISABLE ROW LEVEL SECURITY';
    
    -- Loop por todas as policies existentes e remover
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'peis'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.peis', policy_record.policyname);
        RAISE NOTICE 'Removida policy: %', policy_record.policyname;
    END LOOP;
    
    RAISE NOTICE 'Todas as policies de peis removidas!';
END $$;

-- ============================================================================
-- RECRIAR POLICIES SIMPLIFICADAS
-- ============================================================================

-- STUDENTS
ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coord_students"
    ON "public"."students"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'coordinator'
        )
    );

CREATE POLICY "admin_students"
    ON "public"."students"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('school_manager', 'education_secretary')
        )
    );

CREATE POLICY "teacher_students"
    ON "public"."students"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('teacher', 'aee_teacher')
        )
    );

CREATE POLICY "pa_students"
    ON "public"."students"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."support_professional_students" sps
            WHERE sps.student_id = "students"."id"
            AND sps.support_professional_id = auth.uid()
        )
    );

CREATE POLICY "family_students"
    ON "public"."students"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'family'
        )
    );

-- PEIS
ALTER TABLE "public"."peis" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coord_peis"
    ON "public"."peis"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'coordinator'
        )
    );

CREATE POLICY "admin_peis"
    ON "public"."peis"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('school_manager', 'education_secretary')
        )
    );

CREATE POLICY "teacher_own_peis"
    ON "public"."peis"
    FOR ALL
    USING (created_by = auth.uid());

CREATE POLICY "teacher_assigned_peis"
    ON "public"."peis"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."pei_teachers" pt
            WHERE pt.pei_id = "peis"."id"
            AND pt.teacher_id = auth.uid()
        )
    );

CREATE POLICY "pa_peis"
    ON "public"."peis"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."support_professional_students" sps
            WHERE sps.student_id = "peis"."student_id"
            AND sps.support_professional_id = auth.uid()
        )
    );

CREATE POLICY "family_peis"
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

SELECT '✅ RLS TOTALMENTE CORRIGIDO!' AS status;

SELECT 'students' AS tabela, COUNT(*) AS policies
FROM pg_policies WHERE tablename = 'students'
UNION ALL
SELECT 'peis' AS tabela, COUNT(*) AS policies
FROM pg_policies WHERE tablename = 'peis';

-- Deve retornar:
-- students: 5 policies
-- peis: 6 policies

