# 📚 Guia Completo do Monorepo PEI Collab V3

## 🎯 Visão Geral da Arquitetura

O **PEI Collab** agora é um **monorepo completo** com **4 aplicações integradas**:

```
pei-collab/ (monorepo root)
├── apps/
│   ├── pei-collab/          🎓 App principal (PEI)
│   ├── gestao-escolar/      📋 Gestão Escolar (fonte de dados)
│   ├── plano-aee/           ♿ Plano de AEE (anexo do PEI)
│   └── blog/                📝 Mini Blog (futuro)
├── packages/
│   ├── ui/                  🎨 Componentes compartilhados
│   ├── database/            💾 Cliente Supabase
│   ├── auth/                🔐 Autenticação
│   └── config/              ⚙️ Configurações
└── supabase/
    └── migrations/          🗄️ Database Schema
```

---

## 🌐 Como os Apps se Integram

### 1️⃣ App Gestão Escolar (Fonte de Dados Central)

**URL Local**: `http://localhost:5174`

**Responsabilidade**: Cadastro centralizado de toda a rede de ensino.

#### **Funcionalidades**:

✅ **Cadastro de Profissionais**
- Professores
- Professores de AEE
- Coordenadores
- Diretores
- Profissionais de Apoio
- Psicólogos, Fonoaudiólogos, etc.

✅ **Cadastro de Alunos**
- Dados pessoais completos
- Informações de saúde
- Necessidades especiais
- Responsáveis
- Contatos de emergência

✅ **Gerenciamento de Turmas**
- Por etapa de ensino (Ed. Infantil → Ensino Médio + EJA)
- Professor regente
- Capacidade de alunos
- Turno e ano letivo

✅ **Disciplinas e Campos de Experiência**
- Campos da BNCC (Educação Infantil)
- Disciplinas por etapa de ensino
- Vinculação de professores por disciplina

#### **Tabelas Principais**:

```sql
- professionals         → Profissionais da rede
- students              → Alunos (expandido)
- classes               → Turmas
- subjects              → Disciplinas/Campos
- class_subjects        → Vinculação turma ↔ disciplina
```

#### **Integração**:

🔗 O **PEI Collab** lê os dados de alunos e profissionais deste app.
🔗 O **Plano de AEE** também usa os mesmos alunos.

---

### 2️⃣ App PEI Collab (App Principal)

**URL Local**: `http://localhost:8080`

**Responsabilidade**: Gestão de Planos Educacionais Individualizados.

#### **Funcionalidades Expandidas**:

✅ **Dashboard para Profissional de Apoio (PA)**
- Visualizar alunos atribuídos
- Registrar feedbacks diários (socialização, autonomia, comportamento)
- Visualizar PEI do aluno em modo leitura
- Adicionar comentários no PEI

✅ **Sistema de Reuniões**
- Criação de reuniões vinculadas a PEIs
- Seleção de participantes (professores, coordenação)
- Pauta e Ata de reunião
- Notificações automáticas
- Registro de presença

✅ **Avaliação Cíclica do PEI**
- Avaliação ao final de cada ciclo (I, II, III)
- Auto-avaliação do PEI
- Alcance de metas
- Modificações necessárias
- Agendamento pela coordenação

✅ **Criação e Edição de PEIs**
- Geração de relatórios em PDF
- IA para auxiliar preenchimento
- Versionamento

#### **Tabelas Principais**:

```sql
- peis                                → PEIs
- support_professional_students       → Vinculação PA ↔ Aluno
- support_professional_feedbacks      → Feedbacks do PA
- pei_meetings                        → Reuniões
- pei_meeting_participants            → Participantes
- pei_evaluations                     → Avaliações cíclicas
- evaluation_schedules                → Agendamento de avaliações
```

#### **Integração**:

🔗 Lê dados de **alunos** e **profissionais** da **Gestão Escolar**.
🔗 O **Plano de AEE** aparece como **anexo** nos relatórios do PEI.

---

### 3️⃣ App Plano de AEE (Anexo do PEI)

**URL Local**: `http://localhost:5175`

**Responsabilidade**: Planos de Atendimento Educacional Especializado.

#### **Funcionalidades**:

✅ **Formulário Completo de AEE**
- **1. Ferramentas de Diagnóstico** (por tipo de deficiência)
- **2. Anamnese** (histórico médico, familiar, escolar)
- **3. Identificação de Barreiras** (aprendizagem, acessibilidade, comunicação, sociais)
- **4. Queixas** (escola, família, aluno)
- **5. Recursos e Adaptações** (curriculares, materiais, espaciais, comunicacionais)
- **6. Objetivos de Ensino** (por área de desenvolvimento)
- **7. Métodos de Avaliação**
- **8. Acompanhamentos** (frequência, duração)
- **9. Encaminhamentos** (outros profissionais)
- **10. Orientações** (família, escola, equipe de apoio)
- **11. Avaliações por Ciclo** (I, II, III Ciclo)

✅ **Permissões**:
- **Professor AEE**: Cria e edita
- **Outros Profissionais**: Apenas leitura e comentários

✅ **Sistema de Comentários**
- Comentários por seção
- Threads de respostas
- Marcação de resolvido

✅ **Anexos**
- Upload de laudos, relatórios, avaliações

#### **Tabelas Principais**:

```sql
- plano_aee                  → Planos de AEE
- plano_aee_comments         → Comentários
- plano_aee_attachments      → Anexos
- diagnostic_templates       → Templates de diagnóstico por deficiência
```

#### **Integração com PEI**:

🔗 Cada Plano de AEE está vinculado a um **PEI** (`pei_id`).
🔗 Ao gerar o **relatório do PEI em PDF**, o Plano de AEE é incluído como **anexo**.

**Exemplo de Integração**:

```typescript
// No relatório do PEI:
const pei = await supabase.from('peis').select('*').eq('id', peiId).single();

const planoAEE = await supabase
  .from('plano_aee')
  .select('*')
  .eq('pei_id', peiId)
  .single();

if (planoAEE) {
  // Adicionar Plano de AEE como anexo no PDF
  pdf.addPage();
  pdf.addSection('ANEXO: PLANO DE AEE');
  pdf.addContent(planoAEE);
}
```

---

## 🗄️ Estrutura Completa do Banco de Dados

### **Gestão Escolar (Nova)**:

```sql
-- Profissionais
CREATE TABLE professionals (
  id uuid PRIMARY KEY,
  full_name text NOT NULL,
  cpf text UNIQUE,
  professional_role enum,    -- 'professor', 'professor_aee', 'coordenador', etc.
  registration_number text,  -- Matrícula funcional
  school_id uuid,
  tenant_id uuid,
  user_id uuid               -- Vínculo com auth.users
);

-- Turmas
CREATE TABLE classes (
  id uuid PRIMARY KEY,
  class_name text NOT NULL,         -- "3º Ano A"
  education_level enum,             -- 'educacao_infantil', 'ensino_fundamental_1', etc.
  grade text,                       -- "1º ano", "Maternal"
  shift text,                       -- "Manhã", "Tarde", "Integral"
  academic_year text,               -- "2025"
  main_teacher_id uuid,
  max_students integer,
  current_students integer
);

-- Disciplinas / Campos de Experiência
CREATE TABLE subjects (
  id uuid PRIMARY KEY,
  subject_name text NOT NULL,
  education_level enum,
  subject_type text,                -- 'disciplina' ou 'campo_experiencia'
  description text
);

-- Vinculação Turma ↔ Disciplina
CREATE TABLE class_subjects (
  id uuid PRIMARY KEY,
  class_id uuid,
  subject_id uuid,
  teacher_id uuid,
  workload integer                  -- Carga horária semanal
);

-- Students (Expandido)
ALTER TABLE students ADD COLUMN class_id uuid;
ALTER TABLE students ADD COLUMN registration_number text;
ALTER TABLE students ADD COLUMN guardian_name text;
ALTER TABLE students ADD COLUMN guardian_phone text;
-- + muitos outros campos
```

### **PEI Collab (Expandido)**:

```sql
-- Profissional de Apoio
CREATE TABLE support_professional_students (
  id uuid PRIMARY KEY,
  support_professional_id uuid,
  student_id uuid
);

CREATE TABLE support_professional_feedbacks (
  id uuid PRIMARY KEY,
  student_id uuid,
  support_professional_id uuid,
  date date,
  socialization_score integer,
  autonomy_score integer,
  behavior_score integer,
  notes text
);

-- Reuniões
CREATE TABLE pei_meetings (
  id uuid PRIMARY KEY,
  meeting_date timestamptz,
  agenda text,
  minutes text,
  status text,               -- 'scheduled', 'completed', 'cancelled'
  attendance_checked boolean
);

CREATE TABLE pei_meeting_peis (
  meeting_id uuid,
  pei_id uuid
);

CREATE TABLE pei_meeting_participants (
  id uuid PRIMARY KEY,
  meeting_id uuid,
  user_id uuid,
  role text,                 -- 'organizer', 'participant'
  attendance_status text     -- 'present', 'absent', 'pending'
);

-- Avaliações Cíclicas
CREATE TABLE pei_evaluations (
  id uuid PRIMARY KEY,
  pei_id uuid,
  cycle text,                -- 'cycle_1', 'cycle_2', 'cycle_3'
  evaluation_data jsonb,
  goals_achieved jsonb,
  modifications_needed text,
  next_steps text,
  evaluated_by uuid,
  evaluated_at timestamptz
);

CREATE TABLE evaluation_schedules (
  id uuid PRIMARY KEY,
  pei_id uuid,
  cycle text,
  scheduled_date date,
  status text                -- 'pending', 'completed', 'rescheduled'
);
```

### **Plano de AEE**:

```sql
CREATE TABLE plano_aee (
  id uuid PRIMARY KEY,
  pei_id uuid,                      -- 🔗 VINCULAÇÃO COM PEI
  student_id uuid,
  
  -- Estrutura JSONB para flexibilidade
  diagnosis_tools jsonb,            -- Ferramentas diagnósticas
  anamnesis_data jsonb,             -- Anamnese estruturada
  learning_barriers jsonb,          -- Barreiras
  resources jsonb,                  -- Recursos
  adaptations jsonb,                -- Adaptações
  teaching_objectives jsonb,        -- Objetivos
  follow_ups jsonb,                 -- Acompanhamentos
  referrals jsonb,                  -- Encaminhamentos
  
  -- Avaliações
  cycle_1_evaluation jsonb,
  cycle_2_evaluation jsonb,
  cycle_3_evaluation jsonb,
  
  -- Controle
  status text,                      -- 'draft', 'approved'
  version integer
);

CREATE TABLE plano_aee_comments (
  id uuid PRIMARY KEY,
  plano_aee_id uuid,
  user_id uuid,
  comment_text text,
  section text,                     -- Seção específica comentada
  is_resolved boolean
);

CREATE TABLE plano_aee_attachments (
  id uuid PRIMARY KEY,
  plano_aee_id uuid,
  file_name text,
  file_path text,
  attachment_type text              -- 'laudo', 'relatorio', 'avaliacao'
);

CREATE TABLE diagnostic_templates (
  id uuid PRIMARY KEY,
  disability_type enum,             -- 'deficiencia_intelectual', 'autismo', etc.
  template_name text,
  fields jsonb                      -- Estrutura do template
);
```

---

## 🔐 Row Level Security (RLS)

### **Gestão Escolar**:

```sql
-- Coordenadores, Diretores e Secretários podem gerenciar
-- Todos podem visualizar
```

### **PEI Collab**:

```sql
-- Profissional de Apoio pode:
  - Ver seus alunos atribuídos
  - Registrar feedbacks
  - Ver PEI dos alunos (somente leitura)
  - Comentar no PEI

-- Coordenação pode:
  - Criar reuniões
  - Agendar avaliações
  - Gerenciar todos os PEIs
```

### **Plano de AEE**:

```sql
-- Professor AEE pode:
  - Criar e editar planos de AEE
  - Gerenciar anexos

-- Outros profissionais podem:
  - Visualizar planos
  - Adicionar comentários
```

---

## 🚀 Como Rodar os Apps

### **Passo 1: Instalar Dependências**

```bash
# No root do monorepo
pnpm install
```

### **Passo 2: Aplicar Migrações no Supabase**

Execute as migrações na ordem:

```sql
1. 20250108000001_support_professional.sql
2. 20250108000002_meetings_system_FIXED.sql
3. 20250108000003_pei_evaluation.sql
4. 20250108000004_plano_aee.sql
5. 20250108000005_blog.sql
6. 20250108000006_gestao_escolar.sql
```

### **Passo 3: Rodar os Apps**

```bash
# Todos de uma vez (recomendado)
pnpm dev

# Ou individualmente:
cd apps/pei-collab && pnpm dev       # http://localhost:8080
cd apps/gestao-escolar && pnpm dev   # http://localhost:5174
cd apps/plano-aee && pnpm dev        # http://localhost:5175
```

---

## 🔗 Fluxo de Integração Completo

### **Cenário: Criação de um PEI com Plano de AEE**

1. **Gestão Escolar** → Cadastrar aluno "João Silva" (turma, escola, responsáveis)
2. **Gestão Escolar** → Cadastrar professor AEE "Maria Santos"
3. **PEI Collab** → Coordenador cria PEI para "João Silva"
4. **PEI Collab** → Atribui Profissional de Apoio "Carlos"
5. **Plano de AEE** → Professor AEE cria Plano de AEE vinculado ao PEI de João
6. **Plano de AEE** → Preenche anamnese, barreiras, objetivos, adaptações
7. **PEI Collab** → PA "Carlos" registra feedbacks diários sobre João
8. **PEI Collab** → Coordenador agenda reunião para discutir PEI
9. **PEI Collab** → Reunião realizada, ata registrada
10. **PEI Collab** → Ao final do I Ciclo, professor avalia o PEI
11. **PEI Collab** → Gera relatório PDF do PEI **incluindo o Plano de AEE como anexo**

---

## 📊 Relatório do PEI com Plano de AEE

### **Estrutura do Relatório PDF**:

```
┌─────────────────────────────────────────┐
│  PLANO EDUCACIONAL INDIVIDUALIZADO      │
├─────────────────────────────────────────┤
│  1. Identificação do Aluno              │
│  2. Objetivos Educacionais              │
│  3. Estratégias Pedagógicas             │
│  4. Recursos e Materiais                │
│  5. Avaliação e Acompanhamento          │
│  6. Feedbacks dos Profissionais de Apoio│
│  7. Reuniões Realizadas                 │
│  8. Avaliações Cíclicas                 │
├─────────────────────────────────────────┤
│  ANEXO A: PLANO DE AEE                  │  ⬅️ INTEGRAÇÃO!
│  ✓ Anamnese                             │
│  ✓ Diagnóstico                          │
│  ✓ Barreiras de Aprendizagem            │
│  ✓ Recursos e Adaptações                │
│  ✓ Objetivos de Ensino                  │
│  ✓ Orientações                          │
│  ✓ Avaliações Cíclicas                  │
└─────────────────────────────────────────┘
```

---

## 📝 Próximos Passos

### **Futuras Implementações**:

1. ✅ **Mini Blog** (já tem migração)
   - Posts educacionais
   - Compartilhamento de experiências
   - Comunidade de professores

2. 🔄 **Sincronização com Sistema de Matrícula Externo**
   - API para importar dados de alunos
   - Webhooks para atualizações em tempo real

3. 📱 **App Mobile (PWA)**
   - Para Profissionais de Apoio
   - Feedbacks rápidos via smartphone

4. 🔔 **Sistema de Notificações Avançado**
   - E-mail
   - Push notifications
   - SMS

5. 📊 **Dashboards Analíticos**
   - Relatórios por escola
   - Indicadores de qualidade
   - Estatísticas de atendimento

---

## 🎉 Conclusão

O **PEI Collab V3** agora é um **ecossistema completo** para gestão educacional inclusiva:

✅ **Gestão Escolar** centraliza todos os cadastros  
✅ **PEI Collab** gerencia os PEIs com recursos avançados  
✅ **Plano de AEE** complementa com atendimento especializado  
✅ **Integração total** entre os apps via banco compartilhado  
✅ **Monorepo** facilita desenvolvimento e manutenção  

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console de cada app
2. Confira as RLS policies no Supabase Dashboard
3. Revise as migrações aplicadas
4. Teste com usuários de teste

**Boa sorte com o desenvolvimento! 🚀**

