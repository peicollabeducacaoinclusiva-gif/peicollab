-- ============================================================================
-- MIGRAÇÃO: Tabelas para Integrações PEI ↔ AEE ↔ Planejamento ↔ Diário
-- Data: 25/02/2025
-- Descrição: Criar tabelas de vínculo entre PEI, AEE, Planejamento e Diário
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Vínculo AEE Activity ↔ PEI Goal
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_activity_pei_goals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "aee_activity_id" uuid NOT NULL,
    "pei_goal_id" uuid NOT NULL REFERENCES "public"."pei_goals"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("aee_activity_id", "pei_goal_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_activity_pei_goals_activity" ON "public"."aee_activity_pei_goals"("aee_activity_id");
CREATE INDEX IF NOT EXISTS "idx_aee_activity_pei_goals_goal" ON "public"."aee_activity_pei_goals"("pei_goal_id");

-- ============================================================================
-- PARTE 2: Tabela de Vínculo Diary Activity ↔ PEI Goal
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."diary_activity_pei_goals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "activity_id" uuid NOT NULL,
    "pei_goal_id" uuid NOT NULL REFERENCES "public"."pei_goals"("id") ON DELETE CASCADE,
    "notes" text,
    "created_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id"),
    UNIQUE("activity_id", "pei_goal_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_diary_activity_pei_goals_activity" ON "public"."diary_activity_pei_goals"("activity_id");
CREATE INDEX IF NOT EXISTS "idx_diary_activity_pei_goals_goal" ON "public"."diary_activity_pei_goals"("pei_goal_id");

-- ============================================================================
-- PARTE 3: Tabela de Sessões AEE (se não existir)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "aee_id" uuid REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "date" date NOT NULL,
    "activity_type" text,
    "description" text,
    "notes" text,
    "activities" text[],
    "progress" text,
    "resources" text[],
    "created_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_sessions_student" ON "public"."aee_sessions"("student_id");
CREATE INDEX IF NOT EXISTS "idx_aee_sessions_aee" ON "public"."aee_sessions"("aee_id");
CREATE INDEX IF NOT EXISTS "idx_aee_sessions_date" ON "public"."aee_sessions"("date");

-- ============================================================================
-- PARTE 4: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."aee_activity_pei_goals" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."diary_activity_pei_goals" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."aee_sessions" TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."aee_activity_pei_goals" IS 'Vínculo entre atividades AEE e metas do PEI';
COMMENT ON TABLE "public"."diary_activity_pei_goals" IS 'Vínculo entre atividades do diário e metas do PEI';
COMMENT ON TABLE "public"."aee_sessions" IS 'Registro de sessões do AEE';

