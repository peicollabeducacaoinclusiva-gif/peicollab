-- ============================================================================
-- LIMPAR ROLES INCORRETOS E PREPARAR PARA PA DEDICADO
-- ============================================================================
-- adminsgc@teste.com = education_secretary (NÃO é PA!)
-- coordenador@teste.com = coordinator (NÃO é PA!)
-- PA deve ser um profissional DIFERENTE e DEDICADO
-- ============================================================================

-- PASSO 1: LIMPAR CONFIGURAÇÕES INCORRETAS
-- ============================================================================

-- Remover role de PA de TODOS os usuários atuais
DELETE FROM support_professional_feedbacks
WHERE support_professional_id IN (
    SELECT user_id FROM user_roles
    WHERE role = 'support_professional'
);

DELETE FROM support_professional_students
WHERE support_professional_id IN (
    SELECT user_id FROM user_roles
    WHERE role = 'support_professional'
);

DELETE FROM user_roles
WHERE role = 'support_professional';

-- Garantir que adminsgc@teste.com tem APENAS role correto
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'adminsgc@teste.com')
AND role != 'education_secretary';

-- Garantir role correto do adminsgc
INSERT INTO user_roles (user_id, role)
SELECT id, 'education_secretary'
FROM auth.users
WHERE email = 'adminsgc@teste.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar limpeza
SELECT 
    u.email,
    ARRAY_AGG(ur.role) as roles
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('adminsgc@teste.com', 'coordenador@teste.com')
GROUP BY u.email;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ROLES INCORRETOS REMOVIDOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ adminsgc@teste.com = education_secretary (correto!)';
    RAISE NOTICE '✅ coordenador@teste.com = coordinator (correto!)';
    RAISE NOTICE '✅ Roles de PA removidos de todos';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMO PASSO:';
    RAISE NOTICE '1. Criar NOVO usuário no Supabase Dashboard';
    RAISE NOTICE '2. Email sugerido: pa@escola.com';
    RAISE NOTICE '3. Senha sugerida: Pa@123456';
    RAISE NOTICE '4. Executar: CONFIGURAR_PA_NOVO.sql';
    RAISE NOTICE '';
END $$;

