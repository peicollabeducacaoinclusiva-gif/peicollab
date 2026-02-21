# 🚀 Guia Completo: PEI Collab no Cursor com Next.js + Supabase

> Guia de vibe coding para intermediários. Siga a ordem das sprints.
> **v2 — Schema corrigido e complementado com RBAC detalhado, versionamento e vínculo família↔aluno.**

---

## 📌 RESUMO DAS MUDANÇAS v2

| Ponto | O que foi corrigido/adicionado |
|---|---|
| `family_students` | Tabela nova — vínculo família↔aluno (gap crítico resolvido) |
| `documents` | +5 campos: `versao_pai_id`, `is_versao_atual`, `aprovado_em`, `aprovado_por`, `template_versao` |
| Trigger versionamento | `enforce_single_current_version` — garante 1 versão atual por tipo |
| Função SQL | `create_document_version()` — lógica transacional completa |
| RLS completo | Políticas granulares por role para todas as tabelas |
| Funções helper RLS | `get_my_network_id()`, `get_my_school_id()`, `get_my_role()` |
| Máquina de estados | Seção 2.8 com todas as transições válidas documentadas |
| Views analytics | Seção 2.9 com 3 views materializadas + função refresh |
| RBAC | Prompt 3 atualizado com matriz detalhada de permissões |
| Histórico de versões | Prompt 8 novo — DocumentVersionHistory |
| Quem versiona | Alinhado: autor original + gestores (inconsistência resolvida) |
| Notificações | Prompt 12 novo — eventos e Supabase Realtime |
| `document_validations` | Campo `motivo_rejeicao` adicionado |

---

## 📦 PARTE 1 — SETUP DO PROJETO

### 1.1 Crie o projeto Next.js

```bash
npx create-next-app@latest pei-collab \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd pei-collab
```

### 1.2 Instale as dependências essenciais

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install @supabase/auth-helpers-nextjs
npm install zustand                    # gerenciamento de estado
npm install react-hook-form zod        # formulários + validação
npm install @hookform/resolvers        # integração zod + react-hook-form
npm install date-fns                   # manipulação de datas
npm install lucide-react               # ícones
npm install clsx tailwind-merge        # utilitários de classe CSS
npm install shadcn-ui                  # (veja setup abaixo)
```

### 1.3 Setup do Shadcn/UI

```bash
npx shadcn-ui@latest init
# Responda: Default > Slate > src/app/globals.css > @/ > yes
```

Componentes úteis para instalar:
```bash
npx shadcn-ui@latest add button card input label select textarea
npx shadcn-ui@latest add badge dialog form table tabs
npx shadcn-ui@latest add dropdown-menu separator skeleton toast
```

### 1.4 Crie o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → New Project
2. Anote: `Project URL` e `anon public key`
3. Crie `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # apenas no backend
```

---

## 🗄️ PARTE 2 — BANCO DE DADOS (SCHEMA SQL COMPLETO)

> Cole no **SQL Editor** do Supabase **rigorosamente na ordem abaixo** — há dependências entre tabelas.

---

### 2.1 Multi-tenancy & Usuários

```sql
-- =============================================
-- NETWORKS
-- Raiz do sistema multi-tenant. Tudo se isola aqui.
-- =============================================
create table networks (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text not null check (type in ('municipal', 'privada')),
  cnpj       text,
  created_at timestamptz default now()
);

-- =============================================
-- SCHOOLS
-- =============================================
create table schools (
  id         uuid primary key default gen_random_uuid(),
  network_id uuid not null references networks(id) on delete cascade,
  name       text not null,
  inep_code  text,
  created_at timestamptz default now()
);

-- =============================================
-- USERS (estende Supabase Auth)
-- =============================================
create table users (
  id         uuid primary key references auth.users(id) on delete cascade,
  network_id uuid references networks(id),
  school_id  uuid references schools(id),
  name       text not null,
  role       text not null check (role in (
               'admin_rede',
               'gestor_escolar',
               'professor_regente',
               'professor_aee',
               'familia'
             )),
  active     boolean default true,
  created_at timestamptz default now()
);

-- Trigger: cria perfil na tabela users ao registrar no Auth
-- O role e name devem vir em raw_user_meta_data no signUp
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into users (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Novo Usuário'),
    coalesce(new.raw_user_meta_data->>'role', 'professor_regente')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

---

### 2.2 Estudantes

```sql
-- =============================================
-- STUDENTS
-- =============================================
create table students (
  id                    uuid primary key default gen_random_uuid(),
  network_id            uuid not null references networks(id),
  school_id             uuid not null references schools(id),
  nome                  text not null,
  data_nascimento       date,
  serie                 text,
  turno                 text check (turno in ('manha', 'tarde', 'noite', 'integral')),
  categoria_necessidade text check (categoria_necessidade in (
                          'DI', 'TEA', 'AHSD', 'DF', 'DV',
                          'Surdez', 'TDAH', 'Dislexia', 'Discalculia', 'Outro'
                        )),
  ativo                 boolean default true,
  created_at            timestamptz default now()
);

-- =============================================
-- FAMILY_STUDENTS  ← TABELA CRÍTICA (nova na v2)
-- Vincula usuários com role 'familia' aos seus filhos.
-- Sem esta tabela o RLS da família não consegue filtrar.
-- Gerenciada por admin_rede e gestor_escolar.
-- =============================================
create table family_students (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, student_id)
);
```

---

### 2.3 Template Engine

```sql
-- =============================================
-- DOCUMENT_TEMPLATES
-- Apenas admin_rede pode criar/editar.
-- =============================================
create table document_templates (
  id            uuid primary key default gen_random_uuid(),
  network_id    uuid references networks(id),
  tipo          text not null check (tipo in ('estudo_caso', 'paee', 'pei')),
  nome_template text not null,
  versao        integer default 1,
  ativo         boolean default true,
  base_nacional boolean default false,
  created_at    timestamptz default now()
);

create table template_sections (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references document_templates(id) on delete cascade,
  ordem       integer not null,
  nome_secao  text not null,
  descricao   text
);

create table template_fields (
  id           uuid primary key default gen_random_uuid(),
  section_id   uuid not null references template_sections(id) on delete cascade,
  tipo_campo   text not null check (tipo_campo in (
                 'text', 'textarea', 'select', 'multiselect',
                 'boolean', 'date', 'number'
               )),
  label        text not null,
  required     boolean default false,
  options_json jsonb,  -- para campos select/multiselect
  ordem        integer not null
);
```

---

### 2.4 Documentos (com versionamento completo)

```sql
-- =============================================
-- DOCUMENTS  ← Schema atualizado na v2
--
-- Novos campos de versionamento:
--   versao_pai_id   → referência à versão anterior (self-reference)
--   is_versao_atual → flag booleana para filtros rápidos
--   aprovado_em     → timestamp de aprovação (para analytics)
--   aprovado_por    → quem aprovou
--   template_versao → versão do template usada ao criar
--
-- Máquina de estados (transições válidas):
--   rascunho     → em_validacao  (professor envia)
--   em_validacao → aprovado      (gestor aprova)
--   em_validacao → rascunho      (gestor rejeita)
--   aprovado     → arquivado     (gestor arquiva)
--   arquivado    → aprovado      (reativação — raro)
--   aprovado     → [nova versão] (cria novo rascunho, arquiva atual)
-- =============================================
create table documents (
  id              uuid primary key default gen_random_uuid(),
  network_id      uuid not null references networks(id),
  student_id      uuid not null references students(id),
  template_id     uuid not null references document_templates(id),
  tipo            text not null check (tipo in ('estudo_caso', 'paee', 'pei')),
  status          text not null default 'rascunho' check (status in (
                    'rascunho', 'em_validacao', 'aprovado', 'arquivado'
                  )),

  -- Versionamento
  versao          integer not null default 1,
  versao_pai_id   uuid references documents(id),   -- versão anterior
  is_versao_atual boolean not null default true,    -- apenas 1 true por (student, tipo)
  template_versao integer not null default 1,

  -- Metadados
  criado_por      uuid references users(id),
  aprovado_em     timestamptz,
  aprovado_por    uuid references users(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Índices essenciais para queries de versionamento
create index idx_documents_student_versao_atual
  on documents(student_id, is_versao_atual)
  where is_versao_atual = true;

create index idx_documents_versao_pai
  on documents(versao_pai_id);

create index idx_documents_network_status
  on documents(network_id, status);

-- =============================================
-- TRIGGER: garante apenas UMA versão atual
-- por (student_id + tipo) em qualquer momento.
-- Sem isso podem existir inconsistências ao versionar.
-- =============================================
create or replace function enforce_single_current_version()
returns trigger as $$
begin
  if NEW.is_versao_atual = true then
    update documents
    set is_versao_atual = false
    where student_id = NEW.student_id
      and tipo       = NEW.tipo
      and id        != NEW.id
      and is_versao_atual = true;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trigger_single_current_version
  after insert or update on documents
  for each row execute function enforce_single_current_version();

-- =============================================
-- DOCUMENT_FIELD_VALUES
-- =============================================
create table document_field_values (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  field_id    uuid not null references template_fields(id),
  value_text  text,
  value_json  jsonb,
  updated_at  timestamptz default now()
);
```

---

### 2.5 Metas (coração do sistema)

```sql
-- =============================================
-- GOALS
-- Metas pertencem ao ESTUDANTE, não ao documento.
-- Documentos referenciam metas via goal_links.
-- Ao versionar um documento, o vínculo (goal_link)
-- é copiado — a meta em si NUNCA é duplicada.
-- =============================================
create table goals (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references students(id),
  origin_document_id  uuid references documents(id),  -- onde a meta foi criada
  tipo_meta           text check (tipo_meta in ('desenvolvimento', 'academica', 'funcional')),
  descricao           text not null,
  indicador           text,
  linha_base          text,
  meta_valor          text,
  unidade             text,
  prazo               date,
  status              text default 'ativa' check (status in ('ativa', 'concluida', 'atrasada')),
  responsavel_user_id uuid references users(id),
  created_at          timestamptz default now()
);

-- =============================================
-- GOAL_UPDATES — histórico de progresso
-- =============================================
create table goal_updates (
  id                   uuid primary key default gen_random_uuid(),
  goal_id              uuid not null references goals(id) on delete cascade,
  progresso_percentual integer check (progresso_percentual between 0 and 100),
  observacao           text,
  registrado_por       uuid references users(id),
  data_registro        timestamptz default now()
);

-- =============================================
-- GOAL_LINKS — conecta metas a documentos (PAEE ↔ PEI)
-- =============================================
create table goal_links (
  id                 uuid primary key default gen_random_uuid(),
  goal_id            uuid not null references goals(id),
  linked_document_id uuid not null references documents(id),
  tipo_vinculo       text check (tipo_vinculo in ('paee_para_pei', 'pei_para_paee'))
);
```

---

### 2.6 Família & Governança

```sql
-- =============================================
-- FAMILY_COMMENTS
-- Apenas role 'familia' insere.
-- Todos da rede visualizam.
-- =============================================
create table family_comments (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id),
  user_id     uuid not null references users(id),
  comentario  text not null,
  created_at  timestamptz default now()
);

-- =============================================
-- FAMILY_ACKNOWLEDGEMENTS
-- Ciência formal da família sobre o documento.
-- unique(document_id, user_id) impede dupla confirmação.
-- =============================================
create table family_acknowledgements (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references documents(id),
  user_id        uuid not null references users(id),
  aceite_boolean boolean default false,
  data_aceite    timestamptz,
  unique(document_id, user_id)
);

-- =============================================
-- DOCUMENT_VALIDATIONS
-- Fluxo: professor → gestor_escolar → admin_rede
-- motivo_rejeicao deve ser preenchido ao rejeitar.
-- =============================================
create table document_validations (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references documents(id),
  validado_por    uuid references users(id),
  papel_validador text,
  motivo_rejeicao text,   -- obrigatório se status = 'rejeitado'
  data_validacao  timestamptz default now(),
  status          text check (status in ('aprovado', 'rejeitado', 'pendente'))
);

-- =============================================
-- AUDIT_LOGS — log imutável de todas as ações
-- Nunca deletar registros desta tabela.
-- =============================================
create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  entidade    text not null,   -- 'document', 'goal', 'student', etc.
  entidade_id uuid,
  acao        text not null,   -- 'created', 'updated', 'version_created', 'approved', etc.
  user_id     uuid references users(id),
  before_json jsonb,
  after_json  jsonb,
  timestamp   timestamptz default now()
);

-- =============================================
-- AI_RECOMMENDATION_LOGS (Sprint 6)
-- =============================================
create table ai_recommendation_logs (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid references students(id),
  contexto_json  jsonb,
  sugestao_json  jsonb,
  aceita_boolean boolean,
  created_at     timestamptz default now()
);
```

---

### 2.7 Row Level Security (RLS) — Multi-tenant completo

> Execute este bloco **depois** de criar todas as tabelas acima.

```sql
-- =============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =============================================
alter table networks                enable row level security;
alter table schools                 enable row level security;
alter table users                   enable row level security;
alter table students                enable row level security;
alter table family_students         enable row level security;
alter table document_templates      enable row level security;
alter table template_sections       enable row level security;
alter table template_fields         enable row level security;
alter table documents               enable row level security;
alter table document_field_values   enable row level security;
alter table goals                   enable row level security;
alter table goal_updates            enable row level security;
alter table goal_links              enable row level security;
alter table family_comments         enable row level security;
alter table family_acknowledgements enable row level security;
alter table document_validations    enable row level security;
alter table audit_logs              enable row level security;

-- =============================================
-- FUNÇÕES HELPER — evitam subquery repetida em policies
-- =============================================
create or replace function get_my_network_id()
returns uuid language sql stable as $$
  select network_id from users where id = auth.uid()
$$;

create or replace function get_my_school_id()
returns uuid language sql stable as $$
  select school_id from users where id = auth.uid()
$$;

create or replace function get_my_role()
returns text language sql stable as $$
  select role from users where id = auth.uid()
$$;

-- =============================================
-- NETWORKS: usuário vê apenas sua rede
-- =============================================
create policy "network_isolation" on networks
  for all using (id = get_my_network_id());

-- =============================================
-- SCHOOLS
-- admin_rede: todas da rede | demais: apenas sua escola
-- =============================================
create policy "school_select" on schools
  for select using (
    network_id = get_my_network_id()
    and (get_my_role() = 'admin_rede' or id = get_my_school_id())
  );

create policy "school_modify" on schools
  for all using (
    network_id = get_my_network_id()
    and get_my_role() in ('admin_rede', 'gestor_escolar')
    and (get_my_role() = 'admin_rede' or id = get_my_school_id())
  );

-- =============================================
-- STUDENTS
-- admin_rede: todos da rede
-- gestor_escolar: todos da sua escola
-- professores: todos da sua escola (filtro fino no app)
-- família: apenas filhos via family_students
-- =============================================
create policy "students_select" on students
  for select using (
    network_id = get_my_network_id()
    and (
      get_my_role() in ('admin_rede', 'gestor_escolar', 'professor_regente', 'professor_aee')
      or id in (
        select student_id from family_students where user_id = auth.uid()
      )
    )
  );

create policy "students_insert" on students
  for insert with check (
    network_id = get_my_network_id()
    and get_my_role() in ('admin_rede', 'gestor_escolar')
  );

create policy "students_update" on students
  for update using (
    network_id = get_my_network_id()
    and get_my_role() in ('admin_rede', 'gestor_escolar')
  );

-- =============================================
-- FAMILY_STUDENTS
-- Apenas gestores criam vínculos; família e gestores visualizam
-- =============================================
create policy "family_students_select" on family_students
  for select using (
    user_id = auth.uid()
    or get_my_role() in ('admin_rede', 'gestor_escolar')
  );

create policy "family_students_insert" on family_students
  for insert with check (
    get_my_role() in ('admin_rede', 'gestor_escolar')
  );

-- =============================================
-- DOCUMENT_TEMPLATES
-- Todos visualizam; apenas admin_rede modifica
-- =============================================
create policy "templates_select" on document_templates
  for select using (
    network_id = get_my_network_id()
    and get_my_role() in ('admin_rede', 'gestor_escolar', 'professor_regente', 'professor_aee')
  );

create policy "templates_modify" on document_templates
  for all using (
    network_id = get_my_network_id()
    and get_my_role() = 'admin_rede'
  );

-- =============================================
-- DOCUMENTS
-- admin_rede: todos da rede
-- gestor_escolar: todos da sua escola
-- professor: documentos que criou
-- família: documentos dos filhos (somente leitura)
-- =============================================
create policy "documents_select" on documents
  for select using (
    network_id = get_my_network_id()
    and (
      get_my_role() = 'admin_rede'
      or (get_my_role() = 'gestor_escolar'
          and student_id in (select id from students where school_id = get_my_school_id()))
      or (get_my_role() in ('professor_regente', 'professor_aee')
          and criado_por = auth.uid())
      or (get_my_role() = 'familia'
          and student_id in (select student_id from family_students where user_id = auth.uid()))
    )
  );

create policy "documents_insert" on documents
  for insert with check (
    network_id = get_my_network_id()
    and get_my_role() in ('admin_rede', 'gestor_escolar', 'professor_regente', 'professor_aee')
  );

-- Apenas documentos em rascunho são editáveis diretamente
create policy "documents_update" on documents
  for update using (
    network_id = get_my_network_id()
    and status = 'rascunho'
    and (
      get_my_role() in ('admin_rede', 'gestor_escolar')
      or criado_por = auth.uid()
    )
  );

-- =============================================
-- GOALS
-- =============================================
create policy "goals_select" on goals
  for select using (
    student_id in (select id from students where network_id = get_my_network_id())
  );

create policy "goals_insert" on goals
  for insert with check (
    get_my_role() in ('admin_rede', 'gestor_escolar', 'professor_regente', 'professor_aee')
  );

create policy "goals_update" on goals
  for update using (
    get_my_role() in ('admin_rede', 'gestor_escolar')
    or responsavel_user_id = auth.uid()
  );

-- =============================================
-- FAMILY_COMMENTS
-- Família insere; todos da rede visualizam
-- =============================================
create policy "family_comments_select" on family_comments
  for select using (
    document_id in (select id from documents where network_id = get_my_network_id())
  );

create policy "family_comments_insert" on family_comments
  for insert with check (
    get_my_role() = 'familia'
    and user_id = auth.uid()
    and document_id in (
      select d.id from documents d
      join family_students fs on fs.student_id = d.student_id
      where fs.user_id = auth.uid()
    )
  );

-- =============================================
-- AUDIT_LOGS
-- admin_rede lê; qualquer autenticado insere
-- =============================================
create policy "audit_select" on audit_logs
  for select using (get_my_role() = 'admin_rede');

create policy "audit_insert" on audit_logs
  for insert with check (true);
```

---

### 2.8 Função transacional de versionamento

> Chame esta função via Supabase Edge Function ou server action do Next.js.

```sql
-- =============================================
-- CREATE_DOCUMENT_VERSION
-- Cria nova versão de um documento aprovado em transação:
-- 1. Cria novo documento (rascunho, versao+1)
-- 2. Copia todos os field_values
-- 3. Copia goal_links (meta NÃO é duplicada)
-- 4. Arquiva versão anterior
-- 5. Registra em audit_logs
-- =============================================
create or replace function create_document_version(
  p_document_id uuid,
  p_user_id     uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_original documents%rowtype;
  v_new_id   uuid;
begin
  select * into v_original from documents where id = p_document_id;

  if v_original.id is null then
    raise exception 'Documento não encontrado';
  end if;

  if v_original.status != 'aprovado' then
    raise exception 'Apenas documentos aprovados podem ser versionados';
  end if;

  -- 1. Criar novo documento
  insert into documents (
    network_id, student_id, template_id, tipo,
    status, versao, versao_pai_id, is_versao_atual,
    template_versao, criado_por
  ) values (
    v_original.network_id,
    v_original.student_id,
    v_original.template_id,
    v_original.tipo,
    'rascunho',
    v_original.versao + 1,
    v_original.id,
    true,
    v_original.template_versao,
    p_user_id
  ) returning id into v_new_id;

  -- 2. Copiar field_values
  insert into document_field_values (document_id, field_id, value_text, value_json)
  select v_new_id, field_id, value_text, value_json
  from document_field_values
  where document_id = p_document_id;

  -- 3. Copiar goal_links (meta original não é tocada)
  insert into goal_links (goal_id, linked_document_id, tipo_vinculo)
  select goal_id, v_new_id, tipo_vinculo
  from goal_links
  where linked_document_id = p_document_id;

  -- 4. Arquivar versão anterior
  -- O trigger enforce_single_current_version cuida do is_versao_atual
  update documents
  set status = 'arquivado', updated_at = now()
  where id = p_document_id;

  -- 5. Registrar auditoria
  insert into audit_logs (entidade, entidade_id, acao, user_id, before_json, after_json)
  values (
    'document',
    v_new_id,
    'version_created',
    p_user_id,
    jsonb_build_object('original_id', p_document_id, 'versao', v_original.versao),
    jsonb_build_object('novo_id', v_new_id, 'nova_versao', v_original.versao + 1)
  );

  return v_new_id;
end;
$$;
```

---

### 2.9 Views Materializadas para Analytics (Sprint 5)

```sql
-- Documentos ativos por escola
create materialized view mv_documentos_ativos as
select
  s.school_id,
  s.network_id,
  d.tipo,
  count(*)                                                              as total,
  count(*) filter (where d.status = 'aprovado' and d.is_versao_atual)  as ativos,
  count(*) filter (where d.status = 'em_validacao')                    as pendentes,
  count(*) filter (where d.status = 'rascunho')                        as em_edicao
from documents d
join students s on d.student_id = s.id
where d.is_versao_atual = true
group by s.school_id, s.network_id, d.tipo;

-- Metas em atraso
create materialized view mv_metas_atrasadas as
select
  g.id                                                           as goal_id,
  g.student_id,
  s.school_id,
  g.descricao,
  g.prazo,
  g.responsavel_user_id,
  date_part('day', now() - g.prazo::timestamptz)::int            as dias_atraso
from goals g
join students s on g.student_id = s.id
where g.status = 'ativa'
  and g.prazo < current_date;

-- Tempo médio de aprovação por rede e tipo de documento
create materialized view mv_tempo_aprovacao as
select
  network_id,
  tipo,
  avg(aprovado_em - created_at)                                                   as tempo_medio,
  percentile_cont(0.5) within group (order by aprovado_em - created_at)           as mediana
from documents
where status = 'aprovado'
  and aprovado_em is not null
group by network_id, tipo;

-- Refresh diário (agendar via pg_cron no Supabase)
create or replace function refresh_analytics()
returns void as $$
begin
  refresh materialized view mv_documentos_ativos;
  refresh materialized view mv_metas_atrasadas;
  refresh materialized view mv_tempo_aprovacao;
end;
$$ language plpgsql;
```

---

## 🏗️ PARTE 3 — ESTRUTURA DE PASTAS

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                       ← sidebar + navbar
│   │   ├── page.tsx                         ← dashboard home + métricas
│   │   ├── students/
│   │   │   ├── page.tsx                     ← lista de alunos
│   │   │   └── [id]/
│   │   │       ├── page.tsx                 ← perfil do aluno
│   │   │       ├── documents/
│   │   │       │   ├── new/page.tsx         ← criar documento
│   │   │       │   └── [docId]/
│   │   │       │       ├── page.tsx         ← editor de documento
│   │   │       │       └── versions/page.tsx← histórico de versões
│   │   │       └── goals/page.tsx           ← metas do aluno
│   │   ├── templates/
│   │   │   ├── page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── users/page.tsx               ← gerenciar usuários da rede
│   └── api/
│       ├── documents/[id]/versions/route.ts ← chama create_document_version()
│       └── webhooks/route.ts
├── components/
│   ├── ui/                                  ← shadcn components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Navbar.tsx
│   ├── auth/
│   │   └── PermissionGate.tsx               ← protege UI por papel
│   ├── students/
│   │   ├── StudentCard.tsx
│   │   └── StudentForm.tsx
│   ├── documents/
│   │   ├── DocumentEditor.tsx               ← editor dinâmico por template
│   │   ├── FieldRenderer.tsx                ← renderiza campos por tipo
│   │   ├── DocumentVersionHistory.tsx       ← histórico e criação de versões
│   │   └── DocumentStatusBadge.tsx
│   ├── goals/
│   │   ├── GoalCard.tsx
│   │   ├── GoalForm.tsx
│   │   └── GoalProgress.tsx
│   └── family/
│       ├── FamilyComments.tsx
│       └── FamilyAcknowledgement.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── rbac.ts                              ← matriz de permissões + authorize()
│   └── utils.ts
├── hooks/
│   ├── useStudents.ts
│   ├── useDocuments.ts
│   ├── useGoals.ts
│   └── usePermissions.ts                    ← hook RBAC
├── stores/
│   └── useAppStore.ts
└── types/
    ├── database.ts                          ← tipos gerados pelo Supabase
    └── index.ts                             ← tipos enriquecidos
```

---

## 🤖 PARTE 4 — PROMPTS PARA O CURSOR

> Use no **Cursor Chat** (`Cmd+L` / `Ctrl+L`). Abra os arquivos relevantes antes — o Cursor usa tudo que está aberto como contexto.

---

### 🔵 PROMPT 1 — Configurar Supabase Client

```
Crie os arquivos de cliente Supabase para Next.js 14 App Router:

1. src/lib/supabase/client.ts — createBrowserClient para client components
2. src/lib/supabase/server.ts — createServerClient para server components e server actions
3. src/middleware.ts — refresh de sessão em todas as rotas, proteger /dashboard

Use @supabase/ssr. Variáveis:
NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

### 🔵 PROMPT 2 — Sistema de Auth completo

```
Crie o sistema de autenticação com Supabase Auth:

- src/app/(auth)/login/page.tsx — form email/senha
- src/app/(auth)/register/page.tsx — cadastro com nome, email, senha, role

Após login, redirecionar para /dashboard.
Use react-hook-form + zod. Use shadcn/ui (Input, Button, Card, Label).
Loading state no botão. Erros traduzidos para português.

No signUp, passe nome e role como metadata:
supabase.auth.signUp({ email, password, options: { data: { name, role } } })
Isso alimenta o trigger handle_new_user que cria o perfil na tabela users.
```

---

### 🔵 PROMPT 3 — RBAC: hook, funções e PermissionGate

```
Crie o sistema RBAC completo para o PEI Collab:

Arquivo src/lib/rbac.ts com a função authorize(user, resource, action, resourceId?):
1. Verifica se o papel tem permissão para a ação na matriz abaixo
2. Verifica escopo de ownership (rede, escola, documento próprio)
3. Para família: verifica vínculo via family_students

Matriz de permissões:
- documents:create      → admin_rede, gestor_escolar, professor_regente, professor_aee
- documents:edit        → admin_rede, gestor_escolar, professor (se autor + status=rascunho)
- documents:approve     → admin_rede, gestor_escolar (apenas sua escola)
- documents:create_version → admin_rede, gestor_escolar, professor (se autor original)
- documents:archive     → admin_rede, gestor_escolar
- templates:create      → admin_rede apenas
- templates:edit        → admin_rede apenas
- students:create       → admin_rede, gestor_escolar
- students:edit         → admin_rede, gestor_escolar
- goals:create          → admin_rede, gestor_escolar, professor_regente, professor_aee
- goals:update_progress → admin_rede, gestor_escolar, professor (se responsável)
- family:comment        → familia apenas
- family:acknowledge    → familia apenas
- users:manage          → admin_rede apenas

Hook src/hooks/usePermissions.ts com funções:
canCreateDocument(), canApproveDocument(), canEditTemplate(),
canManageUsers(), canViewAllStudents(), canCreateVersion(doc)

Componente src/components/auth/PermissionGate.tsx:
<PermissionGate permission="canEditTemplate">
  children visíveis apenas com permissão
</PermissionGate>
```

---

### 🔵 PROMPT 4 — Layout do Dashboard

```
Crie src/app/(dashboard)/layout.tsx com:

Sidebar esquerda:
- Logo "PEI Collab" no topo
- Menu com ícones (lucide-react), visibilidade por role:
  - Todos: Dashboard, Alunos
  - admin_rede + gestor_escolar: Templates, Configurações
  - admin_rede: Usuários
- Nome, role (badge) e botão logout na base

Navbar superior: título da página + avatar do usuário.
Responsivo: colapsável no mobile com botão hamburguer.
Use usePermissions() para controlar visibilidade dos itens.
```

---

### 🔵 PROMPT 5 — CRUD de Estudantes

```
Crie o módulo de estudantes:

1. src/app/(dashboard)/students/page.tsx
   - Lista alunos da network (RLS já filtra no Supabase)
   - Busca por nome, filtro por categoria_necessidade e série
   - Card: nome, série, categoria, escola
   - Botão "Novo Aluno" protegido por PermissionGate

2. StudentForm (modal) com:
   - nome (obrigatório), data_nascimento, serie
   - turno (select: manhã, tarde, noite, integral)
   - categoria_necessidade (select com as 10 categorias do schema)
   - school_id (select com escolas da rede)

3. Para role 'familia': mostrar apenas filhos via family_students

Aplicar network_id automaticamente do usuário logado.
Use react-hook-form + zod.
```

---

### 🔵 PROMPT 6 — Template Engine

```
Crie o editor de templates (protegido por PermissionGate — admin_rede apenas):

1. Listagem /templates: nome, tipo, versão, status ativo/inativo
2. Edição /templates/[id]/edit:
   - Form: nome e tipo (estudo_caso | paee | pei)
   - Lista de seções com botões ↑↓ para reordenar
   - Para cada seção: nome + lista de campos
   - Para cada campo: label, tipo_campo (select), obrigatório (checkbox),
     opções separadas por vírgula (se select ou multiselect)
   - Adicionar Seção / Adicionar Campo em cada seção
   - Salvar tudo em uma operação (upsert sections e fields em sequência)
   - Ao salvar um template já em uso: incrementar campo versao
```

---

### 🔵 PROMPT 7 — Editor de Documentos Dinâmico

```
Crie DocumentEditor em src/components/documents/DocumentEditor.tsx:

Props: studentId, templateId, documentId?, readOnly?

Comportamento:
1. Busca template (sections + fields) via Supabase
2. Busca valores salvos se documentId existir
3. Formulário dinâmico:
   - Uma aba por seção
   - Campos renderizados por FieldRenderer conforme tipo_campo
4. Auto-save a cada 30s se status = rascunho
5. Barra de status com badge colorido por status
6. Ações contextuais:
   - rascunho      → Salvar, Enviar para Validação
   - em_validacao  → leitura + Aprovar/Rejeitar (se gestor, com campo motivo)
   - aprovado      → leitura + Criar Nova Versão (via PermissionGate)
   - arquivado     → leitura somente

FieldRenderer deve suportar todos os tipos:
text, textarea, select, multiselect, boolean, date, number
```

---

### 🔵 PROMPT 8 — Histórico de Versões

```
Crie DocumentVersionHistory em src/components/documents/DocumentVersionHistory.tsx:

Exibe todas as versões do documento (mesmo student_id + tipo), ordenadas por versao desc:
- Versão atual: badge "ATUAL" em destaque verde
- Versões arquivadas: timeline em baixo
- Por versão: número, status, criado por, data criação, data aprovação, qtd metas vinculadas
- Botões: [Ver] em qualquer versão | [Criar Nova Versão] apenas na atual aprovada

Ao clicar "Criar Nova Versão":
1. Dialog de confirmação
2. POST /api/documents/[id]/versions (chama create_document_version() no Supabase)
3. Redirecionar para o novo documento em rascunho

Route handler src/app/api/documents/[id]/versions/route.ts:
- Validar que o usuário tem permissão (canCreateVersion)
- Chamar: supabase.rpc('create_document_version', { p_document_id, p_user_id })
- Retornar o novo document_id
```

---

### 🔵 PROMPT 9 — Módulo de Metas

```
Crie o módulo de metas em src/app/(dashboard)/students/[id]/goals/:

1. Listagem:
   - Agrupada por tipo_meta (desenvolvimento, academica, funcional)
   - Badge de status: ativa=verde, atrasada=vermelho, concluida=cinza
   - Barra de progresso com valor do último goal_update
   - Botão "Registrar Progresso" (professor responsável ou gestor)

2. Formulário nova meta (modal):
   - descricao (obrigatório), tipo_meta, indicador
   - linha_base, meta_valor, unidade, prazo
   - responsavel_user_id (select usuários da rede)
   - origin_document_id (select documentos PAEE do aluno)

3. Modal progresso:
   - progresso_percentual (slider 0-100)
   - observacao (textarea)

4. Botão "Vincular ao PEI": cria goal_link tipo paee_para_pei

Família visualiza metas e progresso mas não cria/edita (PermissionGate).
```

---

### 🔵 PROMPT 10 — Participação da Família

```
Crie os componentes de participação familiar integrados ao DocumentEditor:

1. FamilyComments:
   - Lista: avatar, nome, data, texto do comentário
   - Input de novo comentário SOMENTE para role 'familia'
   - Professores e gestores apenas leem

2. FamilyAcknowledgement:
   - Status: "Aguardando ciência" ou "Ciência confirmada em [data] por [nome]"
   - Botão "Confirmar Ciência" apenas para role 'familia'
   - Salva em family_acknowledgements com data_aceite = now()
   - Unique constraint no banco impede dupla confirmação

Vínculo família↔aluno é gerenciado via family_students pela escola.
Crie também um painel em /settings/users para gestores adicionarem vínculos.
```

---

### 🔵 PROMPT 11 — Tipos TypeScript do Supabase

```
Organize os tipos TypeScript do projeto:

1. Execute no terminal para gerar tipos do banco:
npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.ts

2. Crie src/types/index.ts com tipos enriquecidos:

import { Tables } from './database'

export type Student = Tables<'students'>
export type User = Tables<'users'>
export type FamilyStudent = Tables<'family_students'>

export type Document = Tables<'documents'> & {
  versao_pai?: Document | null
  field_values?: DocumentFieldValue[]
  goal_links?: GoalLink[]
}

export type Goal = Tables<'goals'> & {
  latest_update?: Tables<'goal_updates'> | null
  links?: Tables<'goal_links'>[]
}

export type Template = Tables<'document_templates'> & {
  sections: (Tables<'template_sections'> & {
    fields: Tables<'template_fields'>[]
  })[]
}

3. Type guards úteis:
export const isEditable = (doc: Document) => doc.status === 'rascunho'
export const canBeVersioned = (doc: Document) => doc.status === 'aprovado'
export const isReadOnly = (doc: Document) =>
  ['em_validacao', 'aprovado', 'arquivado'].includes(doc.status)
```

---

### 🔵 PROMPT 12 — Notificações in-app (Sprint 5)

```
Crie um sistema de notificações usando Supabase Realtime:

1. Crie a tabela notifications no Supabase:
CREATE TABLE notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id),
  tipo       text not null,
  titulo     text not null,
  mensagem   text not null,
  lida       boolean default false,
  created_at timestamptz default now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_notifications" ON notifications FOR ALL USING (user_id = auth.uid());

2. Triggers SQL para os eventos:
- Documento enviado para validação → notifica gestor_escolar da escola
- Documento aprovado → notifica professor criador
- Documento rejeitado → notifica professor criador (com motivo)
- Meta com prazo em 7 dias → notifica responsável
- Meta atrasada → notifica responsável e gestor

3. Hook src/hooks/useNotifications.ts:
- Supabase Realtime para receber novas notificações em tempo real
- Marcar como lida ao clicar

4. Componente NotificationBell na Navbar:
- Badge com contagem de não lidas
- Dropdown com as últimas 10 notificações
```

---

## 📋 PARTE 5 — CHECKLIST DAS SPRINTS

### Sprint 1 — Fundação
- [ ] Projeto Next.js criado com todas as dependências
- [ ] Schema SQL executado no Supabase (seções 2.1 a 2.9 em ordem)
- [ ] RLS habilitado e todas as policies criadas
- [ ] Supabase Client configurado (client + server + middleware)
- [ ] Auth (login + registro) funcionando com metadata de role
- [ ] Layout do dashboard com sidebar responsiva
- [ ] RBAC implementado (authorize() + usePermissions + PermissionGate)
- [ ] ✅ Testar: criar 2 usuários de redes diferentes e validar isolamento

### Sprint 2 — Templates e Estudantes
- [ ] CRUD de estudantes com RLS respeitado por role
- [ ] Tabela family_students + painel de vínculo família→aluno
- [ ] Template engine (criar + editar + versionar templates)
- [ ] DocumentEditor funcional com Estudo de Caso
- [ ] Tipos TypeScript gerados e organizados

### Sprint 3 — PAEE e Metas
- [ ] PAEE funcional com DocumentEditor
- [ ] Módulo de metas completo (CRUD + progresso)
- [ ] Vínculo metas ↔ documentos via goal_links
- [ ] ✅ Testar: professor A não vê metas de professor B

### Sprint 4 — PEI e Família
- [ ] PEI integrado com goal_links do PAEE
- [ ] DocumentVersionHistory + função create_document_version testada
- [ ] FamilyComments e FamilyAcknowledgement
- [ ] Fluxo completo de status (rascunho → validação → aprovado)
- [ ] ✅ Testar: família só comenta, não edita

### Sprint 5 — Validação, Logs e Dashboard
- [ ] Fluxo de validação com motivo de rejeição
- [ ] Audit logs em todas as ações críticas
- [ ] Views materializadas criadas e funcionando
- [ ] Dashboard com métricas (mv_documentos_ativos)
- [ ] Notificações in-app com Supabase Realtime

### Sprint 6 — IA e Analytics Avançado
- [ ] Sugestões de metas por categoria/série/idade
- [ ] Alertas: PEI sem metas, PAEE sem responsável, sem ciência familiar
- [ ] Refresh automático das views (pg_cron)
- [ ] ai_recommendation_logs integrado

---

## 💡 PARTE 6 — DICAS DE VIBE CODING NO CURSOR

1. **Abra os arquivos relevantes antes de pedir** — o Cursor usa como contexto tudo que está aberto
2. **Use `@filename` nos prompts** — ex: `@schema.sql crie o hook useStudents baseado nessas tabelas`
3. **Peça um passo de cada vez** — nunca peça "o sistema todo" num prompt
4. **Revise o código gerado** — especialmente RLS policies e lógica de negócio
5. **Mantenha o schema SQL sempre aberto** — serve de referência constante
6. **Gere os tipos do Supabase cedo** — autocomplete economiza muito tempo
7. **Commit a cada sprint** — facilita reverter se algo quebrar
8. **Teste o RLS primeiro** — crie 2 usuários de redes diferentes e valide isolamento
9. **Use o Supabase Table Editor** para inspecionar dados durante desenvolvimento
10. **Nomeie Edge Functions com verbos** — ex: `create-document-version`, `send-notification`

---

## 🔗 RECURSOS ÚTEIS

- [Supabase Docs — Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Shadcn/UI Components](https://ui.shadcn.com/docs/components)
- [Supabase Type Generation](https://supabase.com/docs/guides/api/rest/generating-types)