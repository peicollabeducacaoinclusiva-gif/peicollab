-- ============================================================================
-- CRIAR PROFISSIONAL DE APOIO - pa@teste.com
-- ============================================================================
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- IMPORTANTE: A criação de usuário no auth.users requer privilégios especiais
-- Vamos usar uma abordagem alternativa:

-- OPÇÃO 1: Adicionar role a usuário existente
-- ============================================================================

-- Primeiro, vamos buscar um usuário teacher para adicionar o role de PA
DO $$
DECLARE
    v_user_id uuid;
    v_user_email text;
    v_student_id uuid;
    v_student_name text;
BEGIN
    -- Buscar primeiro professor disponível
    SELECT ur.user_id, u.email 
    INTO v_user_id, v_user_email
    FROM user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    WHERE ur.role = 'teacher'
    LIMIT 1;

    -- Se não encontrou professor, pegar qualquer usuário
    IF v_user_id IS NULL THEN
        SELECT id, email 
        INTO v_user_id, v_user_email
        FROM auth.users
        LIMIT 1;
    END IF;

    -- Adicionar role de PA (usuário pode ter múltiplos roles)
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'support_professional')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Buscar primeiro aluno ativo
    SELECT id, name 
    INTO v_student_id, v_student_name
    FROM students
    WHERE is_active = true
    LIMIT 1;

    -- Vincular PA ao aluno
    INSERT INTO support_professional_students (
        support_professional_id,
        student_id,
        assigned_by,
        notes
    )
    VALUES (
        v_user_id,
        v_student_id,
        v_user_id,
        'Vinculação de teste - criada automaticamente'
    )
    ON CONFLICT DO NOTHING;

    -- Criar feedbacks de exemplo (últimos 7 dias)
    INSERT INTO support_professional_feedbacks (
        student_id,
        support_professional_id,
        feedback_date,
        socialization_score,
        autonomy_score,
        behavior_score,
        comments
    )
    VALUES
        (v_student_id, v_user_id, CURRENT_DATE - 7, 3, 3, 4, 'Primeira semana - adaptação'),
        (v_student_id, v_user_id, CURRENT_DATE - 6, 3, 4, 4, 'Melhorou na autonomia'),
        (v_student_id, v_user_id, CURRENT_DATE - 5, 4, 4, 5, 'Excelente dia!'),
        (v_student_id, v_user_id, CURRENT_DATE - 4, 4, 4, 4, 'Mantendo o progresso'),
        (v_student_id, v_user_id, CURRENT_DATE - 3, 5, 5, 5, 'Melhor dia da semana'),
        (v_student_id, v_user_id, CURRENT_DATE - 2, 4, 4, 4, 'Bom desenvolvimento'),
        (v_student_id, v_user_id, CURRENT_DATE - 1, 4, 5, 5, 'Ótimo progresso')
    ON CONFLICT (student_id, support_professional_id, feedback_date) DO NOTHING;

    -- Mensagens de sucesso
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PROFISSIONAL DE APOIO CONFIGURADO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '👤 CREDENCIAIS DE LOGIN:';
    RAISE NOTICE '   Email: %', v_user_email;
    RAISE NOTICE '   Senha: (a mesma que este usuário já usa)';
    RAISE NOTICE '';
    RAISE NOTICE '👦 ALUNO VINCULADO:';
    RAISE NOTICE '   Nome: %', v_student_name;
    RAISE NOTICE '   ID: %', v_student_id;
    RAISE NOTICE '';
    RAISE NOTICE '📊 DADOS CRIADOS:';
    RAISE NOTICE '   ✅ Role support_professional adicionado';
    RAISE NOTICE '   ✅ 1 aluno vinculado';
    RAISE NOTICE '   ✅ 7 feedbacks de exemplo criados';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 COMO TESTAR:';
    RAISE NOTICE '1. Acesse: http://localhost:8080/login';
    RAISE NOTICE '2. Faça login com: %', v_user_email;
    RAISE NOTICE '3. O Dashboard do PA aparecerá automaticamente';
    RAISE NOTICE '4. Você verá:';
    RAISE NOTICE '   - Card: 1 aluno atribuído';
    RAISE NOTICE '   - Card: 7 feedbacks registrados';
    RAISE NOTICE '   - Card do aluno: %', v_student_name;
    RAISE NOTICE '   - Gráfico com evolução dos últimos 7 dias';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Clique no aluno e depois na aba "Histórico"';
    RAISE NOTICE '🎯 Você verá o gráfico de evolução funcionando!';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Listar todos os PAs configurados
SELECT 
    u.email as "Email de Login",
    p.full_name as "Nome Completo",
    COUNT(DISTINCT sps.student_id) as "Alunos Vinculados",
    COUNT(spf.id) as "Feedbacks Registrados"
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN support_professional_students sps ON sps.support_professional_id = u.id AND sps.is_active = true
LEFT JOIN support_professional_feedbacks spf ON spf.support_professional_id = u.id
WHERE ur.role = 'support_professional'
GROUP BY u.email, p.full_name;

-- ============================================================================
-- INSTRUÇÕES FINAIS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Copie o email mostrado acima';
    RAISE NOTICE '2. Acesse: http://localhost:8080';
    RAISE NOTICE '3. Clique em "Sair" (se estiver logado)';
    RAISE NOTICE '4. Faça login com o email copiado';
    RAISE NOTICE '5. Dashboard do PA aparecerá!';
    RAISE NOTICE '';
END $$;

