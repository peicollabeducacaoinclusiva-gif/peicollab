-- ============================================================================
-- MIGRAÇÃO: Sistema de Exportações Oficiais
-- Data: 25/02/2025
-- Descrição: Criar estrutura para exportações oficiais (SED/SEDUC/INEP)
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Configurações de Exportação
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."export_configurations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "export_type" text NOT NULL, -- 'sed', 'seduc', 'inep', 'municipal'
    "configuration_name" text NOT NULL,
    "config_data" jsonb NOT NULL, -- Configurações específicas do formato
    "enabled" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("tenant_id", "export_type", "configuration_name")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_export_configurations_tenant" ON "public"."export_configurations"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_export_configurations_type" ON "public"."export_configurations"("export_type");

-- ============================================================================
-- PARTE 2: Tabela de Exportações Realizadas
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."official_exports" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "export_type" text NOT NULL,
    "export_period" jsonb NOT NULL, -- {start_date, end_date, academic_year}
    "data_scope" jsonb NOT NULL, -- {classes, students, evaluations, etc}
    "file_url" text,
    "file_size" bigint,
    "status" text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    "error_message" text,
    "generated_by" uuid REFERENCES "auth"."users"("id"),
    "generated_at" timestamptz DEFAULT now(),
    "completed_at" timestamptz
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_official_exports_tenant" ON "public"."official_exports"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_official_exports_school" ON "public"."official_exports"("school_id");
CREATE INDEX IF NOT EXISTS "idx_official_exports_type" ON "public"."official_exports"("export_type");
CREATE INDEX IF NOT EXISTS "idx_official_exports_status" ON "public"."official_exports"("status");

-- ============================================================================
-- PARTE 3: Função para gerar exportação oficial
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_official_export(
    p_export_type text,
    p_tenant_id uuid,
    p_school_id uuid DEFAULT NULL,
    p_period jsonb,
    p_data_scope jsonb
)
RETURNS uuid AS $$
DECLARE
    v_export_id uuid;
    v_config record;
BEGIN
    -- Buscar configuração
    SELECT * INTO v_config
    FROM "public"."export_configurations"
    WHERE export_type = p_export_type
    AND tenant_id = p_tenant_id
    AND enabled = true
    ORDER BY created_at DESC
    LIMIT 1;

    -- Criar registro de exportação
    INSERT INTO "public"."official_exports" (
        tenant_id,
        school_id,
        export_type,
        export_period,
        data_scope,
        status
    )
    VALUES (
        p_tenant_id,
        p_school_id,
        p_export_type,
        p_period,
        p_data_scope,
        'pending'
    )
    RETURNING id INTO v_export_id;

    RETURN v_export_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 4: Inserir configurações padrão
-- ============================================================================

INSERT INTO "public"."export_configurations" (tenant_id, export_type, configuration_name, config_data)
SELECT 
    NULL,
    'inep',
    'Padrão INEP',
    '{"format": "csv", "encoding": "utf-8", "delimiter": ";", "include_pei": true, "include_aee": true}'::jsonb
ON CONFLICT DO NOTHING;

INSERT INTO "public"."export_configurations" (tenant_id, export_type, configuration_name, config_data)
SELECT 
    NULL,
    'seduc',
    'Padrão SEDUC',
    '{"format": "xlsx", "include_evaluations": true, "include_frequency": true}'::jsonb
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 5: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."export_configurations" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."official_exports" TO authenticated;
GRANT EXECUTE ON FUNCTION generate_official_export(text, uuid, uuid, jsonb, jsonb) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."export_configurations" IS 'Configurações de exportação oficial por tenant';
COMMENT ON TABLE "public"."official_exports" IS 'Registro de exportações oficiais realizadas';
COMMENT ON FUNCTION generate_official_export(text, uuid, uuid, jsonb, jsonb) IS 'Gera registro de exportação oficial';

