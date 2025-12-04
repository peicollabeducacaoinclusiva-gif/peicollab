-- Script para popular dados de teste do App Plano de AEE
-- Este script cria planos de AEE, metas, atendimentos e dados relacionados

DO $$
DECLARE
  v_tenant_id uuid := '00000000-0000-0000-0000-000000000001';
  v_school_id uuid := '10000000-0000-0000-0000-000000000001';
  v_student_carlos_id uuid;
  v_student_lucas_id uuid;
  v_student_gabriel_id uuid;
  v_student_rafael_id uuid;
  v_student_enzo_id uuid;
  v_aee_teacher_id uuid;
  v_regular_teacher_id uuid;
  v_class_id uuid;
  v_plan_carlos_id uuid;
  v_plan_lucas_id uuid;
  v_plan_gabriel_id uuid;
  v_plan_rafael_id uuid;
  v_plan_enzo_id uuid;
  v_co_teaching_session_id uuid;
  v_material_production_id uuid;
  v_schedule_link_id uuid;
BEGIN
  -- Obter IDs dos alunos
  SELECT id INTO v_student_carlos_id FROM students WHERE name = 'Carlos Eduardo Oliveira' AND school_id = v_school_id LIMIT 1;
  SELECT id INTO v_student_lucas_id FROM students WHERE name = 'Lucas Henrique Ferreira' AND school_id = v_school_id LIMIT 1;
  SELECT id INTO v_student_gabriel_id FROM students WHERE name = 'Gabriel Souza Martins' AND school_id = v_school_id LIMIT 1;
  SELECT id INTO v_student_rafael_id FROM students WHERE name = 'Rafael Mendes Pereira' AND school_id = v_school_id LIMIT 1;
  SELECT id INTO v_student_enzo_id FROM students WHERE name = 'Enzo Gomes Carvalho' AND school_id = v_school_id LIMIT 1;

  -- Obter ID do professor AEE
  SELECT p.id INTO v_aee_teacher_id 
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'aee_teacher' AND p.school_id = v_school_id
  LIMIT 1;

  -- Obter ID de um professor regular
  SELECT p.id INTO v_regular_teacher_id 
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'teacher' AND p.school_id = v_school_id
  LIMIT 1;

  -- Obter ID de uma turma
  SELECT id INTO v_class_id FROM classes WHERE school_id = v_school_id LIMIT 1;

  IF v_aee_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum professor AEE encontrado.';
  END IF;

  IF v_student_carlos_id IS NULL THEN
    RAISE EXCEPTION 'Alunos não encontrados. Execute primeiro o script populate-gestao-escolar-data.sql';
  END IF;

  -- ============================================
  -- 1. CRIAR PLANOS DE AEE
  -- ============================================

  -- Plano AEE para Carlos (TDAH)
  INSERT INTO plano_aee (
    id, student_id, school_id, tenant_id, created_by, assigned_aee_teacher_id,
    status, start_date, end_date,
    anamnesis_data, learning_barriers, school_complaint, family_complaint,
    resources, adaptations, teaching_objectives, evaluation_methodology
  ) VALUES (
    gen_random_uuid(),
    v_student_carlos_id,
    v_school_id,
    v_tenant_id,
    v_aee_teacher_id,
    v_aee_teacher_id,
    'approved',
    CURRENT_DATE - INTERVAL '2 months',
    CURRENT_DATE + INTERVAL '10 months',
    '{"data_coleta": "2024-11-01", "responsavel": "Maria Silva", "historico_escolar": "Dificuldades de atenção e concentração", "desenvolvimento": "Normal até os 5 anos", "medicacao": "Ritalina 10mg pela manhã"}'::jsonb,
    '["Dificuldade de atenção sustentada", "Impulsividade", "Dificuldade de organização"]'::jsonb,
    'Aluno apresenta dificuldades para manter atenção durante as aulas e completar atividades.',
    'Família relata que o aluno tem dificuldade para fazer lições de casa e organizar materiais escolares.',
    '["Material visual estruturado", "Timer para atividades", "Ambiente com poucos estímulos"]'::jsonb,
    '["Tempo estendido para avaliações", "Instruções claras e objetivas", "Sentar próximo ao professor"]'::jsonb,
    '["Melhorar atenção e concentração", "Desenvolver estratégias de organização", "Reduzir comportamento impulsivo"]'::jsonb,
    'Avaliação contínua através de observação, registro de comportamento e análise de produções.'
  )
  RETURNING id INTO v_plan_carlos_id;

  -- Plano AEE para Lucas (TEA)
  INSERT INTO plano_aee (
    id, student_id, school_id, tenant_id, created_by, assigned_aee_teacher_id,
    status, start_date, end_date,
    anamnesis_data, learning_barriers, school_complaint, family_complaint,
    resources, adaptations, teaching_objectives, evaluation_methodology
  ) VALUES (
    gen_random_uuid(),
    v_student_lucas_id,
    v_school_id,
    v_tenant_id,
    v_aee_teacher_id,
    v_aee_teacher_id,
    'approved',
    CURRENT_DATE - INTERVAL '3 months',
    CURRENT_DATE + INTERVAL '9 months',
    '{"data_coleta": "2024-10-15", "responsavel": "Juliana Ferreira", "historico_escolar": "Diagnóstico de TEA aos 4 anos", "desenvolvimento": "Atraso na fala e interação social", "medicacao": "Nenhuma"}'::jsonb,
    '["Dificuldade de interação social", "Comunicação verbal limitada", "Interesses restritos", "Sensibilidade sensorial"]'::jsonb,
    'Aluno apresenta dificuldades de interação com colegas e comunicação verbal limitada.',
    'Família relata que o aluno prefere atividades isoladas e tem rotinas muito rígidas.',
    '["PECS (Picture Exchange Communication System)", "Material visual estruturado", "Sala de recursos com poucos estímulos"]'::jsonb,
    '["Comunicação alternativa (PECS)", "Rotina visual", "Antecipação de mudanças", "Ambiente estruturado"]'::jsonb,
    '["Desenvolver comunicação funcional", "Melhorar interação social", "Ampliar interesses e atividades"]'::jsonb,
    'Avaliação através de registro de comunicação, observação de interações sociais e análise de rotinas.'
  )
  RETURNING id INTO v_plan_lucas_id;

  -- Plano AEE para Gabriel (Dislexia)
  INSERT INTO plano_aee (
    id, student_id, school_id, tenant_id, created_by, assigned_aee_teacher_id,
    status, start_date, end_date,
    anamnesis_data, learning_barriers, school_complaint, family_complaint,
    resources, adaptations, teaching_objectives, evaluation_methodology
  ) VALUES (
    gen_random_uuid(),
    v_student_gabriel_id,
    v_school_id,
    v_tenant_id,
    v_aee_teacher_id,
    v_aee_teacher_id,
    'pending',
    CURRENT_DATE - INTERVAL '1 month',
    CURRENT_DATE + INTERVAL '11 months',
    '{"data_coleta": "2024-12-01", "responsavel": "Amanda Souza", "historico_escolar": "Dificuldades persistentes em leitura e escrita", "desenvolvimento": "Normal", "medicacao": "Nenhuma"}'::jsonb,
    '["Dificuldade de leitura e escrita", "Inversão de letras", "Dificuldade de compreensão textual"]'::jsonb,
    'Aluno apresenta dificuldades significativas em leitura e escrita, com inversão de letras e baixa compreensão textual.',
    'Família relata que o aluno evita atividades de leitura e demonstra frustração com tarefas escolares.',
    '["Material com fonte aumentada", "Software de leitura", "Material multissensorial"]'::jsonb,
    '["Tempo estendido para leitura", "Avaliação oral como alternativa", "Material com fonte aumentada e espaçamento adequado"]'::jsonb,
    '["Melhorar habilidades de leitura", "Desenvolver estratégias de escrita", "Aumentar compreensão textual"]'::jsonb,
    'Avaliação através de leitura oral, análise de produções escritas e testes de compreensão adaptados.'
  )
  RETURNING id INTO v_plan_gabriel_id;

  -- Plano AEE para Rafael (TDAH + Dislexia)
  INSERT INTO plano_aee (
    id, student_id, school_id, tenant_id, created_by, assigned_aee_teacher_id,
    status, start_date, end_date,
    anamnesis_data, learning_barriers, school_complaint, family_complaint,
    resources, adaptations, teaching_objectives, evaluation_methodology
  ) VALUES (
    gen_random_uuid(),
    v_student_rafael_id,
    v_school_id,
    v_tenant_id,
    v_aee_teacher_id,
    v_aee_teacher_id,
    'draft',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '12 months',
    '{"data_coleta": "2025-01-15", "responsavel": "Vanessa Mendes", "historico_escolar": "Dificuldades múltiplas", "desenvolvimento": "Normal", "medicacao": "Concerta 18mg"}'::jsonb,
    '["Dificuldade de atenção", "Dificuldade de leitura e escrita", "Organização e planejamento"]'::jsonb,
    'Aluno apresenta dificuldades múltiplas: atenção, leitura, escrita e organização.',
    'Família relata que o aluno precisa de muito apoio para realizar tarefas escolares.',
    '["Material visual estruturado", "Software de leitura", "Organizadores visuais"]'::jsonb,
    '["Tempo estendido", "Instruções claras", "Material adaptado", "Ambiente organizado"]'::jsonb,
    '["Melhorar atenção e concentração", "Desenvolver habilidades de leitura", "Organização e planejamento"]'::jsonb,
    'Avaliação contínua e adaptada considerando as múltiplas necessidades do aluno.'
  )
  RETURNING id INTO v_plan_rafael_id;

  -- Plano AEE para Enzo (TEA)
  INSERT INTO plano_aee (
    id, student_id, school_id, tenant_id, created_by, assigned_aee_teacher_id,
    status, start_date, end_date,
    anamnesis_data, learning_barriers, school_complaint, family_complaint,
    resources, adaptations, teaching_objectives, evaluation_methodology
  ) VALUES (
    gen_random_uuid(),
    v_student_enzo_id,
    v_school_id,
    v_tenant_id,
    v_aee_teacher_id,
    v_aee_teacher_id,
    'approved',
    CURRENT_DATE - INTERVAL '4 months',
    CURRENT_DATE + INTERVAL '8 months',
    '{"data_coleta": "2024-09-01", "responsavel": "Renata Gomes", "historico_escolar": "Diagnóstico de TEA aos 3 anos", "desenvolvimento": "Atraso global", "medicacao": "Nenhuma"}'::jsonb,
    '["Comunicação não verbal", "Interação social limitada", "Comportamentos repetitivos", "Sensibilidade sensorial"]'::jsonb,
    'Aluno não verbal, com interação social muito limitada e comportamentos repetitivos.',
    'Família relata que o aluno usa gestos e alguns sons para comunicar necessidades básicas.',
    '["PECS completo", "Tablet com comunicação alternativa", "Material sensorial"]'::jsonb,
    '["Comunicação alternativa (PECS)", "Rotina visual detalhada", "Ambiente com poucos estímulos", "Suporte individualizado"]'::jsonb,
    '["Desenvolver comunicação funcional", "Ampliar interação social", "Reduzir comportamentos disruptivos"]'::jsonb,
    'Avaliação através de registro de comunicação, observação de comportamentos e análise de interações.'
  )
  RETURNING id INTO v_plan_enzo_id;

  -- ============================================
  -- 2. CRIAR SESSÕES DE CO-ENSINO
  -- ============================================

  IF v_regular_teacher_id IS NOT NULL AND v_class_id IS NOT NULL THEN
    -- Sessão de co-ensino para Carlos
    INSERT INTO aee_co_teaching_sessions (
      id, plan_id, student_id, class_id, regular_teacher_id, aee_teacher_id,
      session_date, start_time, end_time, subject_name, topic,
      status, effectiveness_rating, student_engagement, inclusion_success
    ) VALUES (
      gen_random_uuid(),
      v_plan_carlos_id,
      v_student_carlos_id,
      v_class_id,
      v_regular_teacher_id,
      v_aee_teacher_id,
      CURRENT_DATE - INTERVAL '5 days',
      '08:00:00'::time,
      '09:00:00'::time,
      'Matemática',
      'Operações com números decimais',
      'completed',
      4,
      'Aluno manteve atenção durante toda a aula com suporte visual.',
      true
    )
    RETURNING id INTO v_co_teaching_session_id;

    -- Sessão de co-ensino para Lucas
    INSERT INTO aee_co_teaching_sessions (
      id, plan_id, student_id, class_id, regular_teacher_id, aee_teacher_id,
      session_date, start_time, end_time, subject_name, topic,
      status, effectiveness_rating, student_engagement, inclusion_success
    ) VALUES (
      gen_random_uuid(),
      v_plan_lucas_id,
      v_student_lucas_id,
      v_class_id,
      v_regular_teacher_id,
      v_aee_teacher_id,
      CURRENT_DATE - INTERVAL '3 days',
      '10:00:00'::time,
      '11:00:00'::time,
      'Língua Portuguesa',
      'Leitura compartilhada',
      'completed',
      5,
      'Aluno utilizou PECS para participar ativamente da atividade.',
      true
    );
  END IF;

  -- ============================================
  -- 3. CRIAR SESSÕES DE PRODUÇÃO DE MATERIAIS
  -- ============================================

  -- Material para Carlos (TDAH)
  INSERT INTO aee_material_production_sessions (
    id, plan_id, student_id, created_by,
    material_name, material_type, purpose, target_disability,
    session_date, duration_minutes, status, notes
  ) VALUES (
    gen_random_uuid(),
    v_plan_carlos_id,
    v_student_carlos_id,
    v_aee_teacher_id,
    'Organizador Visual Semanal',
    'visual',
    'Ajudar o aluno a organizar suas atividades semanais',
    '["TDAH"]'::jsonb,
    CURRENT_DATE - INTERVAL '10 days',
    120,
    'completed',
    'Material criado com sucesso. Aluno está utilizando diariamente.'
  )
  RETURNING id INTO v_material_production_id;

  -- Material para Lucas (TEA)
  INSERT INTO aee_material_production_sessions (
    id, plan_id, student_id, created_by,
    material_name, material_type, purpose, target_disability,
    session_date, duration_minutes, status, notes
  ) VALUES (
    gen_random_uuid(),
    v_plan_lucas_id,
    v_student_lucas_id,
    v_aee_teacher_id,
    'PECS - Comunicador de Rotina',
    'visual',
    'Sistema de comunicação alternativa para rotina escolar',
    '["TEA"]'::jsonb,
    CURRENT_DATE - INTERVAL '15 days',
    180,
    'completed',
    'Kit completo de PECS criado. Aluno está utilizando para comunicação funcional.'
  );

  -- Material para Gabriel (Dislexia)
  INSERT INTO aee_material_production_sessions (
    id, plan_id, student_id, created_by,
    material_name, material_type, purpose, target_disability,
    session_date, duration_minutes, status, notes
  ) VALUES (
    gen_random_uuid(),
    v_plan_gabriel_id,
    v_student_gabriel_id,
    v_aee_teacher_id,
    'Cartelas de Leitura Multissensorial',
    'tactile',
    'Material para auxiliar na leitura através de múltiplos sentidos',
    '["Dislexia"]'::jsonb,
    CURRENT_DATE - INTERVAL '7 days',
    90,
    'completed',
    'Cartelas criadas com letras em relevo. Aluno demonstrou interesse.'
  );

  -- ============================================
  -- 4. CRIAR REGISTROS DE USO DE MATERIAIS
  -- ============================================

  IF v_material_production_id IS NOT NULL THEN
    INSERT INTO aee_materials_usage_log (
      id, plan_id, student_id, production_session_id, used_by,
      material_name, material_type, used_date, context,
      effectiveness_rating, student_engagement, learning_outcomes
    ) VALUES (
      gen_random_uuid(),
      v_plan_carlos_id,
      v_student_carlos_id,
      v_material_production_id,
      v_aee_teacher_id,
      'Organizador Visual Semanal',
      'visual',
      CURRENT_DATE - INTERVAL '5 days',
      'individual_aee',
      4,
      'high',
      'Aluno conseguiu organizar suas atividades da semana com sucesso.'
    );
  END IF;

  -- ============================================
  -- 5. CRIAR VINCULAÇÕES DE CRONOGRAMA
  -- ============================================

  IF v_class_id IS NOT NULL THEN
    -- Cronograma para atendimento individual de Carlos
    INSERT INTO aee_service_schedule_links (
      id, plan_id, student_id, aee_teacher_id,
      schedule_type, day_of_week, start_time, end_time,
      frequency, location_specific, status
    ) VALUES (
      gen_random_uuid(),
      v_plan_carlos_id,
      v_student_carlos_id,
      v_aee_teacher_id,
      'individual_aee',
      1, -- Segunda-feira
      '14:00:00'::time,
      '15:00:00'::time,
      'weekly',
      'aee_room',
      'active'
    )
    RETURNING id INTO v_schedule_link_id;

    -- Cronograma para atendimento individual de Lucas
    INSERT INTO aee_service_schedule_links (
      id, plan_id, student_id, aee_teacher_id,
      schedule_type, day_of_week, start_time, end_time,
      frequency, location_specific, status
    ) VALUES (
      gen_random_uuid(),
      v_plan_lucas_id,
      v_student_lucas_id,
      v_aee_teacher_id,
      'individual_aee',
      3, -- Quarta-feira
      '14:00:00'::time,
      '15:00:00'::time,
      'weekly',
      'aee_room',
      'active'
    );

    -- Cronograma para atendimento individual de Gabriel
    INSERT INTO aee_service_schedule_links (
      id, plan_id, student_id, aee_teacher_id,
      schedule_type, day_of_week, start_time, end_time,
      frequency, location_specific, status
    ) VALUES (
      gen_random_uuid(),
      v_plan_gabriel_id,
      v_student_gabriel_id,
      v_aee_teacher_id,
      'individual_aee',
      5, -- Sexta-feira
      '14:00:00'::time,
      '15:00:00'::time,
      'weekly',
      'aee_room',
      'active'
    );
  END IF;

  -- ============================================
  -- 6. CRIAR COMUNICAÇÕES ENTRE PROFESSORES
  -- ============================================

  IF v_regular_teacher_id IS NOT NULL THEN
    -- Mensagem do professor AEE para o professor regular sobre Carlos
    INSERT INTO aee_teacher_communication (
      id, plan_id, from_user_id, to_user_id,
      communication_type, subject, message_text, priority, read_status
    ) VALUES (
      gen_random_uuid(),
      v_plan_carlos_id,
      v_aee_teacher_id,
      v_regular_teacher_id,
      'message',
      'Atualização sobre progresso de Carlos',
      'Olá! Gostaria de compartilhar que o Carlos está demonstrando melhora significativa na organização com o uso do organizador visual. Sugiro que continuemos utilizando essa estratégia em sala de aula regular também.',
      'medium',
      false
    );

    -- Mensagem do professor regular para o professor AEE sobre Lucas
    INSERT INTO aee_teacher_communication (
      id, plan_id, from_user_id, to_user_id,
      communication_type, subject, message_text, priority, read_status
    ) VALUES (
      gen_random_uuid(),
      v_plan_lucas_id,
      v_regular_teacher_id,
      v_aee_teacher_id,
      'question',
      'Dúvida sobre uso do PECS',
      'Olá! Tenho uma dúvida sobre como utilizar o PECS com o Lucas durante a aula de matemática. Poderia me orientar?',
      'high',
      false
    );
  END IF;

  -- ============================================
  -- 7. CRIAR REGISTROS DE REPERTÓRIO DE APRENDIZAGEM
  -- ============================================

  -- Repertório para Carlos
  INSERT INTO aee_learning_repertoire (
    id, student_id, plan_id, recorded_by, record_date, record_type,
    family_context, social_context, academic_context,
    learning_preferences, strengths_weaknesses
  ) VALUES (
    gen_random_uuid(),
    v_student_carlos_id,
    v_plan_carlos_id,
    v_aee_teacher_id,
    CURRENT_DATE - INTERVAL '30 days',
    'initial',
    '{"estrutura_familiar": "Nuclear", "suportes": ["Acompanhamento médico", "Medicação"], "envolvimento": "Alto"}'::jsonb,
    '{"relacoes_sociais": "Boa interação com colegas", "integracao": "Participa de atividades em grupo", "grupo_pares": "Bem aceito"}'::jsonb,
    '{"desempenho": "Regular", "areas_interesse": ["Matemática", "Educação Física"], "dificuldades": ["Leitura", "Organização"]}'::jsonb,
    '{"estilos": "Visual e cinestésico", "ritmos": "Precisa de pausas frequentes", "estrategias": "Material visual, atividades práticas"}'::jsonb,
    '{"pontos_fortes": ["Raciocínio lógico", "Criatividade"], "pontos_fracos": ["Atenção sustentada", "Organização"]}'::jsonb
  );

  -- Repertório para Lucas
  INSERT INTO aee_learning_repertoire (
    id, student_id, plan_id, recorded_by, record_date, record_type,
    family_context, social_context, academic_context,
    communication_profile, learning_preferences
  ) VALUES (
    gen_random_uuid(),
    v_student_lucas_id,
    v_plan_lucas_id,
    v_aee_teacher_id,
    CURRENT_DATE - INTERVAL '45 days',
    'initial',
    '{"estrutura_familiar": "Nuclear", "suportes": ["Terapia ocupacional", "Fonoaudiologia"], "envolvimento": "Muito alto"}'::jsonb,
    '{"relacoes_sociais": "Limitada", "integracao": "Precisa de mediação", "grupo_pares": "Aceito com suporte"}'::jsonb,
    '{"desempenho": "Abaixo do esperado", "areas_interesse": ["Atividades sensoriais", "Rotinas"], "dificuldades": ["Comunicação", "Interação social"]}'::jsonb,
    '{"formas": "PECS e gestos", "preferencias": "Comunicação visual", "necessidades": "Antecipação de mudanças"}'::jsonb,
    '{"estilos": "Visual e tátil", "ritmos": "Precisa de rotina rígida", "estrategias": "Material visual, comunicação alternativa"}'::jsonb
  );

  -- ============================================
  -- 8. CRIAR REGISTROS DE PROGRESSO
  -- ============================================

  -- Progresso de Carlos
  INSERT INTO aee_progress_tracking (
    id, plan_id, student_id, tracker_id, tracking_date,
    metric_type, metric_value, metric_unit, metric_description,
    trend, observations
  ) VALUES (
    gen_random_uuid(),
    v_plan_carlos_id,
    v_student_carlos_id,
    v_aee_teacher_id,
    CURRENT_DATE - INTERVAL '7 days',
    'participation',
    75,
    'percent',
    'Participação em atividades de sala de aula',
    'improving',
    'Aluno está participando mais ativamente das aulas com o uso do organizador visual.'
  );

  -- Progresso de Lucas
  INSERT INTO aee_progress_tracking (
    id, plan_id, student_id, tracker_id, tracking_date,
    metric_type, metric_value, metric_unit, metric_description,
    trend, observations
  ) VALUES (
    gen_random_uuid(),
    v_plan_lucas_id,
    v_student_lucas_id,
    v_aee_teacher_id,
    CURRENT_DATE - INTERVAL '10 days',
    'communication',
    60,
    'percent',
    'Uso funcional do PECS para comunicação',
    'improving',
    'Aluno está utilizando o PECS com mais frequência para comunicar necessidades básicas.'
  );

  RAISE NOTICE 'Dados de teste do App Plano de AEE criados com sucesso!';
  RAISE NOTICE 'Planos criados: Carlos (TDAH), Lucas (TEA), Gabriel (Dislexia), Rafael (TDAH+Dislexia), Enzo (TEA)';
END $$;

