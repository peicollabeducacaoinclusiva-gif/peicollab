-- Migration: Adicionar campos INEP na tabela student_enrollments
-- Data: 2025-01-17
-- Descrição: Adiciona campos necessários para exportação INEP/Censo Escolar

-- Adicionar campo codigo_inep_matricula
ALTER TABLE public.student_enrollments
  ADD COLUMN IF NOT EXISTS codigo_inep_matricula text;

-- Comentário na coluna
COMMENT ON COLUMN public.student_enrollments.codigo_inep_matricula IS 'Código INEP da matrícula (até 20 caracteres). Opcional, mas necessário para exportação INEP completa.';

