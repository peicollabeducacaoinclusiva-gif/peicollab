# 🚀 Guia Completo: Aplicar Todas as Migrações

## 📋 Ordem de Execução Correta

Abra o **Supabase Dashboard** → **SQL Editor** e execute **na ordem**:

---

### ✅ **Migração 1: Profissional de Apoio**

```sql
-- Execute: supabase/migrations/20250108000001_support_professional.sql
```

**O que cria:**
- Tabela `support_professional_students`
- Tabela `support_professional_feedbacks`
- RLS policies

---

### ✅ **Migração 2: Sistema de Reuniões**

```sql
-- Execute: supabase/migrations/20250108000002_meetings_system_FIXED.sql
```

**O que cria:**
- Tabela `pei_meetings`
- Tabela `pei_meeting_peis`
- Tabela `pei_meeting_participants`
- RLS policies simplificadas

---

### ⚠️ **Migração 3: Avaliações do PEI** (TEM CONFLITO)

Esta migração pode dar erro se foi aplicada parcialmente. Use a versão CLEAN:

#### **Passo 3a: Limpar**

```sql
-- Execute: LIMPAR_TOTAL_MIGRATION_3.sql
```

#### **Passo 3b: Aplicar versão limpa**

```sql
-- Execute: supabase/migrations/20250108000003_pei_evaluation_CLEAN.sql
```

**O que cria:**
- Tabela `pei_evaluations`
- Tabela `evaluation_schedules`
- Função `auto_create_pei_evaluations()`
- Função `get_evaluation_statistics()`
- Dados iniciais: Cronograma 2025 (I, II, III Ciclo)

---

### ⚠️ **Migração 4: Plano de AEE** (TEM CONFLITO)

Esta migração também pode dar erro. Use a versão CLEAN:

#### **Passo 4a: Limpar**

```sql
-- Execute: LIMPAR_MIGRATION_4.sql
```

#### **Passo 4b: Aplicar versão limpa**

```sql
-- Execute: supabase/migrations/20250108000004_plano_aee_CLEAN.sql
```

**O que cria:**
- Tabela `plano_aee`
- Tabela `plano_aee_comments`
- Tabela `plano_aee_attachments`
- RLS policies simplificadas

---

### ⚠️ **Migração 5: Blog** (TEM CONFLITO - Opcional por ora)

Esta migração também pode dar erro. Use a versão CLEAN:

#### **Passo 5a: Limpar**

```sql
-- Execute: LIMPAR_MIGRATION_5.sql
```

#### **Passo 5b: Aplicar versão limpa**

```sql
-- Execute: supabase/migrations/20250108000005_blog_CLEAN.sql
```

**O que cria:**
- Tabela `blog_categories`
- Tabela `blog_posts`
- Tabela `blog_comments`
- Tabela `blog_post_likes`
- Tabela `blog_post_views`
- Funções de contadores automáticos

---

### ⚠️ **Migração 6: Gestão Escolar** (PODE TER CONFLITO)

Se der erro de policy já existente, use a versão CLEAN:

#### **Passo 6a: Limpar (se necessário)**

```sql
-- Execute: LIMPAR_MIGRATION_6.sql
```

#### **Passo 6b: Aplicar versão limpa**

```sql
-- Execute: supabase/migrations/20250108000006_gestao_escolar_CLEAN.sql
```

**O que cria:**
- ENUM `education_level`
- ENUM `professional_role`
- Tabela `professionals`
- Tabela `classes`
- Tabela `subjects`
- Tabela `class_subjects`
- Atualiza tabela `students` (20+ novos campos)
- Dados iniciais: 5 Campos BNCC + 27 Disciplinas

---

## 📊 Resumo Visual

```
1️⃣  support_professional.sql                      ✅ OK
2️⃣  meetings_system_FIXED.sql                     ✅ OK
3️⃣  LIMPAR_TOTAL_MIGRATION_3.sql                  ⚠️  LIMPAR PRIMEIRO
    → pei_evaluation_CLEAN.sql                    ✅ DEPOIS
4️⃣  LIMPAR_MIGRATION_4.sql                        ⚠️  LIMPAR PRIMEIRO
    → plano_aee_CLEAN.sql                         ✅ DEPOIS
5️⃣  LIMPAR_MIGRATION_5.sql                        ⚠️  LIMPAR PRIMEIRO
    → blog_CLEAN.sql                              ✅ DEPOIS (opcional)
6️⃣  LIMPAR_MIGRATION_6.sql (se necessário)        ⚠️  LIMPAR SE DER ERRO
    → gestao_escolar_CLEAN.sql                    ✅ DEPOIS
```

---

## 🔍 Verificação Completa

Depois de executar todas as migrações, verifique:

```sql
-- Listar todas as tabelas criadas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'support_professional_students',
    'support_professional_feedbacks',
    'pei_meetings',
    'pei_meeting_participants',
    'pei_evaluations',
    'evaluation_schedules',
    'plano_aee',
    'plano_aee_comments',
    'plano_aee_attachments',
    'professionals',
    'classes',
    'subjects',
    'class_subjects'
)
ORDER BY tablename;

-- Deve retornar 13 tabelas
```

---

## ✅ Checklist de Aplicação

- [ ] Migração 1: Profissional de Apoio
- [ ] Migração 2: Sistema de Reuniões
- [ ] Migração 3: Limpeza + Avaliações (versão CLEAN)
- [ ] Migração 4: Limpeza + Plano de AEE (versão CLEAN)
- [ ] Migração 5: Blog (opcional)
- [ ] Migração 6: Gestão Escolar
- [ ] Verificação: 13 tabelas criadas

---

## 🎯 Script de Verificação Final

Execute para confirmar que tudo está OK:

```sql
-- Contar tabelas criadas
SELECT COUNT(*) AS total_tabelas_criadas
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'support_professional_students',
    'support_professional_feedbacks',
    'pei_meetings',
    'pei_meeting_participants',
    'pei_evaluations',
    'evaluation_schedules',
    'plano_aee',
    'plano_aee_comments',
    'plano_aee_attachments',
    'professionals',
    'classes',
    'subjects',
    'class_subjects'
);
-- Resultado esperado: 13

-- Contar policies RLS
SELECT COUNT(*) AS total_policies_criadas
FROM pg_policies
WHERE tablename IN (
    'support_professional_students',
    'support_professional_feedbacks',
    'pei_meetings',
    'pei_meeting_participants',
    'pei_evaluations',
    'evaluation_schedules',
    'plano_aee',
    'plano_aee_comments',
    'plano_aee_attachments',
    'professionals',
    'classes',
    'subjects',
    'class_subjects'
);
-- Resultado esperado: 20+ policies

-- Verificar dados iniciais
SELECT 'Cronograma 2025' as tipo, COUNT(*) as registros
FROM evaluation_schedules 
WHERE academic_year = '2025'
UNION ALL
SELECT 'Campos BNCC' as tipo, COUNT(*) as registros
FROM subjects 
WHERE subject_type = 'campo_experiencia'
UNION ALL
SELECT 'Disciplinas' as tipo, COUNT(*) as registros
FROM subjects 
WHERE subject_type = 'disciplina';
-- Resultado esperado: 
--   Cronograma 2025: 3
--   Campos BNCC: 5
--   Disciplinas: 20+
```

---

## 🚨 Se Der Erro

### **Erro: "relation already exists"**
→ Execute o script de limpeza correspondente (LIMPAR_MIGRATION_X.sql)

### **Erro: "policy already exists"**
→ Use a versão CLEAN da migração

### **Erro: "column does not exist"**
→ A tabela foi criada parcialmente. Execute limpeza e versão CLEAN

---

## 🎉 Depois de Aplicar Tudo

Você poderá:

1. ✅ Rodar os apps: `pnpm dev`
2. ✅ Acessar Gestão Escolar: http://localhost:5174
3. ✅ Acessar Plano de AEE: http://localhost:5175
4. ✅ Acessar PEI Collab: http://localhost:8080

---

**Boa sorte com as migrações! 🚀**

**Última atualização**: 08 de Janeiro de 2025

