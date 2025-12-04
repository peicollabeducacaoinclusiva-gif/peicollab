-- ============================================================================
-- MIGRAÇÃO: Sistema de Reuniões (VERSÃO CORRIGIDA)
-- ============================================================================
-- Sistema completo para agendamento e gestão de reuniões relacionadas aos PEIs
-- Data: 2025-01-08
-- ============================================================================

-- ⚠️ IMPORTANTE: Se houver erro, execute primeiro este bloco de limpeza:
-- DROP TABLE IF EXISTS "public"."pei_meeting_participants" CASCADE;
-- DROP TABLE IF EXISTS "public"."pei_meeting_peis" CASCADE;
-- DROP TABLE IF EXISTS "public"."pei_meetings" CASCADE;

-- ============================================================================
-- TABELA: pei_meetings
-- ============================================================================
-- Reuniões relacionadas aos PEIs
DROP TABLE IF EXISTS "public"."pei_meeting_participants" CASCADE;
DROP TABLE IF EXISTS "public"."pei_meeting_peis" CASCADE;
DROP TABLE IF EXISTS "public"."pei_meetings" CASCADE;

CREATE TABLE "public"."pei_meetings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "meeting_date" timestamptz NOT NULL,
    "meeting_type" text NOT NULL CHECK ("meeting_type" IN ('inicial', 'acompanhamento', 'final', 'extraordinaria')),
    "title" text NOT NULL,
    "description" text,
    
    -- Pauta da reunião (array de tópicos)
    "agenda" jsonb NOT NULL DEFAULT '[]'::jsonb,
    -- Formato: [{"id": "uuid", "topic": "string", "order": number}]
    
    -- Ata da reunião (preenchida durante/após a reunião)
    "minutes" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"id": "uuid", "topic": "string", "checked": boolean, "notes": "text"}]
    
    -- Notas gerais da reunião
    "meeting_notes" text,
    
    -- Localização
    "location" text,
    
    -- Status
    "status" text DEFAULT 'scheduled' CHECK ("status" IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    
    -- Metadados
    "created_by" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "completed_at" timestamptz,
    "cancelled_at" timestamptz,
    "cancellation_reason" text,
    
    -- Multi-tenant
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE
);

-- Índices
CREATE INDEX "idx_pei_meetings_date" ON "public"."pei_meetings"("meeting_date");
CREATE INDEX "idx_pei_meetings_status" ON "public"."pei_meetings"("status");
CREATE INDEX "idx_pei_meetings_tenant" ON "public"."pei_meetings"("tenant_id");
CREATE INDEX "idx_pei_meetings_school" ON "public"."pei_meetings"("school_id");
CREATE INDEX "idx_pei_meetings_type" ON "public"."pei_meetings"("meeting_type");

-- ============================================================================
-- TABELA: pei_meeting_peis
-- ============================================================================
-- Vinculação entre reuniões e PEIs discutidos
CREATE TABLE "public"."pei_meeting_peis" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "meeting_id" uuid NOT NULL REFERENCES "public"."pei_meetings"("id") ON DELETE CASCADE,
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "order" integer DEFAULT 0,
    "notes" text,
    "created_at" timestamptz DEFAULT now(),
    
    -- Constraint: cada PEI pode ser vinculado apenas uma vez por reunião
    CONSTRAINT "unique_pei_per_meeting" UNIQUE ("meeting_id", "pei_id")
);

-- Índices
CREATE INDEX "idx_pei_meeting_peis_meeting" ON "public"."pei_meeting_peis"("meeting_id");
CREATE INDEX "idx_pei_meeting_peis_pei" ON "public"."pei_meeting_peis"("pei_id");

-- ============================================================================
-- TABELA: pei_meeting_participants
-- ============================================================================
-- Participantes das reuniões
CREATE TABLE "public"."pei_meeting_participants" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "meeting_id" uuid NOT NULL REFERENCES "public"."pei_meetings"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Status de presença
    "presence_status" text DEFAULT 'invited' CHECK ("presence_status" IN ('invited', 'confirmed', 'declined', 'attended', 'absent')),
    
    -- Assinatura digital (registra confirmação de presença)
    "signed_at" timestamptz,
    "signature_data" jsonb,
    
    -- Justificativa de ausência
    "absence_reason" text,
    
    -- Metadados
    "invited_at" timestamptz DEFAULT now(),
    "responded_at" timestamptz,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraint: cada usuário pode ser convidado apenas uma vez por reunião
    CONSTRAINT "unique_participant_per_meeting" UNIQUE ("meeting_id", "user_id")
);

-- Índices
CREATE INDEX "idx_pei_meeting_participants_meeting" ON "public"."pei_meeting_participants"("meeting_id");
CREATE INDEX "idx_pei_meeting_participants_user" ON "public"."pei_meeting_participants"("user_id");
CREATE INDEX "idx_pei_meeting_participants_status" ON "public"."pei_meeting_participants"("presence_status");

-- ============================================================================
-- RLS POLICIES: pei_meetings
-- ============================================================================

ALTER TABLE "public"."pei_meetings" ENABLE ROW LEVEL SECURITY;

-- Coordenadores podem gerenciar todas as reuniões da rede
CREATE POLICY "coordinators_manage_meetings"
    ON "public"."pei_meetings"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."profiles" p
            WHERE p.id = auth.uid()
            AND p.tenant_id = "pei_meetings"."tenant_id"
            AND EXISTS (
                SELECT 1 FROM "public"."user_roles" ur
                WHERE ur.user_id = auth.uid()
                AND ur.role = 'coordinator'
            )
        )
    );

-- Diretores podem gerenciar reuniões da sua escola
CREATE POLICY "directors_manage_school_meetings"
    ON "public"."pei_meetings"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."profiles" p
            WHERE p.id = auth.uid()
            AND p.school_id = "pei_meetings"."school_id"
            AND EXISTS (
                SELECT 1 FROM "public"."user_roles" ur
                WHERE ur.user_id = auth.uid()
                AND ur.role IN ('school_manager', 'education_secretary')
            )
        )
    );

-- Participantes podem ver reuniões das quais participam
CREATE POLICY "participants_view_own_meetings"
    ON "public"."pei_meetings"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."pei_meeting_participants" pmp
            WHERE pmp.meeting_id = "pei_meetings"."id"
            AND pmp.user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: pei_meeting_peis
-- ============================================================================

ALTER TABLE "public"."pei_meeting_peis" ENABLE ROW LEVEL SECURITY;

-- Herda permissões da tabela pei_meetings
CREATE POLICY "inherit_meeting_permissions"
    ON "public"."pei_meeting_peis"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."pei_meetings" pm
            WHERE pm.id = "pei_meeting_peis"."meeting_id"
        )
    );

-- ============================================================================
-- RLS POLICIES: pei_meeting_participants
-- ============================================================================

ALTER TABLE "public"."pei_meeting_participants" ENABLE ROW LEVEL SECURITY;

-- Coordenadores e diretores podem gerenciar participantes
CREATE POLICY "coordinators_directors_manage_participants"
    ON "public"."pei_meeting_participants"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."pei_meetings" pm
            JOIN "public"."profiles" p ON (
                p.tenant_id = pm.tenant_id 
                OR p.school_id = pm.school_id
            )
            WHERE pm.id = "pei_meeting_participants"."meeting_id"
            AND p.id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM "public"."user_roles" ur
                WHERE ur.user_id = auth.uid()
                AND ur.role IN ('coordinator', 'school_manager')
            )
        )
    );

-- Participantes podem ver e atualizar seus próprios registros
CREATE POLICY "participants_manage_own_status"
    ON "public"."pei_meeting_participants"
    FOR ALL
    USING ("user_id" = auth.uid());

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================

-- Criar função se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pei_meetings_updated_at ON "public"."pei_meetings";
CREATE TRIGGER update_pei_meetings_updated_at
    BEFORE UPDATE ON "public"."pei_meetings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pei_meeting_participants_updated_at ON "public"."pei_meeting_participants";
CREATE TRIGGER update_pei_meeting_participants_updated_at
    BEFORE UPDATE ON "public"."pei_meeting_participants"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para notificar participantes de uma reunião
CREATE OR REPLACE FUNCTION notify_meeting_participants(meeting_id uuid)
RETURNS void AS $$
DECLARE
    participant_record RECORD;
    meeting_record RECORD;
BEGIN
    -- Buscar dados da reunião
    SELECT * INTO meeting_record
    FROM "public"."pei_meetings"
    WHERE id = meeting_id;
    
    -- Notificar cada participante
    FOR participant_record IN
        SELECT u.email, p.full_name
        FROM "public"."pei_meeting_participants" pmp
        JOIN "auth"."users" u ON u.id = pmp.user_id
        JOIN "public"."profiles" p ON p.id = pmp.user_id
        WHERE pmp.meeting_id = meeting_id
        AND pmp.presence_status = 'invited'
    LOOP
        -- Aqui você pode integrar com sistema de notificações
        RAISE NOTICE 'Notificar %: Reunião % agendada para %', 
            participant_record.full_name, 
            meeting_record.title, 
            meeting_record.meeting_date;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."pei_meetings" IS 'Reuniões relacionadas aos PEIs, com pauta e ata estruturadas';
COMMENT ON TABLE "public"."pei_meeting_peis" IS 'Vinculação entre reuniões e PEIs a serem discutidos';
COMMENT ON TABLE "public"."pei_meeting_participants" IS 'Participantes das reuniões com controle de presença';

COMMENT ON COLUMN "public"."pei_meetings"."agenda" IS 'Pauta da reunião em formato JSON: [{"id": "uuid", "topic": "string", "order": number}]';
COMMENT ON COLUMN "public"."pei_meetings"."minutes" IS 'Ata da reunião em formato JSON: [{"id": "uuid", "topic": "string", "checked": boolean, "notes": "text"}]';

