-- ============================================================================
-- CORREÇÃO: Remover role de PA dos coordenadores
-- ============================================================================
-- PA e Coordenador são funções DISTINTAS e não devem ser acumuladas
-- ============================================================================

-- PASSO 1: LIMPAR roles de PA incorretos
DELETE FROM user_roles
WHERE role = 'support_professional'
AND user_id IN (
    SELECT user_id FROM user_roles
    WHERE role IN ('coordinator', 'education_secretary', 'school_manager')
);

-- PASSO 2: LIMPAR vinculações e feedbacks incorretos
DELETE FROM support_professional_students
WHERE support_professional_id IN (
    SELECT user_id FROM user_roles
    WHERE role IN ('coordinator', 'education_secretary', 'school_manager')
);

DELETE FROM support_professional_feedbacks
WHERE support_professional_id IN (
    SELECT user_id FROM user_roles
    WHERE role IN ('coordinator', 'education_secretary', 'school_manager')
);

-- Verificar limpeza
SELECT 
    'APÓS LIMPEZA - PAs Restantes:' as status,
    u.email,
    ur.role
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'support_professional';

-- Deve retornar 0 linhas agora

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Roles de PA incorretos removidos';
    RAISE NOTICE '✅ Coordenadores voltaram a ser apenas coordenadores';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximo passo:';
    RAISE NOTICE 'Execute: CRIAR_PA_DEDICADO.sql';
    RAISE NOTICE '';
END $$;






