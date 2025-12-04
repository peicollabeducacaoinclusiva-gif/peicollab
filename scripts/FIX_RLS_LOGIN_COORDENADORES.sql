-- ============================================================================
-- FIX URGENTE: Permitir que coordenadores façam login
-- Data: 2025-11-05
-- Problema: RLS está bloqueando acesso aos profiles
-- ============================================================================

-- ============================================================================
-- PASSO 1: Verificar políticas atuais
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Políticas atuais em profiles:';
END $$;

SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- ============================================================================
-- PASSO 2: Permitir que usuários leiam seu próprio profile
-- ============================================================================

-- Dropar políticas antigas
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users" ON profiles;

-- Criar política que permite ler próprio profile
CREATE POLICY "authenticated_users_read_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================================
-- PASSO 3: Permitir que usuários atualizem seu próprio profile
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "authenticated_users_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PASSO 4: Permitir que novos usuários criem seu profile
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "authenticated_users_insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PASSO 5: Permitir que coordenadores vejam usuários da sua escola
-- ============================================================================

DROP POLICY IF EXISTS "Coordinators can view school users" ON profiles;

CREATE POLICY "coordinators_view_school_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Coordenador pode ver outros usuários da mesma escola
    school_id IN (
      SELECT school_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- PASSO 6: Garantir que RLS está habilitado
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- LOG
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Políticas RLS corrigidas!';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas criadas:';
  RAISE NOTICE '  1. ✅ authenticated_users_read_own_profile (SELECT)';
  RAISE NOTICE '  2. ✅ authenticated_users_update_own_profile (UPDATE)';
  RAISE NOTICE '  3. ✅ authenticated_users_insert_own_profile (INSERT)';
  RAISE NOTICE '  4. ✅ coordinators_view_school_profiles (SELECT escola)';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Agora coordenadores podem fazer login!';
  RAISE NOTICE '';
  RAISE NOTICE 'Teste com:';
  RAISE NOTICE '  📧 Email: calin3.estrela@gmail.com';
  RAISE NOTICE '  🔒 Senha: PeiCollab@2025';
END $$;

