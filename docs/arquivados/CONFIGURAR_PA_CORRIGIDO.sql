-- ============================================================================
-- CONFIGURAR PROFISSIONAL DE APOIO (SINTAXE CORRIGIDA)
-- ============================================================================
-- Execute APÓS criar o usuário pa@escola.com no Dashboard
-- ============================================================================

DO $$
DECLARE
    -- ⚠️ COLE O UUID DO PA AQUI:
    v_pa_id uuid := 'COLE-O-UUID-DO-PA-AQUI';
    
    v_director_id uuid;
    v_student_id uuid;
    v_student_name text;
    v_student_class text;
    v_aluno_count integer := 0;
    v_feedback_count integer := 0;
BEGIN
    -- Validar UUID
    IF v_pa_id::text = 'COLE-O-UUID-DO-PA-AQUI' THEN
        RAISE EXCEPTION '⚠️ Substitua o UUID na linha 11!';
    END IF;

    -- Criar profile do PA
    INSERT INTO profiles (id, full_name, email, is_active)
    VALUES (
        v_pa_id,
        'Maria Santos - Profissional de Apoio',
        'pa@escola.com',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = 'Maria Santos - Profissional de Apoio',
        email = 'pa@escola.com',
        is_active = true;

    -- Adicionar APENAS role de support_professional
    INSERT INTO user_roles (user_id, role)
    VALUES (v_pa_id, 'support_professional');

    -- Buscar diretor para atribuição
    SELECT user_id INTO v_director_id
    FROM user_roles
    WHERE role IN ('school_manager', 'coordinator')
    LIMIT 1;

    IF v_director_id IS NULL THEN
        v_director_id := v_pa_id;
    END IF;

    -- Loop para vincular 3 alunos
    FOR v_student_id, v_student_name, v_student_class IN
        SELECT id, name, class_name
        FROM students
        WHERE is_active = true
        ORDER BY random()
        LIMIT 3
    LOOP
        -- Vincular PA ao aluno
        INSERT INTO support_professional_students (
            support_professional_id,
            student_id,
            assigned_by,
            notes
        )
        VALUES (
            v_pa_id,
            v_student_id,
            v_director_id,
            'PA responsável por auxiliar o aluno em atividades de vida diária e funcionais, ' ||
            'promovendo desenvolvimento de autonomia e habilidades sociais no ambiente escolar.'
        );

        v_aluno_count := v_aluno_count + 1;

        -- Criar 10 feedbacks para este aluno (últimos 10 dias)
        FOR i IN 1..10 LOOP
            INSERT INTO support_professional_feedbacks (
                student_id,
                support_professional_id,
                feedback_date,
                socialization_score,
                autonomy_score,
                behavior_score,
                comments
            )
            VALUES (
                v_student_id,
                v_pa_id,
                CURRENT_DATE - i,
                2 + floor(random() * 4)::int, -- Score 2-5
                2 + floor(random() * 4)::int,
                2 + floor(random() * 4)::int,
                CASE 
                    WHEN i <= 3 THEN 'Apoio em atividades de higiene e alimentação. Aluno demonstrando progressos na autonomia.'
                    WHEN i <= 6 THEN 'Acompanhamento em locomoção e uso do banheiro. Boa interação com colegas.'
                    ELSE 'Auxílio na organização de materiais e atividades funcionais. Aluno participativo.'
                END
            );
            
            v_feedback_count := v_feedback_count + 1;
        END LOOP;

        RAISE NOTICE '✅ Aluno % vinculado: % (%) - 10 feedbacks criados', 
            v_aluno_count, v_student_name, v_student_class;
    END LOOP;

    -- Mensagem final detalhada
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅✅✅ PA CRIADO COM SUCESSO! ✅✅✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '👤 PROFISSIONAL DE APOIO:';
    RAISE NOTICE '   Nome: Maria Santos';
    RAISE NOTICE '   Função: Profissional de Apoio (EXCLUSIVA)';
    RAISE NOTICE '   Descrição: Auxiliar na autonomia do estudante';
    RAISE NOTICE '';
    RAISE NOTICE '📧 CREDENCIAIS DE LOGIN:';
    RAISE NOTICE '   Email: pa@escola.com';
    RAISE NOTICE '   Senha: Pa@123456';
    RAISE NOTICE '   URL: http://localhost:8080/login';
    RAISE NOTICE '';
    RAISE NOTICE '👦 ALUNOS SOB ACOMPANHAMENTO:';
    RAISE NOTICE '   Quantidade: %', v_aluno_count;
    RAISE NOTICE '   Feedbacks por aluno: 10';
    RAISE NOTICE '   Total de feedbacks: %', v_feedback_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 ATRIBUIÇÕES DO PA:';
    RAISE NOTICE '   ✅ Acompanhar alunos no ambiente escolar';
    RAISE NOTICE '   ✅ Auxiliar em atividades de vida diária (AVD)';
    RAISE NOTICE '   ✅ Apoiar atividades funcionais';
    RAISE NOTICE '   ✅ Promover desenvolvimento de autonomia';
    RAISE NOTICE '   ✅ Facilitar socialização';
    RAISE NOTICE '   ✅ Registrar feedbacks diários sobre:';
    RAISE NOTICE '      • Socialização (1-5)';
    RAISE NOTICE '      • Autonomia (1-5)';
    RAISE NOTICE '      • Comportamento (1-5)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 COMO TESTAR:';
    RAISE NOTICE '1. Acesse: http://localhost:8080/login';
    RAISE NOTICE '2. Login com: pa@escola.com / Pa@123456';
    RAISE NOTICE '3. Dashboard do PA aparecerá automaticamente';
    RAISE NOTICE '4. Selecione um dos % alunos vinculados', v_aluno_count;
    RAISE NOTICE '5. Veja histórico com % feedbacks', v_feedback_count;
    RAISE NOTICE '6. Registre novo feedback diário';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Ver PA criado
SELECT 
    '✅ PA CONFIGURADO' as status,
    u.email as "Email",
    p.full_name as "Nome",
    ARRAY_AGG(DISTINCT ur.role) as "Roles",
    COUNT(DISTINCT sps.student_id) as "Alunos",
    COUNT(spf.id) as "Feedbacks"
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN support_professional_students sps ON sps.support_professional_id = u.id AND sps.is_active = true
LEFT JOIN support_professional_feedbacks spf ON spf.support_professional_id = u.id
WHERE u.email = 'pa@escola.com'
GROUP BY u.email, p.full_name;






