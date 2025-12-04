# ⚡ INSTRUÇÕES FINAIS: Importação São Gonçalo

## 📋 **CHECKLIST (3 Passos)**

### **PASSO 1: Adicionar coluna email em profiles**

No Supabase SQL Editor, execute:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id;
```

✅ **Resultado:** Coluna email criada

---

### **PASSO 2: Re-executar função de importação (ATUALIZADA)**

A função SQL foi corrigida para normalizar "MUN" → "MUNICIPAL".

No Supabase SQL Editor, execute:

```sql
-- Dropar função antiga
DROP FUNCTION IF EXISTS import_pei_from_csv_row CASCADE;

-- Copiar e colar TODO o conteúdo de:
-- scripts/add_auto_coordinator_creation.sql
```

✅ **Resultado:** Função atualizada com normalização de nomes

---

### **PASSO 3: Cadastrar escolas (versão corrigida)**

No Supabase SQL Editor, execute:

```sql
-- Primeiro, deletar versão abreviada se foi criada
DELETE FROM schools WHERE school_name = 'ESCOLA MUN PEDRO MOURA';

-- Depois, executar TODO o conteúdo de:
-- scripts/cadastrar_escolas_sao_goncalo.sql
```

✅ **Resultado:** 7 escolas cadastradas (todas com "ESCOLA MUNICIPAL")

---

### **PASSO 4: Rodar Importação**

```bash
node scripts/import_csv_pei.js PEIColaborativo-SGC-Respostasaoformulário1.csv
```

---

## 🔧 **MUDANÇAS IMPLEMENTADAS**

### **1. Normalização de Nomes de Escola:**

```sql
-- ANTES: Buscava literal
WHERE school_name LIKE '%ESCOLA MUN PEDRO MOURA%'
-- ❌ Não encontrava "ESCOLA MUNICIPAL PEDRO MOURA"

-- AGORA: Normaliza antes de buscar
v_normalized_school_name := REPLACE(p_school_name, ' MUN ', ' MUNICIPAL ')
WHERE school_name LIKE '%ESCOLA MUNICIPAL PEDRO MOURA%'
-- ✅ Encontra!
```

### **2. Cadastro de Escolas:**

```sql
-- ANTES: Cadastrava ambas
'ESCOLA MUN PEDRO MOURA'
'ESCOLA MUNICIPAL PEDRO MOURA'

-- AGORA: Apenas padrão
'ESCOLA MUNICIPAL PEDRO MOURA'
```

---

## 📊 **ESCOLAS CADASTRADAS (Padrão Correto)**

1. ESCOLA MUNICIPAL EMIGDIA PEDREIRA DE SOUZA
2. ESCOLA MUNICIPAL MANOEL FRANCISCO DE OLIVEIRA
3. ESCOLA MUNICIPAL DEPUTADO NÓIDE CERQUEIRA
4. ESCOLA MUNICIPAL FRANCISCO JOSÉ DA SILVA
5. ESCOLA MUNICIPAL PEDRO MOURA ✅ (corrigido)
6. CRECHE ESCOLA TIA MARIA ANTÔNIA FALCÃO
7. ESCOLA MUNICIPAL PROFESSORA FELICÍSSIMA GUIMARÃES PINTO

**Total:** 7 escolas (padrão "ESCOLA MUNICIPAL")

---

## 🚀 **EXECUTAR AGORA**

```bash
# Após executar os 3 SQLs acima:
node scripts/import_csv_pei.js PEIColaborativo-SGC-Respostasaoformulário1.csv
```

**Resultado esperado:**
```
✅ Sucesso: 28-29 PEIs
🎯 Metas: ~80-90
```

---

**📝 Execute os 3 passos SQL acima e depois rode a importação!**

