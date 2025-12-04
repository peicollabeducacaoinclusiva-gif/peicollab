# 🔧 RESOLVER: Erro "function name is not unique"

## ❌ **ERRO ENCONTRADO**

```
ERROR: 42725: function name "import_pei_from_csv_row" is not unique
HINT: Specify the argument list to select the function unambiguously.
```

**Causa:** A função foi criada duas vezes com assinaturas diferentes (primeira migração + segunda migração).

---

## ✅ **SOLUÇÃO RÁPIDA (3 Passos)**

### **PASSO 1: Dropar Função Antiga**

No Supabase SQL Editor, execute:

```sql
-- Dropar todas as versões da função
DROP FUNCTION IF EXISTS import_pei_from_csv_row CASCADE;
```

✅ **Resultado esperado:** `DROP FUNCTION`

---

### **PASSO 2: Executar Migração Principal**

Cole e execute TODO o conteúdo de:

```sql
scripts/add_diagnosis_fields_and_import_logic.sql
```

✅ **Resultado esperado:** 
```
✅ Migração concluída com sucesso!
  1. ✅ Criada tabela pei_import_batches
  2. ✅ Criada tabela pei_goal_templates (BNCC)
  ...
```

---

### **PASSO 3: Dropar + Executar Migração de Coordenadores**

```sql
-- A) Dropar função criada no passo 2
DROP FUNCTION IF EXISTS import_pei_from_csv_row CASCADE;

-- B) Cole TODO o conteúdo de:
-- scripts/add_auto_coordinator_creation.sql
```

✅ **Resultado esperado:**
```
✅ Funções de auto-criação de coordenadores instaladas!
  1. ✅ create_coordinator_from_email()
  2. ✅ get_or_create_coordinator()
  3. ✅ import_pei_from_csv_row() - ATUALIZADA
  4. ✅ list_import_coordinators()
```

---

## 📋 **VERIFICAÇÃO**

Após executar os 3 passos, verifique se tudo está OK:

```sql
-- Verificar se função foi criada corretamente
SELECT 
  proname,
  pronargs as num_args,
  pg_get_function_arguments(oid) as args
FROM pg_proc 
WHERE proname = 'import_pei_from_csv_row';
```

**Resultado esperado:**
```
proname                  | num_args | args
-------------------------|----------|--------------------------------------
import_pei_from_csv_row  | 19       | p_coordinator_email text, 
                         |          | p_school_name text,
                         |          | p_student_name text, ...
                         |          | p_auto_create_coordinator boolean
```

---

## ⚡ **ALTERNATIVA: Script Unificado**

Se preferir executar tudo de uma vez, use este script:

```sql
-- ============================================================================
-- SCRIPT UNIFICADO - Executar de uma vez só
-- ============================================================================

-- 1. Limpar funções antigas
DROP FUNCTION IF EXISTS import_pei_from_csv_row CASCADE;
DROP FUNCTION IF EXISTS generate_goals_from_diagnosis CASCADE;
DROP FUNCTION IF EXISTS generate_referrals_from_diagnosis CASCADE;
DROP FUNCTION IF EXISTS transform_csv_barriers CASCADE;
DROP FUNCTION IF EXISTS create_coordinator_from_email CASCADE;
DROP FUNCTION IF EXISTS get_or_create_coordinator CASCADE;

-- 2. Copiar e colar AQUI o conteúdo de:
--    scripts/add_diagnosis_fields_and_import_logic.sql

-- (Cole o conteúdo aqui)

-- 3. Dropar função antes de recriar
DROP FUNCTION IF EXISTS import_pei_from_csv_row CASCADE;

-- 4. Copiar e colar AQUI o conteúdo de:
--    scripts/add_auto_coordinator_creation.sql

-- (Cole o conteúdo aqui)

-- 5. Verificação
SELECT COUNT(*) FROM pei_goal_templates; -- Deve retornar 8
```

---

## 🎯 **POR QUE ISSO ACONTECEU?**

### **Estrutura dos Scripts:**

**Script 1** (`add_diagnosis_fields_and_import_logic.sql`):
```sql
CREATE OR REPLACE FUNCTION import_pei_from_csv_row(
  p_coordinator_email TEXT,
  ...
  p_batch_id UUID DEFAULT NULL
  -- 18 parâmetros
) ...
```

**Script 2** (`add_auto_coordinator_creation.sql`):
```sql
CREATE OR REPLACE FUNCTION import_pei_from_csv_row(
  p_coordinator_email TEXT,
  ...
  p_batch_id UUID DEFAULT NULL,
  p_auto_create_coordinator BOOLEAN DEFAULT true  -- ⭐ NOVO!
  -- 19 parâmetros
) ...
```

**Problema:** PostgreSQL não permite `CREATE OR REPLACE` quando muda número de parâmetros.

**Solução:** `DROP` antes de `CREATE`.

---

## 📊 **STATUS APÓS CORREÇÃO**

Após executar corretamente:

| Item | Status |
|------|--------|
| Tabela `pei_import_batches` | ✅ Criada |
| Tabela `pei_goal_templates` | ✅ Criada (8 templates) |
| Função `generate_goals_from_diagnosis()` | ✅ Criada |
| Função `generate_referrals_from_diagnosis()` | ✅ Criada |
| Função `transform_csv_barriers()` | ✅ Criada |
| Função `create_coordinator_from_email()` | ✅ Criada |
| Função `get_or_create_coordinator()` | ✅ Criada |
| Função `import_pei_from_csv_row()` | ✅ Criada (19 params) |
| Função `list_import_coordinators()` | ✅ Criada |

**✅ Sistema pronto para importação!**

---

## 🚀 **PRÓXIMOS PASSOS**

Após resolver o erro:

```bash
# 1. Instalar dependência
npm install @types/papaparse

# 2. Executar importação
npx ts-node scripts/import_csv_pei.ts PEIColaborativo-SGC-Respostasaoformulário1.csv

# 3. Copiar credenciais do relatório
```

---

**✅ Problema resolvido! Execute os 3 passos acima.**

