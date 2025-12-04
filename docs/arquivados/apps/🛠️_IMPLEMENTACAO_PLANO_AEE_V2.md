# 🛠️ Guia de Implementação Técnica - Plano de AEE V2.0

> **Documento Blueprint**: Especificações técnicas detalhadas para implementação da V2.0  
> **Baseado em**: [`🚀_APP_PLANO_AEE_V2.md`](./🚀_APP_PLANO_AEE_V2.md) e [`📋_ROADMAP_PLANO_AEE.md`](./📋_ROADMAP_PLANO_AEE.md)  
> **Data**: 09/01/2025  
> **Status**: 📋 Documento de Planejamento

---

## 🎯 Objetivo deste Documento

Este documento fornece **especificações técnicas detalhadas** para cada tarefa da V2.0, incluindo:

- ✅ Scripts SQL prontos para executar
- ✅ Estrutura de componentes React
- ✅ Tipos TypeScript completos
- ✅ Ordem de implementação com dependências
- ✅ Checklists de validação
- ✅ Testes recomendados

---

## 📊 Visão Geral das Fases

### **Cronograma de Dependências**

```
Fase 1 (Fundação) ← OBRIGATÓRIA PRIMEIRO
    ↓
Fase 2 (Avaliações) ← Depende de Fase 1
    ↓
Fase 3 (Documentos) ← Depende de Fase 1 e 2
    ↓
Fase 4 (Offline) ← Pode ser paralela a Fase 5 e 6
Fase 5 (Analytics) ← Depende de Fase 1
Fase 6 (Avançado) ← Depende de Fase 1
    ↓
Fase 7 (Mobile) ← Depende de todas anteriores
```

---

## 🗄️ FASE 1: Fundação (3 meses)

### **Tarefa 1.1: Migração SQL - 9 Novas Tabelas**

#### **Arquivo**: `supabase/migrations/20250201000001_aee_v2_fundacao.sql`

```sql
-- ============================================================================
-- MIGRAÇÃO V2.0: Fundação do Sistema de Plano de AEE
-- ============================================================================
-- Adiciona 9 novas tabelas para funcionalidades avançadas
-- Data: 2025-02-01
-- ============================================================================

-- ============================================================================
-- 1. CENTROS/SALAS DE AEE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_centers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    
    -- Dados do Centro
    "center_name" text NOT NULL,
    "center_type" text DEFAULT 'sala_recursos', 
    -- 'sala_recursos', 'centro_especializado', 'itinerante'
    "address" text,
    "phone" text,
    
    -- Funcionamento
    "operating_hours" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"seg": "8:00-12:00", "ter": "8:00-12:00"}
    "capacity" integer DEFAULT 10,
    
    -- Especialidades Atendidas
    "specializations" text[] DEFAULT ARRAY[]::text[],
    -- ['TEA', 'Baixa Visão', 'Deficiência Intelectual', 'Surdez']
    
    -- Status
    "is_active" boolean DEFAULT true,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_centers_school" ON "public"."aee_centers"("school_id");
CREATE INDEX IF NOT EXISTS "idx_aee_centers_tenant" ON "public"."aee_centers"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_aee_centers_active" ON "public"."aee_centers"("is_active");

-- RLS
ALTER TABLE "public"."aee_centers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_aee_centers"
    ON "public"."aee_centers"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."profiles" p
            WHERE p.id = auth.uid()
            AND (p.school_id = "aee_centers"."school_id" 
                 OR p.tenant_id = "aee_centers"."tenant_id")
        )
    );

CREATE POLICY "coordinators_manage_aee_centers"
    ON "public"."aee_centers"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            JOIN "public"."profiles" p ON p.id = ur.user_id
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'school_director', 'education_secretary')
            AND (p.school_id = "aee_centers"."school_id" 
                 OR p.tenant_id = "aee_centers"."tenant_id")
        )
    );

-- ============================================================================
-- 2. METAS DO PLANO (SMART)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_plan_goals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    
    -- Meta SMART
    "goal_description" text NOT NULL,
    "goal_area" text DEFAULT 'geral',
    -- 'percepcao', 'linguagem', 'motora', 'socio_emocional', 'autonomia', 'academica', 'geral'
    "is_measurable" boolean DEFAULT true,
    "target_date" date,
    
    -- Acompanhamento de Progresso
    "progress_status" text DEFAULT 'nao_iniciada',
    -- 'nao_iniciada', 'em_andamento', 'alcancada', 'parcialmente_alcancada', 'ajustada', 'cancelada'
    "progress_percentage" integer DEFAULT 0 
        CHECK ("progress_percentage" >= 0 AND "progress_percentage" <= 100),
    
    -- Detalhes da Meta
    "activities" text,
    "materials_needed" text,
    "strategies" text,
    
    -- Critérios de Avaliação
    "success_criteria" text,
    "evaluation_notes" text,
    
    -- Prioridade
    "priority" text DEFAULT 'media',
    -- 'baixa', 'media', 'alta'
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_plan_goals_plan" ON "public"."aee_plan_goals"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_aee_plan_goals_area" ON "public"."aee_plan_goals"("goal_area");
CREATE INDEX IF NOT EXISTS "idx_aee_plan_goals_status" ON "public"."aee_plan_goals"("progress_status");
CREATE INDEX IF NOT EXISTS "idx_aee_plan_goals_priority" ON "public"."aee_plan_goals"("priority");

-- RLS
ALTER TABLE "public"."aee_plan_goals" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_manage_plan_goals"
    ON "public"."aee_plan_goals"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_plan_goals"."plan_id"
            AND (pa.created_by = auth.uid() 
                 OR pa.assigned_aee_teacher_id = auth.uid())
        )
    );

CREATE POLICY "others_view_plan_goals"
    ON "public"."aee_plan_goals"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_plan_goals"."plan_id"
        )
    );

-- ============================================================================
-- 3. REGISTRO DE ATENDIMENTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_attendance_records" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    
    -- Data e Hora
    "attendance_date" date NOT NULL,
    "attendance_time" time,
    "duration_minutes" integer DEFAULT 50,
    
    -- Presença
    "attendance_status" text NOT NULL,
    -- 'presente', 'falta_justificada', 'falta_injustificada', 'remarcado'
    "absence_reason" text,
    
    -- Atividades Realizadas (apenas se presente)
    "activities_performed" text,
    "goals_worked" uuid[], -- Array de goal_ids
    "materials_used" text,
    
    -- Observações e Evolução
    "student_performance" text,
    "behavior_observations" text,
    "challenges_faced" text,
    "achievements" text,
    "observations" text,
    "next_steps" text,
    
    -- Evidências
    "attachments" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"nome": "atividade.pdf", "url": "...", "tipo": "foto|video|documento"}]
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT "valid_attendance_status" CHECK (
        "attendance_status" IN ('presente', 'falta_justificada', 'falta_injustificada', 'remarcado')
    )
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_attendance_plan" ON "public"."aee_attendance_records"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_student" ON "public"."aee_attendance_records"("student_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_teacher" ON "public"."aee_attendance_records"("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "public"."aee_attendance_records"("attendance_date");
CREATE INDEX IF NOT EXISTS "idx_attendance_status" ON "public"."aee_attendance_records"("attendance_status");

-- RLS
ALTER TABLE "public"."aee_attendance_records" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_manage_attendance"
    ON "public"."aee_attendance_records"
    FOR ALL
    USING ("teacher_id" = auth.uid());

CREATE POLICY "others_view_attendance"
    ON "public"."aee_attendance_records"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            JOIN "public"."profiles" p ON p.id = auth.uid()
            WHERE pa.id = "aee_attendance_records"."plan_id"
            AND (p.school_id = pa.school_id OR p.tenant_id = pa.tenant_id)
        )
    );

-- ============================================================================
-- 4. CICLOS DE AVALIAÇÃO
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_evaluation_cycles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    
    -- Identificação do Ciclo
    "cycle_number" integer NOT NULL CHECK ("cycle_number" BETWEEN 1 AND 3),
    "cycle_name" text,
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    
    -- Avaliação do Ciclo
    "achievements" text,
    "challenges" text,
    "goals_progress" jsonb DEFAULT '{}'::jsonb,
    -- Formato: {"goal_id": {"status": "alcancada", "percentage": 100, "observations": "..."}}
    
    -- Frequência no Ciclo
    "total_attendances_planned" integer,
    "total_attendances_actual" integer,
    "attendance_percentage" numeric(5,2),
    
    -- Ajustes Necessários
    "plan_adjustments" text,
    "new_strategies" text,
    "resource_needs" text,
    
    -- Encaminhamentos do Ciclo
    "referrals_made" jsonb DEFAULT '[]'::jsonb,
    
    -- Orientações para Próximo Ciclo
    "recommendations_next_cycle" text,
    
    -- Avaliação
    "evaluation_date" date,
    "evaluated_by" uuid REFERENCES "auth"."users"("id"),
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    -- Constraint de unicidade
    UNIQUE("plan_id", "cycle_number")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_cycles_plan" ON "public"."aee_evaluation_cycles"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_cycles_number" ON "public"."aee_evaluation_cycles"("cycle_number");
CREATE INDEX IF NOT EXISTS "idx_cycles_dates" ON "public"."aee_evaluation_cycles"("start_date", "end_date");

-- RLS
ALTER TABLE "public"."aee_evaluation_cycles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_manage_cycles"
    ON "public"."aee_evaluation_cycles"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_evaluation_cycles"."plan_id"
            AND (pa.created_by = auth.uid() 
                 OR pa.assigned_aee_teacher_id = auth.uid())
        )
    );

CREATE POLICY "others_view_cycles"
    ON "public"."aee_evaluation_cycles"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa
            WHERE pa.id = "aee_evaluation_cycles"."plan_id"
        )
    );

-- ============================================================================
-- 5-9. DEMAIS TABELAS (Resumidas - ver migração completa)
-- ============================================================================

-- 5. aee_diagnostic_assessments (Avaliações Diagnósticas)
-- 6. aee_school_visits (Visitas à Escola)
-- 7. aee_referrals (Encaminhamentos)
-- 8. aee_family_interviews (Anamnese)
-- 9. aee_documents (Documentos Gerados)

-- Ver arquivo completo: migrations/20250201000001_aee_v2_fundacao.sql

-- ============================================================================
-- TRIGGERS E FUNÇÕES
-- ============================================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Aplicar a todas as novas tabelas
DROP TRIGGER IF EXISTS update_aee_centers_updated_at ON "public"."aee_centers";
CREATE TRIGGER update_aee_centers_updated_at
    BEFORE UPDATE ON "public"."aee_centers"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_aee_plan_goals_updated_at ON "public"."aee_plan_goals";
CREATE TRIGGER update_aee_plan_goals_updated_at
    BEFORE UPDATE ON "public"."aee_plan_goals"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON "public"."aee_attendance_records";
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON "public"."aee_attendance_records"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cycles_updated_at ON "public"."aee_evaluation_cycles";
CREATE TRIGGER update_cycles_updated_at
    BEFORE UPDATE ON "public"."aee_evaluation_cycles"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÃO: Criar Ciclos Automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_evaluation_cycles()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
DECLARE
    v_cycle_duration interval := INTERVAL '3 months';
    v_cycle_count integer := 3;
    v_cycle_number integer;
    v_cycle_names text[] := ARRAY['I Ciclo', 'II Ciclo', 'III Ciclo'];
BEGIN
    -- Criar 3 ciclos automaticamente ao criar um plano
    FOR v_cycle_number IN 1..v_cycle_count LOOP
        INSERT INTO aee_evaluation_cycles (
            plan_id,
            cycle_number,
            cycle_name,
            start_date,
            end_date
        )
        VALUES (
            NEW.id,
            v_cycle_number,
            v_cycle_names[v_cycle_number],
            NEW.start_date + (v_cycle_number - 1) * v_cycle_duration,
            NEW.start_date + v_cycle_number * v_cycle_duration - INTERVAL '1 day'
        )
        ON CONFLICT (plan_id, cycle_number) DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS trigger_auto_create_cycles ON "public"."plano_aee";
CREATE TRIGGER trigger_auto_create_cycles
    AFTER INSERT ON "public"."plano_aee"
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_evaluation_cycles();

-- ============================================================================
-- FUNÇÃO: Atualizar Estatísticas do Plano
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_plan_statistics(p_plan_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $
DECLARE
    v_total_attendances integer;
    v_present_attendances integer;
    v_attendance_percentage numeric(5,2);
    v_total_goals integer;
    v_achieved_goals integer;
BEGIN
    -- Calcular frequência
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE attendance_status = 'presente')
    INTO v_total_attendances, v_present_attendances
    FROM aee_attendance_records
    WHERE plan_id = p_plan_id;
    
    v_attendance_percentage := CASE 
        WHEN v_total_attendances > 0 THEN 
            (v_present_attendances::numeric / v_total_attendances::numeric) * 100
        ELSE 0
    END;
    
    -- Calcular metas
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE progress_status = 'alcancada')
    INTO v_total_goals, v_achieved_goals
    FROM aee_plan_goals
    WHERE plan_id = p_plan_id;
    
    -- Atualizar plano
    UPDATE plano_aee
    SET 
        total_attendances = v_total_attendances,
        attendance_percentage = v_attendance_percentage,
        total_goals = v_total_goals,
        goals_achieved = v_achieved_goals,
        updated_at = now()
    WHERE id = p_plan_id;
END;
$;

-- ============================================================================
-- TRIGGER: Atualizar Progresso de Metas
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_update_goal_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
DECLARE
    v_goal_id uuid;
    v_total_attendances integer;
    v_new_progress integer;
BEGIN
    -- Apenas se o atendimento foi presente e tem metas trabalhadas
    IF NEW.attendance_status = 'presente' AND NEW.goals_worked IS NOT NULL THEN
        FOREACH v_goal_id IN ARRAY NEW.goals_worked
        LOOP
            -- Contar quantas vezes essa meta foi trabalhada
            SELECT COUNT(*) INTO v_total_attendances
            FROM aee_attendance_records
            WHERE plan_id = NEW.plan_id
              AND v_goal_id = ANY(goals_worked)
              AND attendance_status = 'presente';
            
            -- Calcular progresso (10% por atendimento, máximo 100%)
            v_new_progress := LEAST(100, (v_total_attendances * 10));
            
            -- Atualizar meta
            UPDATE aee_plan_goals
            SET 
                progress_percentage = v_new_progress,
                progress_status = CASE 
                    WHEN v_new_progress >= 100 THEN 'alcancada'
                    WHEN v_new_progress >= 50 THEN 'em_andamento'
                    ELSE 'nao_iniciada'
                END,
                updated_at = now()
            WHERE id = v_goal_id;
        END LOOP;
        
        -- Atualizar estatísticas do plano
        PERFORM calculate_plan_statistics(NEW.plan_id);
    END IF;
    
    RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS trigger_auto_update_goal_progress ON "public"."aee_attendance_records";
CREATE TRIGGER trigger_auto_update_goal_progress
    AFTER INSERT ON "public"."aee_attendance_records"
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_goal_progress();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."aee_centers" IS 'Centros e Salas de Recurso de AEE';
COMMENT ON TABLE "public"."aee_plan_goals" IS 'Metas SMART dos Planos de AEE';
COMMENT ON TABLE "public"."aee_attendance_records" IS 'Registro de Atendimentos com frequência';
COMMENT ON TABLE "public"."aee_evaluation_cycles" IS 'Ciclos Avaliativos (I, II, III)';

COMMENT ON COLUMN "public"."aee_plan_goals"."goal_area" IS 'Área de desenvolvimento da meta';
COMMENT ON COLUMN "public"."aee_plan_goals"."progress_status" IS 'Status atual da meta';
COMMENT ON COLUMN "public"."aee_attendance_records"."goals_worked" IS 'Array de UUIDs das metas trabalhadas no atendimento';
```

#### **Checklist de Validação - Tarefa 1.1**

- [ ] Arquivo SQL criado em `supabase/migrations/`
- [ ] 4 tabelas principais criadas (aee_centers, aee_plan_goals, aee_attendance_records, aee_evaluation_cycles)
- [ ] Todos os índices criados
- [ ] Políticas RLS aplicadas
- [ ] Triggers de updated_at funcionando
- [ ] Função auto_create_evaluation_cycles testada
- [ ] Função calculate_plan_statistics testada
- [ ] Trigger auto_update_goal_progress testado
- [ ] Comentários adicionados
- [ ] Migração testada em ambiente local
- [ ] Migração aplicada em desenvolvimento

#### **Testes Recomendados - Tarefa 1.1**

```sql
-- Teste 1: Criar plano e verificar ciclos automáticos
INSERT INTO plano_aee (student_id, school_id, tenant_id, created_by, start_date)
VALUES ('uuid-aluno', 'uuid-escola', 'uuid-tenant', 'uuid-professor', '2025-03-01');

SELECT * FROM aee_evaluation_cycles WHERE plan_id = 'uuid-do-plano-criado';
-- Deve retornar 3 ciclos (I, II, III)

-- Teste 2: Criar meta e atendimento, verificar progresso automático
INSERT INTO aee_plan_goals (plan_id, goal_description, goal_area)
VALUES ('uuid-plano', 'Meta teste', 'percepcao');

INSERT INTO aee_attendance_records (
    plan_id, student_id, teacher_id, 
    attendance_date, attendance_status, goals_worked
)
VALUES (
    'uuid-plano', 'uuid-aluno', 'uuid-professor',
    CURRENT_DATE, 'presente', ARRAY['uuid-da-meta']::uuid[]
);

SELECT progress_percentage, progress_status FROM aee_plan_goals WHERE id = 'uuid-da-meta';
-- Deve retornar progress_percentage = 10 e progress_status = 'nao_iniciada'

-- Teste 3: Verificar estatísticas do plano
SELECT total_attendances, attendance_percentage, total_goals, goals_achieved
FROM plano_aee WHERE id = 'uuid-plano';
-- Deve ter valores atualizados automaticamente
```

---

### **Tarefa 1.2: Tipos TypeScript**

#### **Arquivo**: `apps/plano-aee/src/types/planoAEE.types.ts`

```typescript
// ============================================================================
// TIPOS V2.0 - Sistema de Plano de AEE
// ============================================================================

// Tipos base
export type AttendanceStatus = 
  | 'presente' 
  | 'falta_justificada' 
  | 'falta_injustificada' 
  | 'remarcado';

export type GoalStatus = 
  | 'nao_iniciada' 
  | 'em_andamento' 
  | 'alcancada' 
  | 'parcialmente_alcancada' 
  | 'ajustada' 
  | 'cancelada';

export type GoalArea = 
  | 'percepcao' 
  | 'linguagem' 
  | 'motora' 
  | 'socio_emocional' 
  | 'autonomia' 
  | 'academica' 
  | 'geral';

export type GoalPriority = 'baixa' | 'media' | 'alta';

export type CenterType = 
  | 'sala_recursos' 
  | 'centro_especializado' 
  | 'itinerante';

// ============================================================================
// CENTRO DE AEE
// ============================================================================

export interface AEECenter {
  id: string;
  school_id: string;
  tenant_id: string;
  center_name: string;
  center_type: CenterType;
  address?: string;
  phone?: string;
  operating_hours: Record<string, string>; // {"seg": "8:00-12:00"}
  capacity: number;
  specializations: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAEECenterInput {
  school_id: string;
  tenant_id: string;
  center_name: string;
  center_type?: CenterType;
  address?: string;
  phone?: string;
  operating_hours?: Record<string, string>;
  capacity?: number;
  specializations?: string[];
}

// ============================================================================
// METAS DO PLANO (SMART)
// ============================================================================

export interface PlanGoal {
  id: string;
  plan_id: string;
  goal_description: string;
  goal_area: GoalArea;
  is_measurable: boolean;
  target_date?: string;
  progress_status: GoalStatus;
  progress_percentage: number;
  activities?: string;
  materials_needed?: string;
  strategies?: string;
  success_criteria?: string;
  evaluation_notes?: string;
  priority: GoalPriority;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanGoalInput {
  plan_id: string;
  goal_description: string;
  goal_area: GoalArea;
  is_measurable?: boolean;
  target_date?: string;
  activities?: string;
  materials_needed?: string;
  strategies?: string;
  success_criteria?: string;
  priority?: GoalPriority;
}

export interface UpdatePlanGoalInput {
  goal_description?: string;
  goal_area?: GoalArea;
  target_date?: string;
  progress_status?: GoalStatus;
  progress_percentage?: number;
  activities?: string;
  materials_needed?: string;
  strategies?: string;
  success_criteria?: string;
  evaluation_notes?: string;
  priority?: GoalPriority;
}

// ============================================================================
// REGISTRO DE ATENDIMENTO
// ============================================================================

export interface AttendanceAttachment {
  nome: string;
  url: string;
  tipo: 'foto' | 'video' | 'documento';
}

export interface AttendanceRecord {
  id: string;
  plan_id: string;
  student_id: string;
  teacher_id: string;
  attendance_date: string;
  attendance_time?: string;
  duration_minutes: number;
  attendance_status: AttendanceStatus;
  absence_reason?: string;
  activities_performed?: string;
  goals_worked?: string[]; // Array de goal IDs
  materials_used?: string;
  student_performance?: string;
  behavior_observations?: string;
  challenges_faced?: string;
  achievements?: string;
  observations?: string;
  next_steps?: string;
  attachments: AttendanceAttachment[];
  created_at: string;
  updated_at: string;
}

export interface CreateAttendanceInput {
  plan_id: string;
  student_id: string;
  attendance_date: string;
  attendance_time?: string;
  duration_minutes?: number;
  attendance_status: AttendanceStatus;
  absence_reason?: string;
  activities_performed?: string;
  goals_worked?: string[];
  materials_used?: string;
  student_performance?: string;
  behavior_observations?: string;
  challenges_faced?: string;
  achievements?: string;
  observations?: string;
  next_steps?: string;
}

// ============================================================================
// CICLO DE AVALIAÇÃO
// ============================================================================

export interface GoalProgress {
  status: GoalStatus;
  percentage: number;
  observations: string;
}

export interface EvaluationCycle {
  id: string;
  plan_id: string;
  cycle_number: 1 | 2 | 3;
  cycle_name: string;
  start_date: string;
  end_date: string;
  achievements?: string;
  challenges?: string;
  goals_progress: Record<string, GoalProgress>; // goal_id -> progress
  total_attendances_planned?: number;
  total_attendances_actual?: number;
  attendance_percentage?: number;
  plan_adjustments?: string;
  new_strategies?: string;
  resource_needs?: string;
  referrals_made: any[];
  recommendations_next_cycle?: string;
  evaluation_date?: string;
  evaluated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateEvaluationCycleInput {
  achievements?: string;
  challenges?: string;
  goals_progress?: Record<string, GoalProgress>;
  plan_adjustments?: string;
  new_strategies?: string;
  resource_needs?: string;
  recommendations_next_cycle?: string;
  evaluation_date?: string;
}

// ============================================================================
// QUERIES E FILTROS
// ============================================================================

export interface AttendanceFilters {
  plan_id?: string;
  student_id?: string;
  teacher_id?: string;
  date_from?: string;
  date_to?: string;
  attendance_status?: AttendanceStatus;
}

export interface GoalsFilters {
  plan_id?: string;
  goal_area?: GoalArea;
  progress_status?: GoalStatus;
  priority?: GoalPriority;
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

export interface PlanStatistics {
  total_attendances: number;
  attendance_percentage: number;
  total_goals: number;
  goals_achieved: number;
  goals_in_progress: number;
  current_cycle: number;
  days_since_start: number;
}

export interface AttendanceStatistics {
  total: number;
  presente: number;
  faltas_justificadas: number;
  faltas_injustificadas: number;
  remarcados: number;
  attendance_rate: number;
}
```

#### **Checklist de Validação - Tarefa 1.2**

- [ ] Arquivo de tipos criado
- [ ] Todos os tipos exportados
- [ ] Enums definidos corretamente
- [ ] Interfaces para create/update separadas
- [ ] Tipos de filtros incluídos
- [ ] Tipos de estatísticas incluídos
- [ ] Sem erros de TypeScript (`tsc --noEmit`)
- [ ] Documentação inline (JSDoc) adicionada

---

### **Tarefa 1.3: Hooks Customizados**

#### **Arquivo**: `apps/plano-aee/src/hooks/usePlanGoals.ts`

```typescript
// ============================================================================
// HOOK: usePlanGoals
// ============================================================================
// Gerenciar metas SMART do plano de AEE

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useToast } from '@/hooks/use-toast';
import type { PlanGoal, CreatePlanGoalInput, UpdatePlanGoalInput, GoalsFilters } from '@/types/planoAEE.types';

export function usePlanGoals(planId: string, filters?: GoalsFilters) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query: Buscar metas do plano
  const { data: goals, isLoading, error, refetch } = useQuery({
    queryKey: ['plan-goals', planId, filters],
    queryFn: async () => {
      let query = supabase
        .from('aee_plan_goals')
        .select('*')
        .eq('plan_id', planId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (filters?.goal_area) {
        query = query.eq('goal_area', filters.goal_area);
      }
      if (filters?.progress_status) {
        query = query.eq('progress_status', filters.progress_status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as PlanGoal[];
    },
    enabled: !!planId,
  });

  // Mutation: Criar meta
  const createGoal = useMutation({
    mutationFn: async (input: CreatePlanGoalInput) => {
      const { data, error } = await supabase
        .from('aee_plan_goals')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data as PlanGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-goals', planId] });
      toast({
        title: 'Meta criada',
        description: 'A meta foi criada com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar meta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Atualizar meta
  const updateGoal = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdatePlanGoalInput }) => {
      const { data, error } = await supabase
        .from('aee_plan_goals')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as PlanGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-goals', planId] });
      toast({
        title: 'Meta atualizada',
        description: 'A meta foi atualizada com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar meta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Deletar meta
  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('aee_plan_goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-goals', planId] });
      toast({
        title: 'Meta removida',
        description: 'A meta foi removida com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover meta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Função auxiliar: Atualizar progresso
  const updateProgress = (goalId: string, percentage: number) => {
    const status = 
      percentage >= 100 ? 'alcancada' :
      percentage >= 50 ? 'em_andamento' :
      'nao_iniciada';

    return updateGoal.mutate({
      id: goalId,
      input: { progress_percentage: percentage, progress_status: status },
    });
  };

  // Estatísticas
  const statistics = {
    total: goals?.length || 0,
    achieved: goals?.filter(g => g.progress_status === 'alcancada').length || 0,
    in_progress: goals?.filter(g => g.progress_status === 'em_andamento').length || 0,
    not_started: goals?.filter(g => g.progress_status === 'nao_iniciada').length || 0,
    high_priority: goals?.filter(g => g.priority === 'alta').length || 0,
  };

  return {
    goals: goals || [],
    isLoading,
    error,
    refetch,
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    statistics,
  };
}
```

#### **Arquivo**: `apps/plano-aee/src/hooks/useAttendance.ts`

```typescript
// ============================================================================
// HOOK: useAttendance
// ============================================================================
// Gerenciar registro de atendimentos

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useToast } from '@/hooks/use-toast';
import type { AttendanceRecord, CreateAttendanceInput, AttendanceFilters } from '@/types/planoAEE.types';

export function useAttendance(filters: AttendanceFilters) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query: Buscar atendimentos
  const { data: attendances, isLoading, error, refetch } = useQuery({
    queryKey: ['attendances', filters],
    queryFn: async () => {
      let query = supabase
        .from('aee_attendance_records')
        .select('*')
        .order('attendance_date', { ascending: false });

      if (filters.plan_id) {
        query = query.eq('plan_id', filters.plan_id);
      }
      if (filters.student_id) {
        query = query.eq('student_id', filters.student_id);
      }
      if (filters.teacher_id) {
        query = query.eq('teacher_id', filters.teacher_id);
      }
      if (filters.date_from) {
        query = query.gte('attendance_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('attendance_date', filters.date_to);
      }
      if (filters.attendance_status) {
        query = query.eq('attendance_status', filters.attendance_status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });

  // Mutation: Registrar atendimento
  const recordAttendance = useMutation({
    mutationFn: async (input: CreateAttendanceInput) => {
      const { data, error } = await supabase
        .from('aee_attendance_records')
        .insert({
          ...input,
          teacher_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as AttendanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['plan-goals'] }); // Atualiza progresso
      queryClient.invalidateQueries({ queryKey: ['plan-statistics'] });
      toast({
        title: 'Atendimento registrado',
        description: 'O atendimento foi registrado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar atendimento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Estatísticas
  const statistics = {
    total: attendances?.length || 0,
    presente: attendances?.filter(a => a.attendance_status === 'presente').length || 0,
    faltas_justificadas: attendances?.filter(a => a.attendance_status === 'falta_justificada').length || 0,
    faltas_injustificadas: attendances?.filter(a => a.attendance_status === 'falta_injustificada').length || 0,
    attendance_rate: attendances?.length 
      ? ((attendances.filter(a => a.attendance_status === 'presente').length / attendances.length) * 100).toFixed(2)
      : '0',
  };

  return {
    attendances: attendances || [],
    isLoading,
    error,
    refetch,
    recordAttendance,
    statistics,
  };
}
```

#### **Checklist de Validação - Tarefa 1.3**

- [ ] Hooks criados (usePlanGoals, useAttendance)
- [ ] React Query configurado
- [ ] Mutations com invalidação de cache
- [ ] Toast notifications funcionando
- [ ] Estatísticas calculadas corretamente
- [ ] Tipos TypeScript corretos
- [ ] Tratamento de erros implementado
- [ ] Testes unitários criados

---

### **Tarefa 1.4: Componentes React - Metas SMART**

#### **Arquivo**: `apps/plano-aee/src/components/aee/Goals/GoalForm.tsx`

```tsx
// ============================================================================
// COMPONENTE: GoalForm
// ============================================================================
// Formulário para criar/editar metas SMART

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@pei/ui';
import { Input } from '@pei/ui';
import { Textarea } from '@pei/ui';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@pei/ui';
import { Calendar } from '@pei/ui';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@pei/ui';
import type { CreatePlanGoalInput, UpdatePlanGoalInput, GoalArea, GoalPriority } from '@/types/planoAEE.types';

const goalSchema = z.object({
  goal_description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  goal_area: z.enum(['percepcao', 'linguagem', 'motora', 'socio_emocional', 'autonomia', 'academica', 'geral']),
  target_date: z.string().optional(),
  activities: z.string().optional(),
  materials_needed: z.string().optional(),
  strategies: z.string().optional(),
  success_criteria: z.string().optional(),
  priority: z.enum(['baixa', 'media', 'alta']).default('media'),
});

interface GoalFormProps {
  planId: string;
  initialData?: Partial<UpdatePlanGoalInput>;
  onSubmit: (data: CreatePlanGoalInput | UpdatePlanGoalInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function GoalForm({ planId, initialData, onSubmit, onCancel, isLoading }: GoalFormProps) {
  const form = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goal_description: initialData?.goal_description || '',
      goal_area: initialData?.goal_area || 'geral',
      target_date: initialData?.target_date || '',
      activities: initialData?.activities || '',
      materials_needed: initialData?.materials_needed || '',
      strategies: initialData?.strategies || '',
      success_criteria: initialData?.success_criteria || '',
      priority: initialData?.priority || 'media',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (initialData) {
      onSubmit(data as UpdatePlanGoalInput);
    } else {
      onSubmit({ ...data, plan_id: planId } as CreatePlanGoalInput);
    }
  });

  const goalAreas: { value: GoalArea; label: string }[] = [
    { value: 'percepcao', label: 'Percepção' },
    { value: 'linguagem', label: 'Linguagem' },
    { value: 'motora', label: 'Motora' },
    { value: 'socio_emocional', label: 'Socioemocional' },
    { value: 'autonomia', label: 'Autonomia' },
    { value: 'academica', label: 'Acadêmica' },
    { value: 'geral', label: 'Geral' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descrição da Meta */}
        <FormField
          control={form.control}
          name="goal_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição da Meta (SMART) *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Ex: O aluno será capaz de identificar 8 de 10 letras do alfabeto em atividades práticas até junho de 2025"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Dica: Meta SMART = Específica, Mensurável, Atingível, Relevante, Temporal
              </p>
            </FormItem>
          )}
        />

        {/* Área de Desenvolvimento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="goal_area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área de Desenvolvimento *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {goalAreas.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="baixa">🟢 Baixa</SelectItem>
                    <SelectItem value="media">🟡 Média</SelectItem>
                    <SelectItem value="alta">🔴 Alta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Data Alvo */}
        <FormField
          control={form.control}
          name="target_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Alvo</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Atividades */}
        <FormField
          control={form.control}
          name="activities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atividades</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Descreva as atividades que serão realizadas para alcançar esta meta..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Materiais */}
        <FormField
          control={form.control}
          name="materials_needed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Materiais Necessários</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Liste os materiais e recursos necessários..."
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estratégias */}
        <FormField
          control={form.control}
          name="strategies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estratégias Pedagógicas</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Descreva as estratégias que serão utilizadas..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Critérios de Sucesso */}
        <FormField
          control={form.control}
          name="success_criteria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Critérios de Sucesso</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Como saberemos que a meta foi alcançada?"
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ações */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Salvando...' : initialData ? 'Atualizar Meta' : 'Criar Meta'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

#### **Arquivo**: `apps/plano-aee/src/components/aee/Goals/GoalsList.tsx`

```tsx
// ============================================================================
// COMPONENTE: GoalsList
// ============================================================================
// Lista de metas com progresso

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { Badge } from '@pei/ui';
import { Progress } from '@pei/ui';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@pei/ui';
import { Plus, Edit, Trash2, Target } from 'lucide-react';
import { usePlanGoals } from '@/hooks/usePlanGoals';
import { GoalForm } from './GoalForm';
import type { PlanGoal } from '@/types/planoAEE.types';

interface GoalsListProps {
  planId: string;
}

export function GoalsList({ planId }: GoalsListProps) {
  const { goals, isLoading, createGoal, updateGoal, deleteGoal, statistics } = usePlanGoals(planId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PlanGoal | null>(null);

  const getStatusColor = (status: string) => {
    const colors = {
      nao_iniciada: 'bg-gray-100 text-gray-800',
      em_andamento: 'bg-blue-100 text-blue-800',
      alcancada: 'bg-green-100 text-green-800',
      parcialmente_alcancada: 'bg-yellow-100 text-yellow-800',
      ajustada: 'bg-purple-100 text-purple-800',
      cancelada: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.nao_iniciada;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      nao_iniciada: 'Não Iniciada',
      em_andamento: 'Em Andamento',
      alcancada: 'Alcançada',
      parcialmente_alcancada: 'Parcialmente Alcançada',
      ajustada: 'Ajustada',
      cancelada: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityIcon = (priority: string) => {
    const icons = {
      baixa: '🟢',
      media: '🟡',
      alta: '🔴',
    };
    return icons[priority as keyof typeof icons] || '⚪';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando metas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alcançadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.achieved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.in_progress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alta Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.high_priority}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Metas do Plano</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Meta SMART</DialogTitle>
            </DialogHeader>
            <GoalForm
              planId={planId}
              onSubmit={(data) => {
                createGoal.mutate(data as any);
                setIsCreateDialogOpen(false);
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createGoal.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Metas */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma meta cadastrada ainda</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPriorityIcon(goal.priority)}</span>
                        <Badge variant="outline" className="capitalize">
                          {goal.goal_area.replace('_', ' ')}
                        </Badge>
                        <Badge className={getStatusColor(goal.progress_status)}>
                          {getStatusLabel(goal.progress_status)}
                        </Badge>
                      </div>
                      <p className="text-lg font-medium">{goal.goal_description}</p>
                      {goal.target_date && (
                        <p className="text-sm text-muted-foreground">
                          Data alvo: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog open={editingGoal?.id === goal.id} onOpenChange={(open) => !open && setEditingGoal(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingGoal(goal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Editar Meta</DialogTitle>
                          </DialogHeader>
                          <GoalForm
                            planId={planId}
                            initialData={goal}
                            onSubmit={(data) => {
                              updateGoal.mutate({ id: goal.id, input: data as any });
                              setEditingGoal(null);
                            }}
                            onCancel={() => setEditingGoal(null)}
                            isLoading={updateGoal.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja remover esta meta?')) {
                            deleteGoal.mutate(goal.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Progresso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-medium">{goal.progress_percentage}%</span>
                    </div>
                    <Progress value={goal.progress_percentage} />
                  </div>

                  {/* Detalhes Expandíveis */}
                  {(goal.activities || goal.success_criteria) && (
                    <div className="space-y-2 pt-4 border-t">
                      {goal.activities && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Atividades:</p>
                          <p className="text-sm">{goal.activities}</p>
                        </div>
                      )}
                      {goal.success_criteria && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Critérios de Sucesso:</p>
                          <p className="text-sm">{goal.success_criteria}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### **Checklist de Validação - Tarefa 1.4**

- [ ] Componente GoalForm criado
- [ ] Componente GoalsList criado
- [ ] Validação com Zod implementada
- [ ] Dialog para criar/editar funcionando
- [ ] Progress bar visual
- [ ] Badges de status e prioridade
- [ ] Estatísticas exibidas
- [ ] Confirmação antes de deletar
- [ ] Responsivo (mobile)
- [ ] Acessível (ARIA labels)

---

### **Tarefa 1.5: Componente de Registro de Atendimento**

#### **Arquivo**: `apps/plano-aee/src/components/aee/Attendance/QuickRecord.tsx`

```tsx
// ============================================================================
// COMPONENTE: QuickRecord
// ============================================================================
// Registro rápido de atendimento diário

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@pei/ui';
import { Button } from '@pei/ui';
import { Textarea } from '@pei/ui';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@pei/ui';
import { Checkbox } from '@pei/ui';
import { Label } from '@pei/ui';
import { Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePlanGoals } from '@/hooks/usePlanGoals';
import { useAttendance } from '@/hooks/useAttendance';
import type { AttendanceStatus } from '@/types/planoAEE.types';

interface QuickRecordProps {
  planId: string;
  studentId: string;
  studentName: string;
}

export function QuickRecord({ planId, studentId, studentName }: QuickRecordProps) {
  const { goals } = usePlanGoals(planId);
  const { recordAttendance } = useAttendance({ plan_id: planId });
  const [status, setStatus] = useState<AttendanceStatus>('presente');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  const form = useForm();

  const handleSubmit = form.handleSubmit(async (data) => {
    await recordAttendance.mutateAsync({
      plan_id: planId,
      student_id: studentId,
      attendance_date: format(new Date(), 'yyyy-MM-dd'),
      attendance_status: status,
      goals_worked: status === 'presente' ? selectedGoals : undefined,
      activities_performed: data.activities_performed,
      student_performance: data.student_performance,
      behavior_observations: data.behavior_observations,
      observations: data.observations,
      absence_reason: status !== 'presente' ? data.absence_reason : undefined,
    });
    
    // Limpar formulário
    form.reset();
    setSelectedGoals([]);
  });

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Atendimento - {studentName}</CardTitle>
        <CardDescription>
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status do Atendimento */}
        <div>
          <Label>Status do Atendimento</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="presente">✅ Presente</SelectItem>
              <SelectItem value="falta_justificada">📝 Falta Justificada</SelectItem>
              <SelectItem value="falta_injustificada">❌ Falta Injustificada</SelectItem>
              <SelectItem value="remarcado">🔄 Remarcado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {status === 'presente' ? (
          <>
            {/* Metas Trabalhadas */}
            {goals.length > 0 && (
              <div className="space-y-2">
                <Label>Metas Trabalhadas</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                  {goals.map((goal) => (
                    <div key={goal.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`goal-${goal.id}`}
                        checked={selectedGoals.includes(goal.id)}
                        onCheckedChange={() => toggleGoal(goal.id)}
                      />
                      <label
                        htmlFor={`goal-${goal.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {goal.goal_description}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Atividades Realizadas */}
            <div>
              <Label>Atividades Realizadas</Label>
              <Textarea
                {...form.register('activities_performed')}
                placeholder="Descreva as atividades realizadas durante o atendimento..."
                rows={4}
              />
            </div>

            {/* Desempenho do Aluno */}
            <div>
              <Label>Desempenho do Aluno</Label>
              <Textarea
                {...form.register('student_performance')}
                placeholder="Como foi o desempenho do aluno?"
                rows={3}
              />
            </div>

            {/* Observações de Comportamento */}
            <div>
              <Label>Comportamento</Label>
              <Textarea
                {...form.register('behavior_observations')}
                placeholder="Observações sobre o comportamento do aluno..."
                rows={2}
              />
            </div>

            {/* Observações Gerais */}
            <div>
              <Label>Observações Gerais</Label>
              <Textarea
                {...form.register('observations')}
                placeholder="Outras observações relevantes..."
                rows={2}
              />
            </div>
          </>
        ) : (
          /* Motivo da Falta */
          <div>
            <Label>Motivo da Falta</Label>
            <Textarea
              {...form.register('absence_reason')}
              placeholder="Descreva o motivo da falta..."
              rows={3}
              required
            />
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={recordAttendance.isPending}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          {recordAttendance.isPending ? 'Salvando...' : 'Salvar Registro'}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

#### **Checklist de Validação - Tarefa 1.5**

- [ ] Componente QuickRecord criado
- [ ] Seleção de status funcionando
- [ ] Checkbox múltiplo de metas
- [ ] Campos condicionais (presente vs falta)
- [ ] Salvamento com feedback
- [ ] Data formatada em português
- [ ] Form reset após salvar
- [ ] Loading state durante save

---

### **Tarefa 1.6: Integração nas Páginas**

#### **Arquivo**: `apps/plano-aee/src/pages/Plans/PlanEdit.tsx` (atualização)

```tsx
// Adicionar nova aba "Metas e Atendimentos"

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@pei/ui';
import { GoalsList } from '@/components/aee/Goals/GoalsList';
import { QuickRecord } from '@/components/aee/Attendance/QuickRecord';

// Dentro do componente PlanEdit:

<Tabs defaultValue="dados-basicos">
  <TabsList>
    <TabsTrigger value="dados-basicos">Dados Básicos</TabsTrigger>
    <TabsTrigger value="metas">Metas e Atendimentos</TabsTrigger>
    <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
  </TabsList>

  <TabsContent value="dados-basicos">
    {/* Formulário existente */}
  </TabsContent>

  <TabsContent value="metas" className="space-y-6">
    {/* Registro Rápido de Atendimento */}
    <QuickRecord
      planId={planId}
      studentId={plan.student_id}
      studentName={plan.student.full_name}
    />

    {/* Lista de Metas */}
    <GoalsList planId={planId} />
  </TabsContent>

  <TabsContent value="avaliacoes">
    {/* Ciclos existentes */}
  </TabsContent>
</Tabs>
```

---

## ✅ FASE 1 - CHECKLIST FINAL

### **Banco de Dados**
- [ ] Migração SQL executada em local
- [ ] Migração SQL executada em dev
- [ ] Migração SQL executada em produção
- [ ] Seed data criado (centros, metas exemplo)
- [ ] Backup antes da migração
- [ ] Rollback script preparado

### **Backend/Banco**
- [ ] 4 tabelas criadas (aee_centers, aee_plan_goals, aee_attendance_records, aee_evaluation_cycles)
- [ ] Índices criados
- [ ] RLS policies aplicadas
- [ ] Triggers funcionando
- [ ] Funções SQL testadas

### **Types**
- [ ] Arquivo planoAEE.types.ts criado
- [ ] Todas as interfaces exportadas
- [ ] Sem erros TypeScript

### **Hooks**
- [ ] usePlanGoals criado e testado
- [ ] useAttendance criado e testado
- [ ] React Query configurado
- [ ] Cache invalidation funcionando

### **Componentes**
- [ ] GoalForm criado
- [ ] GoalsList criado
- [ ] QuickRecord criado
- [ ] Todos os componentes renderizando
- [ ] Validações funcionando

### **Integração**
- [ ] Aba "Metas e Atendimentos" na página de edição
- [ ] Navegação funcionando
- [ ] Estado sincronizado

### **Testes**
- [ ] Criar meta manual
- [ ] Editar meta existente
- [ ] Deletar meta
- [ ] Registrar atendimento presente
- [ ] Registrar falta
- [ ] Selecionar múltiplas metas
- [ ] Verificar progresso atualiza automaticamente
- [ ] Verificar estatísticas calculadas

### **Documentação**
- [ ] README atualizado
- [ ] Changelog atualizado
- [ ] Comentários no código

---

## 📚 ÍNDICE COMPLETO - FASES 2 A 7

A seguir, o índice resumido das próximas fases. Cada fase será detalhada conforme necessário.

---

## 📋 FASE 2: Avaliações Diagnósticas (2 meses)

### **Objetivo**
Implementar sistema completo de avaliação diagnóstica baseado nas 8 áreas das fichas da Bahia.

### **Tarefas**

#### **2.1 Migração SQL - Avaliação Diagnóstica**
- Tabela `aee_diagnostic_assessments` completa
- 11 campos JSONB para as áreas avaliadas
- RLS policies

#### **2.2 Formulário Multi-Step (8 etapas)**
- Componente `AssessmentForm` principal
- Step 1: Lateralidade
- Step 2: Orientação Espacial e Temporal
- Step 3: Percepções (Visual e Auditiva)
- Step 4: Expressão (Oral e Escrita)
- Step 5: Leitura e Escrita
- Step 6: Raciocínio e Coordenação
- Step 7: Relações Interpessoais
- Step 8: Resumo e Recomendações

#### **2.3 Anamnese (Entrevista Familiar)**
- Migração SQL `aee_family_interviews`
- Componente `AnamnesisForm`
- 11 seções da anamnese
- Integração com plano

#### **2.4 Sugestões Automáticas**
- Função SQL para analisar avaliação
- Gerar barreiras automaticamente
- Sugerir metas SMART
- Sugerir recursos e adaptações

### **Entregáveis**
- [ ] 2 novas tabelas
- [ ] 10 novos componentes
- [ ] Sistema de sugestões com IA
- [ ] Integração com criação de plano

### **Testes**
- [ ] Preencher avaliação completa
- [ ] Salvar progresso entre steps
- [ ] Gerar sugestões automáticas
- [ ] Criar plano a partir da avaliação

---

## 📄 FASE 3: Documentos Automáticos (2 meses)

### **Objetivo**
Gerar automaticamente 8 tipos de documentos PDF profissionais.

### **Tarefas**

#### **3.1 Templates HTML**
- `termo-compromisso.html`
- `termo-desistencia.html`
- `relatorio-visita.html`
- `plano-completo.html`
- `relatorio-ciclo.html`
- `ficha-anamnese.html`
- `ficha-encaminhamento.html`
- `avaliacao-diagnostica.html`

#### **3.2 Serviço de Geração PDF**
- `documentGenerator.ts`
- `pdfExport.ts` com Puppeteer
- Interpolação de dados nos templates
- Formatação e estilos

#### **3.3 Sistema de Assinatura Digital**
- Componente `SignaturePad`
- Timestamp de assinatura
- Validação de assinaturas
- Storage de documentos assinados

#### **3.4 Compartilhamento**
- Tabela `aee_documents`
- Tokens temporários
- Links públicos com expiração
- Acesso sem login para famílias

### **Entregáveis**
- [ ] 8 templates HTML
- [ ] Serviço de PDF
- [ ] Sistema de assinatura
- [ ] Biblioteca de documentos

### **Testes**
- [ ] Gerar cada tipo de documento
- [ ] Assinar documentos
- [ ] Compartilhar com família
- [ ] Expiração de tokens

---

## 📱 FASE 4: Modo Offline (1 mês)

### **Objetivo**
Sistema funcionar 100% offline com sincronização automática.

### **Tarefas**

#### **4.1 IndexedDB Setup**
- Schema com Dexie.js
- Stores: planos, atendimentos, metas, avaliações
- Migrations do IndexedDB

#### **4.2 Serviço de Sincronização**
- `syncService.ts`
- Detectar conflitos
- Resolução automática
- Fila de mudanças pendentes

#### **4.3 Service Worker**
- Cache de assets
- Cache de dados
- Estratégias de cache
- Update automático

#### **4.4 UI de Status**
- Indicador online/offline
- Badge de mudanças pendentes
- Botão de sincronizar manual
- Logs de sincronização

### **Entregáveis**
- [ ] IndexedDB configurado
- [ ] Sincronização bidirecional
- [ ] Service Worker
- [ ] UI de status

### **Testes**
- [ ] Criar plano offline
- [ ] Registrar atendimento offline
- [ ] Sincronizar ao reconectar
- [ ] Resolver conflitos

---

## 📊 FASE 5: Analytics e Dashboard (1 mês)

### **Objetivo**
Dashboard analítico com KPIs em tempo real.

### **Tarefas**

#### **5.1 KPIs Principais**
- Cards de estatísticas
- Tendências (up/down/stable)
- Comparação com período anterior

#### **5.2 Gráficos (Recharts)**
- Frequência mensal (linha)
- Progresso de metas (barra)
- Distribuição por área (pizza)
- Taxa de alcance (gauge)

#### **5.3 Relatórios**
- Relatório de frequência
- Relatório de progresso
- Relatório de encaminhamentos
- Relatório gerencial (rede)

#### **5.4 Exportação**
- Excel (XLSX)
- CSV
- PDF

### **Entregáveis**
- [ ] Dashboard completo
- [ ] 8 gráficos interativos
- [ ] 4 tipos de relatórios
- [ ] Exportação múltipla

---

## 🚀 FASE 6: Funcionalidades Avançadas (2 meses)

### **Objetivo**
Visitas escolares, encaminhamentos, notificações.

### **Tarefas**

#### **6.1 Visitas Escolares**
- Tabela `aee_school_visits`
- Formulário de visita
- Orientações e sugestões
- Assinaturas digitais

#### **6.2 Encaminhamentos**
- Tabela `aee_referrals`
- Tracking de status
- Feedback de especialistas
- Lembretes de follow-up

#### **6.3 Notificações**
- Tabela `aee_reminders`
- Notificações inteligentes
- Email/Push
- Configurações

### **Entregáveis**
- [ ] 3 novas tabelas
- [ ] Sistema de visitas
- [ ] Sistema de encaminhamentos
- [ ] Sistema de notificações

---

## 📱 FASE 7: App Mobile (3 meses)

### **Objetivo**
App nativo React Native para iOS e Android.

### **Tarefas**

#### **7.1 Setup React Native**
- Expo / React Native CLI
- Navegação (React Navigation)
- Estado global
- Autenticação

#### **7.2 Telas Principais**
- Dashboard mobile
- Lista de planos
- Registro de atendimento
- Metas

#### **7.3 Funcionalidades Mobile**
- Camera para evidências
- Offline-first
- Push notifications
- Biometria

#### **7.4 Deploy**
- App Store
- Google Play

### **Entregáveis**
- [ ] App iOS
- [ ] App Android
- [ ] Sincronização mobile
- [ ] Push notifications

---

## 🎯 CRONOGRAMA RESUMIDO

| Fase | Duração | Início | Fim | Desenvolvedores |
|------|---------|--------|-----|-----------------|
| **Fase 1** | 3 meses | Mar/2025 | Mai/2025 | 2 Full-stack |
| **Fase 2** | 2 meses | Jun/2025 | Jul/2025 | 1 Frontend |
| **Fase 3** | 2 meses | Ago/2025 | Set/2025 | 1 Backend + 1 Designer |
| **Fase 4** | 1 mês | Out/2025 | Out/2025 | 1 Frontend |
| **Fase 5** | 1 mês | Nov/2025 | Nov/2025 | 1 Full-stack |
| **Fase 6** | 2 meses | Dez/2025 | Jan/2026 | 2 Full-stack |
| **Fase 7** | 3 meses | Fev/2026 | Abr/2026 | 2 Mobile |

**Total**: 14 meses (com possibilidade de paralelização → 11 meses)

---

## ✅ CONCLUSÃO

### **Documento Completo**

Este guia de implementação fornece:

✅ **Fase 1 100% Detalhada** (~50 páginas)
- Scripts SQL prontos
- Tipos TypeScript completos
- Hooks React Query
- Componentes React
- Testes e validações

✅ **Fases 2-7 Resumidas** (~15 páginas)
- Visão geral de cada fase
- Tarefas principais
- Entregáveis esperados
- Estimativas de tempo

### **Total**: ~65 páginas de documentação técnica

### **Próximos Passos**

1. **Revisar Fase 1** e aprovar antes de iniciar
2. **Aplicar migração SQL** em ambiente de desenvolvimento
3. **Implementar hooks** e testar com dados reais
4. **Criar componentes** e integrar
5. **Testar completamente** a Fase 1
6. **Detalhar Fase 2** quando Fase 1 estiver 80% pronta

---

## 📞 Documentos Relacionados

- [`📚_APP_PLANO_AEE.md`](./📚_APP_PLANO_AEE.md) - Documentação V1.0 (atual)
- [`🚀_APP_PLANO_AEE_V2.md`](./🚀_APP_PLANO_AEE_V2.md) - Visão completa V2.0
- [`📋_ROADMAP_PLANO_AEE.md`](./📋_ROADMAP_PLANO_AEE.md) - Comparação e planejamento

---

**Versão do Documento**: 1.0  
**Data**: 09/01/2025  
**Status**: 📋 Fase 1 completa | Fases 2-7 resumidas  
**Pronto para**: Implementação da Fase 1
