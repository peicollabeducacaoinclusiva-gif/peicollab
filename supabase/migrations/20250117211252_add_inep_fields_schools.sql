-- Migration: Adicionar campos INEP na tabela schools
-- Data: 2025-01-17
-- Descrição: Adiciona campos necessários para exportação INEP/Censo Escolar

-- Adicionar campos INEP em schools
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS municipio_ibge text,
  ADD COLUMN IF NOT EXISTS uf text CHECK (uf IS NULL OR LENGTH(uf) = 2),
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS zona text CHECK (zona IS NULL OR zona IN ('urbana', 'rural')),
  ADD COLUMN IF NOT EXISTS dependencia_administrativa integer CHECK (dependencia_administrativa IS NULL OR dependencia_administrativa BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS localizacao text;

-- Comentários nas colunas
COMMENT ON COLUMN public.schools.municipio_ibge IS 'Código IBGE do município (7 ou 8 dígitos). Obrigatório para exportação INEP.';
COMMENT ON COLUMN public.schools.uf IS 'Unidade Federativa (2 caracteres, ex: BA, SP). Obrigatório para exportação INEP.';
COMMENT ON COLUMN public.schools.cep IS 'CEP da escola (8 ou 9 dígitos).';
COMMENT ON COLUMN public.schools.zona IS 'Zona da escola: urbana ou rural. Obrigatório para exportação INEP.';
COMMENT ON COLUMN public.schools.dependencia_administrativa IS 'Código INEP de dependência administrativa: 1=Municipal, 2=Estadual, 3=Federal, 4=Privada. Obrigatório para exportação INEP.';
COMMENT ON COLUMN public.schools.localizacao IS 'Localização adicional da escola (opcional).';

-- Criar função para popular dependencia_administrativa a partir de tipo_escola
CREATE OR REPLACE FUNCTION public.sync_dependencia_from_tipo_escola()
RETURNS TRIGGER AS $$
BEGIN
  -- Se dependencia_administrativa não estiver preenchida, preencher baseado em tipo_escola
  IF NEW.dependencia_administrativa IS NULL AND NEW.tipo_escola IS NOT NULL THEN
    CASE NEW.tipo_escola
      WHEN 'Municipal' THEN NEW.dependencia_administrativa := 1;
      WHEN 'Estadual' THEN NEW.dependencia_administrativa := 2;
      WHEN 'Federal' THEN NEW.dependencia_administrativa := 3;
      WHEN 'Privada' THEN NEW.dependencia_administrativa := 4;
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronizar dependencia_administrativa
DROP TRIGGER IF EXISTS sync_dependencia_trigger ON public.schools;
CREATE TRIGGER sync_dependencia_trigger
  BEFORE INSERT OR UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_dependencia_from_tipo_escola();

-- Atualizar registros existentes que têm tipo_escola mas não têm dependencia_administrativa
UPDATE public.schools
SET dependencia_administrativa = CASE tipo_escola
  WHEN 'Municipal' THEN 1
  WHEN 'Estadual' THEN 2
  WHEN 'Federal' THEN 3
  WHEN 'Privada' THEN 4
  ELSE NULL
END
WHERE dependencia_administrativa IS NULL AND tipo_escola IS NOT NULL;

