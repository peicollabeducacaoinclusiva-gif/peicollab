-- Migration: Add phone column to profiles
-- Created: 2025-02-03
-- Description: Adiciona campo de telefone aos perfis de usuário

-- Adicionar coluna phone se não existir
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Comentário
COMMENT ON COLUMN profiles.phone IS 'Telefone de contato do usuário';

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Campo phone adicionado à tabela profiles';
END $$;






































