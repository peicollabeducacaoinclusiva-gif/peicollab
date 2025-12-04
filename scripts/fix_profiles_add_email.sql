-- ============================================================================
-- FIX: Adicionar coluna email em profiles
-- Data: 2025-11-05
-- ============================================================================

-- Adicionar coluna email (se não existir)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Criar índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Sincronizar emails existentes de auth.users
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
AND p.email IS NULL;

-- Comentário
COMMENT ON COLUMN profiles.email IS 'Email do usuário (sincronizado de auth.users)';

DO $$
BEGIN
  RAISE NOTICE '✅ Coluna email adicionada à tabela profiles';
  RAISE NOTICE '✅ Emails sincronizados de auth.users';
END $$;

