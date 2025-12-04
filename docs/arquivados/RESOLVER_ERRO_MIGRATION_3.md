# ⚠️ Resolver Erro na Migração 3

## 🔴 Erro Encontrado

```
Error: Failed to run sql query: ERROR: 42710: 
policy "teachers_manage_own_pei_evaluations" for table "pei_evaluations" already exists
```

## 🎯 Causa

A migração 3 foi executada parcialmente, deixando algumas policies criadas. Quando tentamos executar novamente, o erro ocorre porque o SQL tenta criar policies que já existem.

---

## ✅ Solução (2 Opções)

### **Opção 1: Limpeza Completa (Recomendado se não tiver dados importantes)**

#### **Passo 1: Execute o script de limpeza**

Vá ao **Supabase Dashboard** → **SQL Editor** e execute:

📄 **Arquivo**: `LIMPAR_MIGRATION_3.sql`

```sql
-- Este script vai:
-- 1. Remover todas as policies
-- 2. Limpar os dados das tabelas (TRUNCATE)
-- 3. Deixar pronto para reaplicar
```

#### **Passo 2: Execute a migração corrigida**

Depois da limpeza, execute:

📄 **Arquivo**: `supabase/migrations/20250108000003_pei_evaluation_FIXED.sql`

```sql
-- Esta é a versão FIXED que usa DROP POLICY IF EXISTS
-- Não vai dar erro mesmo se as policies já existirem
```

---

### **Opção 2: Apenas Corrigir as Policies (Se tiver dados para preservar)**

Execute apenas este SQL no **Supabase Dashboard**:

```sql
-- Remover policies problemáticas
DROP POLICY IF EXISTS "teachers_manage_own_pei_evaluations" ON "public"."pei_evaluations";
DROP POLICY IF EXISTS "coordinators_manage_all_evaluations" ON "public"."pei_evaluations";
DROP POLICY IF EXISTS "coordinators_manage_evaluations" ON "public"."pei_evaluations";
DROP POLICY IF EXISTS "directors_view_school_evaluations" ON "public"."pei_evaluations";
DROP POLICY IF EXISTS "all_view_evaluations" ON "public"."pei_evaluations";

DROP POLICY IF EXISTS "coordinators_manage_schedules" ON "public"."evaluation_schedules";
DROP POLICY IF EXISTS "directors_manage_school_schedules" ON "public"."evaluation_schedules";
DROP POLICY IF EXISTS "all_view_schedules" ON "public"."evaluation_schedules";

-- Agora execute a migração FIXED
```

Depois, execute: `supabase/migrations/20250108000003_pei_evaluation_FIXED.sql`

---

## 📋 Ordem de Execução Completa

Se você está aplicando TODAS as migrações pela primeira vez:

```sql
1. ✅ 20250108000001_support_professional.sql
2. ✅ 20250108000002_meetings_system_FIXED.sql
3. ❌ 20250108000003_pei_evaluation.sql (COM ERRO)
   
   👉 SOLUÇÃO:
   
   3a. Execute: LIMPAR_MIGRATION_3.sql
   3b. Execute: 20250108000003_pei_evaluation_FIXED.sql ✅
   
4. ⏳ 20250108000004_plano_aee.sql
5. ⏳ 20250108000005_blog.sql
6. ⏳ 20250108000006_gestao_escolar.sql
```

---

## 🔍 Verificar se Foi Aplicado Corretamente

Depois de executar a migração FIXED, verifique:

```sql
-- Verificar se as tabelas existem
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('pei_evaluations', 'evaluation_schedules');

-- Verificar se as policies estão ativas
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('pei_evaluations', 'evaluation_schedules');

-- Verificar se tem dados iniciais (cronograma 2025)
SELECT * FROM evaluation_schedules;
```

**Resultado esperado**:
- 2 tabelas criadas
- 7 policies ativas
- 3 registros no cronograma (I, II, III Ciclo de 2025)

---

## 🎉 Próximos Passos

Depois de resolver, continue com as migrações restantes:

```bash
# No Supabase Dashboard:
4. ✅ Execute: 20250108000004_plano_aee.sql
5. ✅ Execute: 20250108000005_blog.sql
6. ✅ Execute: 20250108000006_gestao_escolar.sql
```

---

## 📞 Se o Erro Persistir

Se mesmo com a versão FIXED o erro continuar:

1. **Verifique se você está no projeto correto** no Supabase
2. **Confirme que a migração 1 e 2 foram aplicadas** antes
3. **Tente executar o SQL linha por linha** para identificar qual parte está falhando

---

## ✅ Resumo Rápido

```bash
# OPÇÃO RÁPIDA (sem dados importantes):

1. Execute no Supabase: LIMPAR_MIGRATION_3.sql
2. Execute no Supabase: 20250108000003_pei_evaluation_FIXED.sql
3. Pronto! ✅
```

---

**Última atualização**: 08 de Janeiro de 2025






