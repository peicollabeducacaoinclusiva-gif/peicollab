-- ============================================================================
-- CONSOLIDAÇÃO DE CONSENTIMENTOS
-- Migra dados de data_consents (antiga) para consents (nova tabela unificada)
-- ============================================================================

-- Verificar se as tabelas existem e migrar dados
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'consents'
    ) AND EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'data_consents'
    ) THEN
        -- Migrar dados de data_consents para consents
        INSERT INTO "public"."consents" (
            tenant_id,
            user_id,
            student_id,
            guardian_id,
            consent_type,
            granted,
            granted_at,
            revoked_at,
            metadata,
            ip_address,
            user_agent,
            created_at,
            updated_at
        )
        SELECT 
            COALESCE(
                dc.tenant_id,
                (SELECT tenant_id FROM "public"."students" WHERE id = dc.student_id LIMIT 1)
            ) as tenant_id,
            dc.user_id,
            dc.student_id,
            dc.guardian_id,
            dc.consent_type::text as consent_type,
            dc.consent_given as granted,
            dc.consent_date as granted_at,
            dc.withdrawn_at as revoked_at,
            jsonb_build_object(
                'source', 'data_consents_migration',
                'original_id', dc.id,
                'consent_method', dc.consent_method,
                'consent_version', dc.consent_version,
                'withdrawn_reason', dc.withdrawn_reason
            ) as metadata,
            dc.ip_address,
            dc.user_agent,
            dc.created_at,
            dc.updated_at
        FROM "public"."data_consents" dc
        WHERE NOT EXISTS (
            -- Evitar duplicação se já migrado
            SELECT 1 FROM "public"."consents" c
            WHERE c.student_id = dc.student_id
                AND c.consent_type = dc.consent_type::text
                AND c.granted_at = dc.consent_date
                AND c.metadata->>'original_id' = dc.id::text
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Dados migrados de data_consents para consents';
    ELSE
        RAISE NOTICE '⚠️  Tabelas consents ou data_consents não existem. Pulando migração.';
    END IF;
END $$;

-- Criar view de compatibilidade (se consents existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'consents'
    ) THEN
        CREATE OR REPLACE VIEW "public"."data_consents_view" AS
        SELECT 
            c.id,
            c.student_id,
            c.guardian_id,
            c.consent_type::text as consent_type,
            c.granted as consent_given,
            c.granted_at as consent_date,
            COALESCE(c.metadata->>'consent_method', 'digital') as consent_method,
            COALESCE(c.metadata->>'consent_version', '1.0') as consent_version,
            c.revoked_at as withdrawn_at,
            c.metadata->>'withdrawn_reason' as withdrawn_reason,
            c.ip_address,
            c.user_agent,
            c.created_at,
            c.updated_at
        FROM "public"."consents" c
        WHERE c.student_id IS NOT NULL OR c.guardian_id IS NOT NULL;

        COMMENT ON VIEW "public"."data_consents_view" IS 
        'View de compatibilidade para data_consents. Use a tabela consents diretamente. DEPRECATED';
        
        RAISE NOTICE '✅ View de compatibilidade criada';
    ELSE
        RAISE NOTICE '⚠️  Tabela consents não existe. View de compatibilidade não criada.';
    END IF;
END $$;

-- Marcar tabela como DEPRECATED (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'data_consents'
    ) THEN
        COMMENT ON TABLE "public"."data_consents" IS 
        '[DEPRECATED] Esta tabela foi substituída por "consents". Use a tabela consents para novas operações.';
    END IF;
END $$;

-- Criar função de aviso (fora do DO $$)
CREATE OR REPLACE FUNCTION "public"."_warn_data_consents_deprecated"()
RETURNS TRIGGER AS $$
BEGIN
    RAISE WARNING 'Tabela data_consents está deprecated. Use a tabela consents.';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger de aviso (se data_consents existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'data_consents'
    ) THEN
        -- Criar trigger BEFORE INSERT para avisar
        DROP TRIGGER IF EXISTS "warn_data_consents_insert" ON "public"."data_consents";
        CREATE TRIGGER "warn_data_consents_insert"
        BEFORE INSERT ON "public"."data_consents"
        FOR EACH ROW
        EXECUTE FUNCTION "public"."_warn_data_consents_deprecated"();
    END IF;
END $$;
