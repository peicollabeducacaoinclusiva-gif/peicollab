-- ============================================================================
-- CRIAR PA - SEM PRECISAR COLAR UUID
-- ============================================================================
-- Este script cria o PA usando a Supabase Admin API
-- ============================================================================

-- IMPORTANTE: Este método requer que você tenha permissões de admin
-- Se não funcionar, use o método manual descrito no final

-- ============================================================================
-- PASSO 1: Limpar configurações antigas
-- ============================================================================

DELETE FROM support_professional_feedbacks;
DELETE FROM support_professional_students;
DELETE FROM user_roles WHERE role = 'support_professional';

-- ============================================================================
-- PASSO 2: O usuário precisa ser criado pelo Dashboard
-- ============================================================================

/*
INSTRUÇÕES PARA CRIAR O USUÁRIO:

1. Abra outra aba do navegador
2. Acesse: Supabase Dashboard
3. Menu: Authentication → Users
4. Botão: "Add User" (verde, canto superior direito)
5. Preencha EXATAMENTE assim:
   ┌─────────────────────────────┐
   │ Email: pa@escola.com        │
   │ Password: Pa@123456         │
   │ ☑️ Auto Confirm User        │ ← IMPORTANTE!
   └─────────────────────────────┘
6. Clique: "Create User"
7. Aguarde criar
8. Você verá o usuário na lista

DEPOIS, volte aqui e execute o SQL abaixo:
*/

-- ============================================================================
-- PASSO 3: Configurar o PA (APÓS criar no dashboard)
-- ============================================================================

DO $$
DECLARE
    v_pa_id uuid;
    v_email text := 'pa@escola.com';
    v_director_id uuid;
    v_student_id uuid;
    v_student_name text;
    v_student_class text;
    v_contador integer := 0;
BEGIN
    -- Buscar o usuário que você acabou de criar
    SELECT id INTO v_pa_id
    FROM auth.users
    WHERE email = v_email;

    -- Validar se encontrou
    IF v_pa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário % não encontrado! Crie primeiro no Dashboard (Authentication → Users → Add User)', v_email;
    END IF;

    RAISE NOTICE '✅ Usuário encontrado: % (ID: %)', v_email, v_pa_id;

    -- Criar/atualizar profile
    INSERT INTO profiles (id, full_name, email, is_active)
    VALUES (
        v_pa_id,
        'Maria Santos - Profissional de Apoio',
        v_email,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = 'Maria Santos - Profissional de Apoio',
        email = EXCLUDED.email,
        is_active = true;

    RAISE NOTICE '✅ Profile criado';

    -- Adicionar role de PA
    INSERT INTO user_roles (user_id, role)
    VALUES (v_pa_id, 'support_professional')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE '✅ Role adicionado';

    -- Buscar diretor
    SELECT user_id INTO v_director_id
    FROM user_roles
    WHERE role IN ('coordinator', 'school_manager')
    LIMIT 1;

    IF v_director_id IS NULL THEN
        v_director_id := v_pa_id;
    END IF;

    -- Vincular a 3 alunos e criar feedbacks
    FOR v_student_id, v_student_name, v_student_class IN
        SELECT id, name, class_name
        FROM students
        WHERE is_active = true
        ORDER BY random()
        LIMIT 3
    LOOP
        -- Vincular
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
            'PA responsável por auxiliar em atividades de vida diária e funcionais'
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
                'Acompanhamento em AVD - dia ' || i
            )
            ON CONFLICT DO NOTHING;
        END LOOP;

        v_contador := v_contador + 1;
        RAISE NOTICE '✅ Aluno % vinculado: % (%)', v_contador, v_student_name, v_student_class;
    END LOOP;

    -- Mensagem final
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅✅✅ PA CONFIGURADO! ✅✅✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📧 CREDENCIAIS:';
    RAISE NOTICE '   Email: pa@escola.com';
    RAISE NOTICE '   Senha: Pa@123456';
    RAISE NOTICE '';
    RAISE NOTICE '👦 ALUNOS: %', v_contador;
    RAISE NOTICE '📊 FEEDBACKS: %', v_contador * 10;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 TESTE:';
    RAISE NOTICE '1. http://localhost:8080/login';
    RAISE NOTICE '2. Login: pa@escola.com / Pa@123456';
    RAISE NOTICE '3. Dashboard do PA aparece!';
    RAISE NOTICE '';
END $$;

