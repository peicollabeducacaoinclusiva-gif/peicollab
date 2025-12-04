# 📊 Resumo: Ecossistema de Apps do Monorepo

> **Visão Geral**: Sistema integrado de gestão educacional com 6 aplicações especializadas

---

## 🗺️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                         │
│  (PostgreSQL + Row Level Security + Real-time + Storage)    │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  🏫 Gestão     │  │  📚 PEI     │  │  🎓 Plano AEE   │
│   Escolar      │◄─┤  Collab     │◄─┤   (V2.0)        │
│   (MASTER)     │  │  (CORE)     │  │  (ESPECIALIZADO)│
└────────────────┘  └─────────────┘  └─────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  📖 Planejamento│ │  🎨 Atividades│ │  🏠 Landing    │
│   de Aulas      │  │  Educativas   │  │   Page         │
└────────────────┘  └───────────────┘  └─────────────────┘
```

---

## 🔄 Fluxo de Dados

### Hierarquia de Responsabilidade

```
Gestão Escolar (FONTE DA VERDADE)
    ↓ cria/atualiza
    ├─ Alunos (students)
    ├─ Profissionais (profiles)
    ├─ Escolas (schools)
    ├─ Turmas (classes)
    ├─ Matrículas (enrollments)
    ├─ Frequência (attendance)
    └─ Notas (grades)
         ↓ consome (read-only)
         │
PEI Collab
    ↓ cria/gerencia
    ├─ PEIs (peis)
    ├─ Metas (pei_goals)
    ├─ Barreiras (pei_barriers)
    └─ Avaliações (pei_reviews)
         ↓ referencia alunos PEI
         │
Plano AEE V2.0
    ↓ cria/gerencia
    ├─ Planos AEE (plano_aee)
    ├─ Metas SMART (aee_plan_goals)
    ├─ Frequência AEE (aee_attendance_records)
    ├─ Avaliações Diagnósticas (aee_diagnostic_assessments)
    └─ Documentos PDF (templates/)
```

---

## 📱 Apps do Monorepo

### 1. 🏫 **Gestão Escolar** - Sistema Master
**Porta**: 5174  
**Status**: 🟡 Básico (Expansão Planejada)  
**Responsabilidade**: CRUD Master de dados educacionais

**Funcionalidades Atuais**:
- ✅ Login e autenticação
- ✅ Dashboard básico
- ✅ Lista de alunos com busca
- ✅ Lista de profissionais
- ✅ Lista de turmas
- ✅ Lista de disciplinas

**Próximas Funcionalidades** (Ver `🏫_GESTAO_ESCOLAR_ROADMAP.md`):
- ⏳ CRUD completo de alunos (campos expandidos)
- ⏳ Sistema de matrículas
- ⏳ Diário de classe (frequência offline PWA)
- ⏳ Lançamento de notas
- ⏳ Boletim escolar (PDF)
- ⏳ Integração com PEI (alertas, contexto acadêmico)

**Usuários-alvo**:
- Secretaria de Educação (acesso total)
- Diretores (escola específica)
- Coordenadores (leitura de escolas vinculadas)
- Professores (turmas específicas)

---

### 2. 📚 **PEI Collab** - Sistema Core
**Porta**: 5173  
**Status**: 🟢 Completo e Funcional  
**Responsabilidade**: Gestão de Planos Educacionais Individualizados

**Funcionalidades**:
- ✅ CRUD completo de PEIs
- ✅ Versionamento automático
- ✅ Máquina de estados (draft → pending → approved/returned)
- ✅ Colaboração multi-usuário
- ✅ Orientações de especialistas
- ✅ Recursos de acessibilidade
- ✅ Encaminhamentos para profissionais
- ✅ Reuniões e atas
- ✅ Notificações em tempo real
- ✅ Acesso familiar seguro (token temporário)
- ✅ Geração de PDF completo
- ✅ Offline-first (PWA)

**Integração Futura com Gestão Escolar**:
- ⏳ Consumir dados de alunos (read-only)
- ⏳ Exibir contexto acadêmico (frequência, notas)
- ⏳ Receber alertas automáticos (faltas, notas abaixo da meta)
- ⏳ Comparar metas PEI vs desempenho real

**Usuários-alvo**:
- Professores AEE
- Coordenadores
- Professores de turma (leitura)
- Famílias (acesso limitado via token)

---

### 3. 🎓 **Plano AEE** - Atendimento Educacional Especializado
**Porta**: 5176  
**Status**: 🟢 V2.0 Implementado (Fases 1-5)  
**Responsabilidade**: Planos de AEE detalhados (complemento ao PEI)

**Funcionalidades Implementadas** (Ver `✅_FASES_1_2_3_4_5_COMPLETAS.md`):

**Fase 1 - Metas SMART e Atendimentos**:
- ✅ Tabela `aee_plan_goals` (metas SMART com progresso)
- ✅ Tabela `aee_attendance_records` (registro de atendimentos)
- ✅ Componentes `GoalForm` e `GoalsList`
- ✅ Componente `QuickRecord` (registro rápido)
- ✅ Triggers automáticos (estatísticas)

**Fase 2 - Avaliações Diagnósticas**:
- ✅ Tabela `aee_diagnostic_assessments`
- ✅ Formulário multi-step (8 etapas)
- ✅ Anamnese familiar completa

**Fase 3 - Geração de Documentos**:
- ✅ Template HTML (Termo de Compromisso)
- ✅ Serviço `documentGenerator.ts`
- ✅ Geração de PDF com dados dinâmicos

**Fase 4 - Offline First**:
- ✅ IndexedDB com Dexie.js
- ✅ Serviço de sincronização automática
- ✅ Funciona sem internet

**Fase 5 - Analytics**:
- ✅ Dashboard com KPIs
- ✅ Estatísticas de frequência e metas
- ✅ Indicadores de desempenho

**Próximas Funcionalidades** (Fase 6-7):
- ⏳ Sistema de visitas escolares
- ⏳ Encaminhamentos rastreáveis
- ⏳ Notificações inteligentes
- ⏳ App mobile (React Native)

**Usuários-alvo**:
- Professores AEE (criação e gestão)
- Coordenadores (aprovação e acompanhamento)

---

### 4. 📖 **Planejamento de Aulas** - Planos Pedagógicos
**Porta**: 5175  
**Status**: 🟢 Funcional  
**Responsabilidade**: Planejamento de aulas e sequências didáticas

**Funcionalidades**:
- ✅ Dashboard de planejamentos
- ✅ Criar plano de aula
- ✅ Minhas aulas planejadas
- ✅ Calendário de aulas
- ✅ Templates de planos
- ✅ Compartilhamento entre professores

**Usuários-alvo**:
- Professores (todas as disciplinas)
- Coordenadores (supervisão)

---

### 5. 🎨 **Atividades Educativas** - Banco de Atividades
**Porta**: 5177  
**Status**: 🟢 Funcional  
**Responsabilidade**: Repositório de atividades pedagógicas

**Funcionalidades**:
- ✅ Dashboard de atividades
- ✅ Explorar atividades (filtros por série, disciplina)
- ✅ Criar nova atividade
- ✅ Minhas atividades criadas
- ✅ Atividades favoritas
- ✅ Compartilhamento e colaboração

**Usuários-alvo**:
- Professores (criar e usar)
- Coordenadores (curadoria)

---

### 6. 🏠 **Landing Page** - Portal de Entrada
**Porta**: 3000  
**Status**: 🟢 Funcional  
**Responsabilidade**: Página institucional e seleção de tenant

**Funcionalidades**:
- ✅ Home institucional
- ✅ Sobre o sistema
- ✅ Seletor de rede/município
- ✅ Redirect para app correto

**Usuários-alvo**:
- Todos (porta de entrada)

---

## 📦 Packages Compartilhados

### `@pei/ui`
**Status**: 🟢 Ativo  
**Conteúdo**:
- Componentes shadcn/ui
- AppSwitcher (navegação entre apps)

### `@pei/auth`
**Status**: 🟢 Ativo  
**Conteúdo**:
- AuthProvider
- TenantContext
- Hooks: `useAuth`, `useUser`, `useTenantFromDomain`

### `@pei/database`
**Status**: 🟢 Ativo  
**Conteúdo**:
- Cliente Supabase
- RLS helpers
- Funções de acesso

### `@pei/config`
**Status**: 🟢 Ativo  
**Conteúdo**:
- Tailwind config compartilhado
- TypeScript config base

### `@pei/shared-types` ⏳
**Status**: 🔴 Não existe (Planejado)  
**Conteúdo Futuro**:
- Interfaces TypeScript compartilhadas
- Entidades: Student, Staff, Enrollment, Attendance, Grade, etc.

---

## 🔗 Integrações Planejadas

### Gestão Escolar ↔ PEI Collab

**Dados Compartilhados**:
```
Gestão Escolar (Master)
    ↓ fornece
    ├─ Alunos (students) → PEI lê para criar planos
    ├─ Turmas (classes) → PEI exibe contexto
    ├─ Frequência (attendance) → PEI recebe alertas
    └─ Notas (grades) → PEI compara com metas
```

**Triggers Automáticos**:
1. **Matrícula** → Atualiza `class_id` no PEI ativo
2. **Faltas acumuladas** → Notifica professor AEE
3. **Nota abaixo da meta** → Alerta no PEI

**Componentes Integrados**:
- `StudentAcademicContext` (no PEI): Exibe frequência e notas
- `PEIStatsWidget` (na Gestão): Mostra estatísticas de PEIs

---

### PEI Collab ↔ Plano AEE

**Relacionamento**:
- **PEI**: Documento legal obrigatório (Lei 13.146/2015)
- **Plano AEE**: Detalhamento técnico do atendimento especializado

**Fluxo**:
```
1. Aluno matriculado → Gestão Escolar
2. Identificado como PcD → PEI criado (PEI Collab)
3. PEI aprovado → Plano AEE detalhado (Plano AEE)
4. Atendimentos registrados → Plano AEE
5. Avaliações periódicas → Atualizam PEI e Plano AEE
```

**Dados Vinculados**:
- `plano_aee.pei_id` → Referência ao PEI (opcional)
- Aluno é a entidade comum
- Metas podem se referenciar

---

## 🎯 Roadmap Geral

### Curto Prazo (1-2 meses)
- [ ] Expandir Gestão Escolar (matrículas, frequência, notas)
- [ ] Criar package `@pei/shared-types`
- [ ] Implementar integração Gestão ↔ PEI (triggers e widgets)
- [ ] Completar Fase 6 do Plano AEE

### Médio Prazo (3-6 meses)
- [ ] PWA offline para Gestão Escolar (diário de classe)
- [ ] Sistema de relatórios integrados
- [ ] Dashboard gerencial unificado
- [ ] App mobile do Plano AEE (React Native)

### Longo Prazo (6-12 meses)
- [ ] Módulo EJA no Gestão Escolar
- [ ] Sistema de transporte escolar
- [ ] Gestão de merenda
- [ ] Portal do aluno/família
- [ ] Analytics avançado (BI)

---

## 📊 Estado Atual do Monorepo

| App               | Status      | Progresso | Usuários Ativos | Docs                               |
|-------------------|-------------|-----------|-----------------|-------------------------------------|
| PEI Collab        | 🟢 Completo | 100%      | ~500            | 📚_APP_PEI_COLLAB.md               |
| Plano AEE         | 🟢 V2.0     | 71%       | ~50             | 📚_APP_PLANO_AEE.md, ✅_FASES...   |
| Gestão Escolar    | 🟡 Básico   | 20%       | 0 (dev)         | 🏫_GESTAO_ESCOLAR_ROADMAP.md       |
| Planejamento      | 🟢 Funcional| 80%       | ~200            | 📚_APP_PLANEJAMENTO.md             |
| Atividades        | 🟢 Funcional| 80%       | ~200            | 📚_APP_ATIVIDADES.md               |
| Landing           | 🟢 Funcional| 100%      | N/A             | -                                   |

**Total de Apps**: 6  
**Total de Packages**: 4 (+ 1 planejado)  
**Linhas de Código**: ~50.000  
**Migrações SQL**: 15+

---

## 🔐 Segurança Multi-App

### Princípios
1. **Autenticação centralizada** (Supabase Auth + `@pei/auth`)
2. **RLS por app** (policies específicas por contexto)
3. **Tenant isolation** (multi-tenancy obrigatório)
4. **LGPD compliant** (auditoria, consentimento, anonimização)

### Hierarquia de Permissões

```
Secretaria Municipal
    ↓ acesso total
    ├─ Todas as escolas
    ├─ Todos os dados
    └─ Aprovações finais
         ↓
Diretor Escolar
    ↓ acesso à escola
    ├─ Alunos da escola
    ├─ Profissionais da escola
    └─ Gestão local
         ↓
Coordenador Pedagógico
    ↓ supervisão
    ├─ Leitura ampla
    ├─ Aprovações de PEI/Planos
    └─ Relatórios
         ↓
Professor / Professor AEE
    ↓ turmas/alunos específicos
    ├─ Suas turmas
    ├─ PEIs que participa
    └─ Lançamentos (frequência, notas)
         ↓
Família
    ↓ acesso limitado
    ├─ Dados do filho
    └─ Via token temporário
```

---

## 🚀 Como Executar

### Todos os Apps (Desenvolvimento)
```bash
pnpm dev
```

### App Específico
```bash
pnpm dev:pei         # PEI Collab (5173)
pnpm dev:gestao      # Gestão Escolar (5174)
pnpm dev:aee         # Plano AEE (5176)
```

### Build de Produção
```bash
pnpm build
```

---

## 📚 Documentação Relacionada

- [📑 Índice Geral](../resumos/📑_INDICE_DOCUMENTACAO_MONOREPO.md)
- [🏫 Roadmap Gestão Escolar](./🏫_GESTAO_ESCOLAR_ROADMAP.md)
- [📚 App PEI Collab](./📚_APP_PEI_COLLAB.md)
- [📚 App Plano AEE](./📚_APP_PLANO_AEE.md)
- [✅ Fases 1-5 Completas](./✅_FASES_1_2_3_4_5_COMPLETAS.md)
- [🔗 Integração PEI ↔ Plano AEE](../integracao/🔗_INTEGRACAO_PEI_PLANO_AEE.md)

---

**Última Atualização**: 09/11/2025  
**Versão**: 1.0  
**Maintainer**: Equipe PEI Collab

