# 🎓 PEI Collab Monorepo V3.0

**Sistema Monorepo para Educação Inclusiva com Múltiplas Aplicações**

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/peicollabeducacaoinclusiva-gif/peicollab)
[![Turborepo](https://img.shields.io/badge/turborepo-1.13-yellow.svg)](https://turbo.build/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura do Monorepo](#estrutura-do-monorepo)
- [Apps Disponíveis](#apps-disponíveis)
- [Packages Compartilhados](#packages-compartilhados)
- [Setup Inicial](#setup-inicial)
- [Comandos Disponíveis](#comandos-disponíveis)
- [Novas Funcionalidades V3.0](#novas-funcionalidades-v30)

## 🎯 Visão Geral

O PEI Collab V3.0 evoluiu para uma arquitetura de monorepo usando Turborepo, permitindo múltiplas aplicações compartilharem código, componentes UI e lógica de negócio de forma eficiente.

### Principais Benefícios do Monorepo

- ✅ **Código Compartilhado**: Componentes UI, lógica de autenticação e banco de dados reutilizáveis
- ✅ **Builds Paralelos**: Turborepo compila todos os apps simultaneamente
- ✅ **Type Safety**: TypeScript compartilhado entre todos os apps
- ✅ **Design Consistente**: Sistema de design único através do `@pei/ui`
- ✅ **Deploy Independente**: Cada app pode ser deployado separadamente

## 🏗️ Estrutura do Monorepo

```
pei-collab/
├── apps/
│   ├── pei-collab/          # App principal de PEIs
│   ├── gestao-escolar/      # Sistema de matrícula e cadastro
│   ├── plano-aee/           # Planos de AEE
│   └── blog/                # Blog institucional
├── packages/
│   ├── ui/                  # Componentes UI compartilhados (shadcn/ui)
│   ├── database/            # Cliente Supabase e tipos
│   ├── auth/                # Sistema de autenticação
│   └── config/              # Configurações compartilhadas
├── supabase/
│   └── migrations/          # Migrações SQL centralizadas
├── turbo.json               # Configuração do Turborepo
├── pnpm-workspace.yaml      # Workspaces do pnpm
└── package.json             # Dependências raiz
```

## 🚀 Apps Disponíveis

### 1. PEI Collab (Principal)
**Path**: `apps/pei-collab`  
**Porta**: `5173`  
**Descrição**: Sistema principal para criação e gestão de Planos Educacionais Individualizados

**Funcionalidades V3.0**:
- ✅ Dashboard do Profissional de Apoio
- ✅ Feedbacks diários (Socialização, Autonomia, Comportamento)
- ✅ Sistema de Reuniões com pauta e ata estruturada
- ✅ Avaliação de PEI por ciclos acadêmicos
- ✅ Todos os recursos anteriores mantidos

### 2. Gestão Escolar
**Path**: `apps/gestao-escolar`  
**Porta**: `5174`  
**Descrição**: Sistema centralizado de matrícula e cadastro de alunos

**Funcionalidades**:
- CRUD completo de alunos
- Vinculação aluno ↔ escola ↔ turma
- Dados de responsáveis e documentação
- API para integração com outros apps

### 3. Plano de AEE
**Path**: `apps/plano-aee`  
**Porta**: `5175`  
**Descrição**: Planos de Atendimento Educacional Especializado (Anexo do PEI)

**Funcionalidades**:
- Diagnósticos por tipo de deficiência
- Anamnese completa
- Barreiras de aprendizagem
- Recursos e adaptações
- Avaliações por ciclo (I, II, III)
- Sistema de comentários colaborativo
- **Permissões**: Apenas professores de AEE podem criar/editar

### 4. Mini Blog
**Path**: `apps/blog`  
**Porta**: `5176`  
**Descrição**: Blog institucional para comunicação

**Funcionalidades**:
- Editor de texto rico
- Categorização de posts
- Posts por escola ou rede
- Sistema de comentários moderados
- Métricas de visualização

## 📦 Packages Compartilhados

### @pei/ui
Biblioteca de componentes UI baseada em shadcn/ui e Radix UI.

```typescript
import { Button, Card, Input } from '@pei/ui';
```

**Componentes Disponíveis**:
- Todos os componentes shadcn/ui
- Componentes customizados do PEI Collab
- Hooks compartilhados

### @pei/database
Cliente Supabase configurado e tipos TypeScript.

```typescript
import { supabase } from '@pei/database/client';
import type { Database } from '@pei/database/types';
```

**Inclui**:
- Cliente Supabase autenticado
- Tipos TypeScript gerados do banco
- Helpers para RLS policies
- Funções RPC tipadas

### @pei/auth
Sistema de autenticação centralizado.

```typescript
import { useAuth, AuthProvider } from '@pei/auth';

const { user, signIn, signOut, hasRole } = useAuth();
```

**Recursos**:
- Context API para autenticação
- Hooks personalizados
- Verificação de roles
- Gerenciamento de sessão

### @pei/config
Configurações compartilhadas.

**Inclui**:
- ESLint config
- TypeScript config
- Tailwind config
- Prettier config

## 🛠️ Setup Inicial

### Pré-requisitos

- Node.js 18+
- pnpm 8+ (recomendado)
- Supabase CLI

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/peicollabeducacaoinclusiva-gif/peicollab.git
cd pei-collab

# 2. Instale o pnpm (se não tiver)
npm install -g pnpm

# 3. Instale todas as dependências
pnpm install

# 4. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# 5. Execute as migrações do banco
pnpm db:migrate

# 6. Inicie todos os apps em modo dev
pnpm dev
```

## 📜 Comandos Disponíveis

### Desenvolvimento

```bash
# Iniciar todos os apps
pnpm dev

# Iniciar um app específico
pnpm dev --filter=pei-collab
pnpm dev --filter=gestao-escolar
pnpm dev --filter=plano-aee
pnpm dev --filter=blog

# Build de todos os apps
pnpm build

# Build de um app específico
pnpm build --filter=pei-collab
```

### Banco de Dados

```bash
# Aplicar migrações
pnpm db:migrate

# Resetar banco (CUIDADO!)
pnpm db:reset

# Fazer push de mudanças
pnpm db:push
```

### Qualidade de Código

```bash
# Linting de todos os projetos
pnpm lint

# Type checking
pnpm type-check

# Formatação
pnpm format

# Testes
pnpm test
```

### Limpeza

```bash
# Limpar builds
pnpm clean

# Limpar node_modules e reinstalar
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

## 🆕 Novas Funcionalidades V3.0

### 1. Profissional de Apoio

**Novo Role**: `support_professional`

**Dashboard Completo**:
- Lista de alunos atribuídos
- Registro de feedback diário:
  - 📊 Socialização (1-5)
  - 📊 Autonomia (1-5)
  - 📊 Comportamento (1-5)
  - 💬 Comentários opcionais
- Histórico de feedbacks com gráficos
- Visualização do PEI dos alunos

**Gestão**:
- Diretores atribuem PAs aos alunos
- Um feedback por aluno por dia
- Professores visualizam feedbacks

### 2. Sistema de Reuniões

**Tipos de Reuniões**:
- Inicial
- Acompanhamento
- Final
- Extraordinária

**Funcionalidades**:
- ✅ Criação pela coordenação
- ✅ Seleção de professores e PEIs
- ✅ Pauta estruturada (tópicos editáveis)
- ✅ Ata com checkboxes por tópico
- ✅ Lista de presença com assinatura digital
- ✅ Notificações aos participantes
- ✅ Histórico completo

### 3. Avaliação de PEI por Ciclos

**Ciclos Acadêmicos**:
- I Ciclo
- II Ciclo
- III Ciclo

**Recursos**:
- ✅ Agendamento automático por configuração
- ✅ Avaliação individual de cada meta
- ✅ Status: Alcançada / Parcialmente / Não Alcançada
- ✅ Modificações necessárias
- ✅ Próximos passos
- ✅ Revisão do coordenador
- ✅ Gráficos de progresso

### 4. Plano de AEE (App Separado)

**Seções do Plano**:
1. Ferramentas de diagnóstico por deficiência
2. Anamnese completa
3. Identificação de barreiras
4. Queixas (escola e família)
5. Recursos disponíveis
6. Adaptações necessárias
7. Objetivos de ensino
8. Metodologia de avaliação
9. Acompanhamentos
10. Encaminhamentos
11. Orientações (família, escola, outros)
12. Avaliações por ciclo (I, II, III)

**Colaboração**:
- Sistema de comentários
- Apenas visualização para não-AEE
- Anexos e documentos

## 🔐 Roles e Permissões

| Role | PEI Collab | Gestão Escolar | Plano AEE | Blog |
|------|------------|----------------|-----------|------|
| **superadmin** | ✅ Tudo | ✅ Tudo | ✅ Tudo | ✅ Tudo |
| **coordinator** | ✅ Gestão completa | ✅ Leitura | 👁️ Visualização | ✅ Gerenciar |
| **school_manager** | ✅ Sua escola | ✅ Sua escola | 👁️ Visualização | ✅ Sua escola |
| **aee_teacher** | ✅ Seus PEIs | 👁️ Leitura | ✅ CRUD | 💬 Comentar |
| **teacher** | ✅ Seus PEIs | 👁️ Leitura | 💬 Comentar | 💬 Comentar |
| **support_professional** | 👁️ Visualização | 👁️ Leitura | 👁️ Visualização | 👁️ Leitura |
| **family** | 👁️ Seu aluno | ❌ Sem acesso | 👁️ Visualização | 👁️ Leitura |
| **specialist** | 👁️ Consulta | 👁️ Leitura | 💬 Comentar | 👁️ Leitura |

## 🚀 Deploy

### Deploy Independente por App

Cada app pode ser deployado separadamente na Vercel:

```bash
# Build e deploy do PEI Collab
cd apps/pei-collab
vercel

# Build e deploy do Gestão Escolar
cd apps/gestao-escolar
vercel
```

### Variáveis de Ambiente

Todas as variáveis necessárias no arquivo `.env.local`:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# App URLs
VITE_PEI_COLLAB_URL=https://pei.seudominio.com
VITE_GESTAO_ESCOLAR_URL=https://gestao.seudominio.com
VITE_PLANO_AEE_URL=https://aee.seudominio.com
VITE_BLOG_URL=https://blog.seudominio.com
```

## 📚 Documentação

- [Guia de Contribuição](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
- [API Documentation](docs/api.md)
- [Arquitetura](docs/architecture.md)

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia o [guia de contribuição](CONTRIBUTING.md).

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- Supabase pela plataforma backend
- Vercel pela hospedagem
- Turborepo pela arquitetura monorepo
- shadcn/ui pelos componentes

---

**🎉 PEI Collab V3.0 - Transformando a educação especial com tecnologia!**






