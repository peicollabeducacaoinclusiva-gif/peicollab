-- ============================================================================
-- ADICIONAR RLS POLICY PARA PA VER PEIs
-- ============================================================================
-- PA precisa poder visualizar (apenas leitura) os PEIs dos alunos vinculados
-- ============================================================================

-- Remover se existir
DROP POLICY IF EXISTS "support_professional_view_assigned_peis" ON "public"."peis";

-- PA pode VER (SELECT apenas) PEIs dos alunos vinculados
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

-- Ver se o PEI da Fernanda existe
SELECT 
    '📄 PEI DA FERNANDA:' as info,
    p.id as pei_id,
    s.name as aluna,
    s.class_name as turma,
    p.status,
    p.created_at
FROM peis p
JOIN students s ON s.id = p.student_id
WHERE s.name ILIKE '%Fernanda%'
OR s.class_name = '3º Ano B'
ORDER BY p.created_at DESC
LIMIT 1;

-- Ver se PA pode acessar
SELECT 
    '🔐 PA PODE VER ESTE PEI?' as info,
    p.id as pei_id,
    s.name as aluna,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM support_professional_students sps
            WHERE sps.student_id = s.id
            AND sps.support_professional_id = (SELECT id FROM auth.users WHERE email = 'pa@escola.com')
            AND sps.is_active = true
        ) THEN '✅ SIM - PA está vinculado'
        ELSE '❌ NÃO - PA não está vinculado'
    END as pode_acessar
FROM peis p
JOIN students s ON s.id = p.student_id
WHERE s.name ILIKE '%Fernanda%'
LIMIT 1;

-- Ver todas as policies de peis
SELECT 
    'RLS POLICIES DE PEIS:' as info,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'peis'
ORDER BY policyname;

-- ============================================================================
-- MENSAGEM
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Policy RLS adicionada: PA pode ver PEIs dos alunos vinculados';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 TESTE AGORA:';
    RAISE NOTICE '1. Recarregue: http://localhost:8080/dashboard';
    RAISE NOTICE '2. Clique no card da Fernanda';
    RAISE NOTICE '3. Clique em "Ver PEI"';
    RAISE NOTICE '4. O PEI deve abrir corretamente!';
    RAISE NOTICE '';
END $$;

