-- ============================================================================
-- MIGRAÇÃO: Sistema de Gestão Escolar
-- ============================================================================
-- Sistema centralizado de cadastro de profissionais, alunos e turmas
-- Data: 2025-01-08
-- ============================================================================

-- ============================================================================
-- ENUM: education_level (Etapas de Ensino)
-- ============================================================================

CREATE TYPE "public"."education_level" AS ENUM (
    'educacao_infantil',
    'ensino_fundamental_1', -- 1º ao 5º ano
    'ensino_fundamental_2', -- 6º ao 9º ano
    'ensino_medio',
    'eja' -- Educação de Jovens e Adultos
);

-- ============================================================================
-- ENUM: professional_role (Função do Profissional)
-- ============================================================================

CREATE TYPE "public"."professional_role" AS ENUM (
    'professor',
    'professor_aee',
    'coordenador',
    'diretor',
    'secretario_educacao',
    'profissional_apoio',
    'psicologo',
    'fonoaudiologo',
    'terapeuta_ocupacional',
    'assistente_social',
    'outros'
);

-- ============================================================================
-- TABELA: professionals (Profissionais da Educação)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."professionals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados Pessoais
    "full_name" text NOT NULL,
    "cpf" text UNIQUE,
    "rg" text,
    "date_of_birth" date,
    "gender" text,
    
    -- Contato
    "email" text,
    "phone" text,
    "address" text,
    "city" text,
    "state" text,
    "zip_code" text,
    
    -- Profissional
    "professional_role" professional_role NOT NULL,
    "registration_number" text, -- Matrícula funcional
    "specialization" text,
    "formation" text, -- Formação acadêmica
    
    -- Vinculações
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "school_id" uuid REFERENCES "public"."schools"("id") ON DELETE SET NULL,
    
    -- Vínculo com auth.users (se tiver acesso ao sistema)
    "user_id" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    
    -- Status
    "is_active" boolean DEFAULT true,
    "hire_date" date,
    "termination_date" date,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX "idx_professionals_tenant" ON "public"."professionals"("tenant_id");
CREATE INDEX "idx_professionals_school" ON "public"."professionals"("school_id");
CREATE INDEX "idx_professionals_user" ON "public"."professionals"("user_id");
CREATE INDEX "idx_professionals_role" ON "public"."professionals"("professional_role");
CREATE INDEX "idx_professionals_active" ON "public"."professionals"("is_active");
CREATE INDEX "idx_professionals_cpf" ON "public"."professionals"("cpf");

-- ============================================================================
-- TABELA: classes (Turmas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    "class_name" text NOT NULL, -- Ex: "3º Ano A", "Maternal II", "1ª Série EJA"
    "education_level" education_level NOT NULL,
    "grade" text, -- Série/Ano: "1º ano", "5º ano", "Maternal", etc.
    "shift" text, -- Turno: "Manhã", "Tarde", "Noite", "Integral"
    
    -- Ano Letivo
    "academic_year" text NOT NULL, -- "2025"
    
    -- Vinculações
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id") ON DELETE CASCADE,
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    
    -- Professor Regente
    "main_teacher_id" uuid REFERENCES "public"."professionals"("id") ON DELETE SET NULL,
    
    -- Capacidade
    "max_students" integer DEFAULT 25,
    "current_students" integer DEFAULT 0,
    
    -- Status
    "is_active" boolean DEFAULT true,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX "idx_classes_school" ON "public"."classes"("school_id");
CREATE INDEX "idx_classes_tenant" ON "public"."classes"("tenant_id");
CREATE INDEX "idx_classes_level" ON "public"."classes"("education_level");
CREATE INDEX "idx_classes_year" ON "public"."classes"("academic_year");
CREATE INDEX "idx_classes_teacher" ON "public"."classes"("main_teacher_id");

-- ============================================================================
-- TABELA: subjects (Disciplinas / Campos de Experiência)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    "subject_name" text NOT NULL,
    "subject_code" text,
    "education_level" education_level NOT NULL,
    
    -- Tipo
    "subject_type" text, -- 'disciplina' ou 'campo_experiencia'
    
    -- Campos de Experiência (Ed. Infantil - BNCC)
    -- "O eu, o outro e o nós"
    -- "Corpo, gestos e movimentos"
    -- "Traços, sons, cores e formas"
    -- "Escuta, fala, pensamento e imaginação"
    -- "Espaços, tempos, quantidades, relações e transformações"
    
    "description" text,
    "objectives" text,
    
    -- Vinculação
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    
    -- Status
    "is_active" boolean DEFAULT true,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX "idx_subjects_tenant" ON "public"."subjects"("tenant_id");
CREATE INDEX "idx_subjects_level" ON "public"."subjects"("education_level");
CREATE INDEX "idx_subjects_type" ON "public"."subjects"("subject_type");

-- ============================================================================
-- TABELA: class_subjects (Disciplinas por Turma)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."class_subjects" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "subject_id" uuid NOT NULL REFERENCES "public"."subjects"("id") ON DELETE CASCADE,
    "teacher_id" uuid REFERENCES "public"."professionals"("id") ON DELETE SET NULL,
    "workload" integer, -- Carga horária semanal
    "created_at" timestamptz DEFAULT now(),
    
    CONSTRAINT "unique_subject_per_class" UNIQUE ("class_id", "subject_id")
);

-- Índices
CREATE INDEX "idx_class_subjects_class" ON "public"."class_subjects"("class_id");
CREATE INDEX "idx_class_subjects_subject" ON "public"."class_subjects"("subject_id");
CREATE INDEX "idx_class_subjects_teacher" ON "public"."class_subjects"("teacher_id");

-- ============================================================================
-- ATUALIZAR TABELA STUDENTS (Adicionar Campos)
-- ============================================================================

-- Adicionar campos se não existirem
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "class_id" uuid REFERENCES "public"."classes"("id") ON DELETE SET NULL;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "registration_number" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "cpf" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "rg" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "birth_certificate" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "state" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "zip_code" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "guardian_name" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "guardian_cpf" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "guardian_phone" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "guardian_email" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "emergency_contact" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "emergency_phone" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "health_info" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "allergies" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "medications" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "special_needs" text;
ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "enrollment_date" date;

-- Índice na turma
CREATE INDEX IF NOT EXISTS "idx_students_class" ON "public"."students"("class_id");

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- professionals
ALTER TABLE "public"."professionals" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_professionals"
    ON "public"."professionals"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('coordinator', 'school_manager', 'education_secretary')
        )
    );

CREATE POLICY "all_view_professionals"
    ON "public"."professionals"
    FOR SELECT
    USING (true);

-- classes
ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_classes"
    ON "public"."classes"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('coordinator', 'school_manager', 'education_secretary')
        )
    );

CREATE POLICY "all_view_classes"
    ON "public"."classes"
    FOR SELECT
    USING (true);

-- subjects
ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_subjects"
    ON "public"."subjects"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('coordinator', 'school_manager', 'education_secretary')
        )
    );

CREATE POLICY "all_view_subjects"
    ON "public"."subjects"
    FOR SELECT
    USING (true);

-- class_subjects
ALTER TABLE "public"."class_subjects" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_class_subjects"
    ON "public"."class_subjects"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles"
            WHERE user_id = auth.uid()
            AND role IN ('coordinator', 'school_manager', 'education_secretary', 'teacher', 'aee_teacher')
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_professionals_updated_at ON "public"."professionals";
CREATE TRIGGER update_professionals_updated_at
    BEFORE UPDATE ON "public"."professionals"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON "public"."classes";
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON "public"."classes"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON "public"."subjects";
CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON "public"."subjects"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DADOS INICIAIS: Campos de Experiência (Ed. Infantil - BNCC)
-- ============================================================================

INSERT INTO "public"."subjects" (subject_name, education_level, subject_type, description, tenant_id)
SELECT 
    campo, 
    'educacao_infantil'::education_level,
    'campo_experiencia',
    descricao,
    id as tenant_id
FROM tenants, (VALUES
    ('O eu, o outro e o nós', 'Desenvolvimento da identidade, autonomia e relações sociais'),
    ('Corpo, gestos e movimentos', 'Exploração do corpo, expressão corporal e coordenação motora'),
    ('Traços, sons, cores e formas', 'Experiências com artes visuais, música e expressão artística'),
    ('Escuta, fala, pensamento e imaginação', 'Desenvolvimento da linguagem oral e escrita'),
    ('Espaços, tempos, quantidades, relações e transformações', 'Noções matemáticas, científicas e temporais')
) AS campos(campo, descricao)
WHERE is_active = true
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DADOS INICIAIS: Disciplinas (Ensino Fundamental e Médio)
-- ============================================================================

INSERT INTO "public"."subjects" (subject_name, education_level, subject_type, tenant_id)
SELECT 
    disciplina,
    nivel::education_level,
    'disciplina',
    t.id
FROM tenants t, (VALUES
    ('Língua Portuguesa', 'ensino_fundamental_1'),
    ('Matemática', 'ensino_fundamental_1'),
    ('Ciências', 'ensino_fundamental_1'),
    ('História', 'ensino_fundamental_1'),
    ('Geografia', 'ensino_fundamental_1'),
    ('Arte', 'ensino_fundamental_1'),
    ('Educação Física', 'ensino_fundamental_1'),
    ('Língua Portuguesa', 'ensino_fundamental_2'),
    ('Matemática', 'ensino_fundamental_2'),
    ('Ciências', 'ensino_fundamental_2'),
    ('História', 'ensino_fundamental_2'),
    ('Geografia', 'ensino_fundamental_2'),
    ('Língua Inglesa', 'ensino_fundamental_2'),
    ('Arte', 'ensino_fundamental_2'),
    ('Educação Física', 'ensino_fundamental_2'),
    ('Língua Portuguesa', 'ensino_medio'),
    ('Matemática', 'ensino_medio'),
    ('Biologia', 'ensino_medio'),
    ('Física', 'ensino_medio'),
    ('Química', 'ensino_medio'),
    ('História', 'ensino_medio'),
    ('Geografia', 'ensino_medio'),
    ('Filosofia', 'ensino_medio'),
    ('Sociologia', 'ensino_medio'),
    ('Língua Inglesa', 'ensino_medio'),
    ('Arte', 'ensino_medio'),
    ('Educação Física', 'ensino_medio')
) AS disciplinas(disciplina, nivel)
WHERE t.is_active = true
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."professionals" IS 'Cadastro centralizado de profissionais da educação';
COMMENT ON TABLE "public"."classes" IS 'Turmas por etapa de ensino (Ed. Infantil ao EM + EJA)';
COMMENT ON TABLE "public"."subjects" IS 'Disciplinas e Campos de Experiência da BNCC';
COMMENT ON TABLE "public"."class_subjects" IS 'Vinculação de disciplinas às turmas com professores';

COMMENT ON COLUMN "public"."professionals"."professional_role" IS 'Função do profissional na rede/escola';
COMMENT ON COLUMN "public"."classes"."education_level" IS 'Etapa de ensino conforme BNCC';
COMMENT ON COLUMN "public"."subjects"."subject_type" IS 'disciplina (Fund/Médio) ou campo_experiencia (Infantil)';

