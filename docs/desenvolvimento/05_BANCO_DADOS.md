# 🗄️ Banco de Dados

Documentação sobre a estrutura do banco de dados e migrações.

---

## 📊 Visão Geral

O projeto usa **Supabase (PostgreSQL)** como banco de dados. Todas as aplicações compartilham o mesmo banco.

### Estrutura Principal

```
supabase/
├── migrations/          # Migrações SQL (aplicar em ordem)
└── functions/           # Edge Functions (futuro)
```

---

## 📋 Tabelas Principais

### Core

| Tabela | Descrição | Relacionamentos |
|--------|-----------|-----------------|
| `tenants` | Redes de ensino | 1:N com `schools` |
| `schools` | Escolas | N:1 com `tenants`, 1:N com `students` |
| `profiles` | Perfis de usuários | 1:1 com `auth.users` |
| `user_roles` | Roles dos usuários | N:1 com `profiles` |
| `user_schools` | Usuário ↔ Escola | N:N |
| `user_tenants` | Usuário ↔ Tenant | N:N |

### Gestão Escolar

| Tabela | Descrição | Relacionamentos |
|--------|-----------|-----------------|
| `students` | Alunos | N:1 com `schools`, 1:N com `peis` |
| `professionals` | Profissionais | N:1 com `schools` |
| `classes` | Turmas | N:1 com `schools` |
| `disciplines` | Disciplinas | N:1 com `classes` |

### PEI Collab

| Tabela | Descrição | Relacionamentos |
|--------|-----------|-----------------|
| `peis` | Planos Educacionais | N:1 com `students`, 1:1 com `plano_aee` |
| `meetings` | Reuniões | N:1 com `peis` |
| `evaluations` | Avaliações | N:1 com `peis` |
| `support_professionals` | Profissionais de Apoio | N:1 com `peis` |
| `daily_feedbacks` | Feedbacks diários | N:1 com `support_professionals` |

### Plano AEE

| Tabela | Descrição | Relacionamentos |
|--------|-----------|-----------------|
| `plano_aee` | Planos de AEE | 1:1 com `peis` |
| `aee_comments` | Comentários | N:1 com `plano_aee` |

---

## 🔄 Migrações

### Aplicar Migrações

1. Acesse: https://app.supabase.com/project/seu-projeto/sql
2. Execute as migrações em **ordem cronológica** (por data no nome)
3. Verifique se não há erros

### Ordem de Aplicação

```
1. 20250113000000_simple_schema_v2.sql          # Schema base
2. 20250113000001_support_professional.sql       # Profissional de Apoio
3. 20250113000002_fix_user_roles_relationship.sql # Correção de roles
4. 20250113000003_advanced_maintenance_functions.sql # Funções
5. 20250113000004_schema_complete_v2.sql        # Schema completo
6. 20250113000005_plano_aee.sql                 # Plano AEE
7. 20250113000006_gestao_escolar.sql            # Gestão Escolar
8. 20250113000007_fix_user_roles_rls.sql        # Correção RLS
```

### Criar Nova Migração

1. Crie arquivo: `supabase/migrations/YYYYMMDDHHMMSS_nome_da_migracao.sql`
2. Use `IF NOT EXISTS` para evitar erros em reexecução
3. Documente mudanças no arquivo

**Exemplo**:

```sql
-- ============================================================================
-- PEI COLLAB - DESCRIÇÃO DA MIGRAÇÃO
-- ============================================================================
-- Data: 2025-01-15
-- Descrição: Adiciona campo X na tabela Y
-- ============================================================================

ALTER TABLE "public"."students" 
ADD COLUMN IF NOT EXISTS "new_field" text;
```

---

## 🔐 Row Level Security (RLS)

### Princípios

- **RLS habilitado** em todas as tabelas sensíveis
- **Políticas por role**: Cada role tem permissões específicas
- **Isolamento de dados**: Usuários só veem dados da sua rede/escola

### Políticas Comuns

```sql
-- Exemplo: Usuários veem apenas alunos da sua escola
CREATE POLICY "Users can view students from their school" 
ON "public"."students"
FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM "public"."user_schools" 
    WHERE user_id = auth.uid()
  )
);
```

### Funções RPC Importantes

| Função | Descrição | Uso |
|--------|-----------|-----|
| `user_can_access_pei` | Verifica acesso a PEI | Antes de acessar PEI |
| `has_role` | Verifica se usuário tem role | Verificação de permissões |
| `create_pei_version` | Cria nova versão de PEI | Versionamento |

**⚠️ Importante**: Sempre use funções RPC para acessos complexos, nunca SELECT direto em tabelas sensíveis.

---

## 📊 Tipos Enumerados

### `user_role`

```sql
'superadmin'
'education_secretary'
'coordinator'
'school_manager'
'aee_teacher'
'teacher'
'family'
'specialist'
'support_professional'
```

### `pei_status`

```sql
'draft'      # Rascunho
'pending'    # Aguardando aprovação
'approved'   # Aprovado
'returned'   # Devolvido para correção
```

---

## 🔄 Máquina de Estados do PEI

```
draft → pending → approved
              ↓
          returned → draft
```

### Regras

- **draft**: Pode ser editado livremente
- **pending**: Não pode ser editado (aguardando aprovação)
- **approved**: Não pode ser editado (apenas visualização)
- **returned**: Volta para draft para correções

**⚠️ Nunca permitir UPDATE em PEIs com status `approved`.**

---

## 🧪 Dados de Teste

### Criar Usuário de Teste

```sql
-- Ver scripts em scripts/ para exemplos completos
INSERT INTO auth.users (id, email, ...) VALUES (...);
INSERT INTO public.profiles (id, full_name, role, ...) VALUES (...);
```

### Credenciais de Teste

Ver: [`../CREDENCIAIS_TESTE.md`](../CREDENCIAIS_TESTE.md)

---

## 📚 Recursos

- **[Autenticação e Segurança](./06_AUTENTICACAO_SEGURANCA.md)**
- **[Migrações SQL](../supabase/migrations/)**
- **[Documentação do Supabase](https://supabase.com/docs)**

---

**Última atualização**: Janeiro 2025

