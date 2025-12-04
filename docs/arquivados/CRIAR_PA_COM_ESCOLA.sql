-- ============================================================================
-- CRIAR PA COM ESCOLA E TENANT
-- ============================================================================
-- Execute APÓS criar usuário pa@escola.com no Dashboard
-- ============================================================================

DO $$
DECLARE
    v_pa_id uuid;
    v_school_id uuid;
    v_tenant_id uuid;
    v_director_id uuid;
    v_student_id uuid;
    v_student_name text;
    v_student_class text;
    v_count integer := 0;
BEGIN
    -- Buscar usuário
    SELECT id INTO v_pa_id
    FROM auth.users
    WHERE email = 'pa@escola.com';

    IF v_pa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário pa@escola.com não encontrado! Crie primeiro no Dashboard.';
    END IF;

    RAISE NOTICE '✅ Usuário encontrado';

    -- Buscar primeira escola ativa
    SELECT id, tenant_id INTO v_school_id, v_tenant_id
    FROM schools
    WHERE is_active = true
    LIMIT 1;

    IF v_school_id IS NULL THEN
        RAISE EXCEPTION 'Nenhuma escola ativa encontrada!';
    END IF;

    RAISE NOTICE '✅ Escola encontrada';

    -- Criar profile COM school_id e tenant_id
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

    RAISE NOTICE '✅ Profile criado com escola vinculada';

    -- Adicionar role na tabela user_roles
    INSERT INTO user_roles (user_id, role)
    VALUES (v_pa_id, 'support_professional')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE '✅ Role adicionado';

    -- Buscar diretor da mesma escola
    SELECT ur.user_id INTO v_director_id
    FROM user_roles ur
    JOIN profiles p ON p.id = ur.user_id
    WHERE ur.role IN ('coordinator', 'school_manager')
    AND p.school_id = v_school_id
    LIMIT 1;

    IF v_director_id IS NULL THEN
        v_director_id := v_pa_id;
    END IF;

    -- Vincular PA a 3 alunos DA MESMA ESCOLA
    FOR v_student_id, v_student_name, v_student_class IN
        SELECT id, name, class_name
        FROM students
        WHERE is_active = true
        AND school_id = v_school_id
        ORDER BY random()
        LIMIT 3
    LOOP
        -- Vincular aluno
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
            'e atividades funcionais no ambiente escolar, promovendo autonomia e socialização.'
        )
        ON CONFLICT DO NOTHING;

        -- Criar 10 feedbacks
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
                2 + floor(random() * 4)::int,
                2 + floor(random() * 4)::int,
                2 + floor(random() * 4)::int,
                CASE 
                    WHEN i <= 3 THEN 'Apoio em higiene pessoal e alimentação. Aluno demonstrando progressos na independência.'
                    WHEN i <= 6 THEN 'Acompanhamento em locomoção e uso do banheiro. Boa interação com colegas.'
                    ELSE 'Auxílio na organização de materiais e atividades em sala. Aluno participativo e colaborativo.'
                END
            )
            ON CONFLICT (student_id, support_professional_id, feedback_date) DO NOTHING;
        END LOOP;

        v_count := v_count + 1;
        RAISE NOTICE '  ✅ Aluno vinculado: % (%) - 10 feedbacks', v_student_name, v_student_class;
    END LOOP;

    -- Mensagem final
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅✅✅ PA CRIADO COM SUCESSO! ✅✅✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '👤 PROFISSIONAL DE APOIO:';
    RAISE NOTICE '   Nome: Maria Santos';
    RAISE NOTICE '   Email: pa@escola.com';
    RAISE NOTICE '   Senha: Pa@123456';
    RAISE NOTICE '   Função: Profissional de Apoio (EXCLUSIVA)';
    RAISE NOTICE '';
    RAISE NOTICE '🏫 VINCULAÇÃO:';
    RAISE NOTICE '   Escola: vinculado';
    RAISE NOTICE '   Rede: vinculado';
    RAISE NOTICE '   Alunos: %', v_count;
    RAISE NOTICE '   Feedbacks: %', v_count * 10;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 ATRIBUIÇÕES:';
    RAISE NOTICE '   ✅ Auxiliar em atividades de vida diária';
    RAISE NOTICE '   ✅ Apoiar atividades funcionais';
    RAISE NOTICE '   ✅ Promover autonomia';
    RAISE NOTICE '   ✅ Facilitar socialização';
    RAISE NOTICE '   ✅ Registrar feedbacks diários';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 TESTE AGORA:';
    RAISE NOTICE '1. http://localhost:8080/login';
    RAISE NOTICE '2. Email: pa@escola.com';
    RAISE NOTICE '3. Senha: Pa@123456';
    RAISE NOTICE '4. Dashboard do PA aparecerá!';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Confirmar PA criado com escola
SELECT 
    '✅ PA CONFIGURADO' as status,
    u.email as "Email",
    p.full_name as "Nome",
    p.role as "Role",
    s.school_name as "Escola",
    t.network_name as "Rede",
    COUNT(DISTINCT sps.student_id) as "Alunos",
    COUNT(spf.id) as "Feedbacks"
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN schools s ON s.id = p.school_id
LEFT JOIN tenants t ON t.id = p.tenant_id
JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN support_professional_students sps ON sps.support_professional_id = u.id AND sps.is_active = true
LEFT JOIN support_professional_feedbacks spf ON spf.support_professional_id = u.id
WHERE u.email = 'pa@escola.com'
AND ur.role = 'support_professional'
GROUP BY u.email, p.full_name, p.role, s.school_name, t.network_name;






