-- Adicionar novos tipos de usuário ao enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'aee_teacher';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'school_manager';