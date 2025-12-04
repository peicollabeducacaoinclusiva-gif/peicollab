# 🏗️ Arquitetura do Sistema

Visão geral da arquitetura do PEI Collab V3.

---

## 📐 Visão Geral

O **PEI Collab V3** é um **monorepo** com **3 aplicações integradas** que compartilham o mesmo banco de dados:

```
pei-collab/ (monorepo root)
├── apps/
│   ├── gestao-escolar/    → Cadastros (alunos, profissionais, turmas)
│   ├── plano-aee/          → Planos de AEE (anexo do PEI)
│   └── pei-collab/         → PEI + Reuniões + Avaliações + PA
│
├── packages/
│   ├── ui/                 → Componentes compartilhados (shadcn/ui)
│   ├── database/           → Cliente Supabase
│   ├── auth/               → Autenticação e permissões
│   ├── config/             → Configurações compartilhadas
│   ├── dashboards/         → Componentes de dashboard
│   └── shared-types/       → Tipos TypeScript compartilhados
│
├── supabase/
│   ├── migrations/         → Migrações SQL
│   └── functions/          → Edge Functions (futuro)
│
└── docs/                   → Documentação
```

---

## 🌐 Integração entre Apps

### Fluxo de Dados

```
┌─────────────────────────────────────────┐
│  Gestão Escolar (Fonte de Dados)       │
│  http://localhost:5174                  │
│  - Cadastro de Alunos                   │
│  - Cadastro de Profissionais            │
│  - Gestão de Turmas                     │
│  - Disciplinas                          │
└──────────────┬──────────────────────────┘
               │ (Banco Compartilhado)
               ↓
┌──────────────┴──────────────────────────┐
│  PEI Collab (App Principal)             │
│  http://localhost:8080                  │
│  - Criação de PEIs                      │
│  - Dashboard PA                         │
│  - Sistema de Reuniões                  │
│  - Avaliações Cíclicas                  │
└──────────────┬──────────────────────────┘
               │ (Vinculação via pei_id)
               ↓
┌──────────────┴──────────────────────────┐
│  Plano de AEE (Anexo do PEI)            │
│  http://localhost:5175                  │
│  - Planos de AEE                        │
│  - Ferramentas Diagnósticas             │
│  - Sistema de Comentários               │
│  - Anexo no PDF do PEI                  │
└─────────────────────────────────────────┘
```

### Banco de Dados Compartilhado

Todos os apps usam o **mesmo banco Supabase**:
- **Tabelas compartilhadas**: `students`, `profiles`, `schools`, `peis`, etc.
- **RLS (Row Level Security)**: Garante que cada usuário só vê seus dados
- **Autenticação unificada**: Login funciona em todos os apps

---

## 📦 Packages Compartilhados

### `packages/ui`

Componentes React reutilizáveis baseados em **shadcn/ui**:
- Botões, inputs, dialogs, etc.
- Tema claro/escuro
- Acessibilidade (a11y)

### `packages/database`

Cliente Supabase configurado:
- Tipos TypeScript gerados
- Helpers para queries comuns
- Funções RPC (ex: `user_can_access_pei`)

### `packages/auth`

Autenticação e permissões:
- Hooks React (`useAuth`, `useUser`)
- Verificação de roles
- Redirecionamento baseado em permissões

### `packages/shared-types`

Tipos TypeScript compartilhados:
- Interfaces de dados
- Enums (roles, status, etc.)
- Tipos de formulários

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

| Tabela | Descrição | App Principal |
|--------|-----------|---------------|
| `tenants` | Redes de ensino | Gestão Escolar |
| `schools` | Escolas | Gestão Escolar |
| `profiles` | Perfis de usuários | Todos |
| `students` | Alunos | Gestão Escolar |
| `peis` | Planos Educacionais | PEI Collab |
| `plano_aee` | Planos de AEE | Plano AEE |
| `meetings` | Reuniões | PEI Collab |
| `evaluations` | Avaliações | PEI Collab |

### Relacionamentos

```
tenants (1) ──< (N) schools
schools (1) ──< (N) students
students (1) ──< (N) peis
peis (1) ──< (1) plano_aee
peis (1) ──< (N) meetings
peis (1) ──< (N) evaluations
```

**Documentação completa**: [`../05_BANCO_DADOS.md`](./05_BANCO_DADOS.md)

---

## 🔐 Segurança (RLS)

**Row Level Security (RLS)** é aplicado em todas as tabelas sensíveis:

- Usuários só veem dados da sua rede/escola
- Superadmins têm acesso total
- Professores só veem seus alunos
- Famílias só veem seus filhos

**Documentação completa**: [`../06_AUTENTICACAO_SEGURANCA.md`](./06_AUTENTICACAO_SEGURANCA.md)

---

## 🎨 Stack Tecnológica

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (estilização)
- **shadcn/ui** (componentes)
- **Recharts** (gráficos)
- **jsPDF** (geração de PDFs)

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **Edge Functions** (futuro)

### Monorepo
- **Turborepo** (orquestração)
- **pnpm** (gerenciador de pacotes)

---

## 📁 Estrutura de Pastas por App

### Estrutura Típica

```
app/
├── src/
│   ├── components/     → Componentes React
│   ├── pages/         → Páginas/rotas
│   ├── hooks/         → Custom hooks
│   ├── services/       → Serviços (API calls)
│   ├── lib/           → Utilitários
│   └── types/         → Tipos TypeScript
├── public/            → Arquivos estáticos
├── package.json
└── vite.config.ts
```

---

## 🔄 Fluxo de Desenvolvimento

1. **Criar feature branch**: `git checkout -b feature/nova-funcionalidade`
2. **Desenvolver**: Fazer mudanças no código
3. **Testar localmente**: `pnpm dev`
4. **Commit**: Seguir padrões de commit (ver [Guia de Contribuição](./03_GUIA_CONTRIBUICAO.md))
5. **Push e PR**: Criar Pull Request

---

## 📚 Documentação Relacionada

- **[Configuração do Ambiente](./01_CONFIGURACAO_AMBIENTE.md)**
- **[Banco de Dados](./05_BANCO_DADOS.md)**
- **[Autenticação e Segurança](./06_AUTENTICACAO_SEGURANCA.md)**
- **[Guia Completo](../guias/📚_GUIA_COMPLETO_MONOREPO_V3.md)**

---

**Última atualização**: Janeiro 2025

