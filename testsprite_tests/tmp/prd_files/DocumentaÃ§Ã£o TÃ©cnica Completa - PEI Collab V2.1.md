# Documentação Técnica Completa - PEI Collab V2.1

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Modelo de Dados](#modelo-de-dados)
4. [Segurança e Controle de Acesso](#segurança-e-controle-de-acesso)
5. [Roles e Permissões](#roles-e-permissões)
6. [Fluxos de Trabalho](#fluxos-de-trabalho)
7. [Guia de Desenvolvimento](#guia-de-desenvolvimento)
8. [Frontend Architecture: Mobile, Offline e PWA](#frontend-architecture-mobile-offline-e-pwa)
9. [Troubleshooting](#troubleshooting)
10. [Relatórios e Analytics](#relatórios-e-analytics)
11. [Deployment e Manutenção](#deployment-e-manutenção)
12. [Convenções de Código](#convenções-de-código)
13. [Segurança - Checklist Completo](#segurança---checklist-completo)
14. [Referências](#referências)
15. [Glossário](#glossário)
16. [Quick Start](#quick-start)
17. [Casos de Uso por Role](#casos-de-uso-por-role)

---

## 🎯 Visão Geral

**PEI Collab** é uma plataforma colaborativa para gestão de Planos Educacionais Individualizados (PEIs), com foco em inclusão educacional e integração entre redes de ensino, escolas, professores, famílias e especialistas.

### Tecnologias
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Banco:** PostgreSQL (RLS habilitado)
- **Autenticação:** Supabase Auth
- **Infraestrutura:** Lovable Cloud (Supabase)
- **Mobile & Offline:** IndexedDB (Dexie.js) + PWA (vite-plugin-pwa)

### Novidades da Versão 2.1
- Integração **Mobile-First** (UX responsiva em todos os módulos)
- Implementação **Offline-First** (cache local e sincronização automática)
- Suporte **PWA** (instalação e uso offline)
- Melhorias no **versionamento de PEIs** com controle automático de versão ativa
- Ajustes em **RLS policies** e triggers duplicadas
- Criação da seção [Frontend Architecture](#frontend-architecture-mobile-offline-e-pwa)

---

## 🏗️ Arquitetura do Sistema

A arquitetura segue o padrão **multi-tenant hierárquico**:

```
Tenant (Rede de Ensino)
  └── Schools (Escolas)
      ├── Students (Alunos)
      ├── PEIs (Planos)
      └── Profiles (Usuários)
```

Fluxo de dados:
```
Usuário → Supabase Auth → Frontend (React) → IndexedDB (Offline Cache) → Supabase Client → PostgreSQL (RLS)
```

---

## 🗄️ Modelo de Dados

### 1. Tipos Enumerados

#### `app_role` / `user_role`
```sql
'superadmin' | 'education_secretary' | 'school_director' | 'coordinator' | 
'aee_teacher' | 'teacher' | 'family' | 'specialist'
```

**Hierarquia de Roles**:
- `superadmin` - Acesso total ao sistema (multi-rede)
- `education_secretary` - Secretário de Educação (Administrador estratégico da rede) 🆕
- `school_director` - Diretor Escolar (Gestor operacional da escola) 🆕
- `coordinator` - Coordenador pedagógico (multi-escola dentro da rede)
- `school_manager` - Gestor de escola individual (DEPRECATED - Use `school_director`)
- `aee_teacher` - Professor de Atendimento Educacional Especializado
- `teacher` - Professor regular
- `specialist` - Especialista (fonoaudiólogo, terapeuta, etc.)
- `family` - Membro da família do aluno

#### `pei_status`
```sql
'draft' | 'pending' | 'returned' | 'approved' | 'obsolete'
```

#### `pei_goal_category`
```sql
'academic' | 'functional'
```

### 2. Estrutura Organizacional

#### **tenants** - Rede de Ensino
```sql
- id (uuid, PK)
- network_name (text, NOT NULL)
- network_address, network_phone, network_email
- network_responsible (text)
- is_active (boolean, default: true)
- created_at, updated_at (timestamptz)
```

#### **schools** - Escolas 🆕
```sql
- id (uuid, PK)
- tenant_id (uuid, FK → tenants)
- school_name (text, NOT NULL)
- school_address, school_phone, school_email
- school_responsible (text)
- is_active (boolean, default: true)
- created_at, updated_at (timestamptz)
```

**Nota**: Esta é a tabela central da V2.0. Todas as entidades principais se ligam aqui.

#### **profiles** - Perfil dos Usuários
```sql
- id (uuid, PK → auth.users)
- full_name (text, NOT NULL)
- school_id (uuid, FK → schools) -- Associação principal (NULL para network_admin)
- tenant_id (uuid, FK → tenants) -- Referência à rede
- role (user_role) -- DEPRECATED: usar user_roles
- is_active (boolean, default: false)
- created_at, updated_at (timestamptz)
```

**Nota**- `education_secretary` tem `school_id = NULL` mas `tenant_id` preenchido, indicando administração no nível da rede.

#### **user_roles** - Múltiplos Papéis
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- role (app_role, NOT NULL)
- created_at (timestamptz)
- UNIQUE(user_id, role)
```

#### **user_schools** - Associação Usuário-Escola 🆕
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- school_id (uuid, FK → schools)
- created_at (timestamptz)
- UNIQUE(user_id, school_id)
```

**Substitui**: `user_tenants` (mantido apenas por compatibilidade)

### 3. Módulo Aluno

#### **students**
```sql
- id (uuid, PK)
- school_id (uuid, FK → schools, NOT NULL)
- tenant_id (uuid, FK → tenants) -- Redundante, via school
- name (text, NOT NULL)
- date_of_birth (date)
- mother_name, father_name (text)
- email, phone (text)
- family_guidance_notes (text)
- created_at, updated_at (timestamptz)
```

#### **student_family**
```sql
- id (uuid, PK)
- student_id (uuid, FK → students)
- family_user_id (uuid, FK → profiles)
- relationship (text)
- created_at (timestamptz)
- UNIQUE(student_id, family_user_id)
```

#### **student_access**
```sql
- id (uuid, PK)
- student_id (uuid, FK → students)
- user_id (uuid, FK → auth.users)
- role (text)
- created_at (timestamptz)
- UNIQUE(student_id, user_id)
```

### 4. Módulo PEI

#### **peis** - Plano Principal
```sql
- id (uuid, PK)
- student_id (uuid, FK → students, NOT NULL)
- school_id (uuid, FK → schools, NOT NULL)
- tenant_id (uuid, FK → tenants) -- Redundante
- created_by (uuid, FK → profiles, NOT NULL)
- assigned_teacher_id (uuid, FK → profiles)
- version_number (integer, NOT NULL, default: 1) -- Versão atual do PEI
- is_active_version (boolean, NOT NULL, default: true) -- Indica se é a versão mais recente e em uso
- status (pei_status, default: 'draft')
- diagnosis_data (jsonb)
- planning_data (jsonb)
- evaluation_data (jsonb)
- family_approved_at (timestamptz)
- family_approved_by (text)
- is_synced (boolean, default: false) -- NOVO na V2.1: Indica sincronização com o cache local
- created_at, updated_at (timestamptz)
```

**Nota sobre Versionamento de PEI (Múltiplas Versões)**:
O sistema suporta múltiplas versões de um PEI para um mesmo aluno. Quando um novo PEI é criado (por exemplo, para uma revisão semestral), a versão anterior aprovada é marcada como `obsolete` e a nova versão é marcada como `is_active_version = true`. A tabela `peis` agora inclui `version_number` e `is_active_version` para gerenciar isso. O status `obsolete` é aplicado automaticamente à versão anterior quando uma nova versão é aprovada.

**Correções de Versionamento de PEIs (V2.1)**
- Substituição da constraint por **índice parcial** garantindo uma única versão ativa por aluno:
  ```sql
  CREATE UNIQUE INDEX unique_active_pei_version
  ON peis(student_id)
  WHERE is_active_version = true;
  ```
- Trigger `create_pei_version` atualizada para incrementar automaticamente `version_number` e marcar versão anterior como `obsolete`.
- Adicionada *view* consolidada `pei_versions_view` para consulta histórica simplificada.

#### **pei_barriers** - Barreiras Identificadas
```sql
- id (uuid, PK)
- pei_id (uuid, FK → peis)
- barrier_type (text) -- Cognitiva, Comportamental, etc.
- description (text)
- severity (text) -- leve, moderada, severa
- created_at (timestamptz)
```

#### **pei_goals** - Metas
```sql
- id (uuid, PK)
- pei_id (uuid, FK → peis)
- barrier_id (uuid, FK → pei_barriers)
- description (text, NOT NULL)
- category (pei_goal_category)
- target_date (date)
- progress_level (text, default: 'não iniciada')
- progress_score (integer, 0-100)
- notes (text)
- created_at, updated_at (timestamptz)
```

#### **pei_teachers** - Professores Associados
```sql
- id (uuid, PK)
- pei_id (uuid, FK → peis)
- teacher_id (uuid, FK → auth.users)
- assigned_at, assigned_by (timestamptz, uuid)
- UNIQUE(pei_id, teacher_id)
```

#### **pei_specialist_orientations** - Orientações de Especialistas
```sql
- id (uuid, PK)
- pei_id (uuid, FK → peis)
- specialist_id (uuid, FK → auth.users)
- orientation_field (text, NOT NULL)
- guidance (text, NOT NULL)
- created_at, updated_at (timestamptz)
```

#### **pei_accessibility_resources** - Recursos de Acessibilidade
```sql
- id (uuid, PK)
- pei_id (uuid, FK → peis)
- resource_type (text) -- Libras, Braille, etc.
- description (text)
- usage_frequency (text)
- created_at (timestamptz)
```

#### **pei_referrals** - Encaminhamentos
```sql
- id (uuid, PK)
- pei_id (uuid, FK → peis)
- referred_to (text, NOT NULL)
- reason (text)
- date (timestamptz)
- follow_up (text)
- created_at (timestamptz)
```

### 5. Auditoria e Colaboração

#### **pei_history** - Versionamento
```sql
- id (uuid, PK)
- pei_id (uuid, FK → peis)
- version_number (integer, NOT NULL)
- changed_by (uuid, NOT NULL)
- changed_at (timestamptz, NOT NULL)
- change_type (text) -- created, status_changed, updated
- change_summary (text)
- diagnosis_data, planning_data, evaluation_data (jsonb)
- status (pei_status) -- 'obsolete' indica que uma nova versão foi criada e esta não é mais a ativa.
- previous_version_id (uuid, FK → peis) -- Referência à versão anterior (NULL para a primeira versão)
- client_context (text) -- NOVO na V2.1: Identifica dispositivo e origem da ação (e.g., 'mobile', 'desktop', 'pwa')
- UNIQUE(pei_id, version_number)
```

#### **pei_reviews** - Avaliações
```sql
- id (uuid, PK)
- pei_id (uuid, FK → peis)
- reviewer_id (uuid, FK → profiles)
- reviewer_role (text) -- teacher, aee, coordinator, etc.
- review_date (timestamptz)
- notes (text)
- next_review_date (date)
- evaluation_data (jsonb)
- created_at (timestamptz)
```

#### **pei_comments** - Comentários
```sql
- id (uuid, PK)
- pei_id (uuid, FK → peis)
- student_id (uuid, FK → students)
- user_id (uuid, FK → profiles)
- content (text, NOT NULL)
- created_at (timestamptz)
```

### 6. Reuniões

#### **pei_meetings**
```sql
- id (uuid, PK)
- pei_id (uuid, FK → peis)
- title (text, NOT NULL)
- description (text)
- scheduled_for (timestamptz, NOT NULL)
- location_or_link (text)
- created_by (uuid, FK → auth.users)
- created_at (timestamptz)
```

#### **pei_meeting_participants**
```sql
- id (uuid, PK)
- meeting_id (uuid, FK → pei_meetings)
- user_id (uuid, FK → auth.users)
- status (text, default: 'invited')
- UNIQUE(meeting_id, user_id)
```

### 7. Notificações

#### **pei_notifications**
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- pei_id (uuid, FK → peis)
- notification_type (text, NOT NULL)
- is_read (boolean, default: false)
- created_at (timestamptz)
- read_at (timestamptz)
```

### 8. Acesso Família (Tokens)

#### **family_access_tokens**
```sql
- id (uuid, PK)
- student_id (uuid, FK → students)
- pei_id (uuid, FK → peis)
- token_hash (text, UNIQUE, NOT NULL)
- expires_at (timestamptz, default: now() + 7 days)
- used (boolean, default: false)
- created_by (uuid, FK → auth.users)
- created_at (timestamptz)
- last_accessed_at (timestamptz)
- access_count (integer, default: 0)
```

#### **pei_family_tokens** (DEPRECATED)
Mantido por compatibilidade. Use `family_access_tokens`.

#### **pei_access_logs**
```sql
- id (uuid, PK)
- pei_id (uuid, FK → peis)
- token_used (text, NOT NULL)
- ip_address, user_agent (text)
- verified (boolean, default: false)
- accessed_at (timestamptz)
```

#### **pei_access_attempts**
```sql
- id (uuid, PK)
- ip_address (text, NOT NULL)
- attempted_at (timestamptz)
- success (boolean, default: false)
- created_at (timestamptz)
```

---

## 🔒 Segurança e Controle de Acesso

- Todas as tabelas com **Row Level Security (RLS)**.
- Políticas refatoradas para uso de funções estáveis (`get_user_tenant_safe`).
- Revisão da hierarquia de papéis e escopo de acesso.

### Funções Essenciais V2.1

#### Identificação de Contexto

```sql
-- Obtém school_id principal do usuário
get_user_school_id(_user_id uuid) → uuid

-- Obtém tenant_id da escola
get_school_tenant_id(_school_id uuid) → uuid

-- Obtém tenant_id do usuário (compatibilidade e network_admin)
get_user_tenant_safe(_user_id uuid) → uuid

-- Verifica se usuário é network_admin de uma rede específica 🆕
is_network_admin(_user_id uuid, _tenant_id uuid) → boolean
```

#### Validação de Acesso

```sql
-- Verifica se usuário tem papel específico
has_role(_user_id uuid, _role app_role) → boolean

-- Obtém papel principal do usuário
get_user_primary_role(_user_id uuid) → app_role

-- Verifica acesso à escola
user_has_school_access(_user_id uuid, _school_id uuid) → boolean

-- Verifica acesso ao PEI
user_can_access_pei(_user_id uuid, _pei_id uuid) → boolean

-- Verifica acesso ao aluno
can_view_student(_user_id uuid, _student_id uuid) → boolean

-- Verifica se usuário pode gerenciar a rede 🆕
can_manage_network(_user_id uuid, _tenant_id uuid) → boolean
```

#### Lógica de `user_can_access_pei`

Retorna `TRUE` se:
- Usuário é **superadmin**
- Usuário é **network_admin** da rede do PEI
- Usuário está em `pei_teachers` para este PEI
- Usuário está em `pei_specialist_orientations` para este PEI
- Usuário é o criador (`created_by`)
- Usuário é **coordinator**, **school_manager** ou **aee_teacher** da mesma escola

#### Lógica de `can_manage_network`

```sql
CREATE OR REPLACE FUNCTION public.can_manage_network(_user_id uuid, _tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public
AS $
  SELECT EXISTS (SELECT 1 WHERE has_role(_user_id, 'superadmin'::app_role))
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
      AND tenant_id = _tenant_id 
      AND has_role(_user_id, 'network_admin'::app_role)
  );
$;
```

Retorna `TRUE` se:
- Usuário é **superadmin** (acesso a todas as redes)
- Usuário é **network_admin** da rede específica

#### Tokens de Família

- Família acessa PEIs via tokens temporários com controle de expiração e hash seguro.
- Tokens familiares com expiração renovada após uso (7 dias).

```sql
-- Gera hash seguro do token
hash_token(token_value text) → text

-- Valida token de acesso familiar
validate_family_token(token_value text) → json

-- Verifica acesso via token
user_can_access_pei_via_token(token_value text, _pei_id uuid) → boolean
```

---

## 👥 Roles e Permissões

Hierarquia atualizada:
```
Superadmin → Network Admin → Coordinator → School Manager → AEE Teacher → Teacher → Specialist → Family
```

- Adicionado **Network Admin** como administrador da rede (equivalente ao `education_secretary` com escopo de administração).

| Role | Escopo de Acesso | Permissões Chave |
|---|---|---|
| **superadmin** | Multi-Rede | Acesso total, gestão de todas as redes. |
| **education_secretary** | Rede (Tenant) | Administração estratégica da Rede. |
| **school_director** | Escola (School) | Gestão operacional da Escola. |
| **coordinator** | Multi-Escola (dentro da Rede) | Visão ampla, coordenação pedagógica. |
| **aee_teacher** | Escola/PEI | Criação e edição de PEIs. |
| **teacher** | Escola/PEI | Colaboração em PEIs, visualização de alunos. |
| **specialist** | Escola/PEI | Inserção de orientações especializadas. |
| **family** | PEI específico | Visualização e aprovação do PEI via token. |

---

## 🔄 Fluxos de Trabalho

Fluxos otimizados:
- Criação e aprovação de PEI com versão automática.
- Geração e uso de tokens familiares.
- Sincronização automática de acessos (`student_access`, `pei_teachers`).

---

## 💻 Guia de Desenvolvimento

- Todas as migrações devem ser versionadas em `/supabase/migrations`.
- Evitar queries diretas sem RLS.
- Adicionar testes unitários de triggers e policies no Supabase.
- Scripts comuns e exemplos SQL permanecem conforme versão 2.0, com ajustes de versionamento automático.

---

## 🛰️ Frontend Architecture: Mobile, Offline e PWA

### 1. Estrutura do Frontend
```
src/
 ├── components/
 ├── pages/
 ├── hooks/
 │   ├── useAuth.ts
 │   ├── useTenant.ts
 │   ├── useOfflineCache.ts
 ├── db/
 │   └── indexedDB.ts
 ├── service-worker.js
 └── main.tsx
```

### 2. Mobile-First
- Layouts responsivos com **Tailwind** (`sm:`, `md:`, `lg:`).
- Substituição de menus fixos por `Sheet` (drawer mobile).
- Divisão de formulários de PEI em abas responsivas (Diagnóstico, Planejamento, Avaliação).
- Testes automatizados com viewport `375x812` (iPhone X).

### 3. Offline-First
- Implementação com **Dexie.js** (IndexedDB):
  ```ts
  import Dexie from 'dexie';
  export const db = new Dexie('pei_collab');
  db.version(1).stores({
    students: 'id, name, school_id',
    peis: 'id, student_id, version_number, is_active_version, status',
  });
  ```
- Cache de dados: `students`, `peis`, `pei_goals`, `pei_barriers`.
- Evento de sincronização:
  ```ts
  window.addEventListener('online', syncOfflineData);
  ```
- Status de sincronização (`is_synced`) visível no UI.

### 4. PWA (Progressive Web App)
- Plugin configurado: `vite-plugin-pwa`
  ```ts
  import { VitePWA } from 'vite-plugin-pwa';
  export default {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'PEI Collab',
          short_name: 'PEICollab',
          theme_color: '#2563eb',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
          ],
        },
        workbox: {
          runtimeCaching: [
            { urlPattern: /https:\/\/.*supabase\.co\//, handler: 'NetworkFirst' },
            { urlPattern: /\.(?:png|jpg|svg)$/, handler: 'CacheFirst' },
          ],
        },
      })
    ],
  };
  ```
- Modo offline total com `offline.html` fallback.
- Botão “Instalar PEI Collab” com `beforeinstallprompt`.

### 5. Integração das Três Abordagens
| Camada | Mobile-First | Offline-First | PWA |
|---------|---------------|----------------|-----|
| **UI** | Layout responsivo | Indicador de conexão | Instalação no dispositivo |
| **Dados** | Carregamento sob demanda | Cache IndexedDB | Atualização automática |
| **UX** | Navegação simplificada | Sincronização automática | Fallback offline |

---

## 🔧 Troubleshooting

Inclui novos checklists:
- Falhas de sincronização offline (verificar IndexedDB e status `is_synced`)
- Erros no registro do Service Worker
- Validação de cache local após reconexão
- **Problemas de RLS**: Verificar se as funções `get_user_school_id` e `get_user_tenant_safe` estão retornando valores corretos e se as policies estão usando `USING` e `WITH CHECK` adequadamente.

---

## 📊 Relatórios e Analytics

Mantém queries da versão 2.0, com novos indicadores:
- **PEIs em modo offline** (não sincronizados)
- **Acessos via PWA** (registrados por `user_agent` no `pei_access_logs`)
- **Uso mobile vs desktop** (campo `client_context` em `pei_history`)

---

## 🚀 Deployment e Manutenção

Checklist atualizado:
- [x] PWA testado com Lighthouse (>90%)
- [x] IndexedDB habilitado e sincronização validada
- [x] Service Worker registrado e ativo
- [x] RLS validado em todas as tabelas
- [x] Triggers de versionamento testadas (`create_pei_version`)

---

## 🔖 Convenções de Código

Mantém o mesmo padrão SQL e TypeScript da versão anterior.
Novos nomes reservados:
- `is_synced`: indica se o registro local foi sincronizado.
- `client_context`: identifica dispositivo e origem da ação.

---

## 🔐 Segurança - Checklist Completo

Adicionado:
- Proteção de cache local (limpeza segura no logout)
- Verificação de Service Worker comprometido (update automatizado)
- Tokens familiares com expiração renovada após uso (7 dias)
- **RLS Policies**: Revisão completa das políticas para garantir que a nova hierarquia de roles (`education_secretary`, `school_director`) seja respeitada.

---

## 📙 Referências

- [Supabase Docs](https://supabase.com/docs)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Dexie.js Docs](https://dexie.org/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 📚 Glossário

| Termo | Significado |
|--------|--------------|
| **PWA** | Progressive Web App |
| **IndexedDB** | Banco de dados local do navegador |
| **Dexie.js** | Wrapper para IndexedDB |
| **Offline-First** | Aplicativo funcional sem conexão |
| **Mobile-First** | Design otimizado para dispositivos móveis |
| **Service Worker** | Script que gerencia cache e conexões |
| **RLS** | Row Level Security (Segurança em Nível de Linha) |

---

## 🔄 Quick Start

```bash
# Clonar repositório
npm install
# Configurar Supabase
cp .env.example .env
# Executar migrações
supabase db push
# Iniciar servidor de desenvolvimento
npm run dev
```

---

## 🎯 Casos de Uso por Role

Igual à versão 2.0, com suporte adicional a uso **offline** para professores e **instalação PWA** para famílias e coordenadores.

---

**Versão do Schema:** 2.1  
**Data da Atualização:** 2025-10-24  
**Compatibilidade:** PostgreSQL 14+, Supabase, React 18+, Vite 5+

