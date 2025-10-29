-- ============================================================================
-- PEI COLLAB - CORREÇÃO DE RELAÇÃO USER_ROLES
-- Corrige a relação entre profiles e user_roles
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VERIFICAR E CORRIGIR A TABELA USER_ROLES
-- ----------------------------------------------------------------------------

-- Garantir que a tabela user_roles existe com a estrutura correta
CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "role" "public"."user_role" NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("user_id", "role")
);

-- ----------------------------------------------------------------------------
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ----------------------------------------------------------------------------

-- Índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON "public"."user_roles"("user_id");

-- Índice para busca por role
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON "public"."user_roles"("role");

-- ----------------------------------------------------------------------------
-- 3. CRIAR FUNÇÃO PARA MIGRAR DADOS EXISTENTES
-- ----------------------------------------------------------------------------

-- Função para migrar roles existentes da tabela profiles para user_roles
CREATE OR REPLACE FUNCTION "public"."migrate_profiles_roles_to_user_roles"()
RETURNS void AS $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Verificar se ainda existe a coluna role na tabela profiles
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        -- Migrar dados existentes
        FOR profile_record IN 
            SELECT id, role FROM "public"."profiles" 
            WHERE role IS NOT NULL
        LOOP
            -- Inserir role na tabela user_roles se não existir
            INSERT INTO "public"."user_roles" (user_id, role)
            VALUES (profile_record.id, profile_record.role)
            ON CONFLICT (user_id, role) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Roles migrados da tabela profiles para user_roles';
    ELSE
        RAISE NOTICE 'Coluna role não encontrada na tabela profiles - migração já foi feita';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 4. EXECUTAR MIGRAÇÃO DE DADOS
-- ----------------------------------------------------------------------------

-- Executar a migração
SELECT "public"."migrate_profiles_roles_to_user_roles"();

-- ----------------------------------------------------------------------------
-- 5. CRIAR FUNÇÕES RPC PARA COMPATIBILIDADE
-- ----------------------------------------------------------------------------

-- Função para obter o role principal de um usuário
CREATE OR REPLACE FUNCTION "public"."get_user_primary_role"(_user_id uuid)
RETURNS text AS $$
DECLARE
    primary_role text;
BEGIN
    SELECT role INTO primary_role
    FROM "public"."user_roles"
    WHERE user_id = _user_id
    ORDER BY 
        CASE role
            WHEN 'superadmin' THEN 1
            WHEN 'education_secretary' THEN 2
            WHEN 'school_director' THEN 3
            WHEN 'coordinator' THEN 4
            WHEN 'teacher' THEN 5
            WHEN 'aee_teacher' THEN 6
            WHEN 'specialist' THEN 7
            WHEN 'family' THEN 8
            ELSE 9
        END
    LIMIT 1;
    
    RETURN COALESCE(primary_role, 'teacher');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário tem um role específico
CREATE OR REPLACE FUNCTION "public"."has_role"(_user_id uuid, _role text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "public"."user_roles"
        WHERE user_id = _user_id AND role = _role::user_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter tenant do usuário
CREATE OR REPLACE FUNCTION "public"."get_user_tenant_safe"(_user_id uuid)
RETURNS uuid AS $$
DECLARE
    tenant_id uuid;
BEGIN
    -- Primeiro, tentar buscar tenant_id direto do profile
    SELECT p.tenant_id INTO tenant_id
    FROM "public"."profiles" p
    WHERE p.id = _user_id;
    
    -- Se não encontrou, buscar via school_id
    IF tenant_id IS NULL THEN
        SELECT s.tenant_id INTO tenant_id
        FROM "public"."profiles" p
        JOIN "public"."schools" s ON s.id = p.school_id
        WHERE p.id = _user_id;
    END IF;
    
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter school_id do usuário
CREATE OR REPLACE FUNCTION "public"."get_user_school_id"(_user_id uuid)
RETURNS uuid AS $$
DECLARE
    school_id uuid;
BEGIN
    SELECT p.school_id INTO school_id
    FROM "public"."profiles" p
    WHERE p.id = _user_id;
    
    RETURN school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter tenant_id de uma escola
CREATE OR REPLACE FUNCTION "public"."get_school_tenant_id"(_school_id uuid)
RETURNS uuid AS $$
DECLARE
    tenant_id uuid;
BEGIN
    SELECT s.tenant_id INTO tenant_id
    FROM "public"."schools" s
    WHERE s.id = _school_id;
    
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar acesso a escola
CREATE OR REPLACE FUNCTION "public"."user_has_school_access"(_user_id uuid, _school_id uuid)
RETURNS boolean AS $$
DECLARE
    user_tenant_id uuid;
    school_tenant_id uuid;
    user_school_id uuid;
BEGIN
    -- Superadmin tem acesso a tudo
    IF "public"."has_role"(_user_id, 'superadmin') THEN
        RETURN true;
    END IF;
    
    -- Education secretary tem acesso a escolas da sua rede
    IF "public"."has_role"(_user_id, 'education_secretary') THEN
        user_tenant_id := "public"."get_user_tenant_safe"(_user_id);
        school_tenant_id := "public"."get_school_tenant_id"(_school_id);
        RETURN user_tenant_id = school_tenant_id;
    END IF;
    
    -- School director tem acesso apenas à sua escola
    IF "public"."has_role"(_user_id, 'school_director') THEN
        user_school_id := "public"."get_user_school_id"(_user_id);
        RETURN user_school_id = _school_id;
    END IF;
    
    -- Outros roles têm acesso baseado em student_access
    RETURN EXISTS (
        SELECT 1 FROM "public"."student_access" sa
        JOIN "public"."students" st ON st.id = sa.student_id
        WHERE sa.user_id = _user_id AND st.school_id = _school_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar acesso a PEI
CREATE OR REPLACE FUNCTION "public"."user_can_access_pei"(_user_id uuid, _pei_id uuid)
RETURNS boolean AS $$
DECLARE
    pei_student_id uuid;
    pei_school_id uuid;
BEGIN
    -- Buscar informações do PEI
    SELECT p.student_id, st.school_id INTO pei_student_id, pei_school_id
    FROM "public"."peis" p
    JOIN "public"."students" st ON st.id = p.student_id
    WHERE p.id = _pei_id;
    
    -- Verificar acesso baseado no role
    IF "public"."has_role"(_user_id, 'superadmin') THEN
        RETURN true;
    END IF;
    
    IF "public"."has_role"(_user_id, 'education_secretary') THEN
        RETURN "public"."user_has_school_access"(_user_id, pei_school_id);
    END IF;
    
    IF "public"."has_role"(_user_id, 'school_director') THEN
        RETURN "public"."user_has_school_access"(_user_id, pei_school_id);
    END IF;
    
    -- Outros roles: verificar student_access
    RETURN EXISTS (
        SELECT 1 FROM "public"."student_access" sa
        WHERE sa.user_id = _user_id AND sa.student_id = pei_student_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se pode gerenciar rede
CREATE OR REPLACE FUNCTION "public"."can_manage_network"(_user_id uuid, _tenant_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Superadmin pode gerenciar qualquer rede
    IF "public"."has_role"(_user_id, 'superadmin') THEN
        RETURN true;
    END IF;
    
    -- Education secretary pode gerenciar sua rede
    IF "public"."has_role"(_user_id, 'education_secretary') THEN
        RETURN "public"."get_user_tenant_safe"(_user_id) = _tenant_id;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 6. CRIAR VIEW DE COMPATIBILIDADE
-- ----------------------------------------------------------------------------

-- View para compatibilidade com código antigo
CREATE OR REPLACE VIEW "public"."profiles_with_legacy_role" AS
SELECT 
    p.*,
    (SELECT ur.role FROM "public"."user_roles" ur WHERE ur.user_id = p.id ORDER BY ur.role LIMIT 1) as legacy_role
FROM "public"."profiles" p;

-- ----------------------------------------------------------------------------
-- 7. APLICAR RLS POLICIES
-- ----------------------------------------------------------------------------

-- Habilitar RLS na tabela user_roles
ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;

-- Policy para user_roles: usuários podem ver seus próprios roles
CREATE POLICY "Users can view their own roles" ON "public"."user_roles"
    FOR SELECT USING (auth.uid() = user_id);

-- Policy para user_roles: superadmin pode ver todos os roles
CREATE POLICY "Superadmin can view all roles" ON "public"."user_roles"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
        )
    );

-- Policy para user_roles: education_secretary pode ver roles da sua rede
CREATE POLICY "Education secretary can view network roles" ON "public"."user_roles"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            JOIN "public"."profiles" p ON p.id = ur.user_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'education_secretary'
            AND p.tenant_id = (
                SELECT p2.tenant_id FROM "public"."profiles" p2 
                WHERE p2.id = user_roles.user_id
            )
        )
    );

-- ----------------------------------------------------------------------------
-- 8. VERIFICAÇÃO FINAL
-- ----------------------------------------------------------------------------

-- Verificar se a migração foi bem-sucedida
DO $$
BEGIN
    -- Verificar se a tabela user_roles existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Tabela user_roles não foi criada';
    END IF;
    
    -- Verificar se as funções RPC existem
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_primary_role' AND routine_schema = 'public') THEN
        RAISE EXCEPTION 'Função get_user_primary_role não foi criada';
    END IF;
    
    RAISE NOTICE 'Migração de user_roles concluída com sucesso!';
END $$;


