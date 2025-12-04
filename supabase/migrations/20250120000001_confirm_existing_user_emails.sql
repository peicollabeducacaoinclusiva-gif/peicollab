-- Migração: Confirmar emails de usuários existentes
-- Este script confirma os emails de todos os usuários que ainda não têm email confirmado
-- Isso garante consistência após remover a necessidade de confirmação por email

-- Atualizar email_confirmed_at para usuários que não têm confirmação
-- mas que têm um email válido
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE 
  email IS NOT NULL 
  AND email != ''
  AND (email_confirmed_at IS NULL OR email_confirmed_at < created_at);

-- Log da migração
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Migração concluída: % usuários tiveram seus emails confirmados', updated_count;
END $$;

-- Verificar se há usuários sem email confirmado após a migração
-- (apenas para auditoria, não bloqueia nada)
SELECT 
  COUNT(*) as usuarios_sem_email_confirmado
FROM auth.users
WHERE 
  email IS NOT NULL 
  AND email != ''
  AND email_confirmed_at IS NULL;

