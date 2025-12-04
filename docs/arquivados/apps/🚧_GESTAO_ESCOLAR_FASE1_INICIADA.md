# 🚧 Gestão Escolar - Fase 1 Iniciada

> **Data**: 09/11/2025  
> **Status**: ⏳ Em Andamento  
> **Fase**: 1 - Expansão do Banco de Dados

---

## ✅ Correções Aplicadas (Pré-requisitos)

Antes de começar a implementação, corrigi erros de build do monorepo:

### 1. **Package `@pei/ui`**
- ✅ Criado `packages/ui/src/button.tsx` (componente básico)
- ✅ Criado `packages/ui/src/dropdown-menu.tsx` (componente básico)
- ✅ Simplificado `packages/ui/src/index.ts` (removido exports inexistentes)

### 2. **Package `@pei/database`**
- ✅ Criado `packages/database/src/types.ts` (placeholder para types)

### 3. **Tailwind Config** (3 apps corrigidos)
- ✅ `apps/plano-aee/tailwind.config.ts` - import corrigido
- ✅ `apps/gestao-escolar/tailwind.config.ts` - import corrigido
- ✅ `apps/landing/tailwind.config.ts` - import corrigido

### 4. **TypeScript Config**
- ✅ `tsconfig.json` (root) - corrigido
- ✅ `packages/config/tsconfig.json` - placeholder criado
- ✅ `packages/config/index.ts` - placeholder criado

---

## 🗄️ Migração SQL Criada

### Arquivo: `supabase/migrations/20250210000001_gestao_escolar_expansion.sql`

**Conteúdo** (450+ linhas):

#### **PARTE 1: Expansão de Tabelas Existentes**

##### 1.1 **students** - Alunos (25+ novos campos)
```sql
-- Identificação completa
codigo_identificador, numero_ficha, nome_social, cpf, rg

-- Dados pessoais
sexo, raca_cor, naturalidade, tipo_sanguineo, cartao_sus

-- Endereço completo (8 campos)
endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, 
endereco_cep, localizacao_geografica

-- Contatos
telefone_principal, telefone_secundario, email

-- Responsáveis
mae_nome, mae_telefone, mae_cpf, pai_nome, pai_telefone, pai_cpf

-- Status acadêmico
status_matricula (Ativo, Transferido, Cancelado, Concluído, Abandonou)

-- Necessidades especiais expandido
necessidades_especiais (boolean), tipo_necessidade (array), laudo_medico_url
```

**Migração de Dados**:
- ✅ `special_needs` → `necessidades_especiais` + `tipo_necessidade[]`

**Índices Criados**:
- `idx_students_codigo` (codigo_identificador)
- `idx_students_status` (status_matricula)
- `idx_students_necessidades` (necessidades_especiais)
- `idx_students_cpf` (cpf)

##### 1.2 **profiles** - Staff (15+ novos campos)
```sql
-- Dados profissionais
matricula_funcional, cargo_funcao, tipo_vinculo, regime_trabalho,
departamento_setor, data_entrada, data_saida

-- Formação
escolaridade, formacao (jsonb), habilitacoes (jsonb)

-- Dados pessoais
cpf, rg, data_nascimento, endereco_completo, telefone, email_pessoal
```

**Índices Criados**:
- `idx_profiles_matricula` (matricula_funcional)
- `idx_profiles_cargo` (cargo_funcao)

##### 1.3 **schools** - Escolas (10+ novos campos)
```sql
-- Dados institucionais
codigo_inep (UNIQUE), tipo_escola, diretor_id (FK profiles),
coordenador_pedagogico_id (FK profiles)

-- Capacidade e estrutura
capacidade_total, oferece_eja, oferece_aee, turnos (jsonb)

-- Localização
latitude, longitude
```

**Índices Criados**:
- `idx_schools_inep` (codigo_inep)
- `idx_schools_tipo` (tipo_escola)

---

#### **PARTE 2: Novas Tabelas** (5 tabelas)

##### 2.1 **grade_levels** - Níveis de Ensino
```sql
CREATE TABLE grade_levels (
  id, tenant_id,
  codigo, nome,                            -- EF-1, "1º Ano EF"
  modalidade, etapa,                       -- Ensino Fundamental, Anos Iniciais
  idade_minima, idade_maxima,
  carga_horaria_anual,
  competencias_bncc (jsonb),
  is_active,
  created_at, updated_at
)
```

**RLS Policies**:
- ✅ Visualização por tenant
- ✅ Gestão apenas para admins

##### 2.2 **subjects** - Disciplinas
```sql
CREATE TABLE subjects (
  id, tenant_id,
  codigo, nome,                            -- MAT, "Matemática"
  componente_curricular,                   -- Base Nacional Comum
  area_conhecimento,                       -- Matemática
  carga_horaria_semanal,
  competencias_bncc (jsonb),
  is_active,
  created_at, updated_at
)
```

**RLS Policies**:
- ✅ Visualização por tenant
- ✅ Gestão apenas para admins

##### 2.3 **enrollments** - Matrículas ⭐
```sql
CREATE TABLE enrollments (
  id,
  student_id (FK students),
  class_id (FK classes),
  school_id (FK schools),
  ano_letivo,                              -- 2025, 2026
  data_matricula,
  modalidade,                              -- Regular, Transferência
  escola_origem,
  status,                                  -- Matriculado, Transferido, etc.
  motivo_saida, data_saida,
  observacoes,
  created_by, created_at, updated_at,
  UNIQUE(student_id, class_id, ano_letivo)
)
```

**Índices** (5 índices):
- `idx_enrollments_student`, `_class`, `_school`, `_ano`, `_status`

**RLS Policies**:
- ✅ Visualização por escola vinculada
- ✅ Gestão para admins e coordenadores

##### 2.4 **attendance** - Frequência 📊
```sql
CREATE TABLE attendance (
  id,
  class_id (FK classes),
  student_id (FK students),
  subject_id (FK subjects, NULL = geral),
  data, presenca,
  atraso_minutos, saida_antecipada_minutos,
  justificativa, observacao,
  registrado_por (FK auth.users),
  is_synced,                               -- Para offline PWA
  created_at, updated_at,
  UNIQUE(student_id, data, COALESCE(subject_id, UUID_NIL))
)
```

**Índices** (6 índices otimizados):
- `idx_attendance_student` (student_id, data DESC)
- `idx_attendance_class` (class_id, data DESC)
- `idx_attendance_date` (data DESC)
- `idx_attendance_presenca` (presenca, data DESC)
- `idx_attendance_unique_with_subject` (UNIQUE quando subject_id NOT NULL)
- `idx_attendance_unique_without_subject` (UNIQUE quando subject_id IS NULL)

**RLS Policies**:
- ✅ Visualização por escola
- ✅ Professores gerenciam suas turmas

##### 2.5 **grades** - Notas e Avaliações 📈
```sql
CREATE TABLE grades (
  id,
  enrollment_id (FK enrollments),
  subject_id (FK subjects),
  avaliacao_tipo,                          -- Prova, Trabalho, Projeto, etc.
  periodo,                                 -- 1BIM, 2BIM, SEM1, ANUAL
  nota_valor (0.00-10.00),
  conceito (A-E, MB-I),
  peso (média ponderada),
  comentario,
  lancado_por (FK auth.users),
  aprovado_por (FK auth.users),
  aprovado_em,
  created_at, updated_at,
  CHECK (nota_valor OR conceito),
  CHECK (nota_valor BETWEEN 0 AND 10)
)
```

**Índices** (3 índices):
- `idx_grades_enrollment`, `_subject`, `_periodo`

**RLS Policies**:
- ✅ Visualização por escola
- ✅ Professores e coordenadores gerenciam

---

#### **PARTE 3: Triggers de Integração** (3 triggers)

##### 3.1 **sync_pei_class()** ↔ PEI Collab
```sql
-- Ao criar/atualizar matrícula, vincular class_id ao PEI ativo
TRIGGER trigger_sync_pei_class ON enrollments
  AFTER INSERT OR UPDATE OF class_id, status
  WHEN (NEW.status = 'Matriculado')
```

**O que faz**:
- Quando aluno é matriculado em turma → Atualiza `peis.class_id`
- Vincula `peis.enrollment_id` automaticamente

##### 3.2 **notify_pei_attendance()** 🚨 Alertas de Faltas
```sql
-- Ao registrar falta, verificar se aluno tem PEI e alertar
TRIGGER trigger_pei_attendance_alert ON attendance
  AFTER INSERT
```

**O que faz**:
- Conta faltas do aluno no mês
- Se > 5 faltas → Cria notificação para professor AEE
- Tipo: `attendance_alert`

##### 3.3 **compare_grade_with_pei()** 🎯 Metas vs Notas
```sql
-- Ao lançar nota, comparar com metas do PEI
TRIGGER trigger_compare_grade_pei ON grades
  AFTER INSERT OR UPDATE OF nota_valor
  WHEN (NEW.nota_valor IS NOT NULL)
```

**O que faz**:
- Busca metas do PEI relacionadas à disciplina
- Se `nota < meta` → Cria notificação
- Tipo: `grade_below_goal`

---

#### **PARTE 4: Funções Auxiliares**

##### 4.1 **get_student_academic_context()** 📊
```sql
-- Retorna contexto acadêmico completo do aluno para PEI
RETURNS json {
  turma, nivel,
  frequencia_percentual,
  media_geral,
  disciplinas_abaixo_media,
  faltas_mes_atual,
  em_risco (boolean)
}
```

**Uso no PEI Collab**:
```typescript
const context = await supabase.rpc('get_student_academic_context', {
  _student_id: studentId
});
// Exibir no widget de contexto acadêmico
```

---

## 📊 Estatísticas da Migração

| Item | Quantidade |
|------|------------|
| **Tabelas Expandidas** | 3 (students, profiles, schools) |
| **Novos Campos** | 50+ |
| **Novas Tabelas** | 5 (grade_levels, subjects, enrollments, attendance, grades) |
| **Índices Criados** | 20+ |
| **Triggers** | 3 (integração com PEI) |
| **Funções SQL** | 1 (contexto acadêmico) |
| **RLS Policies** | 10+ |
| **Linhas de SQL** | 450+ |

---

## 🔗 Integrações Planejadas

### Gestão Escolar → PEI Collab

```
┌─────────────────────────┐
│   Gestão Escolar        │
│   (MASTER)              │
└───────────┬─────────────┘
            │
            ├─► students (CREATE/UPDATE)
            │   └─► PEI lê (SELECT)
            │
            ├─► enrollments (CREATE)
            │   └─► Trigger: sync_pei_class()
            │       └─► Atualiza peis.class_id
            │
            ├─► attendance (INSERT falta)
            │   └─► Trigger: notify_pei_attendance()
            │       └─► Notifica professor AEE (>5 faltas)
            │
            └─► grades (INSERT nota)
                └─► Trigger: compare_grade_with_pei()
                    └─► Compara com metas (nota < meta)
```

---

## ⏭️ Próximos Passos

### **Imediato**
1. ⏳ Aplicar migração no Supabase
2. ⏳ Testar triggers de integração
3. ⏳ Validar RLS policies

### **Fase 2** (Próxima Semana)
1. ⏳ Criar package `@pei/shared-types`
2. ⏳ Definir todas as interfaces TypeScript
3. ⏳ Configurar exports do package

### **Fase 3-8** (Seguintes)
- Ver `🏫_GESTAO_ESCOLAR_ROADMAP.md` para roadmap completo

---

## 📚 Documentação Relacionada

- **Roadmap Completo**: `docs/apps/🏫_GESTAO_ESCOLAR_ROADMAP.md`
- **Resumo Apps**: `docs/apps/📊_RESUMO_APPS_MONOREPO.md`
- **Índice Geral**: `docs/resumos/📑_INDICE_DOCUMENTACAO_MONOREPO.md`

---

**Status**: ✅ Fase 1 - Migração SQL Criada (Pronta para aplicar)  
**Próximo**: Aplicar migração e testar

