-- ============================================================================
-- CRIAR PROFISSIONAL DE APOIO DEDICADO
-- ============================================================================
-- PA é uma função ESPECÍFICA, distinta de professor, coordenador, etc.
-- ============================================================================

-- ============================================================================
-- INSTRUÇÕES PARA CRIAR USUÁRIO NO DASHBOARD
-- ============================================================================

/*
PASSO 1: Criar Usuário no Supabase Dashboard
============================================

1. Acesse: Supabase Dashboard
2. Menu: Authentication → Users
3. Botão: "Add User" (verde)
4. Preencha:
   - Email: pa@teste.com
   - Password: Pa@123456
   - ☑️ Auto Confirm User (MARCAR!)
5. Clique: "Create User"
6. COPIE o UUID do usuário criado

PASSO 2: Execute o SQL abaixo (substituindo o UUID)
*/

-- ============================================================================
-- SQL DE CONFIGURAÇÃO (Execute após criar o usuário)
-- ============================================================================

DO $$
DECLARE
    -- ⚠️ COLE O UUID DO USUÁRIO CRIADO AQUI:
    v_pa_id uuid := '00000000-0000-0000-0000-000000000000'; -- SUBSTITUA!
    
    v_student_id uuid;
    v_student_name text;
    v_director_id uuid;
    v_count integer := 0;
BEGIN
    -- Validar que o UUID foi substituído
    IF v_pa_id = '00000000-0000-0000-0000-000000000000' THEN
        RAISE EXCEPTION 'Por favor, substitua o UUID na variável v_pa_id!';
    END IF;

    -- Criar profile para o PA
    INSERT INTO profiles (id, full_name, email, is_active)
    VALUES (
        v_pa_id,
        'Profissional de Apoio - Maria Silva',
        'pa@teste.com',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = 'Profissional de Apoio - Maria Silva',
        email = 'pa@teste.com',
        is_active = true;

    -- Adicionar APENAS o role de support_professional
    INSERT INTO user_roles (user_id, role)
    VALUES (v_pa_id, 'support_professional')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Buscar um diretor para ser o "assigned_by"
    SELECT user_id INTO v_director_id
    FROM user_roles
    WHERE role IN ('school_manager', 'coordinator')
    LIMIT 1;

    -- Se não tem diretor, usar o próprio PA
    IF v_director_id IS NULL THEN
        v_director_id := v_pa_id;
    END IF;

    -- Vincular PA a 3 alunos diferentes (simulando carga real de trabalho)
    FOR v_student_record IN (
        SELECT id, name 
        FROM students 
        WHERE is_active = true 
        LIMIT 3
    ) LOOP
        v_student_id := v_student_record.id;
        v_student_name := v_student_record.name;
        
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
            'Aluno sob acompanhamento para desenvolvimento de autonomia e habilidades sociais'
        )
        ON CONFLICT DO NOTHING;

        -- Criar feedbacks dos últimos 7 dias
        FOR i IN 1..7 LOOP
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
                    WHEN i <= 2 THEN 'Acompanhamento recente - aluno demonstrando progresso'
                    WHEN i <= 4 THEN 'Auxiliando nas atividades de vida diária'
                    ELSE 'Apoio na socialização e autonomia'
                END
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        v_count := v_count + 1;
    END LOOP;

    -- Mensagem de sucesso
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PROFISSIONAL DE APOIO CRIADO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '👤 PERFIL:';
    RAISE NOTICE '   Nome: Maria Silva';
    RAISE NOTICE '   Função: Profissional de Apoio';
    RAISE NOTICE '   Role: support_professional APENAS';
    RAISE NOTICE '';
    RAISE NOTICE '📧 CREDENCIAIS:';
    RAISE NOTICE '   Email: pa@teste.com';
    RAISE NOTICE '   Senha: Pa@123456';
    RAISE NOTICE '';
    RAISE NOTICE '👦 ALUNOS SOB ACOMPANHAMENTO:';
    RAISE NOTICE '   Quantidade: %', v_count;
    RAISE NOTICE '   Feedbacks por aluno: 7';
    RAISE NOTICE '   Total de feedbacks: %', v_count * 7;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 FUNÇÃO DO PA:';
    RAISE NOTICE '   - Auxiliar na autonomia do estudante';
    RAISE NOTICE '   - Acompanhar atividades de vida diária';
    RAISE NOTICE '   - Apoiar atividades funcionais na escola';
    RAISE NOTICE '   - Registrar feedbacks diários';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 TESTE AGORA:';
    RAISE NOTICE '1. Acesse: http://localhost:8080/login';
    RAISE NOTICE '2. Login: pa@teste.com / Pa@123456';
    RAISE NOTICE '3. Dashboard do PA aparecerá';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Confirmar que PA tem APENAS o role correto
SELECT 
    'VERIFICAÇÃO - PA CRIADO:' as status,
    u.email,
    p.full_name,
    ARRAY_AGG(ur.role) as "roles (deve ter APENAS support_professional)",
    COUNT(DISTINCT sps.student_id) as alunos_vinculados,
    COUNT(spf.id) as total_feedbacks
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN support_professional_students sps ON sps.support_professional_id = u.id AND sps.is_active = true
LEFT JOIN support_professional_feedbacks spf ON spf.support_professional_id = u.id
WHERE u.email = 'pa@teste.com'
GROUP BY u.email, p.full_name;






