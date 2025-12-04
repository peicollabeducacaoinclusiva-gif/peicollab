-- ============================================================================
-- ADICIONAR STATUS FALTANTES AO ENUM pei_status
-- ============================================================================
-- Adiciona os status que o frontend usa mas que faltam no enum do banco
-- ============================================================================

-- Adicionar novos valores ao tipo pei_status
DO $$ BEGIN
    -- pending_validation: PEI enviado pelo professor aguardando validação do coordenador
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'pei_status'::regtype AND enumlabel = 'pending_validation') THEN
        ALTER TYPE "public"."pei_status" ADD VALUE 'pending_validation';
    END IF;
    
    -- validated: PEI validado pelo coordenador, aguardando aprovação da família
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'pei_status'::regtype AND enumlabel = 'validated') THEN
        ALTER TYPE "public"."pei_status" ADD VALUE 'validated';
    END IF;
    
    -- pending_family: PEI aguardando aprovação da família
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'pei_status'::regtype AND enumlabel = 'pending_family') THEN
        ALTER TYPE "public"."pei_status" ADD VALUE 'pending_family';
    END IF;
EXCEPTION
    WHEN others THEN
        -- Ignora erros
        NULL;
END $$;

-- Verificar se os status foram adicionados
SELECT unnest(enum_range(NULL::pei_status)) AS status_value ORDER BY status_value;

