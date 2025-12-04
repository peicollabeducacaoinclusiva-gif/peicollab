# 🚨 CORREÇÃO URGENTE: Coordenador Não Consegue Salvar PEI

## ❌ **Problema**

Ao clicar em "Salvar" ao criar PEI como coordenador, aparece:
```
❌ Erro: Não foi possível salvar o PEI.
```

---

## 🔍 **Causa Raiz**

A **RLS Policy** do coordenador está incompleta!

```sql
-- POLICY ATUAL (PROBLEMÁTICA):
CREATE POLICY "coordinators_manage_school_peis" ON public.peis
  FOR ALL
  USING (
    has_role_direct('coordinator')
    AND school_id = get_user_school_direct()
  );
  -- ❌ FALTA WITH CHECK!
```

### **O Problema:**

Quando a policy é `FOR ALL` (inclui INSERT), o PostgreSQL precisa de:
- **`USING`**: Para SELECT, UPDATE, DELETE
- **`WITH CHECK`**: Para INSERT e UPDATE (validar dados novos)

Se não houver `WITH CHECK`, PostgreSQL **bloqueia INSERTs**!

---

## ✅ **SOLUÇÃO IMEDIATA**

### **Execute este SQL no Supabase Dashboard:**

```sql
-- RECRIAR POLICY com WITH CHECK adequado
DROP POLICY IF EXISTS "coordinators_manage_school_peis" ON public.peis;

CREATE POLICY "coordinators_manage_school_peis" ON public.peis
  FOR ALL
  USING (
    has_role_direct('coordinator')
    AND school_id = get_user_school_direct()
  )
  WITH CHECK (
    has_role_direct('coordinator')
    AND school_id = get_user_school_direct()
    AND created_by = auth.uid()
  );
```

---

## 📋 **Passo a Passo**

### **1️⃣ Abra o Supabase Dashboard**
- https://supabase.com/dashboard
- Entre no seu projeto
- Clique em **SQL Editor**

### **2️⃣ Cole e Execute o SQL Acima**
- Cole o SQL da seção "SOLUÇÃO IMEDIATA"
- Clique em **RUN** (ou Ctrl+Enter)
- ✅ Deve mostrar: "Success. No rows returned"

### **3️⃣ Teste Criar PEI Novamente**
1. **Faça LOGOUT e LOGIN** como coordenador
2. Dashboard → **"Solicitar PEI"**
3. ☑️ Marque **"Criar diretamente"**
4. Selecione um aluno
5. Clique **"Criar e Preencher"**
6. Preencha pelo menos o básico
7. Clique **"Salvar"**
8. ✅ **Deve funcionar agora!**

---

## 🔧 **Script Completo (Opcional)**

Se quiser executar com diagnóstico completo:

**Arquivo:** `scripts/fix_coordinator_create_pei_policy.sql`

Esse script:
- ✅ Mostra a policy atual
- ✅ Recria a policy corretamente
- ✅ Adiciona policy para education_secretary também
- ✅ Verifica o resultado
- ✅ Adiciona comentários

---

## 🎯 **O Que Muda**

### **ANTES (Bloqueado):**
```
Coordenador cria PEI
    ↓
PostgreSQL valida com USING
    ↓
❌ USING não tem WITH CHECK
    ↓
❌ INSERT bloqueado
    ↓
Erro: "Não foi possível salvar"
```

### **DEPOIS (Funciona):**
```
Coordenador cria PEI
    ↓
PostgreSQL valida com WITH CHECK
    ↓
✅ WITH CHECK permite created_by = auth.uid()
    ↓
✅ INSERT permitido
    ↓
✅ PEI criado com sucesso!
```

---

## 📊 **Validações na Nova Policy**

### **USING (Para SELECT/UPDATE/DELETE):**
```sql
has_role_direct('coordinator')
AND school_id = get_user_school_direct()
```
**Significa:** Coordenador vê/edita PEIs da sua escola

### **WITH CHECK (Para INSERT/UPDATE):**
```sql
has_role_direct('coordinator')
AND school_id = get_user_school_direct()
AND created_by = auth.uid()
```
**Significa:** Coordenador pode criar PEI se:
- ✅ Tem role de coordenador
- ✅ PEI é da sua escola
- ✅ Ele é o criador (created_by)

---

## 🛡️ **Segurança Mantida**

| Validação | Status |
|-----------|--------|
| Coordenador só vê PEIs da sua escola | ✅ Mantido |
| Não pode criar PEI de outra escola | ✅ Mantido |
| created_by deve ser o coordenador | ✅ **Adicionado** |
| assigned_teacher_id pode ser NULL | ✅ **Permitido** |

---

## 🔬 **Diagnóstico Avançado (Se Não Resolver)**

Se após executar o SQL ainda não funcionar, execute o diagnóstico:

**Arquivo:** `scripts/verificar_rls_coordenador_pei.sql`

Esse script mostra:
1. Todas as policies ativas em `peis`
2. Se RLS está habilitado
3. School_id do coordenador
4. Role do coordenador
5. Constraints da tabela
6. Triggers ativos
7. Simula criação de PEI

---

## 💡 **Melhorias no Código Frontend**

Adicionei **logs detalhados** para facilitar diagnóstico:

```typescript
console.log('🔧 Dados para salvar PEI:', {
  primaryRole,
  assignedTeacherId,
  studentSchoolId,
  profileTenantId: profile.tenant_id,
  userId: user.id,
  peiId
});

console.log('📝 PEI Data completo:', peiData);

// No erro:
console.error("Error details:", {
  message: error.message,
  details: error.details,
  hint: error.hint,
  code: error.code
});
```

**Agora quando der erro, você verá:**
- Mensagem de erro completa
- Código do erro
- Hint do PostgreSQL
- Detalhes técnicos

---

## 🎯 **Casos de Teste**

Após executar o SQL, teste:

### **Teste 1: Coordenador Cria Direto**
```
1. Login como coordenador
2. "Solicitar PEI"
3. ☑️ "Criar diretamente"
4. Seleciona aluno
5. Preenche mínimo necessário
6. Clica "Salvar"
7. ✅ DEVE FUNCIONAR
```

### **Teste 2: Coordenador Atribui**
```
1. Login como coordenador
2. "Solicitar PEI"
3. ☐ NÃO marca "Criar diretamente"
4. Seleciona aluno + professor
5. Clica "Solicitar PEI"
6. ✅ DEVE CRIAR E ATRIBUIR
```

### **Teste 3: Professor Cria Normal**
```
1. Login como professor
2. "Criar PEI"
3. Preenche
4. Clica "Salvar"
5. ✅ DEVE FUNCIONAR (sem mudanças)
```

---

## 📞 **Se o Erro Persistir**

### **Execute o diagnóstico:**
```sql
-- Ver se coordenador tem a função get_user_school_direct() funcionando
SELECT 
  auth.uid() as current_user,
  get_user_school_direct() as my_school_id,
  has_role_direct('coordinator') as tem_role;
```

**Resultado esperado:**
```
current_user: abc-123-...
my_school_id: school-id-...
tem_role: true
```

**Se algum for NULL ou false:**
- Problema está nas funções auxiliares
- Me envie o resultado para investigar mais

---

## ⚡ **RESUMO EXECUTIVO**

| Item | Ação |
|------|------|
| **Causa** | Policy sem WITH CHECK |
| **Solução** | Recriar policy |
| **Arquivo** | `fix_coordinator_create_pei_policy.sql` |
| **Tempo** | ~10 segundos |
| **Risco** | 🟢 Baixo (só corrige policy) |
| **Teste** | Criar PEI como coordenador |

---

## 🚀 **EXECUTE AGORA**

**Cole no SQL Editor do Supabase:**

```sql
DROP POLICY IF EXISTS "coordinators_manage_school_peis" ON public.peis;

CREATE POLICY "coordinators_manage_school_peis" ON public.peis
  FOR ALL
  USING (
    has_role_direct('coordinator')
    AND school_id = get_user_school_direct()
  )
  WITH CHECK (
    has_role_direct('coordinator')
    AND school_id = get_user_school_direct()
    AND created_by = auth.uid()
  );
```

**Depois teste criar PEI novamente!** ✅

---

**Criado:** 05/11/2025  
**Status:** ⚡ Pronto para aplicar  
**Urgência:** 🔴 Alta




