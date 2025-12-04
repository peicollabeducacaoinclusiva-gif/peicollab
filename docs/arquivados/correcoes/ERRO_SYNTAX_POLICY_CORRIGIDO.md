# 🔧 Erro de Sintaxe SQL Corrigido

**Erro:** `syntax error at or near "NOT"`  
**Linha:** `CREATE POLICY IF NOT EXISTS`  
**Status:** ✅ **CORRIGIDO**

---

## 🐛 O Problema

### Erro Original

```sql
CREATE POLICY IF NOT EXISTS "coordinator_can_manage_tokens" 
ON public.family_access_tokens
FOR ALL 
USING (...);
```

### Mensagem de Erro

```
Error: Failed to run sql query: 
ERROR: 42601: syntax error at or near "NOT" 
LINE 13: CREATE POLICY IF NOT EXISTS "coordinator_can_manage_tokens"
```

---

## 🔍 Causa do Erro

O PostgreSQL **NÃO suporta** a cláusula `IF NOT EXISTS` para `CREATE POLICY`.

### Comandos que Suportam `IF NOT EXISTS`:

✅ `CREATE TABLE IF NOT EXISTS`  
✅ `CREATE INDEX IF NOT EXISTS`  
✅ `CREATE FUNCTION IF NOT EXISTS`  
✅ `CREATE SCHEMA IF NOT EXISTS`  

### Comandos que NÃO Suportam:

❌ `CREATE POLICY IF NOT EXISTS` ← **Não existe!**  
❌ `ALTER POLICY IF NOT EXISTS` ← **Não existe!**

---

## ✅ Solução Implementada

### Código Corrigido

```sql
-- ❌ ANTES (Não funciona)
CREATE POLICY IF NOT EXISTS "coordinator_can_manage_tokens" 
ON public.family_access_tokens
FOR ALL USING (...);

-- ✅ DEPOIS (Corrigido)
-- Remover policy se já existir
DROP POLICY IF EXISTS "coordinator_can_manage_tokens" 
ON public.family_access_tokens;

-- Criar policy
CREATE POLICY "coordinator_can_manage_tokens" 
ON public.family_access_tokens
FOR ALL USING (...);
```

### Por que funciona?

1. **`DROP POLICY IF EXISTS`** é suportado ✅
2. Remove a policy caso ela já exista
3. **`CREATE POLICY`** (sem `IF NOT EXISTS`) então cria a policy nova
4. Se a policy não existia, o `DROP` não faz nada (não gera erro)
5. Se a policy existia, o `DROP` remove e o `CREATE` recria

---

## 📋 Comparação

| Comando | Sintaxe | Suporte PostgreSQL |
|---------|---------|-------------------|
| Criar tabela | `CREATE TABLE IF NOT EXISTS` | ✅ Suportado |
| Criar policy | `CREATE POLICY IF NOT EXISTS` | ❌ **NÃO suportado** |
| Remover policy | `DROP POLICY IF EXISTS` | ✅ Suportado |
| Alterar policy | `CREATE OR REPLACE POLICY` | ❌ **NÃO existe** |

---

## 🔧 Padrão Recomendado

### Para Policies (e outros objetos que não suportam `IF NOT EXISTS`)

```sql
-- Padrão: DROP + CREATE
DROP POLICY IF EXISTS "nome_da_policy" ON tabela;
CREATE POLICY "nome_da_policy" ON tabela FOR ALL USING (...);
```

### Para Tabelas e Índices

```sql
-- Pode usar IF NOT EXISTS diretamente
CREATE TABLE IF NOT EXISTS tabela (...);
CREATE INDEX IF NOT EXISTS idx_nome ON tabela(coluna);
```

---

## 📁 Arquivos Corrigidos

### 1. `supabase/migrations/20250206000001_add_coordinator_tokens_policy.sql`

**Mudança:**
```diff
- CREATE POLICY IF NOT EXISTS "coordinator_can_manage_tokens"
+ DROP POLICY IF EXISTS "coordinator_can_manage_tokens" ON public.family_access_tokens;
+ CREATE POLICY "coordinator_can_manage_tokens"
```

### 2. `APLICAR_AGORA_TOKENS_COORDENADOR.md`

Código SQL atualizado com a sintaxe correta.

---

## 🚀 Como Aplicar Agora

### Método 1: Copiar da Migração (Recomendado)

1. Abra: `supabase/migrations/20250206000001_add_coordinator_tokens_policy.sql`
2. Copie **TODO** o conteúdo do arquivo
3. Cole no **SQL Editor do Supabase**
4. Clique **"Run"**

### Método 2: Copiar do Guia Rápido

1. Abra: `APLICAR_AGORA_TOKENS_COORDENADOR.md`
2. Copie o código SQL da seção "Passo 1"
3. Cole no **SQL Editor do Supabase**
4. Clique **"Run"**

### Resultado Esperado

```
NOTICE: Policy RLS para coordenadores adicionada com sucesso!
NOTICE: Coordenadores agora podem ver e gerenciar tokens de acesso familiar.

Query executed successfully
```

---

## 🧪 Testar se Funcionou

### 1. Verificar Policy Criada

```sql
-- No SQL Editor do Supabase
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE policyname = 'coordinator_can_manage_tokens';
```

**Resultado esperado:**
```
policyname                    | coordinator_can_manage_tokens
tablename                     | family_access_tokens
cmd                          | ALL
```

### 2. Testar no Dashboard

1. Login como coordenador
2. Acesse a aba **"Tokens"**
3. Veja a lista de tokens ✅

---

## 💡 Lições Aprendidas

### 1. PostgreSQL != MySQL/MariaDB

No MySQL/MariaDB:
```sql
CREATE POLICY IF NOT EXISTS ... -- ✅ Funciona
```

No PostgreSQL:
```sql
CREATE POLICY IF NOT EXISTS ... -- ❌ Não funciona
```

### 2. Sempre use `DROP IF EXISTS` + `CREATE`

Para objetos que não suportam `IF NOT EXISTS`:
```sql
-- Padrão seguro
DROP [OBJETO] IF EXISTS nome;
CREATE [OBJETO] nome ...;
```

### 3. Documentação Oficial

- PostgreSQL Policies: https://www.postgresql.org/docs/current/sql-createpolicy.html
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

---

## 🚨 Outros Comandos que NÃO Suportam `IF NOT EXISTS`

```sql
-- ❌ Não funcionam no PostgreSQL
CREATE POLICY IF NOT EXISTS ...
CREATE TRIGGER IF NOT EXISTS ...
CREATE RULE IF NOT EXISTS ...
ALTER POLICY IF NOT EXISTS ...
```

### Solução para Todos

```sql
-- ✅ Use este padrão
DROP [OBJETO] IF EXISTS nome;
CREATE [OBJETO] nome ...;
```

---

## ✅ Checklist de Validação

- [x] ✅ Erro de sintaxe identificado
- [x] ✅ Causa raiz documentada
- [x] ✅ Código corrigido na migração
- [x] ✅ Código corrigido no guia rápido
- [x] ✅ Documentação criada
- [ ] ⏸️ **Migração aplicada no Supabase** ← **PRÓXIMO PASSO**
- [ ] ⏸️ Tokens aparecem no dashboard

---

## 📞 Ainda com Problemas?

### Erro: "permission denied for table family_access_tokens"

**Solução:**
Verifique se o usuário tem permissões:
```sql
GRANT ALL ON public.family_access_tokens TO authenticated;
```

### Erro: "relation 'family_access_tokens' does not exist"

**Solução:**
A tabela não existe. Aplique as migrações anteriores primeiro:
```bash
supabase db push
```

### Erro: "policy already exists"

**Solução:**
O código já tem `DROP POLICY IF EXISTS`, então não deveria dar erro.
Se der, remova manualmente:
```sql
DROP POLICY "coordinator_can_manage_tokens" ON public.family_access_tokens;
```
E rode a migração novamente.

---

**🎉 Erro Corrigido! Agora é só aplicar a migração!**

---

**Data:** 06/11/2024  
**Versão:** 2.1  
**Arquivos Modificados:**
- `supabase/migrations/20250206000001_add_coordinator_tokens_policy.sql` ✅
- `APLICAR_AGORA_TOKENS_COORDENADOR.md` ✅

