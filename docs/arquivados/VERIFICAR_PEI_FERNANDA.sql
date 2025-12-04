-- ============================================================================
-- VERIFICAR SE PEI DA FERNANDA FOI CRIADO
-- ============================================================================

-- 1. Ver se a aluna Fernanda existe
SELECT 
    '👧 ALUNA FERNANDA:' as info,
    id,
    name,
    class_name,
    is_active
FROM students
WHERE name ILIKE '%Fernanda%'
OR class_name = '3º Ano B'
LIMIT 5;

-- 2. Ver se PEI foi criado
SELECT 
    '📄 PEI CRIADO:' as info,
    p.id as pei_id,
    s.name as aluna,
    s.class_name as turma,
    p.status,
    p.created_at,
    p.diagnosis_data IS NOT NULL as tem_diagnostico,
    p.planning_data IS NOT NULL as tem_planejamento
FROM peis p
JOIN students s ON s.id = p.student_id
WHERE s.name ILIKE '%Fernanda%'
OR s.class_name = '3º Ano B'
ORDER BY p.created_at DESC
LIMIT 1;

-- 3. Ver se PA está vinculado à aluna
SELECT 
    '🔗 VINCULAÇÃO PA ↔ FERNANDA:' as info,
    sps.id,
    u.email as email_pa,
    s.name as aluna,
    sps.is_active,
    sps.notes
FROM support_professional_students sps
JOIN auth.users u ON u.id = sps.support_professional_id
JOIN students s ON s.id = sps.student_id
WHERE u.email = 'pa@escola.com'
AND s.name ILIKE '%Fernanda%'
LIMIT 1;

-- 4. Testar query que o componente faz
SELECT 
    '🔍 QUERY DO COMPONENTE (busca PEI):' as info,
    p.id as pei_id
FROM peis p
WHERE p.student_id IN (
    SELECT s.id FROM students s
    WHERE s.name ILIKE '%Fernanda%'
)
ORDER BY p.created_at DESC
LIMIT 1;

-- ============================================================================
-- INSTRUÇÕES
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 VERIFIQUE OS RESULTADOS ACIMA:';
    RAISE NOTICE '';
    RAISE NOTICE '1. A aluna Fernanda existe?';
    RAISE NOTICE '2. O PEI foi criado?';
    RAISE NOTICE '3. PA está vinculado à Fernanda?';
    RAISE NOTICE '4. A query do componente retorna o PEI?';
    RAISE NOTICE '';
    RAISE NOTICE 'Se algum retornar vazio, me informe qual!';
    RAISE NOTICE '';
END $$;

