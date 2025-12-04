-- Migration: Substituir SuperAdmin de teste pelo email real
-- Remove: superadmin@teste.com
-- Adiciona: peicollabeducacaoinclusiva@gmail.com

-- ============================================================================
-- 1. REMOVER SUPERADMIN DE TESTE
-- ============================================================================

-- Remover da tabela user_roles
DELETE FROM public.user_roles 
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Remover da tabela user_tenants
DELETE FROM public.user_tenants 
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Remover da tabela user_schools
DELETE FROM public.user_schools 
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Remover da tabela profiles
DELETE FROM public.profiles 
WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Remover da tabela auth.users
DELETE FROM auth.users 
WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;

-- ============================================================================
-- 2. CRIAR NOVO SUPERADMIN COM EMAIL REAL
-- ============================================================================

-- UUID para o novo superadmin
DO $$
DECLARE
  new_superadmin_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;
  default_tenant_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Inserir usuário no auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    new_superadmin_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'peicollabeducacaoinclusiva@gmail.com',
    crypt('Inclusao2025!', gen_salt('bf')), -- Senha padrão (MUDAR após primeiro login)
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "PEI Collab - Educação Inclusiva"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- Inserir perfil
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    tenant_id,
    school_id,
    is_active
  ) VALUES (
    new_superadmin_id,
    'PEI Collab - Educação Inclusiva',
    'peicollabeducacaoinclusiva@gmail.com',
    default_tenant_id,
    NULL, -- SuperAdmin não precisa escola específica
    true
  )
  ON CONFLICT (id) DO NOTHING;

  -- Adicionar role de superadmin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_superadmin_id, 'superadmin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Vincular a todos os tenants (ou apenas ao default)
  INSERT INTO public.user_tenants (user_id, tenant_id)
  SELECT new_superadmin_id, id 
  FROM public.tenants
  ON CONFLICT (user_id, tenant_id) DO NOTHING;

  RAISE NOTICE '✅ SuperAdmin criado com sucesso!';
  RAISE NOTICE '   Email: peicollabeducacaoinclusiva@gmail.com';
  RAISE NOTICE '   Senha padrão: Inclusao2025!';
  RAISE NOTICE '   ⚠️ IMPORTANTE: Altere a senha após o primeiro login!';
END $$;

-- ============================================================================
-- 3. ADICIONAR POLÍTICA RLS PARA SUPERADMIN (SE NÃO EXISTIR)
-- ============================================================================

-- Garantir que superadmin vê todos os alunos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' 
    AND policyname = 'superadmin_view_all_students'
  ) THEN
    EXECUTE 'CREATE POLICY "superadmin_view_all_students" ON public.students
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role = ''superadmin''
        )
      )';
    RAISE NOTICE '✅ Política RLS para superadmin criada';
  ELSE
    RAISE NOTICE 'ℹ️ Política RLS para superadmin já existe';
  END IF;
END $$;

-- Garantir que superadmin vê todos os profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'superadmin_see_all_profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "superadmin_see_all_profiles" ON public.profiles
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role = ''superadmin''
        )
      )';
    RAISE NOTICE '✅ Política RLS para superadmin (profiles) criada';
  ELSE
    RAISE NOTICE 'ℹ️ Política RLS para superadmin (profiles) já existe';
  END IF;
END $$;

-- Garantir que superadmin pode gerenciar alunos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' 
    AND policyname = 'superadmin_manage_all_students'
  ) THEN
    EXECUTE 'CREATE POLICY "superadmin_manage_all_students" ON public.students
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role = ''superadmin''
        )
      )';
    RAISE NOTICE '✅ Política RLS para superadmin gerenciar alunos criada';
  ELSE
    RAISE NOTICE 'ℹ️ Política RLS para superadmin gerenciar alunos já existe';
  END IF;
END $$;

-- ============================================================================
-- 4. VERIFICAÇÃO
-- ============================================================================

-- Mostrar informações do novo superadmin
DO $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'superadmin'
  AND p.email = 'peicollabeducacaoinclusiva@gmail.com';

  IF user_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SUPERADMIN CONFIGURADO COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '👑 Email: peicollabeducacaoinclusiva@gmail.com';
    RAISE NOTICE '🔑 Senha: Inclusao2025!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ IMPORTANTE:';
    RAISE NOTICE '   1. Altere a senha após o primeiro login';
    RAISE NOTICE '   2. Configure autenticação de 2 fatores';
    RAISE NOTICE '   3. Não compartilhe essas credenciais';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '❌ Erro ao criar superadmin';
  END IF;
END $$;

