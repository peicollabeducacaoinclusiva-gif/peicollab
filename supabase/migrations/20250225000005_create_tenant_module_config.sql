-- ============================================================================
-- MIGRAÇÃO: Módulo de Secretaria Pluggable
-- Data: 25/02/2025
-- Descrição: Criar tabela para configuração de módulos por tenant
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Configuração de Módulos
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."tenant_module_config" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "module_name" text NOT NULL,
    "enabled" boolean DEFAULT true,
    "config" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id"),
    UNIQUE("tenant_id", "module_name")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_tenant_module_config_tenant" ON "public"."tenant_module_config"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_tenant_module_config_module" ON "public"."tenant_module_config"("module_name");
CREATE INDEX IF NOT EXISTS "idx_tenant_module_config_enabled" ON "public"."tenant_module_config"("enabled");

-- ============================================================================
-- PARTE 2: Função para verificar se módulo está habilitado
-- ============================================================================

CREATE OR REPLACE FUNCTION is_module_enabled(p_tenant_id uuid, p_module_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM "public"."tenant_module_config"
        WHERE tenant_id = p_tenant_id
        AND module_name = p_module_name
        AND enabled = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 3: Inserir módulos padrão para tenants existentes
-- ============================================================================

-- Módulos disponíveis
INSERT INTO "public"."tenant_module_config" (tenant_id, module_name, enabled)
SELECT 
    t.id,
    module,
    CASE 
        WHEN module IN ('students', 'classes', 'professionals') THEN true
        ELSE false
    END
FROM "public"."tenants" t
CROSS JOIN (VALUES 
    ('declarations'),
    ('history'),
    ('online_enrollment'),
    ('re_enrollment'),
    ('student_documents'),
    ('students'),
    ('classes'),
    ('professionals')
) AS modules(module)
ON CONFLICT (tenant_id, module_name) DO NOTHING;

-- ============================================================================
-- PARTE 4: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON "public"."tenant_module_config" TO authenticated;
GRANT EXECUTE ON FUNCTION is_module_enabled(uuid, text) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."tenant_module_config" IS 'Configuração de módulos habilitados/desabilitados por tenant';
COMMENT ON FUNCTION is_module_enabled(uuid, text) IS 'Verifica se um módulo está habilitado para um tenant';

