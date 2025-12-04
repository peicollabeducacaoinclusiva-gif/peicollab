-- ============================================================================
-- CRIAR PA FINAL (COM CAMPO ROLE)
-- ============================================================================
-- Execute APÓS criar usuário pa@escola.com no Dashboard
-- ============================================================================

DO $$
DECLARE
    v_pa_id uuid;
    v_director_id uuid;
    v_student_id uuid;
    v_student_name text;
    v_student_class text;
    v_count integer := 0;
BEGIN
    -- Buscar usuário pelo email
    SELECT id INTO v_pa_id
    FROM auth.users
    WHERE email = 'pa@escola.com';

    IF v_pa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário pa@escola.com não encontrado! Crie primeiro no Dashboard (Authentication → Users → Add User)';
    END IF;

    RAISE NOTICE '✅ Usuário encontrado: pa@escola.com';

    -- Criar profile COM CAMPO ROLE
    INSERT INTO profiles (id, full_name, email, role, is_active)
    VALUES (
        v_pa_id,
        'Maria Santos - Profissional de Apoio',
        'pa@escola.com',
        'support_professional', -- ⭐ Campo obrigatório!
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = 'Maria Santos - Profissional de Apoio',
        email = 'pa@escola.com',
        role = 'support_professional',
        is_active = true;

    RAISE NOTICE '✅ Profile criado';

    -- Adicionar na tabela user_roles também
    INSERT INTO user_roles (user_id, role)
    VALUES (v_pa_id, 'support_professional')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE '✅ Role adicionado';

    -- Buscar diretor para atribuição
    SELECT user_id INTO v_director_id
    FROM user_roles
    WHERE role IN ('coordinator', 'school_manager')
    LIMIT 1;

    IF v_director_id IS NULL THEN
        v_director_id := v_pa_id;
    END IF;

    -- Vincular PA a 3 alunos e criar feedbacks
    FOR v_student_id, v_student_name, v_student_class IN
        SELECT id, name, class_name
        FROM students
        WHERE is_active = true
        ORDER BY random()
        LIMIT 3
    LOOP
        -- Vincular aluno ao PA
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
            'promovendo autonomia e socialização no ambiente escolar.'
        )
        ON CONFLICT DO NOTHING;

        -- Criar 10 feedbacks (últimos 10 dias)
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
                    WHEN i <= 3 THEN 'Apoio em higiene e alimentação. Aluno demonstrando maior autonomia nas tarefas diárias.'
                    WHEN i <= 6 THEN 'Acompanhamento em locomoção e uso do banheiro. Boa socialização com colegas da turma.'
                    ELSE 'Auxílio na organização de materiais escolares e atividades funcionais. Aluno participativo e colaborativo.'
                END
            )
            ON CONFLICT (student_id, support_professional_id, feedback_date) DO NOTHING;
        END LOOP;

        v_count := v_count + 1;
        RAISE NOTICE '  ✅ Aluno vinculado: % (%) - 10 feedbacks criados', v_student_name, v_student_class;
    END LOOP;

    -- Mensagem final
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅✅✅ PA CRIADO COM SUCESSO! ✅✅✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '👤 PROFISSIONAL DE APOIO:';
    RAISE NOTICE '   Nome: Maria Santos';
    RAISE NOTICE '   Função: Profissional de Apoio (EXCLUSIVA)';
    RAISE NOTICE '   Role: support_professional';
    RAISE NOTICE '';
    RAISE NOTICE '📧 CREDENCIAIS DE LOGIN:';
    RAISE NOTICE '   Email: pa@escola.com';
    RAISE NOTICE '   Senha: Pa@123456';
    RAISE NOTICE '   URL: http://localhost:8080/login';
    RAISE NOTICE '';
    RAISE NOTICE '👦 ALUNOS SOB ACOMPANHAMENTO:';
    RAISE NOTICE '   Quantidade: %', v_count;
    RAISE NOTICE '   Feedbacks por aluno: 10';
    RAISE NOTICE '   Total de feedbacks: %', v_count * 10;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 FUNÇÃO DO PA NO SISTEMA:';
    RAISE NOTICE '   ✅ Auxiliar na autonomia do estudante';
    RAISE NOTICE '   ✅ Acompanhar atividades de vida diária (AVD)';
    RAISE NOTICE '   ✅ Apoiar atividades funcionais no ambiente escolar';
    RAISE NOTICE '   ✅ Promover desenvolvimento de habilidades sociais';
    RAISE NOTICE '   ✅ Registrar feedbacks diários sobre:';
    RAISE NOTICE '      • Socialização (interação com colegas) - 1 a 5';
    RAISE NOTICE '      • Autonomia (independência em tarefas) - 1 a 5';
    RAISE NOTICE '      • Comportamento (adaptação ao ambiente) - 1 a 5';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 COMO TESTAR:';
    RAISE NOTICE '1. Acesse: http://localhost:8080';
    RAISE NOTICE '2. Clique em "Sair" (se estiver logado)';
    RAISE NOTICE '3. Clique em "Entrar"';
    RAISE NOTICE '4. Email: pa@escola.com';
    RAISE NOTICE '5. Senha: Pa@123456';
    RAISE NOTICE '6. Dashboard do PA aparecerá automaticamente em /dashboard';
    RAISE NOTICE '7. Você verá:';
    RAISE NOTICE '   - Título: "Dashboard do Profissional de Apoio"';
    RAISE NOTICE '   - Cards com: % alunos, % feedbacks', v_count, v_count * 10;
    RAISE NOTICE '   - % cards de alunos vinculados', v_count;
    RAISE NOTICE '8. Clique em um aluno';
    RAISE NOTICE '9. Clique na aba "Histórico"';
    RAISE NOTICE '10. Veja o gráfico de evolução com 10 feedbacks!';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Confirmar criação
SELECT 
    '✅ PROFISSIONAL DE APOIO' as status,
    u.email as "Email de Login",
    p.full_name as "Nome Completo",
    p.role as "Role no Profile",
    ARRAY_AGG(DISTINCT ur.role) as "Roles na Tabela user_roles",
    COUNT(DISTINCT sps.student_id) as "Alunos Vinculados",
    COUNT(spf.id) as "Total de Feedbacks"
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN support_professional_students sps ON sps.support_professional_id = u.id AND sps.is_active = true
LEFT JOIN support_professional_feedbacks spf ON spf.support_professional_id = u.id
WHERE u.email = 'pa@escola.com'
GROUP BY u.email, p.full_name, p.role;

-- Ver alunos vinculados
SELECT 
    '👦 ALUNOS DO PA' as info,
    s.name as "Nome do Aluno",
    s.class_name as "Turma",
    COUNT(spf.id) as "Feedbacks Registrados"
FROM support_professional_students sps
JOIN students s ON s.id = sps.student_id
JOIN auth.users u ON u.id = sps.support_professional_id
LEFT JOIN support_professional_feedbacks spf ON spf.student_id = s.id AND spf.support_professional_id = u.id
WHERE u.email = 'pa@escola.com'
AND sps.is_active = true
GROUP BY s.name, s.class_name
ORDER BY s.name;






