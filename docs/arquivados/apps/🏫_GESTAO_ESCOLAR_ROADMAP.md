# 🏫 Gestão Escolar - Roadmap de Desenvolvimento

> **Status Atual**: App básico criado  
> **Próximos Passos**: Expandir funcionalidades e integrar com PEI Collab  
> **Inspiração**: Sugestões do Claude adaptadas ao nosso monorepo

---

## 📊 Estado Atual vs Visão

### ✅ O Que Já Temos

```
apps/gestao-escolar/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx      ✅ Criado (básico)
│   │   ├── Students.tsx       ✅ Criado com tabela e busca
│   │   ├── Professionals.tsx  ✅ Criado (básico)
│   │   ├── Classes.tsx        ✅ Criado (básico)
│   │   ├── Subjects.tsx       ✅ Criado (básico)
│   │   └── Login.tsx          ✅ Criado
│   └── App.tsx                ✅ Rotas configuradas
└── package.json               ✅ Dependências instaladas
```

**Packages Compartilhados:**
- ✅ `@pei/ui` - Componentes UI
- ✅ `@pei/database` - Cliente Supabase
- ✅ `@pei/auth` - Autenticação

### 🎯 Visão Completa (Baseada nas Sugestões)

O app **Gestão Escolar** será o **sistema master** de dados educacionais, alimentando o **PEI Collab** com informações de:
- 👥 **Alunos** (students)
- 👨‍🏫 **Profissionais** (profiles/staff)
- 🏫 **Escolas** (schools)
- 📚 **Turmas** (classes)
- 📝 **Matrículas** (enrollments)
- 📊 **Frequência** (attendance)
- 📈 **Notas** (grades)

---

## 🗄️ Expansão do Banco de Dados

### Tabelas a Expandir

#### 1. **students** (Expandir campos)

```sql
-- Adicionar campos detalhados à tabela existente
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS codigo_identificador text UNIQUE,
  ADD COLUMN IF NOT EXISTS numero_ficha text,
  ADD COLUMN IF NOT EXISTS nome_social text,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS sexo text CHECK (sexo IN ('M', 'F', 'Outro')),
  ADD COLUMN IF NOT EXISTS raca_cor text,
  ADD COLUMN IF NOT EXISTS naturalidade text,
  ADD COLUMN IF NOT EXISTS tipo_sanguineo text,
  ADD COLUMN IF NOT EXISTS cartao_sus text,
  
  -- Endereço completo
  ADD COLUMN IF NOT EXISTS endereco_logradouro text,
  ADD COLUMN IF NOT EXISTS endereco_numero text,
  ADD COLUMN IF NOT EXISTS endereco_complemento text,
  ADD COLUMN IF NOT EXISTS endereco_bairro text,
  ADD COLUMN IF NOT EXISTS endereco_cidade text,
  ADD COLUMN IF NOT EXISTS endereco_cep text,
  ADD COLUMN IF NOT EXISTS localizacao_geografica point,
  
  -- Contatos
  ADD COLUMN IF NOT EXISTS telefone_principal text,
  ADD COLUMN IF NOT EXISTS telefone_secundario text,
  ADD COLUMN IF NOT EXISTS email text,
  
  -- Responsáveis (manter compatibilidade com campos antigos)
  ADD COLUMN IF NOT EXISTS mae_nome text,
  ADD COLUMN IF NOT EXISTS mae_telefone text,
  ADD COLUMN IF NOT EXISTS mae_cpf text,
  ADD COLUMN IF NOT EXISTS pai_nome text,
  ADD COLUMN IF NOT EXISTS pai_telefone text,
  ADD COLUMN IF NOT EXISTS pai_cpf text,
  
  -- Status acadêmico
  ADD COLUMN IF NOT EXISTS status_matricula text DEFAULT 'Ativo' 
    CHECK (status_matricula IN ('Ativo', 'Transferido', 'Cancelado', 'Concluído')),
  
  -- Necessidades especiais (já existe como special_needs)
  ADD COLUMN IF NOT EXISTS necessidades_especiais boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tipo_necessidade text[],
  ADD COLUMN IF NOT EXISTS laudo_medico_url text;

-- Migrar dados antigos
UPDATE students 
SET necessidades_especiais = (special_needs IS NOT NULL AND special_needs != ''),
    tipo_necessidade = CASE 
      WHEN special_needs IS NOT NULL THEN ARRAY[special_needs]
      ELSE NULL
    END
WHERE necessidades_especiais IS NULL;
```

#### 2. **profiles** (Expandir para Staff completo)

```sql
-- Adicionar campos profissionais
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS matricula_funcional text,
  ADD COLUMN IF NOT EXISTS cargo_funcao text,
  ADD COLUMN IF NOT EXISTS tipo_vinculo text 
    CHECK (tipo_vinculo IN ('Efetivo', 'Contrato', 'Comissionado', 'Voluntário')),
  ADD COLUMN IF NOT EXISTS regime_trabalho text 
    CHECK (regime_trabalho IN ('20h', '30h', '40h', 'Dedicação Exclusiva')),
  ADD COLUMN IF NOT EXISTS departamento_setor text,
  ADD COLUMN IF NOT EXISTS data_entrada date,
  ADD COLUMN IF NOT EXISTS data_saida date,
  ADD COLUMN IF NOT EXISTS escolaridade text,
  ADD COLUMN IF NOT EXISTS formacao jsonb, -- Array de formações acadêmicas
  ADD COLUMN IF NOT EXISTS habilitacoes jsonb, -- [Libras, Braille, AEE, etc]
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS endereco_completo text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS email_pessoal text;
```

#### 3. **schools** (Expandir informações)

```sql
-- Adicionar campos institucionais
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS codigo_inep text UNIQUE,
  ADD COLUMN IF NOT EXISTS tipo_escola text 
    CHECK (tipo_escola IN ('Municipal', 'Estadual', 'Federal', 'Privada')),
  ADD COLUMN IF NOT EXISTS diretor_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS coordenador_pedagogico_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS capacidade_total integer,
  ADD COLUMN IF NOT EXISTS oferece_eja boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS oferece_aee boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS turnos jsonb, -- ["Matutino", "Vespertino", "Noturno"]
  ADD COLUMN IF NOT EXISTS latitude decimal(10,8),
  ADD COLUMN IF NOT EXISTS longitude decimal(11,8);
```

### Novas Tabelas

#### 4. **grade_levels** - Níveis de Ensino

```sql
CREATE TABLE grade_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  
  codigo text UNIQUE NOT NULL, -- EI-PRE, EF-1, EF-6, EM-1, EJA-MOD1
  nome text NOT NULL, -- "Pré-escola", "1º Ano EF", "EJA Módulo 1"
  modalidade text CHECK (modalidade IN (
    'Educação Infantil', 
    'Ensino Fundamental', 
    'Ensino Médio', 
    'EJA', 
    'Educação Especial'
  )),
  etapa text, -- Anos Iniciais, Anos Finais
  idade_minima integer,
  idade_maxima integer,
  carga_horaria_anual integer,
  competencias_bncc jsonb,
  descricao text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Inserir níveis padrão
INSERT INTO grade_levels (tenant_id, codigo, nome, modalidade, etapa, idade_minima, idade_maxima) VALUES
  (current_setting('app.current_tenant')::uuid, 'EI-BERÇARIO', 'Berçário', 'Educação Infantil', NULL, 0, 2),
  (current_setting('app.current_tenant')::uuid, 'EI-PRE', 'Pré-escola', 'Educação Infantil', NULL, 4, 5),
  (current_setting('app.current_tenant')::uuid, 'EF-1', '1º Ano EF', 'Ensino Fundamental', 'Anos Iniciais', 6, 7),
  (current_setting('app.current_tenant')::uuid, 'EF-2', '2º Ano EF', 'Ensino Fundamental', 'Anos Iniciais', 7, 8),
  (current_setting('app.current_tenant')::uuid, 'EF-6', '6º Ano EF', 'Ensino Fundamental', 'Anos Finais', 11, 12),
  (current_setting('app.current_tenant')::uuid, 'EM-1', '1º Ano EM', 'Ensino Médio', NULL, 15, 16),
  (current_setting('app.current_tenant')::uuid, 'EJA-MOD1', 'EJA Módulo 1', 'EJA', 'Fundamental', 15, NULL);
```

#### 5. **enrollments** - Matrículas

```sql
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id),
  school_id uuid NOT NULL REFERENCES schools(id),
  
  ano_letivo integer NOT NULL, -- 2025, 2026
  data_matricula date NOT NULL DEFAULT CURRENT_DATE,
  
  modalidade text CHECK (modalidade IN ('Regular', 'Transferência', 'Rematrícula')),
  escola_origem text, -- Se transferência
  
  status text DEFAULT 'Matriculado' 
    CHECK (status IN ('Matriculado', 'Transferido', 'Cancelado', 'Concluído', 'Abandonou')),
  motivo_saida text,
  data_saida date,
  
  observacoes text,
  
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(student_id, class_id, ano_letivo)
);

-- RLS: PEI Collab pode ler, Gestão Escolar gerencia
CREATE POLICY "gestao_manage_enrollments" ON enrollments
  FOR ALL
  USING (
    has_role(auth.uid(), 'education_secretary') 
    OR has_role(auth.uid(), 'school_director')
    OR school_id IN (SELECT school_id FROM user_schools WHERE user_id = auth.uid())
  );

CREATE POLICY "pei_read_enrollments" ON enrollments
  FOR SELECT
  USING (
    can_view_student(auth.uid(), student_id)
  );
```

#### 6. **subjects** - Disciplinas

```sql
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  
  codigo text UNIQUE NOT NULL, -- MAT, PORT, HIST, GEO
  nome text NOT NULL, -- Matemática, Língua Portuguesa
  componente_curricular text, -- Base Nacional Comum / Parte Diversificada
  area_conhecimento text, -- Linguagens, Matemática, Ciências Humanas, Ciências da Natureza
  carga_horaria_semanal integer,
  competencias_bncc jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Inserir disciplinas padrão
INSERT INTO subjects (tenant_id, codigo, nome, area_conhecimento) VALUES
  (current_setting('app.current_tenant')::uuid, 'PORT', 'Língua Portuguesa', 'Linguagens'),
  (current_setting('app.current_tenant')::uuid, 'MAT', 'Matemática', 'Matemática'),
  (current_setting('app.current_tenant')::uuid, 'HIST', 'História', 'Ciências Humanas'),
  (current_setting('app.current_tenant')::uuid, 'GEO', 'Geografia', 'Ciências Humanas'),
  (current_setting('app.current_tenant')::uuid, 'CIEN', 'Ciências', 'Ciências da Natureza'),
  (current_setting('app.current_tenant')::uuid, 'EDFIS', 'Educação Física', 'Linguagens'),
  (current_setting('app.current_tenant')::uuid, 'ARTE', 'Arte', 'Linguagens');
```

#### 7. **attendance** - Frequência

```sql
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id),
  student_id uuid NOT NULL REFERENCES students(id),
  subject_id uuid REFERENCES subjects(id), -- Null = frequência geral do dia
  
  data date NOT NULL,
  presenca boolean NOT NULL,
  atraso_minutos integer DEFAULT 0,
  saida_antecipada_minutos integer DEFAULT 0,
  
  justificativa text,
  observacao text,
  
  registrado_por uuid NOT NULL REFERENCES auth.users(id),
  
  is_synced boolean DEFAULT false, -- Para offline PWA
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(student_id, data, COALESCE(subject_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Índices para performance
CREATE INDEX idx_attendance_student ON attendance(student_id, data DESC);
CREATE INDEX idx_attendance_class ON attendance(class_id, data DESC);
CREATE INDEX idx_attendance_date ON attendance(data DESC);
```

#### 8. **grades** - Notas

```sql
CREATE TABLE grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  
  avaliacao_tipo text CHECK (avaliacao_tipo IN (
    'Prova', 'Trabalho', 'Projeto', 'Participação', 'Recuperação'
  )),
  periodo text NOT NULL, -- "1BIM", "2BIM", "3BIM", "4BIM", "SEM1", "SEM2", "ANUAL"
  
  nota_valor decimal(5,2), -- 0.00 a 10.00
  conceito text, -- A, B, C, D, E ou MB, B, R, I
  peso decimal(3,2) DEFAULT 1.0, -- Para média ponderada
  
  comentario text,
  
  lancado_por uuid NOT NULL REFERENCES auth.users(id),
  aprovado_por uuid REFERENCES auth.users(id), -- Coordenação aprova
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_nota_or_conceito CHECK (
    (nota_valor IS NOT NULL) OR (conceito IS NOT NULL)
  )
);

-- Índices
CREATE INDEX idx_grades_enrollment ON grades(enrollment_id);
CREATE INDEX idx_grades_subject ON grades(subject_id, periodo);
```

---

## 🔗 Integração com PEI Collab

### Triggers de Sincronização

#### 1. Sincronizar classe do aluno com PEI

```sql
-- Ao criar/atualizar matrícula, atualizar PEI ativo
CREATE OR REPLACE FUNCTION sync_pei_class()
RETURNS TRIGGER AS $$
BEGIN
  -- Se houver PEI ativo, vincular à turma atual
  UPDATE peis
  SET 
    class_id = NEW.class_id,
    enrollment_id = NEW.id,
    updated_at = now()
  WHERE student_id = NEW.student_id
    AND is_active_version = true
    AND status NOT IN ('obsolete');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_pei_class
AFTER INSERT OR UPDATE OF class_id, status ON enrollments
FOR EACH ROW
WHEN (NEW.status = 'Matriculado')
EXECUTE FUNCTION sync_pei_class();
```

#### 2. Alertar PEI sobre faltas acumuladas

```sql
CREATE OR REPLACE FUNCTION notify_pei_attendance()
RETURNS TRIGGER AS $$
DECLARE
  faltas_mes integer;
  has_active_pei boolean;
  pei_id_ativo uuid;
BEGIN
  -- Verificar se aluno tem PEI ativo
  SELECT 
    EXISTS(SELECT 1 FROM peis WHERE student_id = NEW.student_id AND is_active_version = true),
    (SELECT id FROM peis WHERE student_id = NEW.student_id AND is_active_version = true LIMIT 1)
  INTO has_active_pei, pei_id_ativo;
  
  IF has_active_pei AND NEW.presenca = false THEN
    -- Contar faltas no mês
    SELECT COUNT(*) INTO faltas_mes
    FROM attendance
    WHERE student_id = NEW.student_id
      AND presenca = false
      AND data >= date_trunc('month', NEW.data)
      AND data <= date_trunc('month', NEW.data) + interval '1 month' - interval '1 day';
    
    -- Se > 5 faltas no mês, criar notificação
    IF faltas_mes > 5 THEN
      INSERT INTO pei_notifications (
        user_id, 
        pei_id, 
        notification_type,
        title,
        message,
        is_read
      )
      SELECT 
        pt.teacher_id,
        pei_id_ativo,
        'attendance_alert',
        'Alerta de Frequência',
        'Aluno acumulou ' || faltas_mes || ' faltas no mês',
        false
      FROM pei_teachers pt
      WHERE pt.pei_id = pei_id_ativo
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_pei_attendance_alert
AFTER INSERT ON attendance
FOR EACH ROW
EXECUTE FUNCTION notify_pei_attendance();
```

#### 3. Comparar notas com metas do PEI

```sql
CREATE OR REPLACE FUNCTION compare_grade_with_pei()
RETURNS TRIGGER AS $$
DECLARE
  pei_goal_target decimal;
  student_id_ref uuid;
BEGIN
  -- Buscar student_id da matrícula
  SELECT student_id INTO student_id_ref
  FROM enrollments
  WHERE id = NEW.enrollment_id;
  
  -- Buscar meta relacionada à disciplina no PEI ativo
  SELECT pg.target_value / 10.0 INTO pei_goal_target
  FROM peis p
  JOIN pei_goals pg ON pg.pei_id = p.id
  WHERE p.student_id = student_id_ref
    AND p.is_active_version = true
    AND pg.description ILIKE '%' || (SELECT nome FROM subjects WHERE id = NEW.subject_id) || '%'
  ORDER BY pg.created_at DESC
  LIMIT 1;
  
  -- Se nota < meta, criar notificação
  IF pei_goal_target IS NOT NULL AND NEW.nota_valor < pei_goal_target THEN
    INSERT INTO pei_notifications (
      user_id,
      pei_id,
      notification_type,
      title,
      message,
      is_read
    )
    SELECT 
      p.created_by,
      p.id,
      'grade_below_goal',
      'Nota abaixo da meta do PEI',
      'Nota ' || NEW.nota_valor || ' está abaixo da meta ' || pei_goal_target,
      false
    FROM peis p
    WHERE p.student_id = student_id_ref 
      AND p.is_active_version = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_compare_grade_pei
AFTER INSERT OR UPDATE OF nota_valor ON grades
FOR EACH ROW
WHEN (NEW.nota_valor IS NOT NULL)
EXECUTE FUNCTION compare_grade_with_pei();
```

---

## 📦 Package Compartilhado: Types

Criar `packages/shared-types` para tipos compartilhados:

```typescript
// packages/shared-types/src/entities/student.ts
export interface StudentExpanded {
  // Campos básicos (já existentes)
  id: string;
  full_name: string;
  date_of_birth: string;
  registration_number?: string;
  is_active: boolean;
  
  // Novos campos
  codigo_identificador: string;
  nome_social?: string;
  cpf?: string;
  rg?: string;
  sexo?: 'M' | 'F' | 'Outro';
  
  // Endereço
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_cep?: string;
  
  // Contatos
  telefone_principal?: string;
  email?: string;
  
  // Responsáveis
  mae_nome?: string;
  mae_telefone?: string;
  pai_nome?: string;
  pai_telefone?: string;
  
  // Status
  status_matricula: 'Ativo' | 'Transferido' | 'Cancelado' | 'Concluído';
  necessidades_especiais: boolean;
  tipo_necessidade?: string[];
  
  // Relações
  school_id: string;
  tenant_id: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// packages/shared-types/src/entities/enrollment.ts
export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  school_id: string;
  ano_letivo: number;
  data_matricula: string;
  modalidade: 'Regular' | 'Transferência' | 'Rematrícula';
  status: 'Matriculado' | 'Transferido' | 'Cancelado' | 'Concluído' | 'Abandonou';
  observacoes?: string;
  created_at: string;
}

// packages/shared-types/src/entities/attendance.ts
export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  subject_id?: string;
  data: string;
  presenca: boolean;
  atraso_minutos: number;
  saida_antecipada_minutos: number;
  justificativa?: string;
  observacao?: string;
  registrado_por: string;
  created_at: string;
}

// packages/shared-types/src/entities/grade.ts
export interface Grade {
  id: string;
  enrollment_id: string;
  subject_id: string;
  avaliacao_tipo: 'Prova' | 'Trabalho' | 'Projeto' | 'Participação' | 'Recuperação';
  periodo: string;
  nota_valor?: number;
  conceito?: string;
  peso: number;
  comentario?: string;
  lancado_por: string;
  aprovado_por?: string;
  created_at: string;
}
```

---

## 🎨 Estrutura de Componentes

### Módulos a Implementar

```
apps/gestao-escolar/src/
├── modules/
│   ├── alunos/                    # Gestão de Alunos (expandir)
│   │   ├── components/
│   │   │   ├── StudentForm.tsx        # CRUD completo
│   │   │   ├── StudentProfile.tsx     # Perfil detalhado
│   │   │   ├── StudentEnrollment.tsx  # Matricular
│   │   │   └── StudentHistory.tsx     # Histórico escolar
│   │   ├── hooks/
│   │   │   ├── useStudents.ts
│   │   │   └── useStudentMutations.ts
│   │   └── pages/
│   │       └── StudentDetails.tsx
│   │
│   ├── profissionais/             # Gestão de Staff (expandir)
│   │   ├── components/
│   │   │   ├── StaffForm.tsx
│   │   │   ├── StaffProfile.tsx
│   │   │   └── StaffSchedule.tsx
│   │   └── hooks/
│   │       └── useStaff.ts
│   │
│   ├── turmas/                    # Gestão de Turmas (expandir)
│   │   ├── components/
│   │   │   ├── ClassForm.tsx
│   │   │   ├── ClassStudents.tsx      # Lista de alunos da turma
│   │   │   └── ClassSchedule.tsx      # Grade horária
│   │   └── hooks/
│   │       └── useClasses.ts
│   │
│   ├── academico/                 # 🆕 Novo Módulo
│   │   ├── frequencia/
│   │   │   ├── AttendanceSheet.tsx    # Diário de classe
│   │   │   ├── QuickAttendance.tsx    # Registro rápido
│   │   │   └── AttendanceReport.tsx   # Relatórios
│   │   ├── notas/
│   │   │   ├── GradesEntry.tsx        # Lançamento de notas
│   │   │   └── GradesReport.tsx       # Boletim
│   │   └── hooks/
│   │       ├── useAttendance.ts
│   │       └── useGrades.ts
│   │
│   ├── matriculas/                # 🆕 Novo Módulo
│   │   ├── components/
│   │   │   ├── EnrollmentWizard.tsx   # Wizard de matrícula
│   │   │   ├── TransferStudent.tsx    # Transferência
│   │   │   └── EnrollmentList.tsx
│   │   └── hooks/
│   │       └── useEnrollments.ts
│   │
│   └── dashboard/                 # Expandir Dashboard
│       ├── widgets/
│       │   ├── PEIStatsWidget.tsx     # Integração com PEI
│       │   ├── AttendanceWidget.tsx
│       │   └── GradesWidget.tsx
│       └── DashboardGestao.tsx
```

---

## 🚀 Roadmap de Implementação

### Fase 1: Expansão do Banco (Semana 1)
- [ ] Criar migração SQL completa
- [ ] Expandir tabelas existentes (students, profiles, schools)
- [ ] Criar novas tabelas (grade_levels, enrollments, subjects, attendance, grades)
- [ ] Implementar triggers de integração
- [ ] Testar RLS policies

### Fase 2: Package Shared Types (Semana 1)
- [ ] Criar `packages/shared-types`
- [ ] Definir interfaces de todas as entidades
- [ ] Configurar build e exports
- [ ] Atualizar `@pei/database` para usar os types

### Fase 3: Módulo Alunos Expandido (Semana 2)
- [ ] Componente `StudentForm` completo (todos os campos)
- [ ] Perfil detalhado do aluno
- [ ] Histórico de matrículas
- [ ] Upload de documentos (laudo médico)
- [ ] Integração com responsáveis

### Fase 4: Módulo Matrículas (Semana 3)
- [ ] Wizard de matrícula (step-by-step)
- [ ] Vincular aluno a turma
- [ ] Processo de transferência
- [ ] Geração de documentos de matrícula

### Fase 5: Módulo Acadêmico - Frequência (Semana 4)
- [ ] Diário de classe (desktop + PWA offline)
- [ ] Registro rápido de faltas
- [ ] Justificativas de ausência
- [ ] Relatórios de frequência
- [ ] Alertas de faltas excessivas

### Fase 6: Módulo Acadêmico - Notas (Semana 5)
- [ ] Lançamento de notas por período
- [ ] Cálculo automático de médias
- [ ] Aprovação por coordenação
- [ ] Boletim escolar (PDF)
- [ ] Comparação com metas do PEI

### Fase 7: Dashboard Integrado (Semana 6)
- [ ] Widget de estatísticas de PEIs
- [ ] Widget de frequência escolar
- [ ] Widget de desempenho acadêmico
- [ ] Alunos em risco (integrado com PEI)
- [ ] Gráficos e relatórios

### Fase 8: Integração PEI Collab (Semana 7)
- [ ] PEI exibir contexto acadêmico do aluno
- [ ] Alertas automáticos (faltas, notas)
- [ ] Comparação metas vs desempenho real
- [ ] Relatórios integrados

---

## 🔐 Segurança e RLS

### Políticas de Acesso

```sql
-- Secretaria de Educação: acesso total
CREATE POLICY "secretary_full_access" ON students
  FOR ALL
  USING (
    tenant_id = get_user_tenant_safe(auth.uid())
    AND has_role(auth.uid(), 'education_secretary')
  );

-- Diretor: acesso à sua escola
CREATE POLICY "director_school_access" ON students
  FOR ALL
  USING (
    school_id IN (
      SELECT s.id FROM schools s
      WHERE s.diretor_id = auth.uid()
    )
  );

-- Coordenador: leitura de escolas vinculadas
CREATE POLICY "coordinator_read_access" ON students
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM user_schools WHERE user_id = auth.uid()
    )
  );

-- Professor: apenas alunos de suas turmas
CREATE POLICY "teacher_class_students" ON students
  FOR SELECT
  USING (
    id IN (
      SELECT e.student_id 
      FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE c.professor_titular_id = auth.uid()
        AND e.status = 'Matriculado'
    )
  );

-- PEI Collab: leitura apenas (já definido anteriormente)
CREATE POLICY "pei_collab_read_only" ON students
  FOR SELECT
  USING (
    can_view_student(auth.uid(), students.id)
  );
```

---

## 📊 Queries Úteis

### 1. Alunos elegíveis para PEI

```sql
CREATE OR REPLACE FUNCTION get_students_for_pei(_user_id uuid)
RETURNS TABLE (
  id uuid,
  nome_completo text,
  codigo_identificador text,
  escola text,
  turma text,
  necessidades text[],
  tem_pei_ativo boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.full_name,
    s.codigo_identificador,
    sc.school_name,
    c.class_name,
    s.tipo_necessidade,
    EXISTS(SELECT 1 FROM peis p WHERE p.student_id = s.id AND p.is_active_version = true)
  FROM students s
  JOIN schools sc ON sc.id = s.school_id
  LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'Matriculado'
  LEFT JOIN classes c ON c.id = e.class_id
  WHERE s.school_id IN (SELECT school_id FROM user_schools WHERE user_id = _user_id)
    AND s.status_matricula = 'Ativo'
    AND s.necessidades_especiais = true
  ORDER BY s.full_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### 2. Contexto acadêmico para PEI

```sql
CREATE OR REPLACE FUNCTION get_student_academic_context(_student_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'turma', c.class_name,
    'nivel', gl.nome,
    'frequencia_percentual', COALESCE(
      (COUNT(a.*) FILTER (WHERE a.presenca = true)::decimal / NULLIF(COUNT(a.*), 0)) * 100,
      100
    ),
    'media_geral', COALESCE(AVG(g.nota_valor), 0),
    'disciplinas_abaixo_media', COUNT(DISTINCT g.subject_id) FILTER (WHERE g.nota_valor < 6.0),
    'faltas_mes_atual', COUNT(a.*) FILTER (
      WHERE a.presenca = false 
      AND a.data >= date_trunc('month', CURRENT_DATE)
    ),
    'em_risco', (
      COALESCE(
        (COUNT(a.*) FILTER (WHERE a.presenca = true)::decimal / NULLIF(COUNT(a.*), 0)) * 100,
        100
      ) < 75 
      OR COALESCE(AVG(g.nota_valor), 0) < 6.0
    )
  ) INTO result
  FROM students s
  LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'Matriculado'
  LEFT JOIN classes c ON c.id = e.class_id
  LEFT JOIN grade_levels gl ON gl.id = c.grade_level_id
  LEFT JOIN attendance a ON a.student_id = s.id 
    AND a.data >= CURRENT_DATE - INTERVAL '30 days'
  LEFT JOIN grades g ON g.enrollment_id = e.id
  WHERE s.id = _student_id
  GROUP BY c.class_name, gl.nome;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## 🎯 Métricas de Sucesso

### KPIs Técnicos
- [ ] Tempo de carregamento de lista de alunos < 500ms
- [ ] Lançamento de frequência offline (PWA)
- [ ] Sincronização bidirecional PEI ↔ Gestão < 1s
- [ ] Cobertura de testes > 80%

### KPIs Funcionais
- [ ] 100% dos alunos NEE com PEI ativo
- [ ] Taxa de preenchimento de frequência > 95%
- [ ] Tempo médio de matrícula < 10min
- [ ] Satisfação dos usuários > 4.5/5

---

## 📚 Próximos Passos Imediatos

1. ✅ Revisar este documento
2. ⏳ Criar migração SQL (`supabase/migrations/20250201_gestao_escolar_expansion.sql`)
3. ⏳ Criar package `@pei/shared-types`
4. ⏳ Expandir `StudentForm.tsx` com todos os campos
5. ⏳ Implementar módulo de matrículas
6. ⏳ Criar diário de classe (frequência)
7. ⏳ Integrar com PEI Collab

---

**Autor**: Sistema AI  
**Data**: 09/11/2025  
**Versão**: 1.0  
**Status**: 📋 Planejamento

