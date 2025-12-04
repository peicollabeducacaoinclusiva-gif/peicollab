-- Script para limpar dados e criar rede de teste completa
-- Execute este script para resetar o ambiente de desenvolvimento

BEGIN;

-- ============================================
-- PARTE 1: LIMPEZA DE DADOS (ordem inversa das dependências)
-- ============================================

-- Deletar dados relacionados a PEIs
DELETE FROM pei_evaluations;
DELETE FROM pei_meeting_participants;
DELETE FROM pei_meeting_peis;
DELETE FROM pei_meetings;
DELETE FROM pei_comments;
DELETE FROM pei_reviews;
DELETE FROM pei_history;
DELETE FROM pei_notifications;
DELETE FROM pei_referrals;
DELETE FROM pei_accessibility_resources;
DELETE FROM pei_specialist_orientations;
DELETE FROM pei_goals;
DELETE FROM pei_barriers;
DELETE FROM pei_teachers;
DELETE FROM family_access_tokens;
DELETE FROM peis;

-- Deletar dados relacionados a Plano AEE
DELETE FROM plano_aee_attachments;
DELETE FROM plano_aee_comments;
DELETE FROM aee_evaluation_cycles;
DELETE FROM aee_notifications;
DELETE FROM aee_referrals;
DELETE FROM aee_school_visits;
DELETE FROM plano_aee;

-- Deletar dados relacionados a alunos
DELETE FROM support_professional_feedbacks;
DELETE FROM support_professional_students;
DELETE FROM student_family;
DELETE FROM student_access;
DELETE FROM student_enrollments;
DELETE FROM enrollments;
DELETE FROM attendance;
DELETE FROM grades;
DELETE FROM students;

-- Deletar dados relacionados a turmas e professores
DELETE FROM class_teachers;
DELETE FROM class_subjects;
DELETE FROM classes;

-- Deletar dados relacionados a profissionais
DELETE FROM professionals;

-- Deletar dados relacionados a escolas
DELETE FROM blog_comments;
DELETE FROM blog_post_likes;
DELETE FROM blog_post_views;
DELETE FROM blog_posts;
DELETE FROM blog_categories;
DELETE FROM evaluation_schedules;
DELETE FROM pei_import_batches;
DELETE FROM schools;

-- Deletar dados relacionados a tenants
DELETE FROM subjects;
DELETE FROM grade_levels;
DELETE FROM user_tenants;
DELETE FROM tenants;

-- Limpar dados de usuários (manter apenas os essenciais)
-- NOTA: Não deletamos auth.users para manter os usuários de teste
DELETE FROM user_roles WHERE user_id NOT IN (
  SELECT id FROM auth.users WHERE email IN ('secretary@test.com', 'admin@test.com')
);
DELETE FROM user_schools;
DELETE FROM profiles WHERE id NOT IN (
  SELECT id FROM auth.users WHERE email IN ('secretary@test.com', 'admin@test.com')
);

-- ============================================
-- PARTE 2: CRIAÇÃO DA REDE DE TESTE
-- ============================================

-- Criar rede de teste
INSERT INTO tenants (id, network_name, network_address, network_phone, network_email, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Rede Municipal de Educação - Teste',
  'Rua da Educação, 123 - Centro',
  '(75) 99999-9999',
  'educacao@teste.gov.br',
  true
)
ON CONFLICT (id) DO UPDATE SET
  network_name = EXCLUDED.network_name,
  network_address = EXCLUDED.network_address,
  network_phone = EXCLUDED.network_phone,
  network_email = EXCLUDED.network_email,
  is_active = EXCLUDED.is_active;

-- ============================================
-- PARTE 3: CRIAR ESCOLAS DE TESTE
-- ============================================

-- Escola 1: Educação Infantil e Fundamental I
INSERT INTO schools (id, tenant_id, school_name, school_address, school_phone, school_email, codigo_inep, tipo_escola, is_active, oferece_eja, oferece_aee, turnos)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Escola Municipal de Educação Infantil e Fundamental I',
  'Rua das Flores, 100',
  '(75) 1111-1111',
  'emei@teste.gov.br',
  '29000001',
  'Municipal',
  true,
  false,
  true,
  '["Manhã", "Tarde"]'::jsonb
);

-- Escola 2: Fundamental I e II
INSERT INTO schools (id, tenant_id, school_name, school_address, school_phone, school_email, codigo_inep, tipo_escola, is_active, oferece_eja, oferece_aee, turnos)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Escola Municipal de Ensino Fundamental',
  'Avenida Principal, 200',
  '(75) 2222-2222',
  'emef@teste.gov.br',
  '29000002',
  'Municipal',
  true,
  false,
  true,
  '["Manhã", "Tarde"]'::jsonb
);

-- Escola 3: Fundamental II e Ensino Médio
INSERT INTO schools (id, tenant_id, school_name, school_address, school_phone, school_email, codigo_inep, tipo_escola, is_active, oferece_eja, oferece_aee, turnos)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Colégio Municipal de Ensino Fundamental e Médio',
  'Rua da Escola, 300',
  '(75) 3333-3333',
  'colegio@teste.gov.br',
  '29000003',
  'Municipal',
  true,
  true,
  true,
  '["Manhã", "Tarde", "Noite"]'::jsonb
);

-- ============================================
-- PARTE 4: CRIAR PROFISSIONAIS DE TESTE
-- ============================================

-- Diretor da Escola 1
INSERT INTO professionals (id, tenant_id, school_id, full_name, email, phone, professional_role, registration_number, is_active, hire_date)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Maria Silva Santos',
  'maria.silva@teste.gov.br',
  '(75) 99999-0001',
  'diretor',
  'DIR001',
  true,
  CURRENT_DATE
);

-- Diretor da Escola 2
INSERT INTO professionals (id, tenant_id, school_id, full_name, email, phone, professional_role, registration_number, is_active, hire_date)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'João Oliveira Costa',
  'joao.oliveira@teste.gov.br',
  '(75) 99999-0002',
  'diretor',
  'DIR002',
  true,
  CURRENT_DATE
);

-- Diretor da Escola 3
INSERT INTO professionals (id, tenant_id, school_id, full_name, email, phone, professional_role, registration_number, is_active, hire_date)
VALUES (
  '20000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000003',
  'Ana Paula Ferreira',
  'ana.ferreira@teste.gov.br',
  '(75) 99999-0003',
  'diretor',
  'DIR003',
  true,
  CURRENT_DATE
);

-- Coordenadores Pedagógicos
INSERT INTO professionals (id, tenant_id, school_id, full_name, email, phone, professional_role, registration_number, is_active, hire_date)
VALUES
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Carlos Eduardo Lima', 'carlos.lima@teste.gov.br', '(75) 99999-0004', 'coordenador', 'COORD001', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Patricia Almeida', 'patricia.almeida@teste.gov.br', '(75) 99999-0005', 'coordenador', 'COORD002', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Roberto Mendes', 'roberto.mendes@teste.gov.br', '(75) 99999-0006', 'coordenador', 'COORD003', true, CURRENT_DATE);

-- Professores AEE
INSERT INTO professionals (id, tenant_id, school_id, full_name, email, phone, professional_role, registration_number, is_active, hire_date)
VALUES
  ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lucia AEE Silva', 'lucia.aee@teste.gov.br', '(75) 99999-0007', 'professor_aee', 'AEE001', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Fernando AEE Santos', 'fernando.aee@teste.gov.br', '(75) 99999-0008', 'professor_aee', 'AEE002', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Juliana AEE Costa', 'juliana.aee@teste.gov.br', '(75) 99999-0009', 'professor_aee', 'AEE003', true, CURRENT_DATE);

-- Professores Regulares (10 por escola)
INSERT INTO professionals (id, tenant_id, school_id, full_name, email, phone, professional_role, registration_number, is_active, hire_date)
VALUES
  -- Escola 1
  ('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Professor 1 EMEI', 'prof1.emei@teste.gov.br', '(75) 99999-0010', 'professor', 'PROF001', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Professor 2 EMEI', 'prof2.emei@teste.gov.br', '(75) 99999-0011', 'professor', 'PROF002', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Professor 3 EMEI', 'prof3.emei@teste.gov.br', '(75) 99999-0012', 'professor', 'PROF003', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Professor 4 EMEI', 'prof4.emei@teste.gov.br', '(75) 99999-0013', 'professor', 'PROF004', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Professor 5 EMEI', 'prof5.emei@teste.gov.br', '(75) 99999-0014', 'professor', 'PROF005', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Professor 6 EMEI', 'prof6.emei@teste.gov.br', '(75) 99999-0015', 'professor', 'PROF006', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Professor 7 EMEI', 'prof7.emei@teste.gov.br', '(75) 99999-0016', 'professor', 'PROF007', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Professor 8 EMEI', 'prof8.emei@teste.gov.br', '(75) 99999-0017', 'professor', 'PROF008', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Professor 9 EMEI', 'prof9.emei@teste.gov.br', '(75) 99999-0018', 'professor', 'PROF009', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Professor 10 EMEI', 'prof10.emei@teste.gov.br', '(75) 99999-0019', 'professor', 'PROF010', true, CURRENT_DATE),
  -- Escola 2
  ('20000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Professor 1 EMEF', 'prof1.emef@teste.gov.br', '(75) 99999-0020', 'professor', 'PROF011', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Professor 2 EMEF', 'prof2.emef@teste.gov.br', '(75) 99999-0021', 'professor', 'PROF012', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Professor 3 EMEF', 'prof3.emef@teste.gov.br', '(75) 99999-0022', 'professor', 'PROF013', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Professor 4 EMEF', 'prof4.emef@teste.gov.br', '(75) 99999-0023', 'professor', 'PROF014', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Professor 5 EMEF', 'prof5.emef@teste.gov.br', '(75) 99999-0024', 'professor', 'PROF015', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Professor 6 EMEF', 'prof6.emef@teste.gov.br', '(75) 99999-0025', 'professor', 'PROF016', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Professor 7 EMEF', 'prof7.emef@teste.gov.br', '(75) 99999-0026', 'professor', 'PROF017', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Professor 8 EMEF', 'prof8.emef@teste.gov.br', '(75) 99999-0027', 'professor', 'PROF018', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Professor 9 EMEF', 'prof9.emef@teste.gov.br', '(75) 99999-0028', 'professor', 'PROF019', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Professor 10 EMEF', 'prof10.emef@teste.gov.br', '(75) 99999-0029', 'professor', 'PROF020', true, CURRENT_DATE),
  -- Escola 3
  ('20000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Professor 1 Colegio', 'prof1.colegio@teste.gov.br', '(75) 99999-0030', 'professor', 'PROF021', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Professor 2 Colegio', 'prof2.colegio@teste.gov.br', '(75) 99999-0031', 'professor', 'PROF022', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Professor 3 Colegio', 'prof3.colegio@teste.gov.br', '(75) 99999-0032', 'professor', 'PROF023', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Professor 4 Colegio', 'prof4.colegio@teste.gov.br', '(75) 99999-0033', 'professor', 'PROF024', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Professor 5 Colegio', 'prof5.colegio@teste.gov.br', '(75) 99999-0034', 'professor', 'PROF025', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Professor 6 Colegio', 'prof6.colegio@teste.gov.br', '(75) 99999-0035', 'professor', 'PROF026', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Professor 7 Colegio', 'prof7.colegio@teste.gov.br', '(75) 99999-0036', 'professor', 'PROF027', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Professor 8 Colegio', 'prof8.colegio@teste.gov.br', '(75) 99999-0037', 'professor', 'PROF028', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Professor 9 Colegio', 'prof9.colegio@teste.gov.br', '(75) 99999-0038', 'professor', 'PROF029', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Professor 10 Colegio', 'prof10.colegio@teste.gov.br', '(75) 99999-0039', 'professor', 'PROF030', true, CURRENT_DATE);

-- Especialistas
INSERT INTO professionals (id, tenant_id, school_id, full_name, email, phone, professional_role, registration_number, specialization, is_active, hire_date)
VALUES
  ('20000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', NULL, 'Psicóloga Ana Beatriz', 'ana.psicologa@teste.gov.br', '(75) 99999-0040', 'psicologo', 'PSIC001', 'Psicologia Escolar', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', NULL, 'Fonoaudióloga Maria Clara', 'maria.fono@teste.gov.br', '(75) 99999-0041', 'fonoaudiologo', 'FONO001', 'Fonoaudiologia Educacional', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', NULL, 'Terapeuta Ocupacional João Pedro', 'joao.to@teste.gov.br', '(75) 99999-0042', 'terapeuta_ocupacional', 'TO001', 'T.O. Escolar', true, CURRENT_DATE);

-- Profissionais de Apoio
INSERT INTO professionals (id, tenant_id, school_id, full_name, email, phone, professional_role, registration_number, is_active, hire_date)
VALUES
  ('20000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Apoio 1 EMEI', 'apoio1.emei@teste.gov.br', '(75) 99999-0043', 'profissional_apoio', 'APOIO001', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Apoio 1 EMEF', 'apoio1.emef@teste.gov.br', '(75) 99999-0044', 'profissional_apoio', 'APOIO002', true, CURRENT_DATE),
  ('20000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Apoio 1 Colegio', 'apoio1.colegio@teste.gov.br', '(75) 99999-0045', 'profissional_apoio', 'APOIO003', true, CURRENT_DATE);

-- Atualizar escolas com diretores
UPDATE schools SET diretor_id = '20000000-0000-0000-0000-000000000001' WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE schools SET diretor_id = '20000000-0000-0000-0000-000000000002' WHERE id = '10000000-0000-0000-0000-000000000002';
UPDATE schools SET diretor_id = '20000000-0000-0000-0000-000000000003' WHERE id = '10000000-0000-0000-0000-000000000003';

UPDATE schools SET coordenador_pedagogico_id = '20000000-0000-0000-0000-000000000004' WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE schools SET coordenador_pedagogico_id = '20000000-0000-0000-0000-000000000005' WHERE id = '10000000-0000-0000-0000-000000000002';
UPDATE schools SET coordenador_pedagogico_id = '20000000-0000-0000-0000-000000000006' WHERE id = '10000000-0000-0000-0000-000000000003';

-- ============================================
-- PARTE 5: CRIAR TURMAS DE TESTE
-- ============================================

-- Turmas da Escola 1 (Educação Infantil)
INSERT INTO classes (id, tenant_id, school_id, class_name, education_level, grade, shift, academic_year, main_teacher_id, max_students, current_students, is_active)
VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'A', 'educacao_infantil', 'Infantil 4', 'Manhã', '2025', '20000000-0000-0000-0000-000000000010', 20, 0, true),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'B', 'educacao_infantil', 'Infantil 5', 'Manhã', '2025', '20000000-0000-0000-0000-000000000011', 20, 0, true),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'A', 'ensino_fundamental_1', '1º Ano EF', 'Tarde', '2025', '20000000-0000-0000-0000-000000000012', 25, 0, true),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'B', 'ensino_fundamental_1', '2º Ano EF', 'Tarde', '2025', '20000000-0000-0000-0000-000000000013', 25, 0, true);

-- Turmas da Escola 2 (Fundamental I e II)
INSERT INTO classes (id, tenant_id, school_id, class_name, education_level, grade, shift, academic_year, main_teacher_id, max_students, current_students, is_active)
VALUES
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'A', 'ensino_fundamental_1', '3º Ano EF', 'Manhã', '2025', '20000000-0000-0000-0000-000000000020', 25, 0, true),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'B', 'ensino_fundamental_1', '4º Ano EF', 'Manhã', '2025', '20000000-0000-0000-0000-000000000021', 25, 0, true),
  ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'A', 'ensino_fundamental_2', '6º Ano EF', 'Tarde', '2025', '20000000-0000-0000-0000-000000000022', 30, 0, true),
  ('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'B', 'ensino_fundamental_2', '7º Ano EF', 'Tarde', '2025', '20000000-0000-0000-0000-000000000023', 30, 0, true);

-- Turmas da Escola 3 (Fundamental II e Médio)
INSERT INTO classes (id, tenant_id, school_id, class_name, education_level, grade, shift, academic_year, main_teacher_id, max_students, current_students, is_active)
VALUES
  ('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'A', 'ensino_fundamental_2', '8º Ano EF', 'Manhã', '2025', '20000000-0000-0000-0000-000000000030', 30, 0, true),
  ('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'B', 'ensino_fundamental_2', '9º Ano EF', 'Manhã', '2025', '20000000-0000-0000-0000-000000000031', 30, 0, true),
  ('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'A', 'ensino_medio', '1º Ano EM', 'Tarde', '2025', '20000000-0000-0000-0000-000000000032', 35, 0, true),
  ('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'B', 'ensino_medio', '2º Ano EM', 'Tarde', '2025', '20000000-0000-0000-0000-000000000033', 35, 0, true),
  ('30000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'A', 'eja', 'EJA - Anos Iniciais (EF)', 'Noite', '2025', '20000000-0000-0000-0000-000000000034', 30, 0, true);

-- ============================================
-- PARTE 6: CRIAR ALUNOS DE TESTE
-- ============================================

-- Alunos da Escola 1 (20 alunos)
INSERT INTO students (id, tenant_id, school_id, name, date_of_birth, registration_number, guardian_name, guardian_phone, is_active, necessidades_especiais, tipo_necessidade)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Aluno ' || generate_series || ' EMEI',
  CURRENT_DATE - (INTERVAL '1 year' * (4 + (generate_series % 2))),
  'REG' || LPAD(generate_series::text, 4, '0'),
  'Responsável ' || generate_series,
  '(75) 99999-' || LPAD((1000 + generate_series)::text, 4, '0'),
  true,
  (generate_series % 5 = 0), -- 20% com necessidades especiais
  CASE WHEN generate_series % 5 = 0 THEN ARRAY['TEA', 'Deficiência Intelectual'] ELSE NULL END
FROM generate_series(1, 20);

-- Alunos da Escola 2 (30 alunos)
INSERT INTO students (id, tenant_id, school_id, name, date_of_birth, registration_number, guardian_name, guardian_phone, is_active, necessidades_especiais, tipo_necessidade)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'Aluno ' || generate_series || ' EMEF',
  CURRENT_DATE - (INTERVAL '1 year' * (8 + (generate_series % 4))),
  'REG' || LPAD((20 + generate_series)::text, 4, '0'),
  'Responsável ' || (20 + generate_series),
  '(75) 99999-' || LPAD((1020 + generate_series)::text, 4, '0'),
  true,
  (generate_series % 4 = 0), -- 25% com necessidades especiais
  CASE WHEN generate_series % 4 = 0 THEN ARRAY['TDAH', 'Deficiência Visual'] ELSE NULL END
FROM generate_series(1, 30);

-- Alunos da Escola 3 (40 alunos)
INSERT INTO students (id, tenant_id, school_id, name, date_of_birth, registration_number, guardian_name, guardian_phone, is_active, necessidades_especiais, tipo_necessidade)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000003',
  'Aluno ' || generate_series || ' Colegio',
  CURRENT_DATE - (INTERVAL '1 year' * (13 + (generate_series % 5))),
  'REG' || LPAD((50 + generate_series)::text, 4, '0'),
  'Responsável ' || (50 + generate_series),
  '(75) 99999-' || LPAD((1050 + generate_series)::text, 4, '0'),
  true,
  (generate_series % 3 = 0), -- 33% com necessidades especiais
  CASE WHEN generate_series % 3 = 0 THEN ARRAY['Deficiência Física', 'Altas Habilidades'] ELSE NULL END
FROM generate_series(1, 40);

-- ============================================
-- PARTE 7: CRIAR PEIs DE TESTE
-- ============================================

-- PEIs para alunos com necessidades especiais (aprox. 30% dos alunos)
-- Vamos criar PEIs para alguns alunos de cada escola

-- PEIs da Escola 1
INSERT INTO peis (id, tenant_id, school_id, student_id, status, version_number, is_active_version, created_at, updated_at)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  s.id,
  CASE (ROW_NUMBER() OVER ()) % 4
    WHEN 0 THEN 'approved'
    WHEN 1 THEN 'pending'
    WHEN 2 THEN 'draft'
    ELSE 'returned'
  END::pei_status,
  1,
  true,
  CURRENT_DATE - (INTERVAL '1 day' * (ROW_NUMBER() OVER () % 30)),
  CURRENT_DATE - (INTERVAL '1 day' * (ROW_NUMBER() OVER () % 30))
FROM students s
WHERE s.tenant_id = '00000000-0000-0000-0000-000000000001'
  AND s.school_id = '10000000-0000-0000-0000-000000000001'
  AND s.necessidades_especiais = true
LIMIT 4;

-- PEIs da Escola 2
INSERT INTO peis (id, tenant_id, school_id, student_id, status, version_number, is_active_version, created_at, updated_at)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  s.id,
  CASE (ROW_NUMBER() OVER ()) % 4
    WHEN 0 THEN 'approved'
    WHEN 1 THEN 'pending'
    WHEN 2 THEN 'draft'
    ELSE 'returned'
  END::pei_status,
  1,
  true,
  CURRENT_DATE - (INTERVAL '1 day' * (ROW_NUMBER() OVER () % 30)),
  CURRENT_DATE - (INTERVAL '1 day' * (ROW_NUMBER() OVER () % 30))
FROM students s
WHERE s.tenant_id = '00000000-0000-0000-0000-000000000001'
  AND s.school_id = '10000000-0000-0000-0000-000000000002'
  AND s.necessidades_especiais = true
LIMIT 8;

-- PEIs da Escola 3
INSERT INTO peis (id, tenant_id, school_id, student_id, status, version_number, is_active_version, created_at, updated_at)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000003',
  s.id,
  CASE (ROW_NUMBER() OVER ()) % 4
    WHEN 0 THEN 'approved'
    WHEN 1 THEN 'pending'
    WHEN 2 THEN 'draft'
    ELSE 'returned'
  END::pei_status,
  1,
  true,
  CURRENT_DATE - (INTERVAL '1 day' * (ROW_NUMBER() OVER () % 30)),
  CURRENT_DATE - (INTERVAL '1 day' * (ROW_NUMBER() OVER () % 30))
FROM students s
WHERE s.tenant_id = '00000000-0000-0000-0000-000000000001'
  AND s.school_id = '10000000-0000-0000-0000-000000000003'
  AND s.necessidades_especiais = true
LIMIT 13;

-- ============================================
-- PARTE 8: ASSOCIAR SECRETÁRIO À REDE
-- ============================================

-- Atualizar perfil do secretário para associar à nova rede
UPDATE profiles
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'secretary@test.com');

-- Garantir associação na tabela user_tenants
INSERT INTO user_tenants (user_id, tenant_id)
SELECT id, '00000000-0000-0000-0000-000000000001'
FROM auth.users
WHERE email = 'secretary@test.com'
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificar resultados
SELECT 
  (SELECT COUNT(*) FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001') as rede_criada,
  (SELECT COUNT(*) FROM schools WHERE tenant_id = '00000000-0000-0000-0000-000000000001') as escolas_criadas,
  (SELECT COUNT(*) FROM professionals WHERE tenant_id = '00000000-0000-0000-0000-000000000001') as profissionais_criados,
  (SELECT COUNT(*) FROM classes WHERE tenant_id = '00000000-0000-0000-0000-000000000001') as turmas_criadas,
  (SELECT COUNT(*) FROM students WHERE tenant_id = '00000000-0000-0000-0000-000000000001') as alunos_criados,
  (SELECT COUNT(*) FROM peis WHERE tenant_id = '00000000-0000-0000-0000-000000000001') as peis_criados;

