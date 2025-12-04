-- ============================================================================
-- TESTES DE INTEGRAÇÃO: Gestão Escolar ↔ PEI Collab
-- Data: 09/11/2025
-- Objetivo: Validar triggers automáticos e funções SQL
-- ============================================================================

-- ============================================================================
-- PARTE 1: VALIDAÇÃO DO SCHEMA
-- ============================================================================

-- 1.1 Verificar se todas as tabelas foram criadas
-- ============================================================================
SELECT 
  'Tabelas Criadas' as tipo,
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as total_colunas
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('grade_levels', 'subjects', 'enrollments', 'attendance', 'grades')
ORDER BY table_name;

-- Resultado esperado: 5 linhas

-- 1.2 Verificar novos campos em students
-- ============================================================================
SELECT 
  'Campos Adicionados em students' as tipo,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN (
    'codigo_identificador', 
    'status_matricula', 
    'necessidades_especiais',
    'endereco_logradouro',
    'telefone_principal',
    'mae_nome'
  )
ORDER BY column_name;

-- Resultado esperado: 6 linhas

-- 1.3 Verificar novos campos em peis
-- ============================================================================
SELECT 
  'Campos Adicionados em peis' as tipo,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'peis' 
  AND column_name IN ('class_id', 'enrollment_id')
ORDER BY column_name;

-- Resultado esperado: 2 linhas

-- 1.4 Verificar triggers criados
-- ============================================================================
SELECT 
  'Triggers Criados' as tipo,
  trigger_name,
  event_object_table as tabela,
  action_timing as quando,
  event_manipulation as acao
FROM information_schema.triggers 
WHERE trigger_name IN (
  'trigger_sync_pei_class',
  'trigger_pei_attendance_alert',
  'trigger_compare_grade_pei'
)
ORDER BY trigger_name;

-- Resultado esperado: 3 linhas

-- 1.5 Verificar função SQL criada
-- ============================================================================
SELECT 
  'Funções Criadas' as tipo,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name = 'get_student_academic_context';

-- Resultado esperado: 1 linha

-- 1.6 Verificar índices criados
-- ============================================================================
SELECT 
  'Índices Criados' as tipo,
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('enrollments', 'attendance', 'grades')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Resultado esperado: 15-20 linhas

-- ============================================================================
-- PARTE 2: DADOS DE TESTE
-- ============================================================================

-- 2.1 Criar tenant de teste (se não existir)
-- ============================================================================
INSERT INTO tenants (id, network_name, network_address, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Rede Municipal de Teste',
  'Rua de Teste, 123',
  true
)
ON CONFLICT (id) DO UPDATE
SET network_name = EXCLUDED.network_name;

-- 2.2 Criar escola de teste (se não existir)
-- ============================================================================
INSERT INTO schools (id, tenant_id, school_name, school_address, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Escola Municipal de Teste',
  'Av. Teste, 456',
  true
)
ON CONFLICT (id) DO UPDATE
SET school_name = EXCLUDED.school_name;

-- 2.3 Criar turma de teste (se não existir)
-- ============================================================================
INSERT INTO classes (
  id, 
  school_id, 
  tenant_id, 
  class_name, 
  education_level, 
  grade,
  academic_year,
  is_active
)
VALUES (
  '33333333-3333-3333-3333-333333333333'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '5º Ano A - Teste',
  'ensino_fundamental_1', -- Valores válidos: educacao_infantil, ensino_fundamental_1, ensino_fundamental_2, ensino_medio, eja
  '5º ano',
  '2025',
  true
)
ON CONFLICT (id) DO UPDATE
SET class_name = EXCLUDED.class_name;

-- 2.4 Criar aluno de teste com necessidades especiais
-- ============================================================================
INSERT INTO students (
  id,
  school_id,
  tenant_id,
  name,
  codigo_identificador,
  date_of_birth,
  status_matricula,
  necessidades_especiais,
  tipo_necessidade,
  is_active
)
VALUES (
  '44444444-4444-4444-4444-444444444444'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'João da Silva Teste',
  'ALU-2025-TEST-001',
  '2012-05-15',
  'Ativo',
  true,
  ARRAY['TDAH', 'Dislexia'],
  true
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    necessidades_especiais = EXCLUDED.necessidades_especiais;

-- 2.5 Criar PEI ativo para o aluno de teste
-- ============================================================================
INSERT INTO peis (
  id,
  student_id,
  school_id,
  tenant_id,
  status,
  is_active_version,
  version,
  created_at
)
VALUES (
  '55555555-5555-5555-5555-555555555555'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'approved',
  true,
  1,
  now()
)
ON CONFLICT (id) DO UPDATE
SET is_active_version = EXCLUDED.is_active_version;

-- 2.6 Criar meta no PEI (Matemática = 8.0)
-- ============================================================================
INSERT INTO pei_goals (
  id,
  pei_id,
  description,
  category,
  progress_score,
  target_date
)
VALUES (
  '66666666-6666-6666-6666-666666666666'::uuid,
  '55555555-5555-5555-5555-555555555555'::uuid,
  'Melhorar desempenho em Matemática',
  'Aprendizado',
  80, -- Meta de 8.0
  CURRENT_DATE + INTERVAL '90 days'
)
ON CONFLICT (id) DO UPDATE
SET progress_score = EXCLUDED.progress_score;

-- 2.7 Criar disciplina Matemática
-- ============================================================================
INSERT INTO subjects (
  id,
  tenant_id,
  codigo,
  nome,
  area_conhecimento,
  is_active
)
VALUES (
  '77777777-7777-7777-7777-777777777777'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'MAT',
  'Matemática',
  'Matemática',
  true
)
ON CONFLICT ON CONSTRAINT subjects_tenant_id_codigo_key
DO UPDATE SET nome = EXCLUDED.nome;

-- 2.8 Criar vinculação professor AEE ao PEI
-- ============================================================================
-- NOTA: Substituir 'auth-user-uuid' pelo UUID de um usuário real do sistema
-- Para obter um UUID válido, execute: SELECT id FROM auth.users LIMIT 1;

-- INSERT INTO pei_teachers (pei_id, teacher_id, assigned_at)
-- VALUES (
--   '55555555-5555-5555-5555-555555555555'::uuid,
--   'auth-user-uuid'::uuid, -- SUBSTITUIR!
--   now()
-- )
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 3: TESTE 1 - Sincronização de Turma (Trigger: sync_pei_class)
-- ============================================================================

-- 3.1 Verificar estado ANTES da matrícula
-- ============================================================================
SELECT 
  'ANTES - Estado do PEI' as momento,
  id,
  student_id,
  class_id,
  enrollment_id,
  is_active_version
FROM peis
WHERE id = '55555555-5555-5555-5555-555555555555'::uuid;

-- Resultado esperado: class_id e enrollment_id = NULL

-- 3.2 Criar matrícula (deve disparar trigger)
-- ============================================================================
INSERT INTO enrollments (
  id,
  student_id,
  class_id,
  school_id,
  ano_letivo,
  data_matricula,
  modalidade,
  status,
  created_by
)
VALUES (
  '88888888-8888-8888-8888-888888888888'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  2025,
  CURRENT_DATE,
  'Regular',
  'Matriculado',
  (SELECT id FROM auth.users LIMIT 1) -- Primeiro usuário disponível
)
ON CONFLICT (id) DO UPDATE
SET status = EXCLUDED.status;

-- 3.3 Verificar estado DEPOIS da matrícula
-- ============================================================================
SELECT 
  'DEPOIS - Estado do PEI' as momento,
  id,
  student_id,
  class_id,
  enrollment_id,
  is_active_version,
  updated_at
FROM peis
WHERE id = '55555555-5555-5555-5555-555555555555'::uuid;

-- ✅ RESULTADO ESPERADO: 
-- class_id = '33333333-3333-3333-3333-333333333333'
-- enrollment_id = '88888888-8888-8888-8888-888888888888'
-- updated_at = agora (recém atualizado)

-- ============================================================================
-- PARTE 4: TESTE 2 - Alerta de Faltas (Trigger: notify_pei_attendance)
-- ============================================================================

-- 4.1 Verificar notificações ANTES
-- ============================================================================
SELECT 
  'ANTES - Notificações' as momento,
  COUNT(*) as total
FROM pei_notifications
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid
  AND notification_type = 'attendance_alert';

-- Resultado esperado: 0 (ou contagem atual)

-- 4.2 Registrar 6 faltas no mês atual (deve disparar alerta)
-- ============================================================================
INSERT INTO attendance (
  class_id,
  student_id,
  data,
  presenca,
  atraso_minutos,
  registrado_por
)
SELECT
  '33333333-3333-3333-3333-333333333333'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  date_trunc('month', CURRENT_DATE) + (i || ' days')::interval,
  false, -- FALTA
  0,
  (SELECT id FROM auth.users LIMIT 1)
FROM generate_series(0, 5) AS i
WHERE NOT EXISTS (
  SELECT 1 FROM attendance
  WHERE student_id = '44444444-4444-4444-4444-444444444444'::uuid
    AND data = date_trunc('month', CURRENT_DATE) + (i || ' days')::interval
);

-- 4.3 Verificar notificações DEPOIS
-- ============================================================================
SELECT 
  'DEPOIS - Notificações' as momento,
  id,
  user_id,
  pei_id,
  notification_type,
  is_read,
  created_at
FROM pei_notifications
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid
  AND notification_type = 'attendance_alert'
ORDER BY created_at DESC
LIMIT 5;

-- ✅ RESULTADO ESPERADO: 
-- Pelo menos 1 notificação criada
-- notification_type = 'attendance_alert'
-- is_read = false

-- 4.4 Verificar contagem de faltas
-- ============================================================================
SELECT 
  'Estatísticas de Frequência' as tipo,
  student_id,
  COUNT(*) as total_registros,
  COUNT(*) FILTER (WHERE presenca = true) as presencas,
  COUNT(*) FILTER (WHERE presenca = false) as faltas,
  ROUND(
    (COUNT(*) FILTER (WHERE presenca = true)::decimal / COUNT(*)) * 100,
    2
  ) as taxa_presenca
FROM attendance
WHERE student_id = '44444444-4444-4444-4444-444444444444'::uuid
  AND data >= date_trunc('month', CURRENT_DATE)
GROUP BY student_id;

-- Resultado esperado: faltas >= 6

-- ============================================================================
-- PARTE 5: TESTE 3 - Comparação Notas vs Metas (Trigger: compare_grade_with_pei)
-- ============================================================================

-- 5.1 Verificar notificações ANTES
-- ============================================================================
SELECT 
  'ANTES - Notificações de Nota' as momento,
  COUNT(*) as total
FROM pei_notifications
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid
  AND notification_type = 'grade_below_goal';

-- 5.2 Lançar nota ABAIXO da meta (meta = 8.0, nota = 5.5)
-- ============================================================================
INSERT INTO grades (
  enrollment_id,
  subject_id,
  avaliacao_tipo,
  periodo,
  nota_valor,
  peso,
  lancado_por
)
VALUES (
  '88888888-8888-8888-8888-888888888888'::uuid,
  '77777777-7777-7777-7777-777777777777'::uuid, -- Matemática
  'Prova',
  '1BIM',
  5.5, -- ABAIXO da meta de 8.0
  1.0,
  (SELECT id FROM auth.users LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- 5.3 Verificar notificações DEPOIS
-- ============================================================================
SELECT 
  'DEPOIS - Notificações de Nota' as momento,
  id,
  user_id,
  pei_id,
  notification_type,
  is_read,
  created_at
FROM pei_notifications
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid
  AND notification_type = 'grade_below_goal'
ORDER BY created_at DESC
LIMIT 5;

-- ✅ RESULTADO ESPERADO:
-- Pelo menos 1 notificação criada
-- notification_type = 'grade_below_goal'

-- 5.4 Lançar nota ACIMA da meta (não deve gerar alerta)
-- ============================================================================
INSERT INTO grades (
  enrollment_id,
  subject_id,
  avaliacao_tipo,
  periodo,
  nota_valor,
  peso,
  lancado_por
)
VALUES (
  '88888888-8888-8888-8888-888888888888'::uuid,
  '77777777-7777-7777-7777-777777777777'::uuid, -- Matemática
  'Trabalho',
  '1BIM',
  9.0, -- ACIMA da meta de 8.0
  1.0,
  (SELECT id FROM auth.users LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- Verificar: NÃO deve criar nova notificação para a nota 9.0

-- ============================================================================
-- PARTE 6: TESTE 4 - Função get_student_academic_context()
-- ============================================================================

-- 6.1 Testar função de contexto acadêmico
-- ============================================================================
SELECT get_student_academic_context('44444444-4444-4444-4444-444444444444'::uuid) as contexto_academico;

-- ✅ RESULTADO ESPERADO (JSON):
-- {
--   "turma": "5º Ano A - Teste",
--   "nivel": "Ensino Fundamental - 5º ano",
--   "frequencia_percentual": ~0 (por causa das 6 faltas),
--   "media_geral": ~7.25 (média de 5.5 e 9.0),
--   "disciplinas_abaixo_media": 1,
--   "faltas_mes_atual": 6,
--   "em_risco": true (por causa das faltas)
-- }

-- ============================================================================
-- PARTE 7: VALIDAÇÃO FINAL - Resumo Completo
-- ============================================================================

-- 7.1 Resumo das Integrações
-- ============================================================================
SELECT 
  'RESUMO FINAL' as tipo,
  'PEI ID' as campo,
  id as valor
FROM peis
WHERE id = '55555555-5555-5555-5555-555555555555'::uuid

UNION ALL

SELECT 
  'RESUMO FINAL',
  'Class ID no PEI',
  class_id::text
FROM peis
WHERE id = '55555555-5555-5555-5555-555555555555'::uuid

UNION ALL

SELECT 
  'RESUMO FINAL',
  'Enrollment ID no PEI',
  enrollment_id::text
FROM peis
WHERE id = '55555555-5555-5555-5555-555555555555'::uuid

UNION ALL

SELECT 
  'RESUMO FINAL',
  'Total Notificações Frequência',
  COUNT(*)::text
FROM pei_notifications
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid
  AND notification_type = 'attendance_alert'

UNION ALL

SELECT 
  'RESUMO FINAL',
  'Total Notificações Nota',
  COUNT(*)::text
FROM pei_notifications
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid
  AND notification_type = 'grade_below_goal'

UNION ALL

SELECT 
  'RESUMO FINAL',
  'Total Faltas',
  COUNT(*)::text
FROM attendance
WHERE student_id = '44444444-4444-4444-4444-444444444444'::uuid
  AND presenca = false

UNION ALL

SELECT 
  'RESUMO FINAL',
  'Média Matemática',
  ROUND(AVG(nota_valor), 2)::text
FROM grades
WHERE enrollment_id = '88888888-8888-8888-8888-888888888888'::uuid
  AND subject_id = '77777777-7777-7777-7777-777777777777'::uuid;

-- ============================================================================
-- CHECKLIST DE VALIDAÇÃO
-- ============================================================================

-- ✅ [ ] Todas as 5 novas tabelas foram criadas?
-- ✅ [ ] Campos novos estão presentes em students?
-- ✅ [ ] Campos class_id e enrollment_id existem em peis?
-- ✅ [ ] Os 3 triggers foram criados?
-- ✅ [ ] A função get_student_academic_context existe?
-- ✅ [ ] Trigger sync_pei_class funcionou? (class_id atualizado no PEI)
-- ✅ [ ] Trigger notify_pei_attendance funcionou? (notificação criada após 6 faltas)
-- ✅ [ ] Trigger compare_grade_with_pei funcionou? (notificação criada para nota 5.5)
-- ✅ [ ] Função de contexto retorna JSON válido?

-- ============================================================================
-- LIMPEZA (OPCIONAL)
-- ============================================================================

-- CUIDADO: Isso vai deletar os dados de teste!
-- Descomente apenas se quiser limpar os testes

-- DELETE FROM pei_notifications WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid;
-- DELETE FROM grades WHERE enrollment_id = '88888888-8888-8888-8888-888888888888'::uuid;
-- DELETE FROM attendance WHERE student_id = '44444444-4444-4444-4444-444444444444'::uuid;
-- DELETE FROM pei_goals WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid;
-- DELETE FROM pei_teachers WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid;
-- DELETE FROM peis WHERE id = '55555555-5555-5555-5555-555555555555'::uuid;
-- DELETE FROM enrollments WHERE id = '88888888-8888-8888-8888-888888888888'::uuid;
-- DELETE FROM students WHERE id = '44444444-4444-4444-4444-444444444444'::uuid;
-- DELETE FROM classes WHERE id = '33333333-3333-3333-3333-333333333333'::uuid;
-- DELETE FROM subjects WHERE id = '77777777-7777-7777-7777-777777777777'::uuid;
-- DELETE FROM schools WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;
-- DELETE FROM tenants WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;

-- ============================================================================
-- FIM DOS TESTES
-- ============================================================================

-- 📊 Resultado Esperado:
-- ✅ Trigger 1: PEI.class_id e enrollment_id atualizados
-- ✅ Trigger 2: Notificação de frequência criada (>5 faltas)
-- ✅ Trigger 3: Notificação de nota baixa criada (nota < meta)
-- ✅ Função SQL: Retorna JSON com contexto acadêmico

