-- ============================================================================
-- CRIAR PA AUTOMÁTICO - Execute TODO este script de uma vez
-- ============================================================================
-- Este script pega automaticamente um usuário e aluno e cria o PA
-- ============================================================================

DO $$
DECLARE
    v_user_id uuid;
    v_user_email text;
    v_student_id uuid;
    v_student_name text;
    v_coordinator_id uuid;
BEGIN
    -- 1. Buscar um coordenador ou professor para transformar em PA
    SELECT u.id, u.email INTO v_user_id, v_user_email
    FROM auth.users u
    JOIN user_roles ur ON ur.user_id = u.id
    WHERE ur.role IN ('teacher', 'coordinator')
    LIMIT 1;

    -- Se não encontrou, pegar qualquer usuário
    IF v_user_id IS NULL THEN
        SELECT id, email INTO v_user_id, v_user_email
        FROM auth.users
        LIMIT 1;
    END IF;

    -- 2. Adicionar role de PA
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'support_professional')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. Buscar um aluno ativo
    SELECT id, name INTO v_student_id, v_student_name
    FROM students
    WHERE is_active = true
    LIMIT 1;

    -- 4. Buscar um coordenador para ser o "assigned_by"
    SELECT user_id INTO v_coordinator_id
    FROM user_roles
    WHERE role = 'coordinator'
    LIMIT 1;

    -- Se não tem coordenador, usar o próprio PA
    IF v_coordinator_id IS NULL THEN
        v_coordinator_id := v_user_id;
    END IF;

    -- 5. Vincular PA ao aluno
    INSERT INTO support_professional_students (
        support_professional_id,
        student_id,
        assigned_by,
        notes
    )
    VALUES (
        v_user_id,
        v_student_id,
        v_coordinator_id,
        'Vinculação automática para teste - ' || CURRENT_TIMESTAMP
    )
    ON CONFLICT (support_professional_id, student_id, is_active) DO NOTHING;

    -- 6. Criar alguns feedbacks de exemplo
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
        (v_student_id, v_user_id, CURRENT_DATE - INTERVAL '7 days', 3, 4, 3, 'Feedback de teste - semana passada'),
        (v_student_id, v_user_id, CURRENT_DATE - INTERVAL '6 days', 4, 4, 4, 'Aluno mostrou melhora'),
        (v_student_id, v_user_id, CURRENT_DATE - INTERVAL '5 days', 4, 5, 4, 'Excelente dia'),
        (v_student_id, v_user_id, CURRENT_DATE - INTERVAL '4 days', 3, 4, 3, 'Dia regular'),
        (v_student_id, v_user_id, CURRENT_DATE - INTERVAL '3 days', 5, 5, 5, 'Melhor dia da semana!'),
        (v_student_id, v_user_id, CURRENT_DATE - INTERVAL '2 days', 4, 4, 4, 'Mantendo o progresso'),
        (v_student_id, v_user_id, CURRENT_DATE - INTERVAL '1 day', 4, 5, 4, 'Muito bom')
    ON CONFLICT (student_id, support_professional_id, feedback_date) DO NOTHING;

    -- 7. Mensagens de confirmação
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PROFISSIONAL DE APOIO CRIADO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '👤 CREDENCIAIS:';
    RAISE NOTICE '   Email: %', v_user_email;
    RAISE NOTICE '   Senha: (a mesma que já usa)';
    RAISE NOTICE '';
    RAISE NOTICE '👦 ALUNO VINCULADO:';
    RAISE NOTICE '   Nome: %', v_student_name;
    RAISE NOTICE '';
    RAISE NOTICE '📊 DADOS DE TESTE:';
    RAISE NOTICE '   ✅ 7 feedbacks criados';
    RAISE NOTICE '   ✅ Últimos 7 dias';
    RAISE NOTICE '   ✅ Scores variando de 3-5';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 COMO TESTAR:';
    RAISE NOTICE '1. Faça login com: %', v_user_email;
    RAISE NOTICE '2. Dashboard do PA aparecerá automaticamente';
    RAISE NOTICE '3. Você verá o aluno vinculado: %', v_student_name;
    RAISE NOTICE '4. Selecione o aluno';
    RAISE NOTICE '5. Veja o histórico com 7 feedbacks';
    RAISE NOTICE '6. Registre um novo feedback';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 URL: http://localhost:8080';
    RAISE NOTICE '';
END $$;






