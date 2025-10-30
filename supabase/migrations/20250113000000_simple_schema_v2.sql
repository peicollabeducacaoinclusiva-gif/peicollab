-- ============================================================================
-- PEI COLLAB - SCHEMA SIMPLES V2.0
-- ============================================================================
-- Sistema: Plataforma Colaborativa para Planos Educacionais Individualizados
-- Versão: 2.0 (Com separação Rede de Ensino / Escola)
-- Data: 2025-01-13
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TIPOS ENUMERADOS
-- ============================================================================

CREATE TYPE "public"."user_role" AS ENUM (
    'superadmin',
    'education_secretary',
    'coordinator', 
    'school_manager',
    'aee_teacher',
    'teacher',
    'family',
    'specialist'
);

CREATE TYPE "public"."pei_status" AS ENUM (
    'draft',
    'pending',
    'approved',
    'returned'
);

-- ============================================================================
-- TABELAS PRINCIPAIS
-- ============================================================================

-- TENANTS (Redes de Ensino)
CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "network_name" text NOT NULL,
    "network_address" text,
    "network_phone" text,
    "network_email" text,
    "is_active" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- SCHOOLS (Escolas)
CREATE TABLE IF NOT EXISTS "public"."schools" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_name" text NOT NULL,
    "school_address" text,
    "school_phone" text,
    "school_email" text,
    "school_responsible" text,
    "is_active" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- PROFILES (Perfil dos Usuários)
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" uuid PRIMARY KEY REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "full_name" text NOT NULL,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "role" "public"."user_role" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- USER_SCHOOLS (Relacionamento Usuário-Escola)
CREATE TABLE IF NOT EXISTS "public"."user_schools" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("user_id", "school_id")
);

-- USER_TENANTS (Relacionamento Usuário-Tenant)
CREATE TABLE IF NOT EXISTS "public"."user_tenants" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT now(),
    UNIQUE("user_id", "tenant_id")
);

-- STUDENTS (Alunos)
CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "date_of_birth" date,
    "student_id" text,
    "class_name" text,
    "is_active" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- PEIS (Planos Educacionais Individualizados)
CREATE TABLE IF NOT EXISTS "public"."peis" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "assigned_teacher_id" uuid REFERENCES "auth"."users"("id"),
    "created_by" uuid REFERENCES "auth"."users"("id"),
    "status" "public"."pei_status" DEFAULT 'draft',
    "version" integer DEFAULT 1,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- ============================================================================
-- DADOS DE TESTE
-- ============================================================================

-- Inserir tenant de teste
INSERT INTO public.tenants (id, network_name, network_address, network_email, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Rede Municipal de Ensino - Demo',
    'Rua da Educação, 123',
    'contato@rede.com',
    true
) ON CONFLICT (id) DO NOTHING;

-- Inserir escola de teste
INSERT INTO public.schools (id, tenant_id, school_name, school_address, school_email, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Escola Municipal João da Silva',
    'Rua das Flores, 456',
    'escola@municipal.com',
    true
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS SIMPLES (Permissivo para desenvolvimento)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peis ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (para desenvolvimento)
CREATE POLICY "Allow all operations on tenants" ON public.tenants
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on schools" ON public.schools
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on profiles" ON public.profiles
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on user_schools" ON public.user_schools
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on user_tenants" ON public.user_tenants
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on students" ON public.students
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on peis" ON public.peis
FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- FUNÇÕES ÚTEIS
-- ============================================================================

-- Função para obter tenant do usuário
CREATE OR REPLACE FUNCTION public.get_user_tenant_safe(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tenant_result UUID;
BEGIN
  -- Primeiro tenta pegar do profiles
  SELECT tenant_id INTO user_tenant_result
  FROM public.profiles
  WHERE id = _user_id AND tenant_id IS NOT NULL
  LIMIT 1;
  
  -- Se não encontrou, pega o primeiro da tabela user_tenants
  IF user_tenant_result IS NULL THEN
    SELECT tenant_id INTO user_tenant_result
    FROM public.user_tenants
    WHERE user_id = _user_id
    LIMIT 1;
  END IF;
  
  RETURN user_tenant_result;
END;
$$;

-- Função para obter school do usuário
CREATE OR REPLACE FUNCTION public.get_user_school_safe(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_school_result UUID;
BEGIN
  -- Primeiro tenta pegar do profiles
  SELECT school_id INTO user_school_result
  FROM public.profiles
  WHERE id = _user_id AND school_id IS NOT NULL
  LIMIT 1;
  
  -- Se não encontrou, pega o primeiro da tabela user_schools
  IF user_school_result IS NULL THEN
    SELECT school_id INTO user_school_result
    FROM public.user_schools
    WHERE user_id = _user_id
    LIMIT 1;
  END IF;
  
  RETURN user_school_result;
END;
$$;




