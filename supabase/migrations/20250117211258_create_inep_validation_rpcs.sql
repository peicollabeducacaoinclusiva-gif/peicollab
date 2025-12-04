-- Migration: Criar RPCs de validação para dados INEP
-- Data: 2025-01-17
-- Descrição: Cria funções para validar dados antes da exportação INEP

-- RPC: Validar dados INEP de uma escola
CREATE OR REPLACE FUNCTION public.validate_inep_school_data(_school_id uuid)
RETURNS TABLE (
  campo text,
  valor_atual text,
  esta_preenchido boolean,
  mensagem text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school record;
BEGIN
  -- Buscar dados da escola
  SELECT * INTO v_school
  FROM public.schools
  WHERE id = _school_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'escola'::text,
      ''::text,
      false,
      'Escola não encontrada'::text;
    RETURN;
  END IF;
  
  -- Validar campos obrigatórios
  RETURN QUERY
  SELECT 
    'municipio_ibge'::text,
    COALESCE(v_school.municipio_ibge, ''),
    v_school.municipio_ibge IS NOT NULL AND v_school.municipio_ibge ~ '^\d{7,8}$',
    CASE 
      WHEN v_school.municipio_ibge IS NULL THEN 'Campo obrigatório não preenchido'
      WHEN v_school.municipio_ibge !~ '^\d{7,8}$' THEN 'Formato inválido (deve ter 7 ou 8 dígitos)'
      ELSE 'OK'
    END
  UNION ALL
  SELECT 
    'dependencia_administrativa'::text,
    COALESCE(v_school.dependencia_administrativa::text, ''),
    v_school.dependencia_administrativa IS NOT NULL AND v_school.dependencia_administrativa BETWEEN 1 AND 4,
    CASE 
      WHEN v_school.dependencia_administrativa IS NULL THEN 'Campo obrigatório não preenchido'
      WHEN v_school.dependencia_administrativa NOT BETWEEN 1 AND 4 THEN 'Valor inválido (deve ser 1, 2, 3 ou 4)'
      ELSE 'OK'
    END
  UNION ALL
  SELECT 
    'zona'::text,
    COALESCE(v_school.zona, ''),
    v_school.zona IS NOT NULL AND v_school.zona IN ('urbana', 'rural'),
    CASE 
      WHEN v_school.zona IS NULL THEN 'Campo obrigatório não preenchido'
      WHEN v_school.zona NOT IN ('urbana', 'rural') THEN 'Valor inválido (deve ser urbana ou rural)'
      ELSE 'OK'
    END
  UNION ALL
  SELECT 
    'uf'::text,
    COALESCE(v_school.uf, ''),
    v_school.uf IS NOT NULL AND LENGTH(v_school.uf) = 2,
    CASE 
      WHEN v_school.uf IS NULL THEN 'Campo recomendado não preenchido'
      WHEN LENGTH(v_school.uf) != 2 THEN 'Formato inválido (deve ter 2 caracteres)'
      ELSE 'OK'
    END
  UNION ALL
  SELECT 
    'codigo_inep'::text,
    COALESCE(v_school.codigo_inep, ''),
    v_school.codigo_inep IS NOT NULL AND v_school.codigo_inep ~ '^\d{7,8}$',
    CASE 
      WHEN v_school.codigo_inep IS NULL THEN 'Campo recomendado não preenchido'
      WHEN v_school.codigo_inep !~ '^\d{7,8}$' THEN 'Formato inválido (deve ter 7 ou 8 dígitos)'
      ELSE 'OK'
    END;
END;
$$;

COMMENT ON FUNCTION public.validate_inep_school_data IS 'Valida se uma escola tem todos os campos INEP preenchidos corretamente';

-- RPC: Validar dados completos para exportação INEP
CREATE OR REPLACE FUNCTION public.validate_inep_export_data(
  _school_id uuid,
  _academic_year integer
)
RETURNS TABLE (
  tipo_validacao text,
  total_registros integer,
  registros_validos integer,
  registros_invalidos integer,
  problemas jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school record;
  v_total_turmas integer;
  v_turmas_validas integer;
  v_total_alunos integer;
  v_alunos_validos integer;
  v_total_profissionais integer;
  v_profissionais_validos integer;
  v_total_matriculas integer;
  v_matriculas_validas integer;
  v_problemas jsonb := '[]'::jsonb;
BEGIN
  -- Buscar dados da escola
  SELECT * INTO v_school
  FROM public.schools
  WHERE id = _school_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'erro'::text,
      0,
      0,
      0,
      jsonb_build_array(jsonb_build_object('tipo', 'erro', 'mensagem', 'Escola não encontrada'));
    RETURN;
  END IF;
  
  -- Validar escola
  IF v_school.municipio_ibge IS NULL OR v_school.dependencia_administrativa IS NULL THEN
    v_problemas := v_problemas || jsonb_build_object(
      'tipo', 'escola',
      'mensagem', 'Escola não tem campos INEP obrigatórios preenchidos'
    );
  END IF;
  
  -- Contar e validar turmas
  SELECT COUNT(*), COUNT(*) FILTER (WHERE modalidade_inep IS NOT NULL)
  INTO v_total_turmas, v_turmas_validas
  FROM public.classes
  WHERE school_id = _school_id
    AND is_active = true
    AND (academic_year::integer = _academic_year OR academic_year IS NULL);
  
  IF v_total_turmas > 0 AND v_turmas_validas < v_total_turmas THEN
    v_problemas := v_problemas || jsonb_build_object(
      'tipo', 'turmas',
      'mensagem', format('%s de %s turmas não têm modalidade_inep preenchida', 
        v_total_turmas - v_turmas_validas, v_total_turmas)
    );
  END IF;
  
  -- Contar e validar alunos
  SELECT COUNT(*), COUNT(*) FILTER (WHERE date_of_birth IS NOT NULL AND sexo IS NOT NULL)
  INTO v_total_alunos, v_alunos_validos
  FROM public.students
  WHERE school_id = _school_id
    AND is_active = true;
  
  IF v_total_alunos > 0 AND v_alunos_validos < v_total_alunos THEN
    v_problemas := v_problemas || jsonb_build_object(
      'tipo', 'alunos',
      'mensagem', format('%s de %s alunos não têm data_nascimento ou sexo preenchidos', 
        v_total_alunos - v_alunos_validos, v_total_alunos)
    );
  END IF;
  
  -- Contar e validar profissionais
  SELECT COUNT(*), COUNT(*) FILTER (WHERE date_of_birth IS NOT NULL AND gender IS NOT NULL)
  INTO v_total_profissionais, v_profissionais_validos
  FROM public.professionals
  WHERE school_id = _school_id
    AND is_active = true;
  
  IF v_total_profissionais > 0 AND v_profissionais_validos < v_total_profissionais THEN
    v_problemas := v_problemas || jsonb_build_object(
      'tipo', 'profissionais',
      'mensagem', format('%s de %s profissionais não têm data_nascimento ou gender preenchidos', 
        v_total_profissionais - v_profissionais_validos, v_total_profissionais)
    );
  END IF;
  
  -- Contar e validar matrículas
  SELECT COUNT(*), COUNT(*) FILTER (WHERE enrollment_date IS NOT NULL OR start_date IS NOT NULL)
  INTO v_total_matriculas, v_matriculas_validas
  FROM public.student_enrollments
  WHERE school_id = _school_id
    AND academic_year = _academic_year;
  
  IF v_total_matriculas > 0 AND v_matriculas_validas < v_total_matriculas THEN
    v_problemas := v_problemas || jsonb_build_object(
      'tipo', 'matriculas',
      'mensagem', format('%s de %s matrículas não têm data de matrícula preenchida', 
        v_total_matriculas - v_matriculas_validas, v_total_matriculas)
    );
  END IF;
  
  -- Retornar resumo
  RETURN QUERY SELECT 
    'resumo'::text,
    v_total_turmas + v_total_alunos + v_total_profissionais + v_total_matriculas,
    v_turmas_validas + v_alunos_validos + v_profissionais_validos + v_matriculas_validas,
    (v_total_turmas - v_turmas_validas) + (v_total_alunos - v_alunos_validos) + 
    (v_total_profissionais - v_profissionais_validos) + (v_total_matriculas - v_matriculas_validas),
    v_problemas;
END;
$$;

COMMENT ON FUNCTION public.validate_inep_export_data IS 'Valida dados completos de uma escola para exportação INEP, incluindo turmas, alunos, profissionais e matrículas';

