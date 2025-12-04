-- ============================================================================
-- 🎯 CRIAR PA - EXECUTE ESTE (VERSÃO FINAL)
-- ============================================================================
-- Execute TODO este bloco de uma vez no Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
    v_pa_id uuid;
    v_school_id uuid;
    v_tenant_id uuid;
    v_school_name text;
    v_director_id uuid;
    v_student_id uuid;
    v_student_name text;
    v_student_class text;
    v_count integer := 0;
BEGIN
    -- 1. Buscar usuário pa@escola.com
    SELECT id INTO v_pa_id
    FROM auth.users
    WHERE email = 'pa@escola.com';

    IF v_pa_id IS NULL THEN
        RAISE EXCEPTION '❌ Usuário pa@escola.com não encontrado! Crie primeiro no Dashboard: Authentication → Users → Add User';
    END IF;

    RAISE NOTICE '✅ Usuário encontrado: pa@escola.com';

    -- 2. Buscar primeira escola ativa
    SELECT id, tenant_id, school_name 
    INTO v_school_id, v_tenant_id, v_school_name
    FROM schools
    WHERE is_active = true
    LIMIT 1;

    IF v_school_id IS NULL THEN
        RAISE EXCEPTION '❌ Nenhuma escola ativa encontrada no sistema!';
    END IF;

    RAISE NOTICE '✅ Escola encontrada: %', v_school_name;

    -- 3. Criar/atualizar profile COM school_id e tenant_id
    INSERT INTO profiles (
        id, 
        full_name, 
        email, 
        role, 
        school_id, 
        tenant_id, 
        is_active
    )
    VALUES (
        v_pa_id,
        'Maria Santos - Profissional de Apoio',
        'pa@escola.com',
        'support_professional',
        v_school_id,
        v_tenant_id,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = 'Maria Santos - Profissional de Apoio',
        email = 'pa@escola.com',
        role = 'support_professional',
        school_id = EXCLUDED.school_id,
        tenant_id = EXCLUDED.tenant_id,
        is_active = true;

    RAISE NOTICE '✅ Profile criado (com escola vinculada)';

    -- 4. Adicionar role
    INSERT INTO user_roles (user_id, role)
    VALUES (v_pa_id, 'support_professional')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE '✅ Role adicionado';

    -- 5. Buscar diretor da mesma escola
    SELECT ur.user_id INTO v_director_id
    FROM user_roles ur
    JOIN profiles p ON p.id = ur.user_id
    WHERE ur.role IN ('coordinator', 'school_manager')
    AND p.school_id = v_school_id
    LIMIT 1;

    IF v_director_id IS NULL THEN
        -- Se não tem diretor, usar o PA mesmo
        v_director_id := v_pa_id;
    END IF;

    -- 6. Vincular PA a 3 alunos DA MESMA ESCOLA
    FOR v_student_id, v_student_name, v_student_class IN
        SELECT id, name, class_name
        FROM students
        WHERE is_active = true
        AND school_id = v_school_id
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
            'Profissional de Apoio responsável por auxiliar o aluno em atividades de vida diária (AVD) ' ||
            'e atividades funcionais, promovendo autonomia e socialização no ambiente escolar.'
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
                2 + floor(random() * 4)::int, -- Score entre 2-5
                2 + floor(random() * 4)::int,
                2 + floor(random() * 4)::int,
                CASE 
                    WHEN i <= 3 THEN 'Apoio em higiene pessoal e alimentação. Aluno demonstrando maior autonomia nas tarefas diárias.'
                    WHEN i <= 6 THEN 'Acompanhamento em locomoção e uso do banheiro. Boa interação social com colegas da turma.'
                    ELSE 'Auxílio na organização de materiais e atividades em sala. Aluno participativo e colaborativo.'
                END
            )
            ON CONFLICT (student_id, support_professional_id, feedback_date) DO NOTHING;
        END LOOP;

        v_count := v_count + 1;
        RAISE NOTICE '  ✅ Aluno %: % (%) - 10 feedbacks criados', v_count, v_student_name, v_student_class;
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
    RAISE NOTICE '';
    RAISE NOTICE '📧 CREDENCIAIS DE LOGIN:';
    RAISE NOTICE '   Email: pa@escola.com';
    RAISE NOTICE '   Senha: Pa@123456';
    RAISE NOTICE '';
    RAISE NOTICE '🏫 VINCULAÇÕES:';
    RAISE NOTICE '   Escola: %', v_school_name;
    RAISE NOTICE '   Alunos: %', v_count;
    RAISE NOTICE '   Feedbacks: %', v_count * 10;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 FUNÇÃO DO PA:';
    RAISE NOTICE '   ✅ Auxiliar aluno em atividades de vida diária (AVD)';
    RAISE NOTICE '   ✅ Apoiar em atividades funcionais no ambiente escolar';
    RAISE NOTICE '   ✅ Promover desenvolvimento de autonomia';
    RAISE NOTICE '   ✅ Facilitar socialização com colegas';
    RAISE NOTICE '   ✅ Registrar feedbacks diários sobre:';
    RAISE NOTICE '      • Socialização (1-5): interação com colegas';
    RAISE NOTICE '      • Autonomia (1-5): independência em tarefas';
    RAISE NOTICE '      • Comportamento (1-5): adaptação ao ambiente';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 COMO TESTAR AGORA:';
    RAISE NOTICE '1. Acesse: http://localhost:8080';
    RAISE NOTICE '2. Clique em "Sair" (se logado)';
    RAISE NOTICE '3. Clique em "Entrar"';
    RAISE NOTICE '4. Email: pa@escola.com';
    RAISE NOTICE '5. Senha: Pa@123456';
    RAISE NOTICE '6. Dashboard do PA aparecerá em /dashboard';
    RAISE NOTICE '7. Você verá % alunos vinculados', v_count;
    RAISE NOTICE '8. Selecione um aluno e clique em "Histórico"';
    RAISE NOTICE '9. Veja o gráfico de evolução com % feedbacks!', v_count * 10;
    RAISE NOTICE '';
END $$;

