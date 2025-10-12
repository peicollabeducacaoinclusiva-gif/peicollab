-- Adicionar colunas para nome do pai e da mãe na tabela students
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS mother_name TEXT;