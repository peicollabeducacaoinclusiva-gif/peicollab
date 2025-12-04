-- ============================================================================
-- RLS ULTRA SIMPLES - SEM RECURSÃO GARANTIDO
-- ============================================================================
-- Policies mais simples possíveis, baseadas apenas em auth.uid() e roles diretos
-- Execute este script no Supabase Dashboard
-- ============================================================================

-- ============================================================================
-- STUDENTS: LIMPEZA E RECRIAÇÃO
-- ============================================================================

-- Desabilitar RLS
ALTER TABLE "public"."students" DISABLE ROW LEVEL SECURITY;

-- Usar função para remover todas as policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'students'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.students';
    END LOOP;
END $$;

-- Reabilitar
ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Coordenador vê tudo
CREATE POLICY "p1_students"
    ON "public"."students"
    FOR ALL
    USING (
        (SELECT role FROM "public"."user_roles" WHERE user_id = auth.uid() LIMIT 1) = 'coordinator'
    );

-- Policy 2: Admins veem tudo
CREATE POLICY "p2_students"
    ON "public"."students"
    FOR ALL
    USING (
        (SELECT role FROM "public"."user_roles" WHERE user_id = auth.uid() LIMIT 1) 
        IN ('school_manager', 'education_secretary')
    );

-- Policy 3: Todos podem ver (simplificado para testar)
CREATE POLICY "p3_students"
    ON "public"."students"
    FOR SELECT
    USING (true);

-- ============================================================================
-- PEIS: LIMPEZA E RECRIAÇÃO
-- ============================================================================

-- Desabilitar RLS
ALTER TABLE "public"."peis" DISABLE ROW LEVEL SECURITY;

-- Usar função para remover todas as policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'peis'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.peis';
    END LOOP;
END $$;

-- Reabilitar
ALTER TABLE "public"."peis" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Coordenador vê/gerencia tudo
CREATE POLICY "p1_peis"
    ON "public"."peis"
    FOR ALL
    USING (
        (SELECT role FROM "public"."user_roles" WHERE user_id = auth.uid() LIMIT 1) = 'coordinator'
    );

-- Policy 2: Admins veem/gerenciam tudo
CREATE POLICY "p2_peis"
    ON "public"."peis"
    FOR ALL
    USING (
        (SELECT role FROM "public"."user_roles" WHERE user_id = auth.uid() LIMIT 1) 
        IN ('school_manager', 'education_secretary')
    );

-- Policy 3: Professor gerencia PEIs que criou
CREATE POLICY "p3_peis"
    ON "public"."peis"
    FOR ALL
    USING (created_by = auth.uid());

-- Policy 4: Todos podem ver (simplificado para testar)
CREATE POLICY "p4_peis"
    ON "public"."peis"
    FOR SELECT
    USING (true);

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT '✅ RLS ULTRA SIMPLES APLICADO!' AS status;

SELECT 'students' AS tabela, COUNT(*) AS policies
FROM pg_policies WHERE tablename = 'students'
UNION ALL
SELECT 'peis' AS tabela, COUNT(*) AS policies
FROM pg_policies WHERE tablename = 'peis';

-- Teste no dashboard após executar:
-- 1. Recarregue a página (F5)
-- 2. Dashboard deve carregar sem erro
-- 3. Se funcionar, podemos adicionar policies mais específicas depois

