# 🔍 Diagnóstico: Tokens Não Aparecem na Aba

**Situação:** Token foi gerado, mas não aparece na lista  
**Status:** 🔧 **EM DIAGNÓSTICO**

---

## 📋 Checklist Rápido

Execute estes passos para identificar o problema:

### ✅ **Passo 1: Abrir Console do Navegador**

1. Abra o dashboard do coordenador
2. Pressione **F12** (DevTools)
3. Vá para a aba **Console**
4. Acesse a aba **"Tokens"** do dashboard
5. Verifique as mensagens no console

#### **O que procurar:**

```javascript
// ✅ Deve aparecer:
🔑 FamilyTokenManager: Carregando tokens...
📌 Filtros: { studentId: undefined, peiId: undefined }
📊 Resultado da query: { data: [...], error: null }
✅ Tokens processados: 1 (ou mais)

// ❌ Se aparecer erro:
❌ Erro na query: { message: "...", code: "..." }
💥 Erro ao carregar tokens: ...
```

---

## 🧪 Testes SQL no Supabase

### **Teste 1: Verificar se os tokens existem**

```sql
-- No SQL Editor do Supabase
SELECT 
  id,
  student_id,
  pei_id,
  expires_at,
  used,
  current_uses,
  max_uses,
  created_at
FROM family_access_tokens
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado:** Deve retornar os tokens gerados

---

### **Teste 2: Verificar a Policy RLS**

```sql
-- Verificar se a policy existe
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'family_access_tokens'
  AND policyname = 'coordinator_can_manage_tokens';
```

**Resultado esperado:**
```
policyname: coordinator_can_manage_tokens
cmd: ALL
```

---

### **Teste 3: Simular Query como Coordenador**

```sql
-- Substitua <coordinator_id> pelo ID real do coordenador
-- Substitua <school_id> pelo ID da escola

-- Ver quais tokens o coordenador pode acessar
SELECT 
  fat.id,
  fat.student_id,
  s.name as student_name,
  s.school_id,
  fat.expires_at,
  fat.used
FROM family_access_tokens fat
JOIN students s ON s.id = fat.student_id
WHERE s.school_id = '<school_id>';  -- ID da escola do coordenador
```

**Resultado esperado:** Deve retornar os tokens dos alunos da escola

---

### **Teste 4: Verificar RLS em Students**

```sql
-- Verificar se coordenador pode ver students
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'students'
  AND policyname LIKE '%coordinator%';
```

---

## 🔧 Possíveis Causas e Soluções

### **Causa 1: Policy RLS em Students Bloqueando**

**Problema:** O JOIN com `students` pode estar falhando porque coordenador não tem permissão para ver a tabela `students`.

**Solução:**

```sql
-- Verificar policy de students para coordenadores
SELECT * FROM pg_policies 
WHERE tablename = 'students' 
  AND (policyname LIKE '%coordinator%' OR policyname LIKE '%coord%');

-- Se não houver policy, criar:
CREATE POLICY "coordinator_can_view_students" 
ON public.students
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'coordinator'
      AND students.school_id = p.school_id
  )
);
```

---

### **Causa 2: Policy RLS em Profiles Bloqueando**

**Problema:** O JOIN com `profiles` (created_by) pode estar falhando.

**Solução:**

```sql
-- Verificar policy de profiles para coordenadores
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
  AND policyname LIKE '%coordinator%';

-- Se não houver policy, criar:
CREATE POLICY "coordinator_can_view_profiles" 
ON public.profiles
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'coordinator'
      AND profiles.school_id = (
        SELECT school_id FROM public.profiles WHERE id = auth.uid()
      )
  )
);
```

---

### **Causa 3: Erro no Console não Sendo Exibido**

**Problema:** O componente está silenciando erros.

**Solução:** Já adicionamos logs detalhados. Verifique o console do navegador (F12 → Console).

---

## 🚀 Solução Rápida (Query Sem JOINs)

Se o problema for com os JOINs, podemos buscar os dados separadamente:

```sql
-- Criar uma view materializada (opcional, mas melhora performance)
CREATE OR REPLACE VIEW coordinator_tokens_view AS
SELECT 
  fat.id,
  fat.student_id,
  fat.pei_id,
  fat.token_hash,
  fat.expires_at,
  fat.used,
  fat.max_uses,
  fat.current_uses,
  fat.last_accessed_at,
  fat.created_by,
  fat.created_at,
  s.name as student_name,
  p.full_name as creator_name
FROM family_access_tokens fat
LEFT JOIN students s ON s.id = fat.student_id
LEFT JOIN profiles p ON p.id = fat.created_by;

-- Dar permissão para coordenadores
GRANT SELECT ON coordinator_tokens_view TO authenticated;
```

---

## 📊 Script de Diagnóstico Completo

Cole este script no **SQL Editor do Supabase** para diagnóstico completo:

```sql
-- ================================================
-- DIAGNÓSTICO COMPLETO: Tokens do Coordenador
-- ================================================

-- 1. Verificar se há tokens no banco
SELECT 
  COUNT(*) as total_tokens,
  COUNT(CASE WHEN used = false THEN 1 END) as tokens_nao_usados,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as tokens_nao_expirados
FROM family_access_tokens;

-- 2. Listar tokens recentes
SELECT 
  id,
  student_id,
  expires_at,
  used,
  current_uses || '/' || max_uses as usos,
  created_at
FROM family_access_tokens
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar policies de family_access_tokens
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%coordinator%' THEN '✅ Coordenador'
    WHEN policyname LIKE '%secretary%' THEN '✅ Secretário'
    WHEN policyname LIKE '%director%' THEN '✅ Diretor'
    ELSE '❓ Outro'
  END as tipo
FROM pg_policies
WHERE tablename = 'family_access_tokens'
ORDER BY policyname;

-- 4. Verificar policies de students
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'students'
  AND policyname LIKE '%coordinator%';

-- 5. Verificar policies de profiles
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname LIKE '%coordinator%';

-- 6. Verificar school_id do coordenador (substitua <coordinator_user_id>)
-- SELECT school_id FROM profiles WHERE id = '<coordinator_user_id>';

-- 7. Verificar alunos da escola do coordenador
-- SELECT COUNT(*) as total_alunos 
-- FROM students 
-- WHERE school_id = '<school_id_do_coordenador>';

-- ================================================
-- FIM DO DIAGNÓSTICO
-- ================================================
```

---

## 🎯 Ações Imediatas

### **1. Abrir Console do Navegador (F12)**

Vá para a aba "Tokens" e veja as mensagens:

```javascript
// Se aparecer:
✅ Tokens processados: 0

// Significa que a query funcionou mas não retornou dados
// Pode ser problema de RLS
```

### **2. Verificar Erro no Console**

```javascript
// Se aparecer:
❌ Erro na query: { 
  message: "permission denied for table students",
  code: "42501"
}

// Significa que falta policy RLS em students
```

### **3. Executar Script de Diagnóstico SQL**

Cole o script acima no SQL Editor e analise os resultados.

---

## 📝 Reportar Resultados

**Por favor, compartilhe:**

1. **Mensagens do Console** (F12 → Console)
   ```
   Cole aqui o que aparecer no console
   ```

2. **Resultado do Teste 1** (tokens no banco)
   ```sql
   Total de tokens encontrados: ?
   ```

3. **Resultado do Teste 2** (policy existe?)
   ```
   Policy encontrada: Sim/Não
   ```

4. **Erros no Console**
   ```
   Algum erro apareceu? Cole aqui
   ```

Com essas informações, poderei criar a correção específica! 🎯

---

**Data:** 06/11/2024  
**Arquivo:** DIAGNOSTICO_TOKENS_NAO_APARECEM.md  
**Próximos Passos:** Executar diagnóstico e reportar resultados

