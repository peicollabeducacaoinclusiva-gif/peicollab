-- Script SQL para preencher dados de teste no App Gestão Escolar
-- Este script adiciona mais dados de teste para facilitar os testes

-- Usar tenant e escola existentes
-- Tenant: 00000000-0000-0000-0000-000000000001
-- Escola: 10000000-0000-0000-0000-000000000001

BEGIN;

-- ============================================
-- 1. PROFISSIONAIS ADICIONAIS
-- ============================================

INSERT INTO professionals (
  id, full_name, email, phone, professional_role, registration_number, 
  specialization, tenant_id, school_id, is_active
) VALUES
  (gen_random_uuid(), 'Prof. Maria Eduarda Silva', 'maria.silva@escola.com', '(11) 98765-4101', 'teacher', 'PROF001', 'Pedagogia - Anos Iniciais', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true),
  (gen_random_uuid(), 'Prof. João Pedro Santos', 'joao.santos@escola.com', '(11) 98765-4102', 'teacher', 'PROF002', 'Matemática', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true),
  (gen_random_uuid(), 'Prof. Ana Paula Costa', 'ana.costa@escola.com', '(11) 98765-4103', 'teacher', 'PROF003', 'Língua Portuguesa', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true),
  (gen_random_uuid(), 'Coord. Pedagógica - Luciana Oliveira', 'luciana.oliveira@escola.com', '(11) 98765-4104', 'coordinator', 'COORD001', 'Coordenação Pedagógica', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true),
  (gen_random_uuid(), 'Prof. AEE - Fernanda Lima', 'fernanda.lima@escola.com', '(11) 98765-4106', 'aee_teacher', 'AEE001', 'Atendimento Educacional Especializado', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true),
  (gen_random_uuid(), 'Prof. Educação Física - Carlos Mendes', 'carlos.mendes@escola.com', '(11) 98765-4107', 'teacher', 'PROF004', 'Educação Física', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true),
  (gen_random_uuid(), 'Prof. Artes - Patricia Souza', 'patricia.souza@escola.com', '(11) 98765-4108', 'teacher', 'PROF005', 'Artes', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. TURMAS ADICIONAIS
-- ============================================

-- Buscar um professor regente
DO $$
DECLARE
  v_teacher_id uuid;
  v_class_id uuid;
BEGIN
  -- Buscar primeiro professor teacher
  SELECT id INTO v_teacher_id 
  FROM professionals 
  WHERE professional_role = 'teacher' 
    AND tenant_id = '00000000-0000-0000-0000-000000000001'
  LIMIT 1;

  -- Criar turmas
  INSERT INTO classes (
    id, class_name, education_level, grade, shift, academic_year,
    school_id, tenant_id, main_teacher_id, max_students, current_students, is_active
  ) VALUES
    (gen_random_uuid(), '3º Ano A', 'ENSINO_FUNDAMENTAL', '3º Ano EF', 'Manhã', '2025', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', v_teacher_id, 25, 0, true),
    (gen_random_uuid(), '3º Ano B', 'ENSINO_FUNDAMENTAL', '3º Ano EF', 'Tarde', '2025', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', v_teacher_id, 25, 0, true),
    (gen_random_uuid(), '4º Ano A', 'ENSINO_FUNDAMENTAL', '4º Ano EF', 'Manhã', '2025', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', v_teacher_id, 25, 0, true),
    (gen_random_uuid(), '5º Ano A', 'ENSINO_FUNDAMENTAL', '5º Ano EF', 'Manhã', '2025', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', v_teacher_id, 25, 0, true),
    (gen_random_uuid(), 'Maternal', 'EDUCACAO_INFANTIL', 'Maternal', 'Integral', '2025', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', v_teacher_id, 20, 0, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_class_id;
END $$;

-- ============================================
-- 3. ALUNOS ADICIONAIS
-- ============================================

DO $$
DECLARE
  v_student_id uuid;
  v_class_id uuid;
  v_class_ids uuid[];
  v_counter integer := 0;
BEGIN
  -- Buscar IDs das turmas criadas
  SELECT ARRAY_AGG(id) INTO v_class_ids
  FROM classes
  WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
    AND school_id = '10000000-0000-0000-0000-000000000001'
    AND academic_year = '2025'
  LIMIT 5;

  -- Se não houver turmas, criar uma padrão
  IF v_class_ids IS NULL OR array_length(v_class_ids, 1) = 0 THEN
    SELECT ARRAY_AGG(id) INTO v_class_ids
    FROM classes
    WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
    LIMIT 5;
  END IF;

  -- Criar alunos
  FOR v_counter IN 1..10 LOOP
    v_class_id := v_class_ids[((v_counter - 1) % array_length(v_class_ids, 1)) + 1];
    
    INSERT INTO students (
      id, name, date_of_birth, student_id, class_name,
      mother_name, father_name, email, phone,
      necessidades_especiais, tipo_necessidade,
      school_id, tenant_id, class_id, is_active
    ) VALUES (
      gen_random_uuid(),
      CASE v_counter
        WHEN 1 THEN 'Ana Silva Santos'
        WHEN 2 THEN 'Carlos Eduardo Oliveira'
        WHEN 3 THEN 'Mariana Costa Lima'
        WHEN 4 THEN 'Lucas Henrique Ferreira'
        WHEN 5 THEN 'Isabella Rodrigues Alves'
        WHEN 6 THEN 'Gabriel Souza Martins'
        WHEN 7 THEN 'Sophia Araújo Barbosa'
        WHEN 8 THEN 'Rafael Mendes Pereira'
        WHEN 9 THEN 'Julia Fernandes Rocha'
        WHEN 10 THEN 'Enzo Gomes Carvalho'
      END,
      CASE v_counter
        WHEN 1 THEN '2015-03-15'
        WHEN 2 THEN '2014-07-22'
        WHEN 3 THEN '2015-11-08'
        WHEN 4 THEN '2013-05-20'
        WHEN 5 THEN '2015-09-12'
        WHEN 6 THEN '2014-12-03'
        WHEN 7 THEN '2015-01-18'
        WHEN 8 THEN '2013-08-25'
        WHEN 9 THEN '2015-04-30'
        WHEN 10 THEN '2014-10-14'
      END,
      'STU' || LPAD(v_counter::text, 3, '0'),
      (SELECT class_name FROM classes WHERE id = v_class_id),
      CASE v_counter
        WHEN 1 THEN 'Maria Silva Santos'
        WHEN 2 THEN 'Patricia Oliveira'
        WHEN 3 THEN 'Fernanda Costa'
        WHEN 4 THEN 'Juliana Ferreira'
        WHEN 5 THEN 'Camila Rodrigues'
        WHEN 6 THEN 'Amanda Souza'
        WHEN 7 THEN 'Larissa Araújo'
        WHEN 8 THEN 'Vanessa Mendes'
        WHEN 9 THEN 'Beatriz Fernandes'
        WHEN 10 THEN 'Renata Gomes'
      END,
      CASE v_counter
        WHEN 1 THEN 'João Santos'
        WHEN 2 THEN 'Eduardo Oliveira'
        WHEN 3 THEN 'Roberto Lima'
        WHEN 4 THEN 'Henrique Ferreira'
        WHEN 5 THEN 'Pedro Alves'
        WHEN 6 THEN 'Ricardo Martins'
        WHEN 7 THEN 'Marcos Barbosa'
        WHEN 8 THEN 'Felipe Pereira'
        WHEN 9 THEN 'André Rocha'
        WHEN 10 THEN 'Thiago Carvalho'
      END,
      'aluno' || v_counter || '@example.com',
      '(11) 98765-43' || LPAD(v_counter::text, 2, '0'),
      CASE v_counter
        WHEN 2 THEN true
        WHEN 4 THEN true
        WHEN 6 THEN true
        WHEN 8 THEN true
        WHEN 10 THEN true
        ELSE false
      END,
      CASE v_counter
        WHEN 2 THEN ARRAY['TDAH']
        WHEN 4 THEN ARRAY['TEA']
        WHEN 6 THEN ARRAY['Dislexia']
        WHEN 8 THEN ARRAY['TDAH', 'Dislexia']
        WHEN 10 THEN ARRAY['TEA']
        ELSE ARRAY[]::text[]
      END,
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      v_class_id,
      true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_student_id;

    -- Atualizar contador de alunos na turma
    IF v_student_id IS NOT NULL THEN
      UPDATE classes
      SET current_students = current_students + 1
      WHERE id = v_class_id;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 4. MATRÍCULAS (se a tabela existir)
-- ============================================

DO $$
DECLARE
  v_student_id uuid;
  v_class_id uuid;
  v_class_ids uuid[];
  v_counter integer := 0;
BEGIN
  -- Verificar se a tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_enrollments') THEN
    -- Buscar alunos criados
    SELECT ARRAY_AGG(id) INTO v_class_ids
    FROM classes
    WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
      AND school_id = '10000000-0000-0000-0000-000000000001'
      AND academic_year = '2025'
    LIMIT 5;

    -- Criar matrículas para alunos recém-criados
    FOR v_student_id IN 
      SELECT id FROM students 
      WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
        AND school_id = '10000000-0000-0000-0000-000000000001'
        AND name IN (
          'Ana Silva Santos', 'Carlos Eduardo Oliveira', 'Mariana Costa Lima',
          'Lucas Henrique Ferreira', 'Isabella Rodrigues Alves', 'Gabriel Souza Martins',
          'Sophia Araújo Barbosa', 'Rafael Mendes Pereira', 'Julia Fernandes Rocha',
          'Enzo Gomes Carvalho'
        )
    LOOP
      v_counter := v_counter + 1;
      v_class_id := v_class_ids[((v_counter - 1) % array_length(v_class_ids, 1)) + 1];
      
      INSERT INTO student_enrollments (
        student_id, school_id, academic_year, grade, class_name, shift,
        enrollment_number, enrollment_date, status
      )
      SELECT 
        v_student_id,
        '10000000-0000-0000-0000-000000000001',
        2025,
        c.grade,
        c.class_name,
        c.shift,
        'MAT' || LPAD(v_counter::text, 3, '0'),
        CURRENT_DATE,
        'active'
      FROM classes c
      WHERE c.id = v_class_id
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;

COMMIT;

-- Resumo
SELECT 
  'Profissionais criados' as tipo,
  COUNT(*) as quantidade
FROM professionals
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND full_name IN (
    'Prof. Maria Eduarda Silva', 'Prof. João Pedro Santos', 'Prof. Ana Paula Costa',
    'Coord. Pedagógica - Luciana Oliveira', 'Prof. AEE - Fernanda Lima',
    'Prof. Educação Física - Carlos Mendes', 'Prof. Artes - Patricia Souza'
  )

UNION ALL

SELECT 
  'Turmas criadas' as tipo,
  COUNT(*) as quantidade
FROM classes
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND school_id = '10000000-0000-0000-0000-000000000001'
  AND academic_year = '2025'
  AND class_name IN ('3º Ano A', '3º Ano B', '4º Ano A', '5º Ano A', 'Maternal')

UNION ALL

SELECT 
  'Alunos criados' as tipo,
  COUNT(*) as quantidade
FROM students
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND school_id = '10000000-0000-0000-0000-000000000001'
  AND name IN (
    'Ana Silva Santos', 'Carlos Eduardo Oliveira', 'Mariana Costa Lima',
    'Lucas Henrique Ferreira', 'Isabella Rodrigues Alves', 'Gabriel Souza Martins',
    'Sophia Araújo Barbosa', 'Rafael Mendes Pereira', 'Julia Fernandes Rocha',
    'Enzo Gomes Carvalho'
  );

