-- Adicionar novos tipos de usuário ao enum (em transações separadas)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'aee_teacher') THEN
    ALTER TYPE user_role ADD VALUE 'aee_teacher';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'school_manager') THEN
    ALTER TYPE user_role ADD VALUE 'school_manager';
  END IF;
END $$;