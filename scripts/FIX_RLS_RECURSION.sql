-- ============================================================================
-- FIX URGENTE: Corrigir Recursão Infinita em RLS
-- Data: 2025-11-05
-- ============================================================================

-- DROPAR TODAS as políticas de profiles (incluindo as novas)
DROP POLICY IF EXISTS "authenticated_users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "authenticated_users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "authenticated_users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "coordinators_view_school_profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "superadmin_all_profiles" ON profiles;

-- Dropar TODAS as políticas existentes
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    RAISE NOTICE 'Dropada: %', r.policyname;
  END LOOP;
END $$;

-- ============================================================================
-- POLÍTICAS SIMPLES (SEM RECURSÃO)
-- ============================================================================

-- 1. Permitir que usuários leiam seu próprio profile
CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Permitir que usuários atualizem seu próprio profile
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Permitir que usuários criem seu próprio profile (no primeiro login)
CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Superadmin vê tudo
CREATE POLICY "superadmin_all_profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- ============================================================================
-- GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- LOG
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Recursão infinita corrigida!';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas RLS atualizadas:';
  RAISE NOTICE '  1. ✅ users_read_own_profile (SELECT próprio)';
  RAISE NOTICE '  2. ✅ users_update_own_profile (UPDATE próprio)';
  RAISE NOTICE '  3. ✅ users_insert_own_profile (INSERT próprio)';
  RAISE NOTICE '  4. ✅ superadmin_all_profiles (ALL para superadmin)';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Coordenadores agora podem fazer login!';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TESTE COM:';
  RAISE NOTICE '   📧 Email: calin3.estrela@gmail.com';
  RAISE NOTICE '   🔒 Senha: PeiCollab@2025';
END $$;

