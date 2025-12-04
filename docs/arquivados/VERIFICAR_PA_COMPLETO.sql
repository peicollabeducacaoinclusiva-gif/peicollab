-- ============================================================================
-- VERIFICAR CONFIGURAÇÃO COMPLETA DO PA
-- ============================================================================
-- Execute para ver o que está acontecendo
-- ============================================================================

-- 1. Ver o PA criado
SELECT 
    '👤 PA CRIADO:' as info,
    u.id,
    u.email,
    p.full_name,
    p.school_id,
    p.tenant_id,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'pa@escola.com';

-- 2. Ver roles do PA
SELECT 
    '🔐 ROLES DO PA:' as info,
    role
FROM user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'pa@escola.com');

-- 3. Ver vinculações criadas
SELECT 
    '🔗 VINCULAÇÕES:' as info,
    sps.id,
    sps.support_professional_id,
    sps.student_id,
    sps.is_active,
    sps.notes
FROM support_professional_students sps
WHERE sps.support_professional_id = (SELECT id FROM auth.users WHERE email = 'pa@escola.com');

-- 4. Ver se os students existem
SELECT 
    '👦 ALUNOS VINCULADOS (DADOS):' as info,
    s.id,
    s.name,
    s.class_name,
    s.is_active,
    s.school_id
FROM support_professional_students sps
JOIN students s ON s.id = sps.student_id
WHERE sps.support_professional_id = (SELECT id FROM auth.users WHERE email = 'pa@escola.com')
AND sps.is_active = true;

-- 5. Ver feedbacks criados
SELECT 
    '📊 FEEDBACKS:' as info,
    COUNT(*) as total,
    MIN(feedback_date) as primeira_data,
    MAX(feedback_date) as ultima_data
FROM support_professional_feedbacks
WHERE support_professional_id = (SELECT id FROM auth.users WHERE email = 'pa@escola.com');

-- 6. Verificar RLS policies de students
SELECT 
    '🔒 RLS POLICIES STUDENTS:' as info,
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE tablename = 'students';

-- ============================================================================
-- MENSAGEM
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 Verifique os resultados acima:';
    RAISE NOTICE '1. PA existe?';
    RAISE NOTICE '2. PA tem school_id e tenant_id?';
    RAISE NOTICE '3. Vinculações existem?';
    RAISE NOTICE '4. Students aparecem na query 4?';
    RAISE NOTICE '5. Se students NÃO aparecem, o problema é RLS!';
    RAISE NOTICE '';
END $$;

