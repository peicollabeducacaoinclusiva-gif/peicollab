-- ============================================================================
-- PEI COLLAB - MIGRAÇÃO INCREMENTAL V2.0 -> V2.2
-- Adiciona estrutura completa (V2.1) e melhorias (V2.2)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSÕES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ----------------------------------------------------------------------------
-- 2. ALTERAÇÕES E CRIAÇÃO DE TIPOS ENUMERADOS
-- ----------------------------------------------------------------------------

-- Adicionar novos valores ao tipo user_role (se ainda não existirem)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'user_role'::regtype AND enumlabel = 'education_secretary') THEN
        ALTER TYPE "public"."user_role" ADD VALUE 'education_secretary';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'user_role'::regtype AND enumlabel = 'school_director') THEN
        ALTER TYPE "public"."user_role" ADD VALUE 'school_director';
    END IF;
EXCEPTION
    WHEN others THEN
        -- Ignora se o tipo não existir (improvável, mas seguro)
END $$;

-- Adicionar novo status ao tipo pei_status
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'pei_status'::regtype AND enumlabel = 'obsolete') THEN
        ALTER TYPE "public"."pei_status" ADD VALUE 'obsolete';
    END IF;
EXCEPTION
    WHEN others THEN
        -- Ignora se o tipo não existir
END $$;

-- Criar novo tipo pei_goal_category (se não existir)
CREATE TYPE "public"."pei_goal_category" AS ENUM (
    'academic',
    'functional'
);

-- ----------------------------------------------------------------------------
-- 3. ALTERAÇÕES EM TABELAS EXISTENTES (Melhorias V2.2)
-- ----------------------------------------------------------------------------

-- PROFILES: Remover campo 'role' (DEPRECATED) - COMENTADO TEMPORARIAMENTE
-- ALTER TABLE "public"."profiles" DROP COLUMN IF EXISTS "role";

-- STUDENTS: Adicionar coluna para Full-Text Search
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "mother_name" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "father_name" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "family_guidance_notes" text;

-- PEIS: Adicionar colunas de versionamento e dados JSON
ALTER TABLE "public"."peis" ADD COLUMN IF NOT EXISTS "is_active_version" boolean NOT NULL DEFAULT true;
ALTER TABLE "public"."peis" RENAME COLUMN "version" TO "version_number";
ALTER TABLE "public"."peis" ADD COLUMN IF NOT EXISTS "diagnosis_data" jsonb;
ALTER TABLE "public"."peis" ADD COLUMN IF NOT EXISTS "planning_data" jsonb;
ALTER TABLE "public"."peis" ADD COLUMN IF NOT EXISTS "evaluation_data" jsonb;
ALTER TABLE "public"."peis" ADD COLUMN IF NOT EXISTS "family_approved_at" timestamptz;
ALTER TABLE "public"."peis" ADD COLUMN IF NOT EXISTS "family_approved_by" text;
ALTER TABLE "public"."peis" ADD COLUMN IF NOT EXISTS "is_synced" boolean DEFAULT false;


-- ----------------------------------------------------------------------------
-- 4. CRIAÇÃO DE NOVAS TABELAS (Estrutura Completa V2.1)
-- ----------------------------------------------------------------------------

-- USER_ROLES (Múltiplos Papéis - Se a V2.0 não tinha)
CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "role" "public"."user_role" NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("user_id", "role")
);

-- STUDENT_FAMILY (Vínculo Aluno-Família)
CREATE TABLE IF NOT EXISTS "public"."student_family" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "family_user_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "relationship" text,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("student_id", "family_user_id")
);

-- STUDENT_ACCESS (Usuários com Acesso ao Aluno)
CREATE TABLE IF NOT EXISTS "public"."student_access" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "role" text,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("student_id", "user_id")
);

-- PEI_BARRIERS (Barreiras Identificadas)
CREATE TABLE IF NOT EXISTS "public"."pei_barriers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "barrier_type" text,
    "description" text,
    "severity" text,
    "created_at" timestamptz DEFAULT now()
);

-- PEI_GOALS (Metas)
CREATE TABLE IF NOT EXISTS "public"."pei_goals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "barrier_id" uuid REFERENCES "public"."pei_barriers"("id") ON DELETE SET NULL,
    "description" text NOT NULL,
    "category" "public"."pei_goal_category",
    "target_date" date,
    "progress_level" text DEFAULT 'não iniciada',
    "progress_score" integer,
    "notes" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- PEI_TEACHERS (Professores Associados)
CREATE TABLE IF NOT EXISTS "public"."pei_teachers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "assigned_at" timestamptz DEFAULT now(),
    "assigned_by" uuid REFERENCES "auth"."users"("id"),
    UNIQUE("pei_id", "teacher_id")
);

-- PEI_SPECIALIST_ORIENTATIONS (Orientações de Especialistas)
CREATE TABLE IF NOT EXISTS "public"."pei_specialist_orientations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "specialist_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "orientation_field" text NOT NULL,
    "guidance" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- PEI_ACCESSIBILITY_RESOURCES (Recursos de Acessibilidade)
CREATE TABLE IF NOT EXISTS "public"."pei_accessibility_resources" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "resource_type" text,
    "description" text,
    "usage_frequency" text,
    "created_at" timestamptz DEFAULT now()
);

-- PEI_REFERRALS (Encaminhamentos)
CREATE TABLE IF NOT EXISTS "public"."pei_referrals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "referred_to" text NOT NULL,
    "reason" text,
    "date" timestamptz DEFAULT now(),
    "follow_up" text,
    "created_at" timestamptz DEFAULT now()
);

-- PEI_MEETINGS (Reuniões)
CREATE TABLE IF NOT EXISTS "public"."pei_meetings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "description" text,
    "scheduled_for" timestamptz NOT NULL,
    "location_or_link" text,
    "created_by" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE RESTRICT,
    "created_at" timestamptz DEFAULT now()
);

-- PEI_MEETING_PARTICIPANTS
CREATE TABLE IF NOT EXISTS "public"."pei_meeting_participants" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "meeting_id" uuid NOT NULL REFERENCES "public"."pei_meetings"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "status" text DEFAULT 'invited',
    UNIQUE("meeting_id", "user_id")
);

-- PEI_NOTIFICATIONS
CREATE TABLE IF NOT EXISTS "public"."pei_notifications" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "pei_id" uuid REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "notification_type" text NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamptz DEFAULT now(),
    "read_at" timestamptz
);

-- PEI_HISTORY (Versionamento/Auditoria de PEI)
CREATE TABLE IF NOT EXISTS "public"."pei_history" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "version_number" integer NOT NULL,
    "changed_by" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE RESTRICT,
    "changed_at" timestamptz NOT NULL DEFAULT now(),
    "change_type" text,
    "change_summary" text,
    "diagnosis_data" jsonb,
    "planning_data" jsonb,
    "evaluation_data" jsonb,
    "status" "public"."pei_status",
    "previous_version_id" uuid REFERENCES "public"."peis"("id"),
    UNIQUE("pei_id", "version_number")
);

-- PEI_REVIEWS (Avaliações/Comentários de Gestores)
CREATE TABLE IF NOT EXISTS "public"."pei_reviews" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "reviewer_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE RESTRICT,
    "reviewer_role" text,
    "review_date" timestamptz DEFAULT now(),
    "notes" text,
    "next_review_date" date,
    "evaluation_data" jsonb,
    "created_at" timestamptz DEFAULT now()
);

-- FAMILY_ACCESS_TOKENS (Acesso Família - Tokens)
CREATE TABLE IF NOT EXISTS "public"."family_access_tokens" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "pei_id" uuid NOT NULL REFERENCES "public"."peis"("id") ON DELETE CASCADE,
    "token_hash" text UNIQUE NOT NULL,
    "expires_at" timestamptz DEFAULT now() + interval '7 days',
    "used" boolean DEFAULT false,
    "max_uses" integer DEFAULT 10,
    "current_uses" integer DEFAULT 0,
    "last_ip_address" text,
    "created_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "last_accessed_at" timestamptz
);

-- AUDIT_LOG (Auditoria Universal - Melhoria V2.2)
CREATE TABLE IF NOT EXISTS "public"."audit_log" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "table_name" TEXT NOT NULL,
  "record_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "old_data" JSONB,
  "new_data" JSONB,
  "changed_by" UUID REFERENCES "auth"."users"("id"),
  "changed_at" TIMESTAMPTZ DEFAULT NOW(),
  "ip_address" TEXT,
  "user_agent" TEXT
);

-- ----------------------------------------------------------------------------
-- 5. ÍNDICES
-- ----------------------------------------------------------------------------

-- Índice Único para Versão Ativa de PEI
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_pei_version
ON "public"."peis"("student_id")
WHERE is_active_version = true;

-- Índice GIN para Full-Text Search de Alunos
CREATE INDEX IF NOT EXISTS idx_students_search ON "public"."students" USING GIN(search_vector);

-- Índices de Auditoria
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON "public"."audit_log"("table_name", "record_id");
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON "public"."audit_log"("changed_by");
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON "public"."audit_log"("changed_at" DESC);


-- ----------------------------------------------------------------------------
-- 6. FUNÇÕES PLPGSQL (Melhorias V2.2)
-- ----------------------------------------------------------------------------

-- Função para garantir apenas uma versão ativa de PEI por aluno
CREATE OR REPLACE FUNCTION "public"."ensure_single_active_pei"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active_version = true THEN
    UPDATE "public"."peis" 
    SET is_active_version = false
    WHERE student_id = NEW.student_id 
      AND id != NEW.id 
      AND is_active_version = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função de validação de token familiar segura
CREATE OR REPLACE FUNCTION "public"."validate_family_token_secure"(
  _token TEXT,
  _ip_address TEXT DEFAULT NULL
) RETURNS TABLE(valid BOOLEAN, message TEXT, pei_id UUID) AS $$
DECLARE
  v_token RECORD;
BEGIN
  SELECT * INTO v_token 
  FROM "public"."family_access_tokens" 
  WHERE token_hash = crypt(_token, token_hash)
    AND expires_at > NOW()
    AND NOT used;
  
  IF v_token IS NULL THEN
    RETURN QUERY SELECT false, 'Token inválido ou expirado'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF v_token.current_uses >= v_token.max_uses THEN
    UPDATE "public"."family_access_tokens" SET used = true WHERE id = v_token.id;
    RETURN QUERY SELECT false, 'Token excedeu limite de usos'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF v_token.last_ip_address IS NOT NULL 
     AND _ip_address IS NOT NULL
     AND v_token.last_ip_address != _ip_address 
     AND v_token.current_uses >= 3 THEN
    RETURN QUERY SELECT false, 'Acesso suspeito detectado: Mudança de IP'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  UPDATE "public"."family_access_tokens" 
  SET current_uses = current_uses + 1,
      last_accessed_at = NOW(),
      last_ip_address = COALESCE(_ip_address, v_token.last_ip_address)
  WHERE id = v_token.id;
  
  RETURN QUERY SELECT true, 'Token válido'::TEXT, v_token.pei_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar o search_vector de alunos
CREATE OR REPLACE FUNCTION "public"."update_student_search_vector"()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.mother_name, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.father_name, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.email, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função de busca otimizada de alunos
CREATE OR REPLACE FUNCTION "public"."search_students"(
  _query TEXT,
  _school_id UUID DEFAULT NULL,
  _limit INTEGER DEFAULT 20
) RETURNS TABLE(
  id UUID,
  name TEXT,
  date_of_birth DATE,
  school_name TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.date_of_birth,
    sc.school_name,
    ts_rank(s.search_vector, websearch_to_tsquery('portuguese', _query)) as rank
  FROM "public"."students" s
  JOIN "public"."schools" sc ON sc.id = s.school_id
  WHERE s.search_vector @@ websearch_to_tsquery('portuguese', _query)
    AND (_school_id IS NULL OR s.school_id = _school_id)
  ORDER BY rank DESC
  LIMIT _limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION "public"."audit_trigger"()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old_data = to_jsonb(OLD);
    v_new_data = NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data = to_jsonb(OLD);
    v_new_data = to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_old_data = NULL;
    v_new_data = to_jsonb(NEW);
  END IF;
  
  INSERT INTO "public"."audit_log" (
    table_name, 
    record_id, 
    action, 
    old_data, 
    new_data, 
    changed_by
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    v_old_data,
    v_new_data,
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função de refresh da MV (para ser executada via cron)
CREATE OR REPLACE FUNCTION "public"."refresh_network_dashboard"()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY "public"."mv_network_dashboard";
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 7. TRIGGERS (Continuação)
-- ----------------------------------------------------------------------------

-- Trigger para atualização automática do search_vector
CREATE OR REPLACE TRIGGER update_student_search
  BEFORE INSERT OR UPDATE ON "public"."students"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_student_search_vector"();

-- Triggers de Auditoria (Exemplos em tabelas críticas)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_tenants') THEN
    CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON "public"."tenants"
      FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_peis') THEN
    CREATE TRIGGER audit_peis AFTER INSERT OR UPDATE OR DELETE ON "public"."peis"
      FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 8. VIEWS E VIEWS MATERIALIZADAS
-- ----------------------------------------------------------------------------

-- View de compatibilidade
CREATE OR REPLACE VIEW "public"."profiles_with_legacy_role" AS
SELECT 
  p.*,
  (SELECT ur.role FROM "public"."user_roles" ur WHERE ur.user_id = p.id AND ur.role != 'family' ORDER BY ur.role LIMIT 1) as legacy_role
FROM "public"."profiles" p;

-- Materialized View para Dashboard de Rede
CREATE MATERIALIZED VIEW IF NOT EXISTS "public"."mv_network_dashboard" AS
SELECT 
  t.id as tenant_id,
  t.network_name,
  COUNT(DISTINCT s.id) as total_schools,
  COUNT(DISTINCT st.id) as total_students,
  COUNT(DISTINCT CASE WHEN p.is_active_version THEN p.id END) as total_active_peis,
  COUNT(DISTINCT CASE WHEN p.status = 'draft' AND p.is_active_version THEN p.id END) as peis_draft,
  COUNT(DISTINCT CASE WHEN p.status = 'pending' AND p.is_active_version THEN p.id END) as peis_pending,
  COUNT(DISTINCT CASE WHEN p.status = 'approved' AND p.is_active_version THEN p.id END) as peis_approved,
  COUNT(DISTINCT pr.id) as total_users,
  MAX(p.updated_at) as last_pei_update
FROM "public"."tenants" t
LEFT JOIN "public"."schools" s ON s.tenant_id = t.id
LEFT JOIN "public"."students" st ON st.school_id = s.id
LEFT JOIN "public"."peis" p ON p.student_id = st.id
LEFT JOIN "public"."profiles" pr ON pr.tenant_id = t.id
GROUP BY t.id, t.network_name;

-- Índice para refresh da MV
CREATE UNIQUE INDEX IF NOT EXISTS mv_network_dashboard_tenant_id ON "public"."mv_network_dashboard"(tenant_id);

-- ----------------------------------------------------------------------------
-- 9. POLÍTICAS RLS (Lembrete)
-- ----------------------------------------------------------------------------

-- As políticas RLS devem ser revisadas e aplicadas manualmente após a migração.
