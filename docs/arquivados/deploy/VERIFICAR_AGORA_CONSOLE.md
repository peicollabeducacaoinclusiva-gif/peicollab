# ⚡ VERIFICAR AGORA: Console do Navegador

**Tempo:** 30 segundos  
**Objetivo:** Ver o que está acontecendo quando busca os tokens

---

## 🚀 Passo a Passo Rápido

### 1️⃣ **Abrir DevTools**
- Pressione **F12** no navegador
- Ou: Botão direito → "Inspecionar"

### 2️⃣ **Ir para Console**
- Clique na aba **"Console"** no DevTools

### 3️⃣ **Limpar Console**
- Clique no ícone 🚫 (clear) ou pressione Ctrl+L

### 4️⃣ **Acessar Aba "Tokens"**
- No dashboard do coordenador
- Clique na aba **"Tokens"**

### 5️⃣ **Ver as Mensagens**

---

## 📊 O Que Deve Aparecer

### ✅ **Se Estiver Funcionando:**

```
🔑 FamilyTokenManager: Carregando tokens...
📌 Filtros: {studentId: undefined, peiId: undefined}
📊 Resultado da query: {data: Array(2), error: null}
  ▶ data: Array(2)
      0: {id: "xxx", student_id: "yyy", ...}
      1: {id: "zzz", student_id: "www", ...}
  ▶ error: null
✅ Tokens processados: 2
```

### ❌ **Se Houver Erro (Copie e Me Envie):**

```
🔑 FamilyTokenManager: Carregando tokens...
📌 Filtros: {studentId: undefined, peiId: undefined}
📊 Resultado da query: {data: null, error: {...}}
  ▶ error:
      code: "42501"
      message: "permission denied for table students"
      details: "..."
      hint: "..."
❌ Erro na query: {...}
💥 Erro ao carregar tokens: {...}
```

---

## 🎯 Me Envie Essas Informações:

### **1. Screenshot do Console**
Tire um print do console com as mensagens

### **2. Ou Cole o Texto:**

```
[Cole aqui exatamente o que apareceu no console]
```

### **3. Informações Adicionais:**

- **Quantos tokens você gerou?** _____
- **Para qual(is) aluno(s)?** _____
- **Quando foram gerados?** _____

---

## 🔍 Testes Adicionais (Se Houver Erro)

### **Teste no SQL Editor do Supabase:**

1. Vá para: https://app.supabase.com
2. SQL Editor
3. Cole e Execute:

```sql
-- Ver todos os tokens
SELECT COUNT(*) as total FROM family_access_tokens;

-- Ver tokens recentes
SELECT 
  id,
  student_id,
  expires_at,
  used,
  created_at
FROM family_access_tokens
ORDER BY created_at DESC
LIMIT 5;
```

**Me envie os resultados:**
```
Total de tokens: _____
Últimos 5 tokens: [cole a saída]
```

---

## 💡 Solução Rápida (Se Error: "permission denied")

Se aparecer erro de permissão, execute no SQL Editor:

```sql
-- Adicionar policy para coordenadores verem students
DROP POLICY IF EXISTS "coordinator_can_view_students" ON public.students;

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

-- Adicionar policy para coordenadores verem profiles
DROP POLICY IF EXISTS "coordinator_can_view_profiles" ON public.profiles;

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

Depois recarregue o dashboard (F5).

---

**🎯 Com essas informações vou corrigir o problema específico!**

---

**Data:** 06/11/2024  
**Tempo Estimado:** 30 segundos  
**Prioridade:** 🔴 Alta

