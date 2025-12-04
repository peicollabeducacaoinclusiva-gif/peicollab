-- ============================================================================
-- MIGRAÇÃO: Multi-Tenancy com Subdomínios
-- ============================================================================
-- Sistema de mapeamento de subdomínios para tenants
-- Data: 2025-01-08
-- ============================================================================

-- ============================================================================
-- TABELA: tenant_domains
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."tenant_domains" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    
    -- Domínios
    "subdomain" text UNIQUE NOT NULL, -- Ex: 'saogoncalo', 'santanopolis'
    "custom_domain" text UNIQUE, -- Ex: 'educacao.saogoncalo.rj.gov.br'
    
    -- Status
    "is_active" boolean DEFAULT true,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_tenant_domains_tenant" ON "public"."tenant_domains"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_tenant_domains_subdomain" ON "public"."tenant_domains"("subdomain");
CREATE INDEX IF NOT EXISTS "idx_tenant_domains_active" ON "public"."tenant_domains"("is_active");

-- ============================================================================
-- EXPANDIR TABELA TENANTS (Personalização)
-- ============================================================================

ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "customization" jsonb DEFAULT '{}'::jsonb;

-- Estrutura do customization:
-- {
--   "logo_url": "https://...",
--   "primary_color": "#3b82f6",
--   "secondary_color": "#10b981",
--   "accent_color": "#f59e0b",
--   "theme": "light",
--   "institution_name": "Secretaria de Educação",
--   "institution_logo": "https://...",
--   "footer_text": "© 2025 Secretaria de Educação",
--   "contact_email": "contato@educacao.gov.br",
--   "contact_phone": "(00) 0000-0000"
-- }

COMMENT ON COLUMN "public"."tenants"."customization" IS 'Personalização visual e branding por tenant';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."tenant_domains" ENABLE ROW LEVEL SECURITY;

-- Todos podem ler domains ativos (para detecção de tenant)
CREATE POLICY "all_view_active_domains"
    ON "public"."tenant_domains"
    FOR SELECT
    USING ("is_active" = true);

-- Apenas admins podem gerenciar
CREATE POLICY "admins_manage_domains"
    ON "public"."tenant_domains"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'education_secretary')
        )
    );

-- ============================================================================
-- TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_tenant_domains_updated_at ON "public"."tenant_domains";
CREATE TRIGGER update_tenant_domains_updated_at
    BEFORE UPDATE ON "public"."tenant_domains"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DADOS INICIAIS (Exemplo)
-- ============================================================================

-- Inserir subdomínios de exemplo
INSERT INTO "public"."tenant_domains" (tenant_id, subdomain)
SELECT 
    t.id,
    CASE 
        WHEN t.name ILIKE '%São Gonçalo%' THEN 'saogoncalo'
        WHEN t.name ILIKE '%Santanópolis%' THEN 'santanopolis'
        WHEN t.name ILIKE '%demo%' THEN 'demo'
        ELSE LOWER(REPLACE(REPLACE(t.name, ' ', ''), 'ã', 'a'))
    END
FROM tenants t
WHERE t.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM tenant_domains td WHERE td.tenant_id = t.id
)
LIMIT 5;

-- Atualizar customization de exemplo
UPDATE "public"."tenants"
SET customization = jsonb_build_object(
    'primary_color', '#3b82f6',
    'secondary_color', '#10b981',
    'institution_name', name || ' - Secretaria de Educação',
    'theme', 'light'
)
WHERE customization = '{}'::jsonb OR customization IS NULL;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."tenant_domains" IS 'Mapeamento de subdomínios/domínios customizados para tenants';

-- ============================================================================
-- CONFIRMAÇÃO
-- ============================================================================

SELECT '✅ Multi-Tenancy configurado! Subdomínios mapeados.' AS status;

SELECT 
    t.name AS rede,
    td.subdomain AS subdominio,
    'https://' || td.subdomain || '.peicollab.com.br' AS url
FROM tenant_domains td
JOIN tenants t ON t.id = td.tenant_id
WHERE td.is_active = true;

