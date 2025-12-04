-- ============================================================================
-- FIX: RLS Policies para Profiles - Permitir Criação Automática
-- Data: 2025-11-05
-- ============================================================================

-- Verificar políticas atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- SOLUÇÃO: Permitir que usuários autenticados criem seu próprio profile
-- ============================================================================

-- Dropar política antiga se existir
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Criar política que permite usuário criar seu próprio profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Permitir que usuários atualizem seu próprio profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permitir que usuários leiam seu próprio profile
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;

CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Permitir que superadmin veja todos
DROP POLICY IF EXISTS "Superadmin can manage all profiles" ON profiles;

CREATE POLICY "Superadmin can manage all profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- ============================================================================
-- LOG
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS atualizadas!';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas criadas:';
  RAISE NOTICE '  1. ✅ Users can insert their own profile';
  RAISE NOTICE '  2. ✅ Users can update their own profile';
  RAISE NOTICE '  3. ✅ Users can read their own profile';
  RAISE NOTICE '  4. ✅ Superadmin can manage all profiles';
  RAISE NOTICE '';
  RAISE NOTICE 'Agora coordenadores podem fazer login!';
END $$;

