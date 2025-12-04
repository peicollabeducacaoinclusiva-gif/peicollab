-- Migration: Adicionar campos INEP na tabela professionals
-- Data: 2025-01-17
-- Descrição: Adiciona campos necessários para exportação INEP/Censo Escolar

-- Adicionar campos INEP em professionals
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS codigo_inep_servidor text,
  ADD COLUMN IF NOT EXISTS carga_horaria_semanal integer CHECK (carga_horaria_semanal IS NULL OR carga_horaria_semanal > 0);

-- Criar índice único para codigo_inep_servidor (permitindo NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_professionals_codigo_inep_servidor_unique 
ON public.professionals(codigo_inep_servidor) 
WHERE codigo_inep_servidor IS NOT NULL;

-- Verificar se regime_trabalho já existe
-- Se não existir, adicionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professionals' 
    AND column_name = 'regime_trabalho'
  ) THEN
    ALTER TABLE public.professionals 
    ADD COLUMN regime_trabalho text 
    CHECK (regime_trabalho IS NULL OR regime_trabalho IN ('20h', '30h', '40h', 'Dedicação Exclusiva'));
    
    COMMENT ON COLUMN public.professionals.regime_trabalho IS 'Regime de trabalho do profissional (20h, 30h, 40h, Dedicação Exclusiva).';
  END IF;
END $$;

-- Comentários nas colunas
COMMENT ON COLUMN public.professionals.codigo_inep_servidor IS 'Código INEP do servidor/profissional (12 dígitos). Opcional, mas necessário para exportação INEP completa.';
COMMENT ON COLUMN public.professionals.carga_horaria_semanal IS 'Carga horária semanal do profissional em horas. Usado para exportação INEP.';

-- Criar função para popular carga_horaria_semanal a partir de regime_trabalho
CREATE OR REPLACE FUNCTION public.sync_carga_horaria_from_regime()
RETURNS TRIGGER AS $$
BEGIN
  -- Se carga_horaria_semanal não estiver preenchida, preencher baseado em regime_trabalho
  IF NEW.carga_horaria_semanal IS NULL AND NEW.regime_trabalho IS NOT NULL THEN
    CASE NEW.regime_trabalho
      WHEN '20h' THEN NEW.carga_horaria_semanal := 20;
      WHEN '30h' THEN NEW.carga_horaria_semanal := 30;
      WHEN '40h' THEN NEW.carga_horaria_semanal := 40;
      WHEN 'Dedicação Exclusiva' THEN NEW.carga_horaria_semanal := 40;
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronizar carga_horaria_semanal
DROP TRIGGER IF EXISTS sync_carga_horaria_trigger ON public.professionals;
CREATE TRIGGER sync_carga_horaria_trigger
  BEFORE INSERT OR UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_carga_horaria_from_regime();

-- Atualizar registros existentes que têm regime_trabalho mas não têm carga_horaria_semanal
UPDATE public.professionals
SET carga_horaria_semanal = CASE regime_trabalho
  WHEN '20h' THEN 20
  WHEN '30h' THEN 30
  WHEN '40h' THEN 40
  WHEN 'Dedicação Exclusiva' THEN 40
  ELSE NULL
END
WHERE carga_horaria_semanal IS NULL AND regime_trabalho IS NOT NULL;

