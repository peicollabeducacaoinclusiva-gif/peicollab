-- ============================================================================
-- CRIAR PEI PARA FERNANDA ALVES SOUZA - 3º Ano B
-- ============================================================================
-- Este script cria um PEI completo com dados de exemplo
-- ============================================================================

DO $$
DECLARE
    v_student_id uuid;
    v_student_name text;
    v_teacher_id uuid;
    v_school_id uuid;
    v_tenant_id uuid;
    v_pei_id uuid;
BEGIN
    -- Buscar a aluna Fernanda
    SELECT id, name, school_id, tenant_id
    INTO v_student_id, v_student_name, v_school_id, v_tenant_id
    FROM students
    WHERE name ILIKE '%Fernanda%Alves%Souza%'
    OR class_name = '3º Ano B'
    LIMIT 1;

    IF v_student_id IS NULL THEN
        -- Se não encontrou exato, pegar qualquer aluna do 3º Ano B
        SELECT id, name, school_id, tenant_id
        INTO v_student_id, v_student_name, v_school_id, v_tenant_id
        FROM students
        WHERE class_name = '3º Ano B'
        LIMIT 1;
    END IF;

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Aluna não encontrada no banco de dados';
    END IF;

    RAISE NOTICE '✅ Aluna encontrada: %', v_student_name;

    -- Buscar um professor da mesma escola
    SELECT ur.user_id
    INTO v_teacher_id
    FROM user_roles ur
    JOIN profiles p ON p.id = ur.user_id
    WHERE ur.role IN ('teacher', 'aee_teacher')
    AND p.school_id = v_school_id
    LIMIT 1;

    -- Se não encontrou, buscar qualquer professor
    IF v_teacher_id IS NULL THEN
        SELECT user_id INTO v_teacher_id
        FROM user_roles
        WHERE role IN ('teacher', 'aee_teacher')
        LIMIT 1;
    END IF;

    -- Criar PEI
    INSERT INTO peis (
        student_id,
        school_id,
        tenant_id,
        assigned_teacher_id,
        created_by,
        status,
        diagnosis_data,
        planning_data,
        evaluation_data
    )
    VALUES (
        v_student_id,
        v_school_id,
        v_tenant_id,
        v_teacher_id,
        v_teacher_id,
        'approved', -- Status aprovado para poder visualizar
        jsonb_build_object(
            'disability_type', 'Deficiência Intelectual',
            'diagnosis_date', '2024-03-15',
            'current_medications', 'Nenhuma',
            'allergies', 'Não apresenta',
            'special_health_needs', 'Requer acompanhamento regular',
            'previous_interventions', 'Atendimento em sala de recursos',
            'family_context', 'Família participativa e colaborativa',
            'strengths', jsonb_build_array(
                'Boa memória visual',
                'Interesse por atividades artísticas',
                'Relacionamento positivo com colegas'
            ),
            'challenges', jsonb_build_array(
                'Dificuldade em leitura e escrita',
                'Necessita apoio para organização de materiais',
                'Requer tempo adicional para atividades'
            ),
            'interests', jsonb_build_array(
                'Desenho e pintura',
                'Música',
                'Brincadeiras ao ar livre'
            ),
            'learning_style', 'Visual e Cinestésica',
            'communication_level', 'Comunicação oral adequada para a idade'
        ),
        jsonb_build_object(
            'goals', jsonb_build_array(
                jsonb_build_object(
                    'id', gen_random_uuid(),
                    'title', 'Desenvolver habilidades de leitura',
                    'description', 'Reconhecer e ler palavras simples do cotidiano com apoio visual',
                    'category', 'academic',
                    'expected_date', '2025-06-30',
                    'strategies', jsonb_build_array(
                        'Uso de fichas visuais',
                        'Leitura compartilhada diária',
                        'Jogos educativos de alfabetização'
                    )
                ),
                jsonb_build_object(
                    'id', gen_random_uuid(),
                    'title', 'Aumentar autonomia nas atividades diárias',
                    'description', 'Realizar atividades de higiene e organização com independência',
                    'category', 'functional',
                    'expected_date', '2025-06-30',
                    'strategies', jsonb_build_array(
                        'Rotinas visuais',
                        'Checklist de tarefas',
                        'Reforço positivo'
                    )
                ),
                jsonb_build_object(
                    'id', gen_random_uuid(),
                    'title', 'Melhorar interação social',
                    'description', 'Participar ativamente de atividades em grupo',
                    'category', 'functional',
                    'expected_date', '2025-06-30',
                    'strategies', jsonb_build_array(
                        'Atividades colaborativas',
                        'Mediação do PA',
                        'Jogos em grupo'
                    )
                )
            ),
            'accommodations', jsonb_build_array(
                'Tempo adicional para atividades escritas',
                'Material adaptado com apoio visual',
                'Acompanhamento do Profissional de Apoio',
                'Atividades diferenciadas conforme necessidade'
            ),
            'resources', jsonb_build_array(
                'Material concreto e manipulável',
                'Fichas visuais e pictogramas',
                'Tecnologia assistiva (tablet com apps educativos)',
                'Jogos pedagógicos adaptados'
            ),
            'methodologies', jsonb_build_array(
                'Ensino multissensorial',
                'Aprendizagem por repetição e reforço',
                'Uso de recursos visuais',
                'Atividades práticas e concretas'
            )
        ),
        jsonb_build_object(
            'observations', 'Aluna apresenta bom potencial de desenvolvimento com apoio adequado. ' ||
                           'Família participativa e comprometida com o processo educacional. ' ||
                           'Profissional de Apoio tem sido fundamental para o desenvolvimento da autonomia.',
            'progress', 'Evolução positiva observada nas últimas semanas, especialmente em autonomia e socialização.',
            'family_feedback', 'Família relata progressos em casa, principalmente na organização de materiais e rotinas.',
            'next_steps', 'Continuar com as estratégias atuais, intensificar trabalho com leitura e escrita.'
        )
    )
    RETURNING id INTO v_pei_id;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PEI CRIADO COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '👧 ALUNA:';
    RAISE NOTICE '   Nome: %', v_student_name;
    RAISE NOTICE '   Turma: 3º Ano B';
    RAISE NOTICE '';
    RAISE NOTICE '📄 PEI:';
    RAISE NOTICE '   ID: %', v_pei_id;
    RAISE NOTICE '   Status: approved (aprovado)';
    RAISE NOTICE '   Professor responsável: definido';
    RAISE NOTICE '';
    RAISE NOTICE '📊 CONTEÚDO DO PEI:';
    RAISE NOTICE '   ✅ Dados de diagnóstico completos';
    RAISE NOTICE '   ✅ 3 metas educacionais definidas:';
    RAISE NOTICE '      1. Desenvolver habilidades de leitura';
    RAISE NOTICE '      2. Aumentar autonomia nas AVDs';
    RAISE NOTICE '      3. Melhorar interação social';
    RAISE NOTICE '   ✅ Estratégias e metodologias';
    RAISE NOTICE '   ✅ Recursos e adaptações';
    RAISE NOTICE '   ✅ Observações e progresso';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 COMO TESTAR:';
    RAISE NOTICE '1. No Dashboard do PA (onde você está)';
    RAISE NOTICE '2. Procure o card da aluna: %', v_student_name;
    RAISE NOTICE '3. Clique no botão "Ver PEI"';
    RAISE NOTICE '4. O PEI completo será aberto!';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Você poderá ver:';
    RAISE NOTICE '   - Dados da aluna';
    RAISE NOTICE '   - Diagnóstico e contexto';
    RAISE NOTICE '   - Metas educacionais';
    RAISE NOTICE '   - Estratégias e recursos';
    RAISE NOTICE '   - Avaliação e progresso';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Ver o PEI criado
SELECT 
    '✅ PEI CRIADO' as status,
    p.id as "PEI ID",
    s.name as "Aluna",
    s.class_name as "Turma",
    p.status as "Status",
    p.created_at as "Criado em"
FROM peis p
JOIN students s ON s.id = p.student_id
WHERE s.name ILIKE '%Fernanda%'
OR s.class_name = '3º Ano B'
ORDER BY p.created_at DESC
LIMIT 1;

