# 🔧 CORREÇÕES URGENTES PARA IMPORTAÇÃO

## 📊 **RESULTADO DA PRIMEIRA TENTATIVA**

```
Total processados: 29
✅ Sucesso:        0
❌ Erros:          29
```

---

## ⚠️ **2 PROBLEMAS IDENTIFICADOS**

### **PROBLEMA 1: Escolas não cadastradas** (75% dos erros)

```
❌ Escola não encontrada: ESCOLA MUNICIPAL EMIGDIA PEDREIRA DE SOUZA
❌ Escola não encontrada: ESCOLA MUNICIPAL DEPUTADO NÓIDE CERQUEIRA  
❌ Escola não encontrada: ESCOLA MUN PEDRO MOURA
```

**Escolas faltando: 7**

---

### **PROBLEMA 2: Tabela profiles sem coluna email** (25% dos erros)

```
❌ Could not find the 'email' column of 'profiles' in the schema cache
```

---

## ✅ **SOLUÇÕES (2 SQLs + 1 Re-execução)**

### **CORREÇÃO 1: Adicionar coluna email em profiles**

No Supabase SQL Editor, execute:

```sql
-- Arquivo: scripts/fix_profiles_add_email.sql

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Sincronizar emails de auth.users
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
AND p.email IS NULL;
```

✅ **Resultado:** Coluna email criada e sincronizada

---

### **CORREÇÃO 2: Cadastrar as 7 escolas**

No Supabase SQL Editor, execute:

```sql
-- Arquivo: scripts/cadastrar_escolas_sao_goncalo.sql
-- Copie e cole TODO o conteúdo
```

**⚠️ IMPORTANTE:** Substitua `v_tenant_id` pelo ID real do tenant de São Gonçalo.

**Para descobrir o tenant_id:**
```sql
SELECT id, network_name FROM tenants;
```

✅ **Resultado:** 7 escolas cadastradas

---

### **CORREÇÃO 3: Re-executar importação**

Após executar as 2 correções SQL:

```bash
node scripts/import_csv_pei.js PEIColaborativo-SGC-Respostasaoformulário1.csv
```

---

## 📋 **ESCOLAS A CADASTRAR**

| # | Nome da Escola | Alunos CSV |
|---|----------------|------------|
| 1 | ESCOLA MUNICIPAL EMIGDIA PEDREIRA DE SOUZA | 2 |
| 2 | ESCOLA MUNICIPAL MANOEL FRANCISCO DE OLIVEIRA | 2 |
| 3 | ESCOLA MUNICIPAL DEPUTADO NÓIDE CERQUEIRA | 6 |
| 4 | ESCOLA MUNICIPAL FRANCISCO JOSÉ DA SILVA | 11 |
| 5 | ESCOLA MUNICIPAL PEDRO MOURA | 4 |
| 6 | CRECHE ESCOLA TIA MARIA ANTÔNIA FALCÃO | 2 |
| 7 | ESCOLA MUNICIPAL PROFESSORA FELICÍSSIMA GUIMARÃES PINTO | 1 |

**Total:** 28 alunos (de 29 linhas do CSV - 1 linha tem dados incompletos)

---

## ⚡ **CHECKLIST RÁPIDO**

```sql
-- 1. ✅ Adicionar coluna email em profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
UPDATE profiles p SET email = au.email FROM auth.users au WHERE p.id = au.id;

-- 2. ✅ Descobrir tenant_id
SELECT id, network_name FROM tenants;
-- Copiar o ID

-- 3. ✅ Cadastrar escolas (substituir v_tenant_id no script)
-- Execute: scripts/cadastrar_escolas_sao_goncalo.sql
```

```bash
# 4. ✅ Re-executar importação
$env:VITE_SUPABASE_URL="https://fximylewmvsllkdczovj.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY5NjQ3MiwiZXhwIjoyMDc3MjcyNDcyfQ.ezYPOGMO2ik-VaiNoBrJ7cKivms3SiZsJ5zN0Fhm3Fg"
node scripts/import_csv_pei.js PEIColaborativo-SGC-Respostasaoformulário1.csv
```

---

## 📊 **RESULTADO ESPERADO (após correções)**

```
╔══════════════════════════════════════════════════════════╗
║  📊 RELATÓRIO FINAL                                     ║
╚══════════════════════════════════════════════════════════╝

  Total processados: 29
  ✅ Sucesso:        28-29
  ❌ Erros:          0-1
  
  🎯 Metas geradas:  80-90
  👥 Coords criados: 11
```

---

## 🎯 **PRÓXIMA EXECUÇÃO**

Depois de executar as correções SQL, apenas rode:

```bash
node scripts/import_csv_pei.js PEIColaborativo-SGC-Respostasaoformulário1.csv
```

**As variáveis de ambiente já estarão configuradas no PowerShell!**

---

**📝 Execute as 2 correções SQL e depois re-execute a importação!**




