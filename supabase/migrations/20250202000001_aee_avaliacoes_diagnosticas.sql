-- ============================================================================
-- MIGRAÇÃO V2.0: Avaliações Diagnósticas
-- ============================================================================
-- Sistema completo de avaliação diagnóstica baseado nas fichas da Bahia
-- Data: 2025-02-02
-- Fase: 2 de 7
-- ============================================================================

-- ============================================================================
-- TABELA: aee_diagnostic_assessments
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_diagnostic_assessments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "aee_center_id" uuid REFERENCES "public"."aee_centers"("id"),
    "plan_id" uuid REFERENCES "public"."plano_aee"("id"),
    
    -- Tipo de Avaliação
    "assessment_date" date NOT NULL DEFAULT CURRENT_DATE,
    "assessment_type" text DEFAULT 'inicial',
    -- Tipos: 'inicial', 'continuada', 'final'
    
    -- === ÁREAS AVALIADAS (8 principais) ===
    
    -- 1. Lateralidade
    "laterality" jsonb DEFAULT '{}'::jsonb,
    -- {"dominancia": "direita|esquerda|cruzada", "usa_corretamente": boolean, "observacoes": "text"}
    
    -- 2. Orientação Espacial e Temporal
    "spatial_orientation" jsonb DEFAULT '{}'::jsonb,
    -- {"reconhece_posicoes": boolean, "compreende_relacoes_espaciais": boolean}
    "temporal_orientation" jsonb DEFAULT '{}'::jsonb,
    -- {"reconhece_dias_semana": boolean, "compreende_sequencia_temporal": boolean}
    
    -- 3. Percepções
    "visual_perception" jsonb DEFAULT '{}'::jsonb,
    -- {"discrimina_cores": boolean, "identifica_formas": boolean, "figura_fundo": boolean}
    "auditory_perception" jsonb DEFAULT '{}'::jsonb,
    -- {"discrimina_sons": boolean, "memoria_auditiva": boolean}
    
    -- 4. Expressão e Comunicação
    "oral_expression" jsonb DEFAULT '{}'::jsonb,
    -- {"vocabulario": "amplo|adequado|restrito", "articulacao": "clara|dificuldade"}
    "written_expression" jsonb DEFAULT '{}'::jsonb,
    -- {"caligrafia": "legivel|irregular", "ortografia": "adequada|dificuldade"}
    "writing_level" text,
    -- Níveis: 'pre_silabico', 'silabico_sem_valor', 'silabico_com_valor', 'silabico_alfabetico', 'alfabetico'
    
    -- 5. Leitura
    "reading_skills" jsonb DEFAULT '{}'::jsonb,
    -- {"reconhece_letras": boolean, "le_palavras": boolean, "le_frases": boolean, "compreende_leitura": boolean}
    
    -- 6. Raciocínio e Coordenação
    "logical_reasoning" jsonb DEFAULT '{}'::jsonb,
    -- {"resolve_problemas": boolean, "sequencia_logica": boolean, "classificacao": boolean}
    "motor_coordination" jsonb DEFAULT '{}'::jsonb,
    -- {"coordenacao_fina": "adequada|dificuldade", "coordenacao_ampla": "adequada|dificuldade"}
    
    -- 7. Relações Interpessoais
    "interpersonal_relations" jsonb DEFAULT '{}'::jsonb,
    -- {"relaciona_bem_colegas": boolean, "aceita_regras": boolean, "trabalha_grupo": boolean}
    "frustration_tolerance" text,
    -- 'baixa', 'moderada', 'alta'
    "self_esteem" text,
    -- 'baixa', 'adequada', 'elevada'
    
    -- 8. Informações Escolares
    "school_complaints" text,
    "school_progress" text,
    "academic_performance" text,
    
    -- 9. Indicações Clínicas
    "clinical_indications" text,
    "professional_support" jsonb DEFAULT '[]'::jsonb,
    -- [{"profissional": "Fonoaudiólogo", "frequencia": "semanal"}]
    
    -- 10. Habilidades Gerais
    "student_skills" jsonb DEFAULT '{}'::jsonb,
    -- {"pontos_fortes": [], "areas_melhorar": []}
    
    -- Observações e Recomendações
    "observations" text,
    "recommendations" text,
    "next_assessment_date" date,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "valid_assessment_type" CHECK (
        "assessment_type" IN ('inicial', 'continuada', 'final')
    ),
    CONSTRAINT "valid_writing_level" CHECK (
        "writing_level" IS NULL OR "writing_level" IN (
            'pre_silabico', 
            'silabico_sem_valor', 
            'silabico_com_valor', 
            'silabico_alfabetico', 
            'alfabetico'
        )
    ),
    CONSTRAINT "valid_frustration" CHECK (
        "frustration_tolerance" IS NULL OR "frustration_tolerance" IN ('baixa', 'moderada', 'alta')
    ),
    CONSTRAINT "valid_self_esteem" CHECK (
        "self_esteem" IS NULL OR "self_esteem" IN ('baixa', 'adequada', 'elevada')
    )
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_assessments_student" ON "public"."aee_diagnostic_assessments"("student_id");
CREATE INDEX IF NOT EXISTS "idx_assessments_teacher" ON "public"."aee_diagnostic_assessments"("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_assessments_plan" ON "public"."aee_diagnostic_assessments"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_assessments_date" ON "public"."aee_diagnostic_assessments"("assessment_date");
CREATE INDEX IF NOT EXISTS "idx_assessments_type" ON "public"."aee_diagnostic_assessments"("assessment_type");

-- Comentários
COMMENT ON TABLE "public"."aee_diagnostic_assessments" IS 'Avaliações Diagnósticas completas (8 áreas baseadas nas fichas da Bahia)';
COMMENT ON COLUMN "public"."aee_diagnostic_assessments"."laterality" IS 'Avaliação de lateralidade (dominância direita/esquerda)';
COMMENT ON COLUMN "public"."aee_diagnostic_assessments"."writing_level" IS 'Nível de escrita (hipótese de escrita)';
COMMENT ON COLUMN "public"."aee_diagnostic_assessments"."professional_support" IS 'Profissionais que já atendem o aluno';

-- ============================================================================
-- TABELA: aee_family_interviews (Anamnese)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_family_interviews" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    
    -- Tipo de Entrevista
    "interview_date" date NOT NULL DEFAULT CURRENT_DATE,
    "interview_type" text DEFAULT 'inicial',
    -- 'inicial', 'continuada', 'final'
    
    -- === DADOS DA ANAMNESE ===
    
    -- 1. Queixa Inicial
    "initial_complaint" text,
    -- "O que a família espera do AEE?"
    
    -- 2. Gestação e Nascimento
    "pregnancy_birth" jsonb DEFAULT '{}'::jsonb,
    -- {"tipo_parto": "normal|cesariana", "complicacoes": boolean, "detalhes": "text"}
    
    -- 3. Desenvolvimento Biopsicossocial
    "biopsychosocial_development" text,
    "developmental_milestones" jsonb DEFAULT '{}'::jsonb,
    -- {"sentou": "6 meses", "andou": "1 ano", "falou": "2 anos", "controle_esfincteriano": "3 anos"}
    
    -- 4. Estrutura Familiar
    "family_structure" text,
    "family_members" jsonb DEFAULT '[]'::jsonb,
    -- [{"nome": "João", "parentesco": "pai", "idade": 40, "profissao": "mecânico"}]
    
    -- 5. Vínculos do Estudante
    "student_bonds" text,
    "favorite_activities" text,
    "social_interactions" text,
    
    -- 6. Rotina Doméstica
    "daily_routine" jsonb DEFAULT '{}'::jsonb,
    -- {"acordar": "7h", "cafe": "7h30", "escola": "8h", "almoco": "12h", "atividades": "14h", "jantar": "19h", "dormir": "21h"}
    
    -- 7. Histórico de Saúde Familiar
    "family_health_history" text,
    "genetic_conditions" text,
    
    -- 8. Histórico Escolar
    "school_history" jsonb DEFAULT '[]'::jsonb,
    -- [{"escola": "Escola X", "ano": "2020", "serie": "1º ano", "observacoes": "Adaptou-se bem"}]
    
    -- 9. Restrições Clínicas
    "clinical_restrictions" text,
    "medications" jsonb DEFAULT '[]'::jsonb,
    -- [{"nome": "Ritalina", "dosagem": "10mg", "horario": "8h"}]
    "allergies" text,
    
    -- 10. Profissionais que Atendem
    "attending_professionals" jsonb DEFAULT '[]'::jsonb,
    -- [{"profissional": "Fonoaudiólogo", "local": "Clínica X", "frequencia": "semanal"}]
    
    -- 11. Comunicação do Estudante
    "student_communication" text,
    "communication_methods" text[],
    -- ['verbal', 'gestos', 'libras', 'pecs', 'prancha']
    
    -- Observações Gerais
    "observations" text,
    "interviewer_notes" text,
    "family_emotional_reactions" text,
    
    -- Participantes da Entrevista
    "participants" jsonb DEFAULT '[]'::jsonb,
    -- [{"nome": "Maria Silva", "parentesco": "mãe", "presente": true}]
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "valid_interview_type" CHECK (
        "interview_type" IN ('inicial', 'continuada', 'final')
    )
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_interviews_student" ON "public"."aee_family_interviews"("student_id");
CREATE INDEX IF NOT EXISTS "idx_interviews_teacher" ON "public"."aee_family_interviews"("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_interviews_date" ON "public"."aee_family_interviews"("interview_date");
CREATE INDEX IF NOT EXISTS "idx_interviews_type" ON "public"."aee_family_interviews"("interview_type");

-- Comentários
COMMENT ON TABLE "public"."aee_family_interviews" IS 'Entrevistas Familiares (Anamnese) completas';
COMMENT ON COLUMN "public"."aee_family_interviews"."initial_complaint" IS 'Queixa inicial e expectativas da família';
COMMENT ON COLUMN "public"."aee_family_interviews"."developmental_milestones" IS 'Marcos do desenvolvimento (sentou, andou, falou, etc.)';
COMMENT ON COLUMN "public"."aee_family_interviews"."communication_methods" IS 'Métodos de comunicação utilizados pelo aluno';

-- ============================================================================
-- RLS POLICIES: aee_diagnostic_assessments
-- ============================================================================

ALTER TABLE "public"."aee_diagnostic_assessments" ENABLE ROW LEVEL SECURITY;

-- Professores de AEE podem gerenciar suas avaliações
CREATE POLICY "teachers_manage_assessments"
    ON "public"."aee_diagnostic_assessments"
    FOR ALL
    USING ("teacher_id" = auth.uid());

-- Outros usuários podem visualizar avaliações dos alunos de sua escola/tenant
CREATE POLICY "others_view_assessments"
    ON "public"."aee_diagnostic_assessments"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."students" s
            JOIN "public"."profiles" p ON p.id = auth.uid()
            WHERE s.id = "aee_diagnostic_assessments"."student_id"
            AND (p.school_id = s.school_id OR p.tenant_id = s.tenant_id)
        )
    );

-- ============================================================================
-- RLS POLICIES: aee_family_interviews
-- ============================================================================

ALTER TABLE "public"."aee_family_interviews" ENABLE ROW LEVEL SECURITY;

-- Professores de AEE podem gerenciar suas entrevistas
CREATE POLICY "teachers_manage_interviews"
    ON "public"."aee_family_interviews"
    FOR ALL
    USING ("teacher_id" = auth.uid());

-- Outros usuários podem visualizar entrevistas dos alunos de sua escola/tenant
CREATE POLICY "others_view_interviews"
    ON "public"."aee_family_interviews"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."students" s
            JOIN "public"."profiles" p ON p.id = auth.uid()
            WHERE s.id = "aee_family_interviews"."student_id"
            AND (p.school_id = s.school_id OR p.tenant_id = s.tenant_id)
        )
    );

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_assessments_updated_at ON "public"."aee_diagnostic_assessments";
CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON "public"."aee_diagnostic_assessments"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interviews_updated_at ON "public"."aee_family_interviews";
CREATE TRIGGER update_interviews_updated_at
    BEFORE UPDATE ON "public"."aee_family_interviews"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÃO: Gerar Sugestões de Barreiras a partir da Avaliação
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_barriers_from_assessment(p_assessment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $
DECLARE
    v_assessment record;
    v_barriers jsonb := '[]'::jsonb;
    v_barrier jsonb;
BEGIN
    -- Buscar avaliação
    SELECT * INTO v_assessment
    FROM aee_diagnostic_assessments
    WHERE id = p_assessment_id;
    
    IF NOT FOUND THEN
        RETURN '[]'::jsonb;
    END IF;
    
    -- Analisar percepção visual
    IF (v_assessment.visual_perception->>'discrimina_cores')::boolean = false THEN
        v_barrier := jsonb_build_object(
            'barrier_type', 'Percepção Visual',
            'description', 'Dificuldade em discriminar cores',
            'severity', 'media',
            'identified_date', CURRENT_DATE
        );
        v_barriers := v_barriers || jsonb_build_array(v_barrier);
    END IF;
    
    -- Analisar leitura
    IF (v_assessment.reading_skills->>'le_palavras')::boolean = false THEN
        v_barrier := jsonb_build_object(
            'barrier_type', 'Leitura',
            'description', 'Dificuldade em ler palavras simples',
            'severity', 'alta',
            'identified_date', CURRENT_DATE
        );
        v_barriers := v_barriers || jsonb_build_array(v_barrier);
    END IF;
    
    -- Analisar coordenação motora
    IF v_assessment.motor_coordination->>'coordenacao_fina' = 'dificuldade' THEN
        v_barrier := jsonb_build_object(
            'barrier_type', 'Motora',
            'description', 'Dificuldade em coordenação motora fina',
            'severity', 'media',
            'identified_date', CURRENT_DATE
        );
        v_barriers := v_barriers || jsonb_build_array(v_barrier);
    END IF;
    
    -- Retornar array de barreiras
    RETURN v_barriers;
END;
$;

COMMENT ON FUNCTION generate_barriers_from_assessment(uuid) IS 'Gera sugestões de barreiras baseado na avaliação diagnóstica';

-- ============================================================================
-- FUNÇÃO: Gerar Sugestões de Metas SMART a partir da Avaliação
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_goals_from_assessment(p_assessment_id uuid, p_plan_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $
DECLARE
    v_assessment record;
    v_goal_text text;
    v_goal_area text;
BEGIN
    -- Buscar avaliação
    SELECT * INTO v_assessment
    FROM aee_diagnostic_assessments
    WHERE id = p_assessment_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Sugerir meta de leitura se houver dificuldade
    IF (v_assessment.reading_skills->>'le_palavras')::boolean = false THEN
        v_goal_text := 'O aluno será capaz de ler corretamente 10 palavras simples (CVC) em atividades práticas, com 80% de acerto, até o final do I Ciclo';
        v_goal_area := 'linguagem';
        
        INSERT INTO aee_plan_goals (
            plan_id, goal_description, goal_area, priority, is_measurable
        )
        VALUES (
            p_plan_id, v_goal_text, v_goal_area, 'alta', true
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Sugerir meta de escrita se necessário
    IF v_assessment.writing_level IN ('pre_silabico', 'silabico_sem_valor') THEN
        v_goal_text := 'O aluno avançará para o nível silábico com valor sonoro, escrevendo seu nome e palavras do cotidiano até o final do II Ciclo';
        v_goal_area := 'linguagem';
        
        INSERT INTO aee_plan_goals (
            plan_id, goal_description, goal_area, priority, is_measurable
        )
        VALUES (
            p_plan_id, v_goal_text, v_goal_area, 'alta', true
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Sugerir meta de coordenação motora
    IF v_assessment.motor_coordination->>'coordenacao_fina' = 'dificuldade' THEN
        v_goal_text := 'O aluno desenvolverá coordenação motora fina para segurar lápis corretamente e realizar traçados com 70% de precisão até o final do I Ciclo';
        v_goal_area := 'motora';
        
        INSERT INTO aee_plan_goals (
            plan_id, goal_description, goal_area, priority, is_measurable
        )
        VALUES (
            p_plan_id, v_goal_text, v_goal_area, 'media', true
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Sugerir meta socioemocional se necessário
    IF (v_assessment.interpersonal_relations->>'relaciona_bem_colegas')::boolean = false THEN
        v_goal_text := 'O aluno desenvolverá habilidades sociais para interagir positivamente com colegas em atividades em grupo, 3 vezes por semana';
        v_goal_area := 'socio_emocional';
        
        INSERT INTO aee_plan_goals (
            plan_id, goal_description, goal_area, priority, is_measurable
        )
        VALUES (
            p_plan_id, v_goal_text, v_goal_area, 'media', true
        )
        ON CONFLICT DO NOTHING;
    END IF;
END;
$;

COMMENT ON FUNCTION generate_goals_from_assessment(uuid, uuid) IS 'Gera sugestões de metas SMART baseado na avaliação diagnóstica';

-- ============================================================================
-- FUNÇÃO: Vincular Avaliação ao Plano
-- ============================================================================

CREATE OR REPLACE FUNCTION link_assessment_to_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
BEGIN
    -- Se a avaliação tem plan_id, atualizar o plano com dados da avaliação
    IF NEW.plan_id IS NOT NULL THEN
        -- Gerar barreiras automaticamente
        UPDATE plano_aee
        SET learning_barriers = generate_barriers_from_assessment(NEW.id)
        WHERE id = NEW.plan_id;
        
        -- Gerar sugestões de metas
        PERFORM generate_goals_from_assessment(NEW.id, NEW.plan_id);
    END IF;
    
    RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS trigger_link_assessment ON "public"."aee_diagnostic_assessments";
CREATE TRIGGER trigger_link_assessment
    AFTER INSERT ON "public"."aee_diagnostic_assessments"
    FOR EACH ROW
    EXECUTE FUNCTION link_assessment_to_plan();

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View: Última avaliação de cada aluno
CREATE OR REPLACE VIEW aee_latest_assessments AS
SELECT DISTINCT ON (student_id)
    a.*,
    s.full_name as student_name,
    p.full_name as teacher_name
FROM aee_diagnostic_assessments a
JOIN students s ON s.id = a.student_id
JOIN profiles p ON p.id = a.teacher_id
ORDER BY a.student_id, a.assessment_date DESC;

COMMENT ON VIEW aee_latest_assessments IS 'Última avaliação diagnóstica de cada aluno';

-- ============================================================================
-- FINALIZAÇÃO
-- ============================================================================

DO $
BEGIN
    RAISE NOTICE '✅ Migração Fase 2 - Avaliações aplicada com sucesso!';
    RAISE NOTICE '📊 2 novas tabelas criadas';
    RAISE NOTICE '🔧 3 funções de sugestões automáticas';
    RAISE NOTICE '⚡ 1 trigger de vinculação';
    RAISE NOTICE '🔐 4 políticas RLS';
    RAISE NOTICE '📈 1 view criada';
    RAISE NOTICE '✨ Sistema de avaliação pronto!';
END $;






























