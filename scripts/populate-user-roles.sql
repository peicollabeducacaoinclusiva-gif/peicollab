-- ============================================================================
-- PEI COLLAB - POPULAR TABELA USER_ROLES
-- Script para popular a tabela user_roles com dados existentes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VERIFICAR E MIGRAR DADOS EXISTENTES
-- ----------------------------------------------------------------------------

-- Verificar se ainda existe a coluna role na tabela profiles
DO $$
BEGIN
    -- Se a coluna role ainda existe, migrar os dados
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        -- Migrar roles existentes
        INSERT INTO "public"."user_roles" (user_id, role)
        SELECT id, role FROM "public"."profiles" 
        WHERE role IS NOT NULL
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Roles migrados da tabela profiles para user_roles';
    ELSE
        RAISE NOTICE 'Coluna role não encontrada - criando roles padrão';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. CRIAR ROLES PADRÃO PARA PROFILES SEM ROLES
-- ----------------------------------------------------------------------------

-- Inserir role 'teacher' para profiles que não têm user_roles
INSERT INTO "public"."user_roles" (user_id, role)
SELECT p.id, 'teacher'
FROM "public"."profiles" p
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."user_roles" ur 
    WHERE ur.user_id = p.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. CRIAR ROLES BASEADOS NA ESTRUTURA DO PERFIL
-- ----------------------------------------------------------------------------

-- Atualizar roles baseado na estrutura do perfil
UPDATE "public"."user_roles" 
SET role = 'education_secretary'
WHERE user_id IN (
    SELECT id FROM "public"."profiles" 
    WHERE tenant_id IS NOT NULL 
    AND school_id IS NULL
    AND id NOT IN (
        SELECT user_id FROM "public"."user_roles" 
        WHERE role = 'superadmin'
    )
);

-- Atualizar roles para school_director (primeiro usuário de cada escola)
UPDATE "public"."user_roles" 
SET role = 'school_director'
WHERE user_id IN (
    SELECT DISTINCT ON (school_id) id
    FROM "public"."profiles" 
    WHERE school_id IS NOT NULL
    ORDER BY school_id, created_at ASC
);

-- ----------------------------------------------------------------------------
-- 4. CRIAR USUÁRIOS DE TESTE SE NÃO HOUVER DADOS
-- ----------------------------------------------------------------------------

-- Verificar se há dados na tabela user_roles
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM "public"."user_roles";
    
    IF user_count = 0 THEN
        RAISE NOTICE 'Nenhum usuário encontrado. Criando usuários de teste...';
        
        -- Criar tenant de teste
        INSERT INTO "public"."tenants" (id, network_name, created_at)
        VALUES ('test-tenant-id', 'Rede de Ensino Teste', NOW())
        ON CONFLICT (id) DO NOTHING;
        
        -- Criar escola de teste
        INSERT INTO "public"."schools" (id, school_name, tenant_id, created_at)
        VALUES ('test-school-id', 'Escola Teste', 'test-tenant-id', NOW())
        ON CONFLICT (id) DO NOTHING;
        
        -- Criar profiles de teste
        INSERT INTO "public"."profiles" (id, full_name, tenant_id, school_id, is_active, created_at)
        VALUES 
            ('test-admin-id', 'Administrador Sistema', NULL, NULL, true, NOW()),
            ('test-secretary-id', 'Secretário de Educação', 'test-tenant-id', NULL, true, NOW()),
            ('test-director-id', 'Diretor da Escola', NULL, 'test-school-id', true, NOW()),
            ('test-teacher-id', 'Professor da Escola', NULL, 'test-school-id', true, NOW())
        ON CONFLICT (id) DO NOTHING;
        
        -- Criar roles de teste
        INSERT INTO "public"."user_roles" (user_id, role)
        VALUES 
            ('test-admin-id', 'superadmin'),
            ('test-secretary-id', 'education_secretary'),
            ('test-director-id', 'school_director'),
            ('test-teacher-id', 'teacher')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Usuários de teste criados com sucesso!';
    ELSE
        RAISE NOTICE 'Usuários encontrados: %', user_count;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. VERIFICAÇÃO FINAL
-- ----------------------------------------------------------------------------

-- Mostrar estatísticas
SELECT 
    'Total de usuários' as metric,
    COUNT(*) as value
FROM "public"."user_roles"
UNION ALL
SELECT 
    'Usuários por role' as metric,
    COUNT(*) as value
FROM "public"."user_roles"
GROUP BY role
ORDER BY metric, value DESC;

-- Mostrar detalhes dos usuários
SELECT 
    p.full_name,
    p.tenant_id,
    p.school_id,
    ur.role,
    CASE 
        WHEN p.tenant_id IS NOT NULL AND p.school_id IS NULL THEN 'Network Admin'
        WHEN p.school_id IS NOT NULL THEN 'School User'
        ELSE 'Global Admin'
    END as user_type
FROM "public"."profiles" p
JOIN "public"."user_roles" ur ON ur.user_id = p.id
ORDER BY ur.role, p.full_name;

-- ----------------------------------------------------------------------------
-- 6. LIMPEZA (OPCIONAL)
-- ----------------------------------------------------------------------------

-- Remover coluna role da tabela profiles se ainda existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "public"."profiles" DROP COLUMN "role";
        RAISE NOTICE 'Coluna role removida da tabela profiles';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. MENSAGEM FINAL
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ Tabela user_roles populada com sucesso!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '📋 Próximos passos:';
    RAISE NOTICE '1. Reinicie a aplicação';
    RAISE NOTICE '2. Teste o login no admin';
    RAISE NOTICE '3. Verifique se os dashboards estão funcionando';
    RAISE NOTICE '==================================================';
END $$;


