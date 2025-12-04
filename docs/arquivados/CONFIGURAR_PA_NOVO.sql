-- ============================================================================
-- CONFIGURAR NOVO PROFISSIONAL DE APOIO
-- ============================================================================
-- Execute APÓS criar o usuário no Dashboard do Supabase
-- ============================================================================

/*
INSTRUÇÕES ANTES DE EXECUTAR:
==============================

1. Acesse: Supabase Dashboard → Authentication → Users
2. Clique: "Add User"
3. Preencha:
   - Email: pa@escola.com
   - Password: Pa@123456
   - ☑️ Auto Confirm User (IMPORTANTE!)
4. Clique: "Create User"
5. COPIE o UUID do usuário criado
6. SUBSTITUA na linha 28 abaixo
7. Execute este SQL
*/

-- ============================================================================
-- CONFIGURAÇÃO DO PA
-- ============================================================================

DO $$
DECLARE
    -- ⚠️⚠️⚠️ COLE O UUID DO PA AQUI ⚠️⚠️⚠️
    v_pa_id uuid := 'COLE-UUID-AQUI'; 
    -- ⚠️⚠️⚠️ SUBSTITUA ACIMA! ⚠️⚠️⚠️
    
    v_student_count integer := 0;
    v_feedback_count integer := 0;
    v_director_id uuid;
BEGIN
    -- Validar UUID
    IF v_pa_id = 'COLE-UUID-AQUI' OR v_pa_id = '00000000-0000-0000-0000-000000000000' THEN
        RAISE EXCEPTION '⚠️ Por favor, substitua o UUID na linha 28!';
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

    -- Vincular PA a 3 alunos (carga realista de trabalho)
    FOR v_student IN (
        SELECT id, name, class_name
        FROM students
        WHERE is_active = true
        ORDER BY random()
        LIMIT 3
    ) LOOP
        -- Vincular aluno
        INSERT INTO support_professional_students (
            support_professional_id,
            student_id,
            assigned_by,
            notes
        )
        VALUES (
            v_pa_id,
            v_student.id,
            v_director_id,
            'Aluno necessita apoio para desenvolvimento de autonomia e habilidades sociais. ' ||
            'PA responsável por acompanhar atividades de vida diária e funcionais no ambiente escolar.'
        );

        v_student_count := v_student_count + 1;

        -- Criar 10 feedbacks (últimos 10 dias úteis)
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
                v_student.id,
                v_pa_id,
                CURRENT_DATE - i,
                2 + floor(random() * 4)::int, -- Score 2-5
                2 + floor(random() * 4)::int,
                2 + floor(random() * 4)::int,
                CASE 
                    WHEN i <= 3 THEN 'Acompanhamento nas atividades de higiene e alimentação. Aluno demonstrando maior autonomia.'
                    WHEN i <= 6 THEN 'Apoio nas atividades de locomoção e organização de materiais. Boa socialização com colegas.'
                    ELSE 'Auxílio em atividades funcionais. Aluno participativo e colaborativo.'
                END
            );
            
            v_feedback_count := v_feedback_count + 1;
        END LOOP;

        RAISE NOTICE '✅ Aluno vinculado: % (%) - 10 feedbacks criados', v_student.name, v_student.class_name;
    END LOOP;

    -- Mensagem final
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅✅✅ PA CRIADO COM SUCESSO! ✅✅✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '👤 PERFIL DO PROFISSIONAL DE APOIO:';
    RAISE NOTICE '   Nome: Maria Santos';
    RAISE NOTICE '   Função: Profissional de Apoio';
    RAISE NOTICE '   Descrição: Auxiliar na autonomia do estudante,';
    RAISE NOTICE '              acompanhando em atividades de vida diária';
    RAISE NOTICE '              e atividades funcionais no ambiente escolar';
    RAISE NOTICE '';
    RAISE NOTICE '📧 CREDENCIAIS DE LOGIN:';
    RAISE NOTICE '   Email: pa@escola.com';
    RAISE NOTICE '   Senha: Pa@123456';
    RAISE NOTICE '   URL: http://localhost:8080/login';
    RAISE NOTICE '';
    RAISE NOTICE '👦 ALUNOS SOB ACOMPANHAMENTO:';
    RAISE NOTICE '   Quantidade: %', v_student_count;
    RAISE NOTICE '   Feedbacks por aluno: 10';
    RAISE NOTICE '   Total de feedbacks: %', v_feedback_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 COMPETÊNCIAS DO PA:';
    RAISE NOTICE '   ✅ Acompanhamento individual';
    RAISE NOTICE '   ✅ Auxílio em atividades de vida diária';
    RAISE NOTICE '   ✅ Apoio em atividades funcionais';
    RAISE NOTICE '   ✅ Registro de feedbacks diários sobre:';
    RAISE NOTICE '      • Socialização (interação com colegas)';
    RAISE NOTICE '      • Autonomia (independência em tarefas)';
    RAISE NOTICE '      • Comportamento (adaptação ao ambiente)';
    RAISE NOTICE '';
    RAISE NOTICE '📊 DASHBOARD DO PA:';
    RAISE NOTICE '   Após login, será redirecionado para:';
    RAISE NOTICE '   http://localhost:8080/dashboard';
    RAISE NOTICE '   (Dashboard específico do PA aparecerá automaticamente)';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Confirmar que PA foi criado corretamente
SELECT 
    '✅ PROFISSIONAL DE APOIO CONFIGURADO' as status,
    u.email as "Email de Login",
    p.full_name as "Nome Completo",
    ARRAY_AGG(DISTINCT ur.role) as "Roles (deve ter APENAS support_professional)",
    COUNT(DISTINCT sps.student_id) as "Alunos Vinculados",
    COUNT(spf.id) as "Total de Feedbacks"
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN support_professional_students sps ON sps.support_professional_id = u.id AND sps.is_active = true
LEFT JOIN support_professional_feedbacks spf ON spf.support_professional_id = u.id
WHERE u.email = 'pa@escola.com'
GROUP BY u.email, p.full_name;

-- Ver os 3 alunos vinculados
SELECT 
    '👦 ALUNOS SOB ACOMPANHAMENTO DO PA' as info,
    s.name as "Nome do Aluno",
    s.class_name as "Turma",
    sps.notes as "Observações da Vinculação",
    COUNT(spf.id) as "Feedbacks Registrados"
FROM support_professional_students sps
JOIN students s ON s.id = sps.student_id
JOIN auth.users u ON u.id = sps.support_professional_id
LEFT JOIN support_professional_feedbacks spf ON spf.student_id = s.id AND spf.support_professional_id = u.id
WHERE u.email = 'pa@escola.com'
AND sps.is_active = true
GROUP BY s.name, s.class_name, sps.notes
ORDER BY s.name;






