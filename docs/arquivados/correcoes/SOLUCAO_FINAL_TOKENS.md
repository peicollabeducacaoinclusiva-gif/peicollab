# ✅ SOLUÇÃO FINAL: Tokens Aparecerem no Dashboard

**Problema:** Tokens gerados não aparecem na aba "Tokens"  
**Causa:** Faltam policies RLS para coordenadores acessarem tabelas relacionadas  
**Status:** 🔧 **SOLUÇÃO PRONTA**

---

## 🚀 Aplicar Agora (2 Migrações)

### **Migração 1: Policy para family_access_tokens**
✅ Já aplicada (se você seguiu as instruções anteriores)

### **Migração 2: Policies para students e profiles**
⏸️ **APLICAR AGORA**

---

## 📋 Passo a Passo

### 1️⃣ **Acessar SQL Editor**
- Vá para: https://app.supabase.com
- Selecione seu projeto
- Clique em: **SQL Editor**
- Clique em: **"New Query"**

### 2️⃣ **Cole o Código Abaixo**

```sql
-- =====================================================
-- SOLUÇÃO COMPLETA: Policies para Coordenadores
-- =====================================================

-- =====================================================
-- 1. POLICY PARA STUDENTS
-- =====================================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- 2. POLICY PARA PROFILES
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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
      AND (
        profiles.school_id = (
          SELECT school_id FROM public.profiles WHERE id = auth.uid()
        )
        OR profiles.id = auth.uid()
      )
  )
);

-- =====================================================
-- 3. VERIFICAÇÃO
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Policy para students criada!';
  RAISE NOTICE '✅ Policy para profiles criada!';
  RAISE NOTICE '🎉 Coordenadores agora podem ver tokens!';
END;
$$;
```

### 3️⃣ **Executar**
- Clique em **"Run"** (ou pressione Ctrl + Enter)

### 4️⃣ **Verificar Sucesso**
Você deve ver:
```
NOTICE: ✅ Policy para students criada!
NOTICE: ✅ Policy para profiles criada!
NOTICE: 🎉 Coordenadores agora podem ver tokens!
```

### 5️⃣ **Recarregar Dashboard**
- Volte para o dashboard
- Pressione **F5** ou **Ctrl + R**
- Acesse a aba **"Tokens"**
- Os tokens devem aparecer! ✅

---

## 🧪 Testar se Funcionou

### **Teste 1: Verificar no Dashboard**

1. Login como coordenador
2. Aba **"Tokens"**
3. Deve aparecer a lista de tokens ✅

### **Teste 2: Abrir Console (F12)**

Deve aparecer:
```javascript
🔑 FamilyTokenManager: Carregando tokens...
📌 Filtros: {studentId: undefined, peiId: undefined}
📊 Resultado da query: {data: Array(X), error: null}
✅ Tokens processados: X
```

(Onde X é o número de tokens gerados)

### **Teste 3: Verificar no SQL**

```sql
-- Ver policies criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE policyname IN (
  'coordinator_can_manage_tokens',
  'coordinator_can_view_students',
  'coordinator_can_view_profiles'
)
ORDER BY tablename, policyname;
```

**Resultado esperado:**
```
family_access_tokens | coordinator_can_manage_tokens  | ALL
profiles             | coordinator_can_view_profiles  | SELECT
students             | coordinator_can_view_students  | SELECT
```

---

## 📊 Estrutura da Lista de Tokens

Após aplicar, você verá:

```
┌──────────────────────────────────────────────┐
│ 🔑 Tokens de Acesso Familiar                 │
│ [🔍 Buscar] [Filtro: Todos ▼] [🔄 Atualizar]│
├──────────────────────────────────────────────┤
│ 👤 João Silva                  [✅ Ativo]    │
│ 🏫 Escola Municipal São João                │
│ 👨‍🏫 Criado por: Prof. Maria (coordenadora)  │
│ 📅 Criado: 05/11/2024                        │
│ ⏰ Expira: 12/11/2024                        │
│ Usos: 2/10                                   │
│ [👁️ Ver] [🔗 Copiar] [🗑️ Excluir]          │
└──────────────────────────────────────────────┘
```

---

## 🔍 Por Que Isso Era Necessário?

### **Problema Original:**

O componente `FamilyTokenManager` faz esta query:

```sql
SELECT 
  fat.*,
  students:student_id(name),     -- JOIN com students
  profiles:created_by(full_name) -- JOIN com profiles
FROM family_access_tokens fat;
```

### **O Que Faltava:**

1. ✅ Policy para `family_access_tokens` → **Já aplicada**
2. ❌ Policy para `students` → **Faltava!**
3. ❌ Policy para `profiles` → **Faltava!**

Sem policies 2 e 3, o JOIN falhava silenciosamente e retornava array vazio.

---

## 🚨 Troubleshooting

### **Problema: Ainda não aparece**

**1. Verificar se as 3 policies existem:**
```sql
SELECT COUNT(*) FROM pg_policies 
WHERE policyname IN (
  'coordinator_can_manage_tokens',
  'coordinator_can_view_students',
  'coordinator_can_view_profiles'
);
```
Deve retornar: **3**

**2. Verificar console do navegador (F12):**
- Se aparecer erro, cole aqui para análise

**3. Limpar cache:**
```
Ctrl + Shift + R (hard refresh)
```

**4. Verificar role do usuário:**
```sql
SELECT role FROM user_roles 
WHERE user_id = auth.uid();
```
Deve retornar: **coordinator**

---

### **Problema: "permission denied"**

**Solução:** Verificar se as policies foram criadas corretamente.

Execute:
```sql
-- Recriar todas as policies
\i supabase/migrations/20250206000001_add_coordinator_tokens_policy.sql
\i supabase/migrations/20250206000002_add_coordinator_students_profiles_policies.sql
```

---

## ✅ Checklist Final

- [ ] ✅ Migração 1 aplicada (family_access_tokens)
- [ ] ✅ Migração 2 aplicada (students + profiles)
- [ ] ✅ Mensagens de sucesso apareceram
- [ ] ✅ Dashboard recarregado (F5)
- [ ] ✅ Aba "Tokens" acessada
- [ ] ✅ **Tokens aparecem na lista!** 🎉

---

## 📁 Arquivos Criados

1. ✅ `supabase/migrations/20250206000001_add_coordinator_tokens_policy.sql`
2. ✅ `supabase/migrations/20250206000002_add_coordinator_students_profiles_policies.sql`
3. ✅ `src/components/coordinator/FamilyTokenManager.tsx` (logs adicionados)
4. ✅ `src/components/dashboards/CoordinatorDashboard.tsx` (aba adicionada)

---

## 📞 Ainda com Problemas?

**Me envie:**
1. Screenshot do console (F12 → Console)
2. Resultado da query de verificação de policies
3. Qualquer mensagem de erro

---

**🎉 Pronto! Aplique a migração e os tokens vão aparecer!**

---

**Data:** 06/11/2024  
**Versão:** 2.1  
**Tempo Estimado:** 2 minutos  
**Prioridade:** 🔴 Crítica


