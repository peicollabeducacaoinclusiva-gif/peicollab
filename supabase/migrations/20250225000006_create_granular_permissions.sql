-- ============================================================================
-- MIGRAÇÃO: Camada de Permissões Granular
-- Data: 25/02/2025
-- Descrição: Criar tabelas para permissões granulares por papel, módulo e recurso
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Permissões por Papel
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "role" text NOT NULL,
    "module" text NOT NULL,
    "permission" text NOT NULL,
    "resource_type" text,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("role", "module", "permission", "resource_type")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_role_permissions_role" ON "public"."role_permissions"("role");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_module" ON "public"."role_permissions"("module");

-- ============================================================================
-- PARTE 2: Tabela de Permissões por Usuário
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "resource_type" text NOT NULL,
    "resource_id" uuid,
    "permission" text NOT NULL,
    "granted_by" uuid REFERENCES "auth"."users"("id"),
    "granted_at" timestamptz DEFAULT now(),
    "expires_at" timestamptz,
    UNIQUE("user_id", "resource_type", "resource_id", "permission")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_user_permissions_user" ON "public"."user_permissions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_permissions_resource" ON "public"."user_permissions"("resource_type", "resource_id");
CREATE INDEX IF NOT EXISTS "idx_user_permissions_permission" ON "public"."user_permissions"("permission");

-- ============================================================================
-- PARTE 3: Tabela de Configuração LGPD (Ocultação de Dados Sensíveis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."lgpd_data_visibility" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "role" text NOT NULL,
    "data_field" text NOT NULL,
    "visible" boolean DEFAULT true,
    "masked" boolean DEFAULT false,
    "mask_pattern" text,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("role", "data_field")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_lgpd_data_visibility_role" ON "public"."lgpd_data_visibility"("role");

-- ============================================================================
-- PARTE 4: Função para verificar permissão
-- ============================================================================

CREATE OR REPLACE FUNCTION has_permission(
    p_user_id uuid,
    p_permission text,
    p_resource_type text DEFAULT NULL,
    p_resource_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_user_role text;
    v_has_role_permission boolean;
    v_has_user_permission boolean;
BEGIN
    -- Buscar papel do usuário
    SELECT get_user_primary_role(p_user_id) INTO v_user_role;

    -- Verificar permissão por papel
    IF p_resource_type IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1
            FROM "public"."role_permissions"
            WHERE role = v_user_role
            AND permission = p_permission
            AND (resource_type = p_resource_type OR resource_type IS NULL)
        ) INTO v_has_role_permission;
    ELSE
        SELECT EXISTS (
            SELECT 1
            FROM "public"."role_permissions"
            WHERE role = v_user_role
            AND permission = p_permission
        ) INTO v_has_role_permission;
    END IF;

    -- Verificar permissão específica do usuário
    IF p_resource_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1
            FROM "public"."user_permissions"
            WHERE user_id = p_user_id
            AND permission = p_permission
            AND resource_type = p_resource_type
            AND resource_id = p_resource_id
            AND (expires_at IS NULL OR expires_at > now())
        ) INTO v_has_user_permission;
    ELSE
        SELECT EXISTS (
            SELECT 1
            FROM "public"."user_permissions"
            WHERE user_id = p_user_id
            AND permission = p_permission
            AND resource_type = p_resource_type
            AND (expires_at IS NULL OR expires_at > now())
        ) INTO v_has_user_permission;
    END IF;

    RETURN v_has_role_permission OR v_has_user_permission;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 5: Inserir permissões padrão por papel
-- ============================================================================

-- Permissões para Secretaria
INSERT INTO "public"."role_permissions" (role, module, permission, resource_type)
VALUES
    ('secretary', 'students', 'view', NULL),
    ('secretary', 'students', 'create', NULL),
    ('secretary', 'students', 'update', NULL),
    ('secretary', 'students', 'delete', NULL),
    ('secretary', 'declarations', 'view', NULL),
    ('secretary', 'declarations', 'create', NULL),
    ('secretary', 'history', 'view', NULL),
    ('secretary', 'history', 'create', NULL),
    ('secretary', 'history', 'update', NULL),
    ('secretary', 'enrollment', 'view', NULL),
    ('secretary', 'enrollment', 'create', NULL),
    ('secretary', 'enrollment', 'update', NULL),
    ('secretary', 'documents', 'view', NULL),
    ('secretary', 'documents', 'create', NULL),
    ('secretary', 'documents', 'update', NULL),
    ('secretary', 'documents', 'delete', NULL)
ON CONFLICT DO NOTHING;

-- Permissões para Coordenação
INSERT INTO "public"."role_permissions" (role, module, permission, resource_type)
VALUES
    ('coordination', 'students', 'view', NULL),
    ('coordination', 'students', 'update', NULL),
    ('coordination', 'classes', 'view', NULL),
    ('coordination', 'classes', 'create', NULL),
    ('coordination', 'classes', 'update', NULL),
    ('coordination', 'pei', 'view', NULL),
    ('coordination', 'pei', 'approve', NULL),
    ('coordination', 'pei', 'return', NULL),
    ('coordination', 'aee', 'view', NULL),
    ('coordination', 'reports', 'view', NULL),
    ('coordination', 'reports', 'create', NULL)
ON CONFLICT DO NOTHING;

-- Permissões para Professor
INSERT INTO "public"."role_permissions" (role, module, permission, resource_type)
VALUES
    ('teacher', 'students', 'view', 'class'),
    ('teacher', 'classes', 'view', 'assigned'),
    ('teacher', 'diary', 'view', NULL),
    ('teacher', 'diary', 'create', NULL),
    ('teacher', 'diary', 'update', 'own'),
    ('teacher', 'grades', 'view', NULL),
    ('teacher', 'grades', 'create', NULL),
    ('teacher', 'grades', 'update', 'own'),
    ('teacher', 'pei', 'view', 'assigned'),
    ('teacher', 'pei', 'update', 'assigned'),
    ('teacher', 'planning', 'view', NULL),
    ('teacher', 'planning', 'create', NULL),
    ('teacher', 'planning', 'update', 'own')
ON CONFLICT DO NOTHING;

-- Permissões para AEE
INSERT INTO "public"."role_permissions" (role, module, permission, resource_type)
VALUES
    ('aee', 'students', 'view', 'aee_students'),
    ('aee', 'pei', 'view', 'aee_students'),
    ('aee', 'pei', 'update', 'aee_students'),
    ('aee', 'aee', 'view', NULL),
    ('aee', 'aee', 'create', NULL),
    ('aee', 'aee', 'update', NULL),
    ('aee', 'aee', 'delete', NULL),
    ('aee', 'sessions', 'view', NULL),
    ('aee', 'sessions', 'create', NULL),
    ('aee', 'sessions', 'update', NULL)
ON CONFLICT DO NOTHING;

-- Permissões para Direção
INSERT INTO "public"."role_permissions" (role, module, permission, resource_type)
VALUES
    ('director', 'students', 'view', NULL),
    ('director', 'classes', 'view', NULL),
    ('director', 'professionals', 'view', NULL),
    ('director', 'pei', 'view', NULL),
    ('director', 'pei', 'approve', NULL),
    ('director', 'aee', 'view', NULL),
    ('director', 'reports', 'view', NULL),
    ('director', 'reports', 'create', NULL),
    ('director', 'dashboard', 'view', NULL)
ON CONFLICT DO NOTHING;

-- Permissões para Família
INSERT INTO "public"."role_permissions" (role, module, permission, resource_type)
VALUES
    ('family', 'students', 'view', 'own_children'),
    ('family', 'pei', 'view', 'own_children'),
    ('family', 'aee', 'view', 'own_children'),
    ('family', 'grades', 'view', 'own_children'),
    ('family', 'attendance', 'view', 'own_children'),
    ('family', 'observations', 'create', 'own_children')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 6: Configuração LGPD - Ocultação de Dados Sensíveis
-- ============================================================================

-- Configurações padrão de visibilidade
INSERT INTO "public"."lgpd_data_visibility" (role, data_field, visible, masked, mask_pattern)
VALUES
    -- Professor não vê dados sensíveis completos
    ('teacher', 'cpf', false, true, '***.***.***-**'),
    ('teacher', 'rg', false, true, '**.***.***-*'),
    ('teacher', 'mother_name', true, false, NULL),
    ('teacher', 'father_name', true, false, NULL),
    ('teacher', 'phone', false, true, '(**) ****-****'),
    ('teacher', 'email', true, false, NULL),
    ('teacher', 'address', false, true, NULL),
    -- Família não vê diagnóstico completo
    ('family', 'diagnosis', false, true, NULL),
    ('family', 'cid10', false, true, NULL),
    ('family', 'medical_history', false, true, NULL),
    -- AEE vê dados educacionais mas não médicos completos
    ('aee', 'cpf', false, true, '***.***.***-**'),
    ('aee', 'medical_history', false, true, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 7: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."role_permissions" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."user_permissions" TO authenticated;
GRANT SELECT ON "public"."lgpd_data_visibility" TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission(uuid, text, text, uuid) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."role_permissions" IS 'Permissões padrão por papel e módulo';
COMMENT ON TABLE "public"."user_permissions" IS 'Permissões específicas por usuário';
COMMENT ON TABLE "public"."lgpd_data_visibility" IS 'Configuração de visibilidade de dados sensíveis (LGPD)';
COMMENT ON FUNCTION has_permission(uuid, text, text, uuid) IS 'Verifica se usuário tem permissão específica';

