-- Migration: Adicionar campos INEP na tabela classes
-- Data: 2025-01-17
-- Descrição: Adiciona campos necessários para exportação INEP/Censo Escolar

-- Adicionar campos INEP em classes
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS codigo_inep_turma text,
  ADD COLUMN IF NOT EXISTS modalidade_inep text;

-- Criar índice único composto para codigo_inep_turma por escola (permitindo NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_codigo_inep_turma_unique 
ON public.classes(school_id, codigo_inep_turma) 
WHERE codigo_inep_turma IS NOT NULL;

-- Comentários nas colunas
COMMENT ON COLUMN public.classes.codigo_inep_turma IS 'Código INEP da turma (até 20 caracteres). Opcional, mas necessário para exportação INEP completa.';
COMMENT ON COLUMN public.classes.modalidade_inep IS 'Modalidade de ensino conforme catálogo INEP (ex: EDUCAÇÃO_INFANTIL, ENSINO_FUNDAMENTAL, ENSINO_MÉDIO, EJA).';

-- Criar função para popular modalidade_inep a partir de education_level
CREATE OR REPLACE FUNCTION public.sync_modalidade_from_education_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Se modalidade_inep não estiver preenchida, preencher baseado em education_level
  IF NEW.modalidade_inep IS NULL AND NEW.education_level IS NOT NULL THEN
    CASE NEW.education_level
      WHEN 'educacao_infantil' THEN NEW.modalidade_inep := 'EDUCAÇÃO_INFANTIL';
      WHEN 'ensino_fundamental_1' THEN NEW.modalidade_inep := 'ENSINO_FUNDAMENTAL';
      WHEN 'ensino_fundamental_2' THEN NEW.modalidade_inep := 'ENSINO_FUNDAMENTAL';
      WHEN 'ensino_medio' THEN NEW.modalidade_inep := 'ENSINO_MÉDIO';
      WHEN 'eja' THEN NEW.modalidade_inep := 'EJA';
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronizar modalidade_inep
DROP TRIGGER IF EXISTS sync_modalidade_trigger ON public.classes;
CREATE TRIGGER sync_modalidade_trigger
  BEFORE INSERT OR UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_modalidade_from_education_level();

-- Atualizar registros existentes que têm education_level mas não têm modalidade_inep
UPDATE public.classes
SET modalidade_inep = CASE education_level
  WHEN 'educacao_infantil' THEN 'EDUCAÇÃO_INFANTIL'
  WHEN 'ensino_fundamental_1' THEN 'ENSINO_FUNDAMENTAL'
  WHEN 'ensino_fundamental_2' THEN 'ENSINO_FUNDAMENTAL'
  WHEN 'ensino_medio' THEN 'ENSINO_MÉDIO'
  WHEN 'eja' THEN 'EJA'
  ELSE NULL
END
WHERE modalidade_inep IS NULL AND education_level IS NOT NULL;

