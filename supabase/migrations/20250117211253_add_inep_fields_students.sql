-- Migration: Adicionar campos INEP na tabela students
-- Data: 2025-01-17
-- Descrição: Adiciona campos necessários para exportação INEP/Censo Escolar

-- Adicionar campo codigo_inep_aluno
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS codigo_inep_aluno text;

-- Criar índice único para codigo_inep_aluno (permitindo NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_codigo_inep_aluno_unique 
ON public.students(codigo_inep_aluno) 
WHERE codigo_inep_aluno IS NOT NULL;

-- Comentário na coluna
COMMENT ON COLUMN public.students.codigo_inep_aluno IS 'Código INEP do aluno (12 dígitos). Opcional, mas necessário para exportação INEP completa.';

-- Verificar se naturalidade já existe (já existe na estrutura atual)
-- Se não existir, adicionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'naturalidade'
  ) THEN
    ALTER TABLE public.students ADD COLUMN naturalidade text;
    COMMENT ON COLUMN public.students.naturalidade IS 'Naturalidade do aluno (município de nascimento).';
  END IF;
END $$;

