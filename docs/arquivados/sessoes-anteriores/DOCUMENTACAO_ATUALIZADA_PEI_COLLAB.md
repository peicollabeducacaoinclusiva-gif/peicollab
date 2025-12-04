# Documentação Técnica Completa - PEI Collab V3.0

**Data de Atualização:** 03/11/2024  
**Versão:** 3.0 (Atualizada com sistema de avatars, logos personalizadas, versionamento e responsividade mobile)

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias](#tecnologias)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Modelo de Dados](#modelo-de-dados)
5. [Funcionalidades por Módulo](#funcionalidades-por-módulo)
6. [Roles e Permissões](#roles-e-permissões)
7. [Fluxos de Trabalho](#fluxos-de-trabalho)
8. [Sistema de Versionamento](#sistema-de-versionamento)
9. [Personalização (Avatars e Logos)](#personalização)
10. [Mobile e Responsividade](#mobile-e-responsividade)
11. [Segurança (RLS)](#segurança)

---

## 🎯 Visão Geral

**PEI Collab** é uma plataforma web colaborativa para gestão de Planos Educacionais Individualizados (PEIs) voltada para a educação inclusiva. O sistema permite que redes de ensino, escolas, coordenadores, professores e famílias colaborem na criação, acompanhamento e aprovação de PEIs para alunos com necessidades educacionais especiais.

### Principais Características

- ✅ **Multi-tenant hierárquico** (Rede → Escolas → Alunos)
- ✅ **Versionamento automático** de PEIs com histórico completo
- ✅ **Múltiplos professores** por PEI (primário + complementares)
- ✅ **Sistema de avatars** personalizáveis com emojis
- ✅ **Logos personalizadas** por rede de ensino
- ✅ **Totalmente responsivo** (mobile-first)
- ✅ **Controle de acesso robusto** (RLS)
- ✅ **Notificações em tempo real**
- ✅ **Modo offline** (PWA com IndexedDB)
- ✅ **Impressão de PEIs** em PDF
- ✅ **Gestão de turmas** e atribuição automática de professores

---

## 💻 Tecnologias

### Frontend
- **React 18** + **TypeScript 5**
- **Vite** (build tool)
- **Tailwind CSS** (estilização)
- **shadcn/ui** (componentes)
- **React Router DOM** (navegação)
- **Recharts** (gráficos)
- **date-fns** (manipulação de datas)
- **jsPDF** (geração de PDFs)

### Backend
- **Supabase**
  - PostgreSQL (banco de dados)
  - Auth (autenticação)
  - Storage (armazenamento de logos)
  - Realtime (notificações)

### Offline & PWA
- **Dexie.js** (IndexedDB)
- **vite-plugin-pwa** (PWA)

### Hospedagem
- **Frontend:** Vercel
- **Backend:** Supabase Cloud

---

## 🏗️ Arquitetura do Sistema

### Hierarquia Multi-Tenant

```
┌─────────────────────────────────────────┐
│          Tenant (Rede de Ensino)        │
│  - network_name                         │
│  - logo personalizada (via Storage)     │
└────────────┬────────────────────────────┘
             │
             ├─► School 1 (Escola)
             │   ├─► Students (Alunos)
             │   ├─► Classes (Turmas: 1ºA, 2ºB, etc)
             │   ├─► Class Teachers (Professores por turma)
             │   └─► PEIs (Planos)
             │
             ├─► School 2
             └─► School N
```

### Fluxo de Dados

```
┌──────────┐     ┌──────────┐     ┌───────────────┐     ┌────────────┐
│ Usuário  │────►│  React   │────►│ Supabase Auth │────►│ PostgreSQL │
└──────────┘     │ Frontend │     │   + Client    │     │    (RLS)   │
                 └────┬─────┘     └───────────────┘     └────────────┘
                      │
                      ▼
                 ┌──────────┐
                 │IndexedDB │ (Offline Cache)
                 └──────────┘
```

---

## 🗄️ Modelo de Dados

### Tabelas Principais

#### 1. **tenants** (Redes de Ensino)
```typescript
{
  id: UUID
  network_name: string
  contact_email: string
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

#### 2. **schools** (Escolas)
```typescript
{
  id: UUID
  tenant_id: UUID (FK → tenants)
  school_name: string
  address: string
  inep_code: string
  is_active: boolean
  created_at: timestamp
}
```

#### 3. **profiles** (Usuários)
```typescript
{
  id: UUID (FK → auth.users)
  full_name: string
  phone: string
  school_id: UUID (FK → schools)
  tenant_id: UUID (FK → tenants)
  is_active: boolean
  avatar_emoji: string  // 🆕 Ex: '👨‍🏫', '🎯', '🏛️'
  avatar_color: string  // 🆕 Ex: 'blue', 'purple', 'indigo'
  created_at: timestamp
}
```

#### 4. **user_roles** (Papéis dos Usuários)
```typescript
{
  id: UUID
  user_id: UUID (FK → profiles)
  role: user_role  // enum
}
```

**Roles disponíveis:**
- `superadmin` - Administrador global
- `education_secretary` - Secretário de Educação (gestor da rede)
- `school_director` - Diretor Escolar
- `coordinator` - Coordenador Pedagógico
- `teacher` - Professor
- `aee_teacher` - Professor AEE
- `family` - Familiar
- `specialist` - Especialista

#### 5. **students** (Alunos)
```typescript
{
  id: UUID
  name: string
  date_of_birth: date
  cpf: string
  school_id: UUID (FK → schools)
  responsavel_nome: string
  responsavel_telefone: string
  is_active: boolean
  created_at: timestamp
}
```

#### 6. **student_enrollments** 🆕 (Matrículas)
```typescript
{
  id: UUID
  student_id: UUID (FK → students)
  school_id: UUID (FK → schools)
  academic_year: integer
  grade: string         // Ex: '1º Ano', '5ª Série'
  class_name: string    // Ex: 'A', 'B', 'Matutino'
  shift: string         // 'morning', 'afternoon', 'evening'
  status: string        // 'active', 'transferred', 'graduated'
  start_date: date
  end_date: date
  created_at: timestamp
}
```

#### 7. **peis** (Planos Educacionais Individualizados)
```typescript
{
  id: UUID
  student_id: UUID (FK → students)
  assigned_teacher_id: UUID (FK → profiles)
  created_by: UUID (FK → profiles)
  status: pei_status    // 'draft', 'pending', 'approved', 'returned'
  diagnosis_data: JSONB
  planning_data: JSONB
  evaluation_data: JSONB
  version_number: integer  // 🆕 Controle de versões
  is_active_version: boolean  // 🆕 Apenas 1 ativo por aluno
  created_at: timestamp
  updated_at: timestamp
}
```

**Constraint:** Apenas **1 PEI ativo** por aluno (`unique_active_pei_version` index)

#### 8. **pei_teachers** 🆕 (Múltiplos Professores por PEI)
```typescript
{
  id: UUID
  pei_id: UUID (FK → peis)
  teacher_id: UUID (FK → profiles)
  is_primary: boolean         // Apenas 1 primário por PEI
  subject: string             // Ex: 'Matemática', 'Português'
  can_edit_diagnosis: boolean
  can_edit_planning: boolean
  can_edit_evaluation: boolean
  created_at: timestamp
}
```

#### 9. **class_teachers** 🆕 (Professores por Turma)
```typescript
{
  id: UUID
  school_id: UUID (FK → schools)
  academic_year: integer
  grade: string
  class_name: string
  teacher_id: UUID (FK → profiles)
  subject: string
  is_primary_subject: boolean  // Professor regente
  workload_hours: integer
  created_at: timestamp
}
```

**Funcionalidade:** Quando um PEI é criado, os professores da turma do aluno são **automaticamente atribuídos** ao PEI via trigger.

#### 10. **pei_history** (Histórico de Alterações)
```typescript
{
  id: UUID
  pei_id: UUID (FK → peis)
  version_number: integer
  changed_by: UUID (FK → profiles)
  change_type: string  // 'created', 'updated'
  change_summary: text
  diagnosis_data_snapshot: JSONB
  planning_data_snapshot: JSONB
  evaluation_data_snapshot: JSONB
  status_snapshot: string
  created_at: timestamp
}
```

#### 11. **student_access** (Controle de Acesso Professor-Aluno)
```typescript
{
  id: UUID
  user_id: UUID (FK → profiles)
  student_id: UUID (FK → students)
  created_at: timestamp
}
```

**Constraint:** `UNIQUE (user_id, student_id)`

#### 12. **pei_notifications** (Notificações)
```typescript
{
  id: UUID
  user_id: UUID (FK → profiles)
  pei_id: UUID (FK → peis)
  notification_type: string  // 'pei_created', 'pei_submitted', 'pei_approved', etc
  message: text
  is_read: boolean
  created_at: timestamp
}
```

---

## 🎨 Funcionalidades por Módulo

### 1. **Dashboard Principal** (`/dashboard`)

**Layout do Header:**
```
┌────────────────────────────────────────────────────────┐
│  [Logo Rede] │ [Logo PEI] PEI Collab │ User [🔔][🌙]  │
│               │   Rede • Escola       │     [Sair]     │
└────────────────────────────────────────────────────────┘
```

- **Logo da Rede (esquerda):** Personalizável por Secretário de Educação
- **Logo PEI Collab (centro):** Marca do sistema
- **Ações (direita):** Notificações, Dark Mode, Perfil, Sair

**Dashboards por Role:**
- `teacher` → TeacherDashboard
- `coordinator` → CoordinatorDashboard
- `school_director` → SchoolDirectorDashboard
- `education_secretary` → EducationSecretaryDashboard
- `superadmin` → SuperadminDashboard

### 2. **TeacherDashboard** (`teacher`)

#### Tabs Principais
1. **Visão Geral**
   - Cards: Total PEIs, Meus Alunos, Taxa de Sucesso
   - Conquistas desbloqueadas
   - PEIs pendentes de aprovação

2. **Meus PEIs**
   - Lista de PEIs criados/atribuídos
   - Badges de status: `draft`, `pending`, `approved`, `returned`
   - Ações: Editar, Visualizar, Histórico de Versões, Excluir

3. **Meus Alunos**
   - Grid de cards de alunos atribuídos
   - Status: "PEI Ativo" ou "Sem PEI"
   - Ações: Criar PEI / Editar PEI existente

4. **Estatísticas**
   - Gráficos de progresso de metas
   - Recursos de acessibilidade utilizados
   - Taxa de aprovação

5. **Atividades Recentes**
   - Timeline de criação de PEIs, comentários, mudanças de status

#### Funcionalidades
- ✅ Criar novo PEI (apenas para alunos atribuídos)
- ✅ Editar PEI em modo `draft`
- ✅ Enviar PEI para coordenação (`pending`)
- ✅ Visualizar rapidamente (modal)
- ✅ Imprimir PEI em PDF
- ✅ Ver histórico de versões

**Restrição:** Professor só pode criar PEI para alunos com `student_access` válido.

### 3. **CoordinatorDashboard** (`coordinator`)

#### Tabs Principais
1. **Visão Geral**
   - Fila de validação de PEIs
   - Estatísticas gerais
   - Solicitações pendentes

2. **PEIs**
   - Lista completa de PEIs da escola
   - Filtros: Status, Professor, Período
   - Ações: Aprovar, Retornar, Visualizar, Gerar Token Família

3. **Estatísticas**
   - Dashboards analíticos
   - Gráficos de progresso
   - Exportação de relatórios

4. **Análises**
   - Tendências ao longo do tempo
   - Recursos mais utilizados
   - Metas por categoria

#### Funcionalidades
- ✅ Solicitar PEI (atribui professor + cria PEI draft automaticamente)
- ✅ Aprovar/Retornar PEIs
- ✅ Gerar tokens de acesso para famílias
- ✅ Gerenciar professores por turma (`ClassTeachersSelector`)
- ✅ Ver histórico de versões de PEIs
- ✅ Exportar relatórios (PDF)

**Calendário responsivo:** 1 mês em mobile, 2 em desktop.

### 4. **SchoolDirectorDashboard** (`school_director`)

Similar ao Coordinator, mas com:
- ✅ Visão estratégica da escola
- ✅ Gestão de professores e turmas (`ClassTeachersSelector`)
- ✅ Análises consolidadas
- ✅ Gerenciamento de recursos

### 5. **EducationSecretaryDashboard** (`education_secretary`)

**Escopo:** Toda a rede de ensino

Funcionalidades:
- ✅ Visão executiva de todas as escolas
- ✅ Upload de **logo personalizada** da rede (Storage Supabase)
- ✅ Estatísticas consolidadas por escola
- ✅ Gerenciar professores de turmas em múltiplas escolas (`NetworkClassTeachersSelector`)
- ✅ Exportação de relatórios da rede
- ✅ Análise de desempenho comparativa

---

## 🔐 Roles e Permissões

### Hierarquia de Acesso

```
superadmin
  └─► education_secretary (Rede)
       └─► school_director (Escola)
            └─► coordinator (Escola)
                 └─► teacher (Alunos atribuídos)
                      └─► family (Apenas seu filho)
```

### Matriz de Permissões

| Ação | teacher | coordinator | school_director | education_secretary | superadmin |
|------|---------|-------------|-----------------|---------------------|------------|
| Criar PEI | ✅ (alunos atribuídos) | ✅ | ✅ | ✅ | ✅ |
| Editar PEI (draft) | ✅ (próprios) | ✅ | ✅ | ✅ | ✅ |
| Aprovar PEI | ❌ | ✅ | ✅ | ✅ | ✅ |
| Ver PEI de qualquer aluno | ❌ | ✅ (escola) | ✅ (escola) | ✅ (rede) | ✅ |
| Upload logo rede | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gerenciar turmas | ❌ | ✅ (escola) | ✅ (escola) | ✅ (rede) | ✅ |
| Gerar token família | ❌ | ✅ | ✅ | ✅ | ✅ |

### RLS (Row Level Security)

Todas as tabelas principais possuem **RLS habilitado** com policies baseadas em:

1. **Role do usuário** (`user_roles`)
2. **Tenant/School** (multi-tenant)
3. **student_access** (para professores)
4. **Ownership** (criador do PEI)

Exemplo de policy para `peis`:
```sql
-- Professores veem apenas PEIs de alunos atribuídos
CREATE POLICY "Teachers see assigned student PEIs"
ON peis FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_access sa
    WHERE sa.student_id = peis.student_id
    AND sa.user_id = auth.uid()
  )
);
```

---

## 🔄 Fluxos de Trabalho

### Fluxo 1: Criação de PEI pelo Professor

```
1. Professor acessa "Meus Alunos"
2. Clica em "Criar PEI" (aluno sem PEI ativo)
3. Verifica student_access (RPC: user_can_access_pei)
   └─► Se NÃO: Toast "Aluno não atribuído"
   └─► Se SIM: Redireciona para /pei/new?studentId=xxx
4. Preenche Diagnóstico, Planejamento, Encaminhamentos
5. Pode usar modelo (template)
6. Salva como draft
7. Envia para coordenação (status → pending)
```

**Trigger automático:**
- Ao criar PEI, verifica se aluno já tem PEI ativo
- Se sim: Redireciona para editar o existente
- Se não: Cria novo com `version_number = max + 1` e `is_active_version = true`

### Fluxo 2: Solicitação de PEI pela Coordenação

```
1. Coordenador acessa "Solicitar PEI"
2. Seleciona aluno e professor
3. Sistema:
   a. Verifica se já existe PEI ativo
      └─► Se sim: Reatribui professor
      └─► Se não: Cria novo PEI (draft)
   b. Cria/atualiza student_access
   c. Envia notificação ao professor
4. Professor vê aluno em "Meus Alunos"
5. Edita e envia PEI
```

### Fluxo 3: Aprovação de PEI

```
1. Professor envia PEI (status: pending)
2. Notificação criada para coordenador
3. Coordenador acessa "Fila de Validação"
4. Revisa PEI:
   └─► Aprovar: status → approved
   └─► Retornar: status → returned (com comentários)
5. Se aprovado:
   - Disponibiliza para família (via token)
   - Registra histórico (pei_history)
6. Se retornado:
   - Notificação ao professor
   - Professor corrige e reenvia
```

### Fluxo 4: Versionamento Automático

Quando um PEI aprovado precisa ser atualizado:

```
1. Professor tenta "Criar Novo PEI" para aluno com PEI ativo
2. Sistema detecta PEI ativo existente
3. Redireciona para editar o PEI existente
4. Ao salvar alterações significativas:
   - Marca PEI anterior: is_active_version = false
   - Cria novo PEI: version_number++, is_active_version = true
   - Registra alteração em pei_history
5. Histórico fica acessível via botão "Histórico de Versões"
```

---

## 📦 Sistema de Versionamento

### Tabelas Envolvidas

1. **peis** → Coluna `version_number` e `is_active_version`
2. **pei_history** → Snapshots de todas as versões
3. **Triggers**:
   - `ensure_single_active_pei` - Garante apenas 1 ativo por aluno
   - `save_pei_history_trigger` - Grava histórico automático

### Funcionalidades

#### Ver Histórico
- Botão "Histórico de Versões" ao lado de cada PEI
- Lista todas as versões (ativas e arquivadas)
- Tabs: Ativa | Arquivadas
- Visualizar qualquer versão antiga em modal

#### Criar Nova Versão
```typescript
// Frontend (CreatePEI.tsx)
if (!peiId) {
  // Verifica se aluno já tem PEI ativo
  const { data: existingActivePEI } = await supabase
    .from("peis")
    .select("id, status, version_number")
    .eq("student_id", selectedStudentId)
    .eq("is_active_version", true)
    .maybeSingle();
  
  if (existingActivePEI) {
    // Redireciona para editar
    navigate(`/pei/edit?id=${existingActivePEI.id}`);
    return;
  }
  
  // Busca próximo número de versão
  const { data: versionData } = await supabase
    .from("peis")
    .select("version_number")
    .eq("student_id", selectedStudentId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  const nextVersion = (versionData?.version_number || 0) + 1;
  
  // Cria novo PEI
  await supabase.from("peis").insert([{
    ...peiData,
    version_number: nextVersion,
    is_active_version: true
  }]);
}
```

---

## 🎨 Personalização (Avatars e Logos)

### 1. Sistema de Avatars (Emojis)

**Tabela:** `profiles`
- `avatar_emoji` → Ex: '👨‍🏫', '🎯', '🏛️'
- `avatar_color` → Ex: 'blue', 'purple', 'indigo'

**Componentes:**
- `UserAvatar.tsx` - Renderiza avatar (emoji ou iniciais)
- `EmojiAvatarPicker.tsx` - Seletor de emoji/cor

**Emojis Padrão por Role:**
| Role | Emoji | Cor |
|------|-------|-----|
| teacher | 👨‍🏫 | blue |
| coordinator | 🎯 | purple |
| school_director | 🏛️ | indigo |
| education_secretary | 🎓 | pink |
| aee_teacher | 🧑‍⚕️ | green |
| superadmin | 👨‍⚖️ | red |

**Customização:**
- Usuários podem trocar emoji/cor em `/profile`
- Paleta de 40+ emojis
- 8 opções de cores

### 2. Logos Personalizadas por Rede

**Storage:** Supabase Storage bucket `school-logos`
**Estrutura:** `{tenant_id}/logo.{png|jpg|svg}`

**Componente:** `InstitutionalLogo.tsx`

**Permissão de Upload:**
- `education_secretary` e `superadmin`

**Fluxo de Upload:**
```typescript
// InstitutionalLogo.tsx
const handleFileUpload = async (file) => {
  // 1. Deleta logo anterior (se existir)
  const { data: existingFiles } = await supabase.storage
    .from("school-logos")
    .list(tenantId);
  
  if (existingFiles.length > 0) {
    await supabase.storage
      .from("school-logos")
      .remove(existingFiles.map(f => `${tenantId}/${f.name}`));
  }
  
  // 2. Upload nova logo
  await supabase.storage
    .from("school-logos")
    .upload(`${tenantId}/logo.${ext}`, file, { upsert: true });
  
  // 3. Atualiza URL pública
  const { data } = supabase.storage
    .from("school-logos")
    .getPublicUrl(`${tenantId}/logo.${ext}`);
  
  setLogoUrl(data.publicUrl);
};
```

**Fallback (sem logo):**
- Ícone padrão de prédio/escola em card estilizado

---

## 📱 Mobile e Responsividade

### Breakpoints Tailwind
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Ajustes Implementados

#### 1. **Header Global**
```jsx
// Dashboard.tsx
<header className="sticky top-0 z-10">
  <div className="container px-2 sm:px-4 py-3 sm:py-4">
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {/* Logo Rede (esquerda) */}
      <InstitutionalLogo ... />
      
      {/* Logo PEI Collab (centro) */}
      <div className="flex items-center gap-1 sm:gap-2">
        <img className="h-6 sm:h-8" src="/logo.png" />
        <h1 className="text-base sm:text-xl">PEI Collab</h1>
      </div>
      
      {/* Ações (direita) */}
      <div className="flex gap-1 sm:gap-2">
        <NotificationBell />
        <ThemeToggle />
        <Button size="sm" className="hidden lg:flex">Sair</Button>
      </div>
    </div>
  </div>
</header>
```

#### 2. **Tabs com Scroll Horizontal**
```jsx
// TeacherDashboard.tsx
<div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
  <TabsList className="inline-flex min-w-max lg:grid lg:grid-cols-5">
    <TabsTrigger className="whitespace-nowrap px-3 sm:px-4 text-xs sm:text-sm">
      <BookOpen className="h-4 w-4 mr-1 sm:mr-2" />
      <span className="hidden sm:inline">Visão Geral</span>
      <span className="sm:hidden">Visão</span>
    </TabsTrigger>
    {/* ... */}
  </TabsList>
</div>
```

#### 3. **Calendário Responsivo**
```jsx
// CoordinatorDashboard.tsx
<CalendarComponent
  mode="range"
  numberOfMonths={window.innerWidth < 768 ? 1 : 2}
  selected={dateRange}
  onSelect={setDateRange}
/>

<PopoverContent className="max-w-[95vw]">
  {/* ... */}
</PopoverContent>
```

#### 4. **Botão de Data Compacto**
```jsx
<Button className="w-full sm:w-[240px] text-xs sm:text-sm">
  <CalendarIcon className="h-4 w-4 flex-shrink-0" />
  <span className="truncate">
    {dateRange?.from ? (
      // Mobile: dd/MM - dd/MM/yy
      // Desktop: LLL dd, y - LLL dd, y
      format(dateRange.from, "dd/MM")
    ) : (
      <span className="hidden sm:inline">Selecione</span>
    )}
  </span>
</Button>
```

#### 5. **Cards e Grids**
Todos os grids já possuem breakpoints:
```jsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards responsivos */}
</div>
```

### Testes Recomendados

- [ ] iPhone SE (375px)
- [ ] iPhone 12/13 (390px)
- [ ] Pixel 5 (393px)
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop (1920px)

---

## 🔒 Segurança

### Row Level Security (RLS)

Todas as tabelas principais têm RLS habilitado:

#### Policies Críticas

**1. students**
```sql
-- Professores veem apenas alunos atribuídos
CREATE POLICY "Teachers see assigned students" ON students
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM student_access
    WHERE student_id = students.id
    AND user_id = auth.uid()
  )
  OR has_role('coordinator')
  OR has_role('school_director')
  OR has_role('education_secretary')
);
```

**2. peis**
```sql
-- Coordenadores veem PEIs da escola
CREATE POLICY "Coordinators see school PEIs" ON peis
FOR SELECT USING (
  has_role('coordinator')
  AND EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.school_id = s.school_id
    WHERE s.id = peis.student_id
    AND p.id = auth.uid()
  )
);
```

**3. pei_teachers** 🆕
```sql
-- Apenas coordenadores/diretores podem gerenciar
CREATE POLICY "Manage PEI teachers" ON pei_teachers
FOR ALL USING (
  has_role('coordinator')
  OR has_role('school_director')
  OR has_role('education_secretary')
);
```

### Funções Helper

```sql
-- Verifica se usuário tem role específica
CREATE FUNCTION has_role(required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifica se usuário pode acessar aluno
CREATE FUNCTION user_can_access_pei(p_student_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM student_access
    WHERE user_id = auth.uid()
    AND student_id = p_student_id
  )
  OR has_role('coordinator')
  OR has_role('school_director')
  OR has_role('education_secretary')
  OR has_role('superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Triggers de Segurança

**1. Auto-create student_access**
```sql
CREATE TRIGGER auto_create_student_access_trigger
AFTER INSERT OR UPDATE OF assigned_teacher_id ON peis
FOR EACH ROW
EXECUTE FUNCTION auto_create_student_access();
```

**2. Ensure single active PEI**
```sql
CREATE TRIGGER ensure_single_active_pei_trigger
BEFORE INSERT OR UPDATE OF is_active_version ON peis
FOR EACH ROW
WHEN (NEW.is_active_version = true)
EXECUTE FUNCTION ensure_single_active_pei();
```

---

## 📊 Estrutura de Arquivos

```
pei-collab/
├── src/
│   ├── components/
│   │   ├── coordinator/
│   │   │   ├── RequestPEIDialog.tsx
│   │   │   ├── PEIQueueTable.tsx
│   │   │   ├── ClassTeachersSelector.tsx 🆕
│   │   │   └── ManageClassTeachersDialog.tsx 🆕
│   │   ├── dashboards/
│   │   │   ├── TeacherDashboard.tsx ✅ Mobile
│   │   │   ├── CoordinatorDashboard.tsx ✅ Mobile
│   │   │   ├── SchoolDirectorDashboard.tsx ✅ Mobile
│   │   │   └── EducationSecretaryDashboard.tsx ✅ Mobile
│   │   ├── pei/
│   │   │   ├── StudentIdentificationSection.tsx
│   │   │   ├── DiagnosisSection.tsx
│   │   │   ├── PlanningSection.tsx
│   │   │   ├── ReportView.tsx
│   │   │   └── PEIVersionHistoryDialog.tsx 🆕
│   │   ├── shared/
│   │   │   ├── InstitutionalLogo.tsx 🆕
│   │   │   ├── UserAvatar.tsx 🆕
│   │   │   ├── EmojiAvatarPicker.tsx 🆕
│   │   │   ├── MobileNavigation.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   └── ThemeToggle.tsx
│   │   └── ui/ (shadcn/ui components)
│   ├── pages/
│   │   ├── Dashboard.tsx ✅ Mobile Header
│   │   ├── CreatePEI.tsx ✅ Versionamento
│   │   ├── Profile.tsx ✅ Avatars
│   │   ├── Notifications.tsx
│   │   ├── Students.tsx
│   │   └── Auth.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTenant.ts
│   │   ├── usePermissions.ts
│   │   └── usePEIVersioning.ts 🆕
│   ├── lib/
│   │   ├── supabaseClient.ts
│   │   ├── offlineDatabase.ts
│   │   └── notifications.ts
│   └── integrations/
│       └── supabase/
├── supabase/
│   ├── migrations/
│   │   ├── 20250203000000_fix_pei_history_tracking.sql
│   │   ├── 20250203000001_fix_critical_rls_security.sql
│   │   ├── 20250203000002_auto_create_student_access.sql
│   │   ├── 20250203000003_enforce_single_active_pei.sql 🆕
│   │   ├── 20250203000004_add_student_enrollments_and_multiple_teachers.sql 🆕
│   │   ├── 20250203000005_add_class_teachers_auto_assignment.sql 🆕
│   │   ├── 20250203000006_add_profile_avatars.sql 🆕
│   │   └── 20250203000008_add_phone_to_profiles.sql 🆕
│   └── functions/
├── public/
│   ├── logo.png ✅ Atual
│   └── fotos/
└── docs/
    ├── SISTEMA_VERSIONAMENTO_PEI.md 🆕
    ├── MULTIPLOS_PROFESSORES_PEI.md 🆕
    ├── GUIA_PROFESSORES_TURMA.md 🆕
    └── SISTEMA_AVATARS_EMOJI.md 🆕
```

---

## 🚀 Quick Start (Desenvolvimento Local)

### 1. Pré-requisitos
```bash
Node.js 18+
npm ou bun
Conta Supabase
```

### 2. Instalação
```bash
git clone <repo>
cd pei-collab
npm install
```

### 3. Configuração
```bash
# .env.local
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### 4. Executar Migrações
```sql
-- No Supabase SQL Editor
-- Executar cada arquivo em supabase/migrations/ em ordem
```

### 5. Rodar Aplicação
```bash
npm run dev
# Acesse http://localhost:8080
```

### 6. Build para Produção
```bash
npm run build
npm run preview
```

---

## 📈 Roadmap Futuro

- [ ] Relatórios avançados com BI
- [ ] Integração com plataformas educacionais (Google Classroom, etc)
- [ ] App mobile nativo (React Native)
- [ ] Assinaturas digitais em PEIs
- [ ] Anexo de documentos (laudos médicos)
- [ ] Chat em tempo real (professor ↔ família)
- [ ] Gamificação para alunos
- [ ] Dashboards para especialistas

---

## 📞 Suporte e Contato

**Desenvolvedor:** [Seu Nome]  
**Email:** [Seu Email]  
**Repositório:** [GitHub URL]  
**Documentação Completa:** [Link para Wiki]

---

## 📄 Licença

MIT License - Copyright (c) 2024

---

**Última atualização:** 03 de novembro de 2024  
**Versão do Sistema:** 3.0








