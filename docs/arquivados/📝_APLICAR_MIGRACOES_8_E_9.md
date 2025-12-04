# 📝 APLICAR MIGRAÇÕES 8 E 9 - PLANEJAMENTO E ATIVIDADES

## 🎯 O QUE FAZER AGORA

Você precisa aplicar **2 novas migrações SQL** no Supabase para criar as tabelas dos apps de Planejamento e Atividades.

---

## 📊 MIGRAÇÃO 8: Sistema de Planejamento

### O que cria:
- ✅ Tabela `planos_curso` (Planos de Curso anuais)
- ✅ Tabela `planos_aula` (Planos de aula individuais)
- ✅ Tabela `plano_aula_atividades` (Vinculação plano ↔ atividade)
- ✅ ENUM `modalidade_organizativa`
- ✅ RLS Policies completas
- ✅ Triggers de updated_at

### Passo a passo:

1. **Abrir Supabase Dashboard**
   - Ir para: https://supabase.com/dashboard
   - Selecionar seu projeto

2. **Abrir SQL Editor**
   - Menu lateral → SQL Editor
   - Click em "New query"

3. **Copiar e Colar SQL**
   - Abrir arquivo: `supabase/migrations/20250108000008_planejamento_aulas.sql`
   - Copiar TODO o conteúdo
   - Colar no SQL Editor

4. **Executar**
   - Click em "Run" (▶️)
   - Aguardar mensagem: `✅ Migração 8 (Planejamento de Aulas) aplicada com sucesso!`

---

## 📊 MIGRAÇÃO 9: Sistema de Atividades

### O que cria:
- ✅ Tabela `atividades` (Banco de atividades)
- ✅ Tabela `atividade_likes` (Curtidas)
- ✅ Tabela `atividade_comments` (Comentários)
- ✅ ENUM `tipo_atividade`
- ✅ ENUM `nivel_dificuldade`
- ✅ RLS Policies completas
- ✅ Triggers automáticos (likes_count, uses_count)

### Passo a passo:

1. **Abrir nova query no SQL Editor**
   - Click em "New query"

2. **Copiar e Colar SQL**
   - Abrir arquivo: `supabase/migrations/20250108000009_atividades.sql`
   - Copiar TODO o conteúdo
   - Colar no SQL Editor

3. **Executar**
   - Click em "Run" (▶️)
   - Aguardar mensagem: `✅ Migração 9 (Sistema de Atividades) aplicada com sucesso!`

---

## ✅ VERIFICAR SE DEU CERTO

### No Supabase Dashboard:

1. **Verificar Tabelas**
   - Menu → Table Editor
   - Você deve ver as novas tabelas:
     - `planos_curso`
     - `planos_aula`
     - `plano_aula_atividades`
     - `atividades`
     - `atividade_likes`
     - `atividade_comments`

2. **Verificar Policies**
   - Abrir qualquer tabela nova
   - Tab "Policies"
   - Deve ter pelo menos 2-3 policies por tabela

---

## 🚀 TESTAR OS APPS

Após aplicar as migrações:

```bash
# Certifique-se de que está na raiz do projeto
cd C:\workspace\Inclusao\pei-collab

# Iniciar todos os apps
pnpm dev
```

### Apps rodando:
- ✅ Planejamento: http://localhost:5176
- ✅ Atividades: http://localhost:5177
- ✅ PEI Collab: http://localhost:8080
- ✅ Gestão: http://localhost:5174
- ✅ AEE: http://localhost:5175
- ✅ Landing: http://localhost:3000

---

## ❓ TROUBLESHOOTING

### Erro: "column already exists"
**Solução**: Tabela parcialmente criada. Execute o script de limpeza:

```sql
-- Limpar migração 8
DROP TABLE IF EXISTS "public"."plano_aula_atividades" CASCADE;
DROP TABLE IF EXISTS "public"."planos_aula" CASCADE;
DROP TABLE IF EXISTS "public"."planos_curso" CASCADE;
DROP TYPE IF EXISTS "public"."modalidade_organizativa" CASCADE;
```

Depois execute a migração 8 novamente.

### Erro: "policy already exists"
**Solução**: Execute antes da migração:

```sql
-- Para migração 8
DROP POLICY IF EXISTS "teacher_manage_own_planos_curso" ON "public"."planos_curso";
DROP POLICY IF EXISTS "coord_view_all_planos_curso" ON "public"."planos_curso";
DROP POLICY IF EXISTS "teacher_manage_own_planos_aula" ON "public"."planos_aula";
DROP POLICY IF EXISTS "coord_view_all_planos_aula" ON "public"."planos_aula";
DROP POLICY IF EXISTS "all_manage_vinculacao" ON "public"."plano_aula_atividades";

-- Para migração 9
DROP POLICY IF EXISTS "teacher_manage_own_atividades" ON "public"."atividades";
DROP POLICY IF EXISTS "all_view_public_atividades" ON "public"."atividades";
DROP POLICY IF EXISTS "teachers_view_network_atividades" ON "public"."atividades";
DROP POLICY IF EXISTS "all_view_likes" ON "public"."atividade_likes";
DROP POLICY IF EXISTS "users_manage_own_likes" ON "public"."atividade_likes";
DROP POLICY IF EXISTS "users_delete_own_likes" ON "public"."atividade_likes";
DROP POLICY IF EXISTS "all_view_comments" ON "public"."atividade_comments";
DROP POLICY IF EXISTS "users_create_comments" ON "public"."atividade_comments";
DROP POLICY IF EXISTS "users_manage_own_comments" ON "public"."atividade_comments";
```

---

## 📋 ORDEM CORRETA

Se for aplicar tudo do zero:

1. ✅ Migração 1: Tenant e base
2. ✅ Migração 2: Reuniões (meetings)
3. ✅ Migração 3: Avaliações PEI
4. ✅ Migração 4: Plano de AEE
5. ✅ Migração 5: Blog
6. ✅ Migração 6: Gestão Escolar
7. ✅ Migração 7: Multi-tenancy (se quiser subdomínios)
8. ✅ **Migração 8: Planejamento** ← NOVA
9. ✅ **Migração 9: Atividades** ← NOVA

---

## 🎉 SUCESSO!

Após aplicar as migrações e testar:

- ✅ 6 apps rodando
- ✅ 27+ tabelas no banco
- ✅ Sistema completo de educação
- ✅ Planejamento baseado na BNCC
- ✅ Banco de atividades compartilhadas

**Sistema PEI Collab expandido com sucesso! 🚀**

