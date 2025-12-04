-- ============================================================================
-- FASE 1 - ISSUE #4: Campos Faltantes Críticos
-- Data: 2025-01-25
-- Descrição: Adicionar campos faltantes necessários para exportação Educacenso
-- ============================================================================

-- ============================================================================
-- PARTE 1: VERIFICAR E ADICIONAR CAMPOS EM STUDENTS
-- ============================================================================

-- Adicionar NIS (Número de Identificação Social) se não existir
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS nis text;

-- Criar índice único para NIS (permitindo NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_nis_unique 
ON public.students(nis) 
WHERE nis IS NOT NULL;

COMMENT ON COLUMN public.students.nis IS 'Número de Identificação Social (NIS). Usado para programas sociais como Bolsa Família.';

-- Adicionar número Bolsa Família se não existir
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS numero_bolsa_familia text;

-- Criar índice para busca por Bolsa Família
CREATE INDEX IF NOT EXISTS idx_students_bolsa_familia 
ON public.students(numero_bolsa_familia) 
WHERE numero_bolsa_familia IS NOT NULL;

COMMENT ON COLUMN public.students.numero_bolsa_familia IS 'Número do Bolsa Família do aluno. Usado para programas sociais.';

-- ============================================================================
-- PARTE 2: VERIFICAR CAMPOS EM SCHOOLS (já devem existir, mas garantimos)
-- ============================================================================

-- Verificar e adicionar campos se não existirem (já adicionados em migração anterior, mas garantimos)
DO $$
BEGIN
  -- municipio_ibge
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'municipio_ibge'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN municipio_ibge text;
    COMMENT ON COLUMN public.schools.municipio_ibge IS 'Código IBGE do município (7 ou 8 dígitos). Obrigatório para exportação INEP.';
  END IF;

  -- uf
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'uf'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN uf text CHECK (uf IS NULL OR LENGTH(uf) = 2);
    COMMENT ON COLUMN public.schools.uf IS 'Unidade Federativa (2 caracteres, ex: BA, SP). Obrigatório para exportação INEP.';
  END IF;

  -- zona
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'zona'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN zona text CHECK (zona IS NULL OR zona IN ('urbana', 'rural'));
    COMMENT ON COLUMN public.schools.zona IS 'Zona da escola: urbana ou rural. Obrigatório para exportação INEP.';
  END IF;

  -- localizacao
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'localizacao'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN localizacao text;
    COMMENT ON COLUMN public.schools.localizacao IS 'Localização adicional da escola (opcional).';
  END IF;
END $$;

-- ============================================================================
-- PARTE 3: ATUALIZAR VIEWS DE EXPORTAÇÃO (se necessário)
-- ============================================================================

-- Verificar se view export_inep_pessoas_alunos precisa incluir NIS
-- (Views já devem estar corretas, mas podemos adicionar campos opcionais)

-- ============================================================================
-- PARTE 4: CRIAR FUNÇÃO DE VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
-- ============================================================================

-- Função para verificar se escola tem todos os campos obrigatórios para Educacenso
CREATE OR REPLACE FUNCTION public.check_school_educacenso_fields(_school_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school record;
  v_missing_fields text[] := ARRAY[]::text[];
  v_result jsonb;
BEGIN
  -- Buscar dados da escola
  SELECT 
    codigo_inep,
    municipio_ibge,
    uf,
    zona,
    school_name,
    tipo_escola
  INTO v_school
  FROM public.schools
  WHERE id = _school_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Escola não encontrada'
    );
  END IF;

  -- Verificar campos obrigatórios
  IF v_school.codigo_inep IS NULL OR v_school.codigo_inep = '' THEN
    v_missing_fields := array_append(v_missing_fields, 'codigo_inep');
  END IF;

  IF v_school.municipio_ibge IS NULL OR v_school.municipio_ibge = '' THEN
    v_missing_fields := array_append(v_missing_fields, 'municipio_ibge');
  END IF;

  IF v_school.uf IS NULL OR v_school.uf = '' THEN
    v_missing_fields := array_append(v_missing_fields, 'uf');
  END IF;

  IF v_school.zona IS NULL OR v_school.zona = '' THEN
    v_missing_fields := array_append(v_missing_fields, 'zona');
  END IF;

  IF v_school.tipo_escola IS NULL OR v_school.tipo_escola = '' THEN
    v_missing_fields := array_append(v_missing_fields, 'tipo_escola');
  END IF;

  -- Construir resultado
  v_result := jsonb_build_object(
    'valid', array_length(v_missing_fields, 1) IS NULL,
    'missing_fields', v_missing_fields,
    'school_id', _school_id,
    'school_name', v_school.school_name
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.check_school_educacenso_fields IS 'Verifica se escola tem todos os campos obrigatórios para exportação Educacenso';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

