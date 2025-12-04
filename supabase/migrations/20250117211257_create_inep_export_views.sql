-- Migration: Criar views para exportação INEP/Censo Escolar
-- Data: 2025-01-17
-- Descrição: Cria views que mapeiam dados do banco para formato INEP conforme layout Educacenso

-- View: export_inep_escolas (Registro 00)
CREATE OR REPLACE VIEW public.export_inep_escolas AS
SELECT 
  s.id as escola_id,
  s.codigo_inep,
  COALESCE(s.municipio_ibge, '0000000') as municipio_ibge,
  COALESCE(s.dependencia_administrativa::text, 
    CASE s.tipo_escola
      WHEN 'Municipal' THEN '1'
      WHEN 'Estadual' THEN '2'
      WHEN 'Federal' THEN '3'
      WHEN 'Privada' THEN '4'
      ELSE '1'
    END
  ) as dependencia,
  s.school_name as nome_escola,
  s.uf,
  s.cep,
  s.zona,
  s.localizacao
FROM public.schools s
WHERE s.is_active = true;

COMMENT ON VIEW public.export_inep_escolas IS 'View para exportação de escolas no formato INEP (Registro 00)';

-- View: export_inep_turmas (Registro 20)
CREATE OR REPLACE VIEW public.export_inep_turmas AS
SELECT 
  c.id as turma_id,
  c.school_id,
  s.municipio_ibge,
  COALESCE(c.codigo_inep_turma, c.id::text) as turma_id_local,
  c.class_name as descricao,
  COALESCE(c.shift, 'M') as turno,
  c.grade as serie,
  COALESCE(c.max_students, c.current_students, 0) as capacidade,
  COALESCE(c.modalidade_inep,
    CASE c.education_level
      WHEN 'educacao_infantil' THEN 'EDUCAÇÃO_INFANTIL'
      WHEN 'ensino_fundamental_1' THEN 'ENSINO_FUNDAMENTAL'
      WHEN 'ensino_fundamental_2' THEN 'ENSINO_FUNDAMENTAL'
      WHEN 'ensino_medio' THEN 'ENSINO_MÉDIO'
      WHEN 'eja' THEN 'EJA'
      ELSE 'ENSINO_FUNDAMENTAL'
    END
  ) as modalidade,
  c.academic_year
FROM public.classes c
JOIN public.schools s ON s.id = c.school_id
WHERE c.is_active = true;

COMMENT ON VIEW public.export_inep_turmas IS 'View para exportação de turmas no formato INEP (Registro 20)';

-- View: export_inep_pessoas (Registro 30) - Alunos
-- Nota: pessoa_id_local será gerado na aplicação, não na view (ROW_NUMBER não funciona bem em views)
CREATE OR REPLACE VIEW public.export_inep_pessoas_alunos AS
SELECT 
  st.id as pessoa_id,
  'aluno' as tipo_pessoa,
  st.codigo_inep_aluno as pessoa_id_local_predefinido,
  st.name as nome,
  st.date_of_birth as data_nascimento,
  COALESCE(st.sexo, 'M') as sexo,
  COALESCE(st.cpf, '') as cpf,
  COALESCE(st.codigo_inep_aluno, '') as inep_id,
  st.school_id,
  st.created_at
FROM public.students st
WHERE st.is_active = true;

-- View: export_inep_pessoas (Registro 30) - Profissionais
CREATE OR REPLACE VIEW public.export_inep_pessoas_profissionais AS
SELECT 
  p.id as pessoa_id,
  'profissional' as tipo_pessoa,
  p.codigo_inep_servidor as pessoa_id_local_predefinido,
  p.full_name as nome,
  p.date_of_birth as data_nascimento,
  COALESCE(p.gender, 'M') as sexo,
  COALESCE(p.cpf, '') as cpf,
  COALESCE(p.codigo_inep_servidor, '') as inep_id,
  p.school_id,
  p.created_at
FROM public.professionals p
WHERE p.is_active = true;

-- View: export_inep_pessoas (Registro 30) - União de alunos e profissionais
-- Nota: Esta view não é usada diretamente na exportação, pois pessoa_id_local é gerado na aplicação
CREATE OR REPLACE VIEW public.export_inep_pessoas AS
SELECT 
  pessoa_id,
  tipo_pessoa,
  pessoa_id_local_predefinido,
  nome,
  data_nascimento,
  sexo,
  cpf,
  inep_id,
  school_id,
  created_at
FROM public.export_inep_pessoas_alunos
UNION ALL
SELECT 
  pessoa_id,
  tipo_pessoa,
  pessoa_id_local_predefinido,
  nome,
  data_nascimento,
  sexo,
  cpf,
  inep_id,
  school_id,
  created_at
FROM public.export_inep_pessoas_profissionais;

COMMENT ON VIEW public.export_inep_pessoas IS 'View para exportação de pessoas (alunos e profissionais) no formato INEP (Registro 30)';

-- View: export_inep_gestores (Registro 40)
CREATE OR REPLACE VIEW public.export_inep_gestores AS
SELECT 
  p.id as gestor_id,
  p.codigo_inep_servidor as pessoa_id_local_predefinido,
  p.full_name as nome,
  CASE p.professional_role::text
    WHEN 'diretor' THEN 'Diretor'
    ELSE 'Gestor'
  END as cargo,
  p.hire_date as data_inicio,
  COALESCE(p.codigo_inep_servidor, '') as inep_id,
  p.school_id,
  p.created_at
FROM public.professionals p
WHERE p.is_active = true
  AND p.professional_role::text = 'diretor';

COMMENT ON VIEW public.export_inep_gestores IS 'View para exportação de gestores no formato INEP (Registro 40)';

-- View: export_inep_profissionais (Registro 50)
CREATE OR REPLACE VIEW public.export_inep_profissionais AS
SELECT 
  p.id as profissional_id,
  p.codigo_inep_servidor as pessoa_id_local_predefinido,
  CASE p.professional_role
    WHEN 'professor' THEN '01'
    WHEN 'professor_aee' THEN '02'
    WHEN 'coordenador' THEN '03'
    WHEN 'psicologo' THEN '04'
    WHEN 'fonoaudiologo' THEN '05'
    WHEN 'terapeuta_ocupacional' THEN '06'
    WHEN 'assistente_social' THEN '07'
    WHEN 'profissional_apoio' THEN '08'
    ELSE '99'
  END as funcao_code,
  COALESCE(p.carga_horaria_semanal, 
    CASE p.regime_trabalho
      WHEN '20h' THEN 20
      WHEN '30h' THEN 30
      WHEN '40h' THEN 40
      WHEN 'Dedicação Exclusiva' THEN 40
      ELSE 20
    END,
    20
  ) as carga_horaria,
  p.hire_date as data_admissao,
  COALESCE(p.codigo_inep_servidor, '') as inep_id,
  p.school_id,
  p.created_at
FROM public.professionals p
WHERE p.is_active = true
  AND p.professional_role::text != 'diretor';

COMMENT ON VIEW public.export_inep_profissionais IS 'View para exportação de profissionais no formato INEP (Registro 50)';

-- View: export_inep_matriculas (Registro 60)
CREATE OR REPLACE VIEW public.export_inep_matriculas AS
SELECT 
  se.id as matricula_id,
  se.student_id,
  se.class_id,
  -- pessoa_id_local do aluno (será gerado na aplicação)
  st.codigo_inep_aluno as pessoa_id_local_predefinido,
  -- turma_id_local (será gerado na aplicação)
  c.codigo_inep_turma as turma_id_local_predefinido,
  se.grade as serie,
  COALESCE(se.enrollment_date, se.start_date, CURRENT_DATE) as data_matricula,
  CASE se.status
    WHEN 'active' THEN 'MATRICULADO'
    WHEN 'transferred' THEN 'TRANSFERIDO'
    WHEN 'completed' THEN 'CONCLUÍDO'
    WHEN 'dropped' THEN 'DESLIGADO'
    WHEN 'cancelled' THEN 'CANCELADO'
    ELSE 'MATRICULADO'
  END as situacao,
  COALESCE(se.codigo_inep_matricula, '') as inep_id,
  se.academic_year,
  se.school_id
FROM public.student_enrollments se
JOIN public.students st ON st.id = se.student_id
LEFT JOIN public.classes c ON c.id = se.class_id
WHERE st.is_active = true;

COMMENT ON VIEW public.export_inep_matriculas IS 'View para exportação de matrículas no formato INEP (Registro 60)';

