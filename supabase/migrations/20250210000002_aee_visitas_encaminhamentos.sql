-- ============================================================================
-- PLANO AEE V2.0 - FASE 6: VISITAS ESCOLARES E ENCAMINHAMENTOS
-- ============================================================================
-- Descrição: Sistema de visitas escolares rastreáveis e encaminhamentos
-- Autor: Sistema PEI Collab
-- Data: 2025-02-10
-- ============================================================================

-- ============================================================================
-- 1. VISITAS ESCOLARES
-- ============================================================================

-- Tabela de visitas escolares do professor de AEE à escola regular
CREATE TABLE IF NOT EXISTS "public"."aee_school_visits" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    
    -- Dados da Visita
    "visit_date" date NOT NULL,
    "visit_time" time,
    "duration_minutes" integer DEFAULT 60,
    "visit_type" text NOT NULL CHECK ("visit_type" IN ('diagnostica', 'acompanhamento', 'orientacao', 'avaliacao', 'outra')),
    
    -- Professor AEE (quem fez a visita)
    "aee_teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    
    -- Participantes da Visita
    "participants" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"nome": "Maria Silva", "funcao": "Professor Regente", "assinatura_url": "..."}]
    
    -- Observações da Visita
    "observations" text,
    "class_environment" text, -- Observações sobre o ambiente da sala
    "student_interaction" text, -- Como o aluno interage na sala regular
    "teacher_feedback" text, -- Feedback do professor regente
    
    -- Orientações Fornecidas
    "orientations_given" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"categoria": "Didática", "descricao": "Sugestão de atividades adaptadas", "prioridade": "Alta"}]
    
    -- Recursos e Materiais
    "resources_needed" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"recurso": "Lupa", "quantidade": 1, "urgencia": "Media", "providenciado": false}]
    
    -- Adaptações Sugeridas
    "suggested_adaptations" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"area": "Avaliação", "adaptacao": "Provas com fonte ampliada", "implementado": false}]
    
    -- Próximos Passos
    "next_steps" text,
    "follow_up_date" date,
    
    -- Evidências
    "attachments" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"nome": "foto-sala.jpg", "url": "storage-path", "tipo": "foto|documento"}]
    
    -- Status e Controle
    "status" text DEFAULT 'rascunho' CHECK ("status" IN ('rascunho', 'realizada', 'cancelada')),
    "report_generated" boolean DEFAULT false,
    "report_url" text,
    
    -- Assinaturas
    "signatures" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"aee_teacher": {"data": "2025-02-10", "url": "..."}, "regente": {...}}
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "positive_duration_visit" CHECK ("duration_minutes" > 0),
    CONSTRAINT "valid_visit_date" CHECK ("visit_date" <= CURRENT_DATE + INTERVAL '6 months')
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_school_visits_plan" ON "public"."aee_school_visits"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_school_visits_student" ON "public"."aee_school_visits"("student_id");
CREATE INDEX IF NOT EXISTS "idx_school_visits_school" ON "public"."aee_school_visits"("school_id");
CREATE INDEX IF NOT EXISTS "idx_school_visits_tenant" ON "public"."aee_school_visits"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_school_visits_date" ON "public"."aee_school_visits"("visit_date");
CREATE INDEX IF NOT EXISTS "idx_school_visits_status" ON "public"."aee_school_visits"("status");

-- Comentários
COMMENT ON TABLE "public"."aee_school_visits" IS 'Visitas do professor de AEE à escola regular para acompanhamento';
COMMENT ON COLUMN "public"."aee_school_visits"."orientations_given" IS 'Orientações pedagógicas fornecidas durante a visita';
COMMENT ON COLUMN "public"."aee_school_visits"."suggested_adaptations" IS 'Adaptações curriculares e metodológicas sugeridas';

-- ============================================================================
-- 2. ENCAMINHAMENTOS ESPECIALIZADOS
-- ============================================================================

-- Tabela de encaminhamentos para profissionais externos
CREATE TABLE IF NOT EXISTS "public"."aee_referrals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    
    -- Dados do Encaminhamento
    "referral_date" date NOT NULL DEFAULT CURRENT_DATE,
    "specialist_type" text NOT NULL,
    -- Tipos: 'Psicólogo', 'Fonoaudiólogo', 'Terapeuta Ocupacional', 'Neurologista', 
    --        'Oftalmologista', 'Otorrinolaringologista', 'Psicopedagogo', 'Outro'
    
    "specialist_name" text,
    "institution" text,
    "contact_info" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"telefone": "...", "email": "...", "endereco": "..."}
    
    -- Motivo do Encaminhamento
    "reason" text NOT NULL,
    "symptoms_observed" text,
    "urgency_level" text DEFAULT 'media' CHECK ("urgency_level" IN ('baixa', 'media', 'alta', 'urgente')),
    
    -- Professor que solicitou
    "requested_by" uuid NOT NULL REFERENCES "auth"."users"("id"),
    
    -- Documentação
    "referral_letter_url" text, -- URL do documento de encaminhamento
    "attachments" jsonb DEFAULT '[]'::jsonb,
    
    -- Acompanhamento
    "status" text DEFAULT 'enviado' CHECK ("status" IN (
        'rascunho', 'enviado', 'agendado', 'em_atendimento', 
        'concluido', 'cancelado', 'sem_resposta'
    )),
    
    "appointment_date" date,
    "appointment_status" text,
    
    -- Retorno do Especialista
    "specialist_feedback" text,
    "specialist_report_url" text,
    "feedback_received_date" date,
    "diagnosis_summary" text,
    "recommendations" text,
    
    -- Próximos Passos
    "follow_up_needed" boolean DEFAULT false,
    "follow_up_date" date,
    "follow_up_notes" text,
    
    -- Integração com o Plano
    "integrated_to_plan" boolean DEFAULT false,
    "integration_notes" text,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "valid_appointment_date" CHECK ("appointment_date" IS NULL OR "appointment_date" >= "referral_date")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_referrals_plan" ON "public"."aee_referrals"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_referrals_student" ON "public"."aee_referrals"("student_id");
CREATE INDEX IF NOT EXISTS "idx_referrals_school" ON "public"."aee_referrals"("school_id");
CREATE INDEX IF NOT EXISTS "idx_referrals_tenant" ON "public"."aee_referrals"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_referrals_status" ON "public"."aee_referrals"("status");
CREATE INDEX IF NOT EXISTS "idx_referrals_specialist" ON "public"."aee_referrals"("specialist_type");
CREATE INDEX IF NOT EXISTS "idx_referrals_urgency" ON "public"."aee_referrals"("urgency_level");

-- Comentários
COMMENT ON TABLE "public"."aee_referrals" IS 'Encaminhamentos para especialistas externos com rastreamento completo';
COMMENT ON COLUMN "public"."aee_referrals"."specialist_feedback" IS 'Retorno e diagnóstico do especialista';
COMMENT ON COLUMN "public"."aee_referrals"."integrated_to_plan" IS 'Indica se as recomendações foram integradas ao plano de AEE';

-- ============================================================================
-- 3. TRIGGERS E FUNÇÕES
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_visits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_referrals_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_visits_updated_at ON "public"."aee_school_visits";
CREATE TRIGGER update_visits_updated_at
    BEFORE UPDATE ON "public"."aee_school_visits"
    FOR EACH ROW
    EXECUTE FUNCTION update_visits_updated_at();

DROP TRIGGER IF EXISTS update_referrals_updated_at ON "public"."aee_referrals";
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON "public"."aee_referrals"
    FOR EACH ROW
    EXECUTE FUNCTION update_referrals_updated_at();

-- ============================================================================
-- 4. FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para obter estatísticas de visitas por plano
CREATE OR REPLACE FUNCTION get_plan_visits_stats(_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_visitas', COUNT(*),
        'realizadas', COUNT(*) FILTER (WHERE status = 'realizada'),
        'pendentes', COUNT(*) FILTER (WHERE status = 'rascunho'),
        'ultima_visita', MAX(visit_date),
        'proxima_visita', MIN(follow_up_date) FILTER (WHERE follow_up_date > CURRENT_DATE)
    )
    INTO v_result
    FROM aee_school_visits
    WHERE plan_id = _plan_id;
    
    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Função para obter estatísticas de encaminhamentos por plano
CREATE OR REPLACE FUNCTION get_plan_referrals_stats(_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_encaminhamentos', COUNT(*),
        'concluidos', COUNT(*) FILTER (WHERE status = 'concluido'),
        'em_andamento', COUNT(*) FILTER (WHERE status IN ('enviado', 'agendado', 'em_atendimento')),
        'com_retorno', COUNT(*) FILTER (WHERE specialist_feedback IS NOT NULL),
        'integrados_plano', COUNT(*) FILTER (WHERE integrated_to_plan = true),
        'por_especialidade', jsonb_object_agg(specialist_type, especialidade_count)
    )
    INTO v_result
    FROM aee_referrals
    LEFT JOIN (
        SELECT specialist_type, COUNT(*) as especialidade_count
        FROM aee_referrals
        WHERE plan_id = _plan_id
        GROUP BY specialist_type
    ) sub ON true
    WHERE plan_id = _plan_id;
    
    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

COMMENT ON FUNCTION get_plan_visits_stats(uuid) IS 'Retorna estatísticas de visitas escolares de um plano';
COMMENT ON FUNCTION get_plan_referrals_stats(uuid) IS 'Retorna estatísticas de encaminhamentos de um plano';

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE "public"."aee_school_visits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."aee_referrals" ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: aee_school_visits
-- Professores AEE e gestores podem ver e gerenciar visitas do seu tenant
DROP POLICY IF EXISTS "users_view_visits" ON "public"."aee_school_visits";
CREATE POLICY "users_view_visits"
    ON "public"."aee_school_visits"
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            has_role(auth.uid(), 'aee_teacher')
            OR has_role(auth.uid(), 'school_admin')
            OR has_role(auth.uid(), 'tenant_admin')
        )
    );

DROP POLICY IF EXISTS "aee_teachers_manage_visits" ON "public"."aee_school_visits";
CREATE POLICY "aee_teachers_manage_visits"
    ON "public"."aee_school_visits"
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
        AND has_role(auth.uid(), 'aee_teacher')
    );

-- POLÍTICAS: aee_referrals
-- Professores AEE e gestores podem ver e gerenciar encaminhamentos
DROP POLICY IF EXISTS "users_view_referrals" ON "public"."aee_referrals";
CREATE POLICY "users_view_referrals"
    ON "public"."aee_referrals"
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            has_role(auth.uid(), 'aee_teacher')
            OR has_role(auth.uid(), 'school_admin')
            OR has_role(auth.uid(), 'tenant_admin')
        )
    );

DROP POLICY IF EXISTS "aee_teachers_manage_referrals" ON "public"."aee_referrals";
CREATE POLICY "aee_teachers_manage_referrals"
    ON "public"."aee_referrals"
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
        AND has_role(auth.uid(), 'aee_teacher')
    );

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

