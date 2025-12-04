-- ============================================================================
-- MIGRAÇÃO: Limpar usuários do banco, mantendo apenas o superadmin
-- Data: 21/02/2025
-- Descrição: Remove todos os usuários exceto o superadmin peicollabeducacaoinclusiva@gmail.com
-- ============================================================================

DO $$
DECLARE
  v_superadmin_id uuid;
  v_superadmin_email text := 'peicollabeducacaoinclusiva@gmail.com';
  v_deleted_count integer;
BEGIN
  -- Encontrar o ID do superadmin pelo email
  SELECT id INTO v_superadmin_id
  FROM auth.users
  WHERE email = v_superadmin_email;
  
  IF v_superadmin_id IS NULL THEN
    RAISE EXCEPTION 'Superadmin não encontrado com email: %', v_superadmin_email;
  END IF;
  
  RAISE NOTICE 'Superadmin encontrado: % (ID: %)', v_superadmin_email, v_superadmin_id;
  
  -- IMPORTANTE: Ordem de deleção para evitar violações de foreign key
  -- Deletar em ordem reversa das dependências
  
  -- 1. Deletar dados relacionados em tabelas que referenciam users/profiles
  -- (Ordem: das mais específicas para as mais gerais)
  
  -- Deletar de tabelas que referenciam user_id (auth.users)
  DELETE FROM public.pei_meeting_participants WHERE user_id != v_superadmin_id;
  DELETE FROM public.student_access WHERE user_id != v_superadmin_id;
  DELETE FROM public.support_professional_students WHERE support_professional_id != v_superadmin_id;
  DELETE FROM public.support_professional_feedbacks WHERE support_professional_id != v_superadmin_id;
  DELETE FROM public.blog_comments WHERE user_id != v_superadmin_id;
  DELETE FROM public.blog_post_likes WHERE user_id != v_superadmin_id;
  DELETE FROM public.import_configs WHERE created_by != v_superadmin_id;
  DELETE FROM public.import_batches WHERE created_by != v_superadmin_id;
  DELETE FROM public.export_batches WHERE created_by != v_superadmin_id;
  DELETE FROM public.sso_codes WHERE user_id != v_superadmin_id;
  
  -- Deletar de tabelas que referenciam profiles (teacher_id, author_id, etc.)
  DELETE FROM public.pei_teachers WHERE teacher_id != v_superadmin_id;
  DELETE FROM public.class_teachers WHERE teacher_id != v_superadmin_id;
  DELETE FROM public.student_enrollments WHERE teacher_id != v_superadmin_id;
  DELETE FROM public.family_access_tokens WHERE created_by != v_superadmin_id;
  DELETE FROM public.communications WHERE author_id != v_superadmin_id;
  DELETE FROM public.communication_reads WHERE user_id != v_superadmin_id;
  DELETE FROM public.messages WHERE from_user_id != v_superadmin_id OR to_user_id != v_superadmin_id;
  DELETE FROM public.events WHERE organizer_id != v_superadmin_id;
  DELETE FROM public.class_diary_entries WHERE teacher_id != v_superadmin_id;
  DELETE FROM public.plano_aee_comments WHERE user_id != v_superadmin_id;
  
  -- Deletar PEIs criados por outros usuários (mas manter os dados dos alunos)
  -- Apenas limpar referências, não deletar os PEIs
  UPDATE public.peis SET created_by = v_superadmin_id WHERE created_by != v_superadmin_id;
  UPDATE public.peis SET assigned_teacher_id = NULL WHERE assigned_teacher_id != v_superadmin_id;
  
  -- Deletar user_roles de todos os outros usuários (exceto superadmin)
  DELETE FROM public.user_roles
  WHERE user_id != v_superadmin_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'User roles deletados: %', v_deleted_count;
  
  -- Deletar user_tenants de todos os outros usuários (exceto superadmin)
  DELETE FROM public.user_tenants
  WHERE user_id != v_superadmin_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'User tenants deletados: %', v_deleted_count;
  
  -- Deletar user_schools de todos os outros usuários (exceto superadmin)
  DELETE FROM public.user_schools
  WHERE user_id != v_superadmin_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'User schools deletados: %', v_deleted_count;
  
  -- Deletar profiles de todos os outros usuários (exceto superadmin)
  -- Isso vai cascatear para outras tabelas relacionadas se houver CASCADE
  DELETE FROM public.profiles
  WHERE id != v_superadmin_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'Profiles deletados: %', v_deleted_count;
  
  -- Deletar usuários do auth.users (exceto superadmin)
  -- IMPORTANTE: Isso deve ser feito por último, pois pode ter dependências
  -- Usar CASCADE se necessário, mas com cuidado
  DELETE FROM auth.users
  WHERE id != v_superadmin_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'Usuários deletados do auth.users: %', v_deleted_count;
  
  -- 6. Verificar se o superadmin ainda existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_superadmin_id) THEN
    RAISE EXCEPTION 'ERRO: Superadmin foi deletado acidentalmente!';
  END IF;
  
  -- 7. Garantir que o superadmin tem o role correto
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_superadmin_id 
    AND role = 'superadmin'::user_role
  ) THEN
    -- Adicionar role superadmin se não existir
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_superadmin_id, 'superadmin'::user_role)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Role superadmin adicionado ao usuário';
  END IF;
  
  RAISE NOTICE '✅ Limpeza concluída! Apenas o superadmin foi mantido.';
  
END $$;

-- Verificação final
DO $$
DECLARE
  v_total_users integer;
  v_superadmin_email text := 'peicollabeducacaoinclusiva@gmail.com';
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM auth.users;
  
  IF v_total_users != 1 THEN
    RAISE WARNING 'Atenção: Total de usuários após limpeza: % (esperado: 1)', v_total_users;
  ELSE
    RAISE NOTICE '✅ Verificação: Apenas 1 usuário no banco (superadmin)';
  END IF;
  
  -- Verificar se o superadmin existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_superadmin_email) THEN
    RAISE EXCEPTION 'ERRO CRÍTICO: Superadmin não encontrado após limpeza!';
  END IF;
  
  RAISE NOTICE '✅ Superadmin verificado: %', v_superadmin_email;
END $$;

