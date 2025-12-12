# 🐛 Debug: Dashboard Não Carrega Dados

## 🎯 Problema Relatado

**Sintoma:**
- ✅ Login funciona e aceita credenciais
- ✅ Redireciona para `/dashboard`
- ❌ **Dashboard não carrega os dados**
- ❌ Página fica em branco ou sem informações

---

## 🔍 Causa Raiz Identificada

O código estava tentando buscar de uma tabela `user_roles` que:
1. Pode não existir
2. Ou não tem dados
3. Causando falhas nas queries

**Tabela Correta:** `profiles` (tem coluna `role` diretamente)

---

## ✅ Correções Aplicadas

### **1. useUserProfile.ts** (Hook de Perfil)

**ANTES:**
```typescript
// Buscava de user_roles (tabela separada)
const { data: userRoles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id);
```

**DEPOIS:**
```typescript
// Busca role diretamente de profiles
const { data: profileData } = await supabase
  .from('profiles')
  .select('full_name, email, role, tenant_id, school_id, ...')
  .eq('id', user.id)
  .single();

// role vem direto do profile
role: profileData.role || 'teacher'
```

---

### **2. ProtectedRoute.tsx** (Verificação de Permissões)

**ANTES:**
```typescript
// Múltiplas buscas em user_roles
const { data: userRoles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', session.user.id)
  .single();

const userRole = userRoles?.role;
```

**DEPOIS:**
```typescript
// Busca role uma vez, de profiles
const { data: profile } = await supabase
  .from('profiles')
  .select('is_active, school_id, role')
  .eq('id', session.user.id)
  .single();

const userRole = profile.role;
```

**Benefício:**
- ✅ Menos queries ao banco
- ✅ Mais rápido
- ✅ Menos pontos de falha

---

### **3. Logs de Debug Adicionados**

**ProtectedRoute:**
```typescript
✅ Sessão encontrada: email@usuario.com
✅ Perfil carregado: { role, tenant_id, school_id, is_active }
✅ ProtectedRoute: Renderizando conteúdo protegido
❌ Redirecionando para login (se falhar)
```

**Dashboard:**
```typescript
📊 Dashboard - Profile Data: { profileData, isLoading, error }
⚠️ LoadStats: tenant_id não encontrado (se falhar)
📊 LoadStats: Iniciando busca de dados para tenant: xxx
✅ Stats carregadas: { students, professionals, classes, peis }
❌ Erro ao carregar estatísticas (se falhar)
```

---

## 🧪 Como Testar

### **1. Abrir DevTools (F12)**
- Aba: **Console**
- Limpar: Clique no ícone 🚫

### **2. Fazer Login**
```
URL: http://localhost:5176/login
Email: coordenador@teste.com
Senha: Teste123
```

### **3. Verificar Console**

**Se funcionou corretamente, verá:**
```
✅ Sessão encontrada: coordenador@teste.com
✅ Perfil carregado: { role: "coordinator", tenant_id: "...", ... }
✅ ProtectedRoute: Renderizando conteúdo protegido
📊 Dashboard - Profile Data: { profileData: {...}, isLoading: false }
📊 LoadStats: Iniciando busca de dados para tenant: 00000000-...
✅ Stats carregadas: { students: X, professionals: Y, ... }
```

**Se ainda falhar, verá:**
```
❌ Erro ao buscar perfil: { message: "..." }
❌ Perfil não encontrado para usuário: xxx
⚠️ LoadStats: tenant_id não encontrado
```

---

## 🔧 Problemas Possíveis e Soluções

### Problema 1: "Perfil não encontrado"

**Causa:** Usuário não tem registro na tabela `profiles`  
**Solução:**
```sql
-- Verificar se o usuário existe
SELECT * FROM profiles WHERE email = 'coordenador@teste.com';

-- Se não existir, criar
INSERT INTO profiles (id, full_name, email, role, tenant_id, is_active)
VALUES (
  'user-id-from-auth',
  'Coordenador',
  'coordenador@teste.com',
  'coordinator',
  '00000000-0000-0000-0000-000000000001',
  true
);
```

---

### Problema 2: "tenant_id não encontrado"

**Causa:** Profile existe mas sem tenant_id  
**Solução:**
```sql
-- Atualizar profile com tenant_id
UPDATE profiles 
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE email = 'coordenador@teste.com';
```

---

### Problema 3: "Stats não carregam"

**Causa:** RLS bloqueando acesso ou tabelas vazias  
**Solução:**
```sql
-- Verificar se há dados
SELECT COUNT(*) FROM students WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
SELECT COUNT(*) FROM professionals WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
SELECT COUNT(*) FROM classes WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Verificar RLS
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('students', 'professionals', 'classes', 'peis');
```

---

### Problema 4: "Dashboard renderiza mas vazio"

**Causa:** Tenant não tem dados cadastrados ainda  
**Solução:** Normal! Basta cadastrar:
- Primeiro aluno
- Primeiro professor
- Primeira turma

---

## 📋 Checklist de Validação

Após o login, verifique no console:

- [ ] ✅ Sessão encontrada?
- [ ] ✅ Perfil carregado com role?
- [ ] ✅ tenant_id presente?
- [ ] ✅ ProtectedRoute renderiza?
- [ ] ✅ Dashboard Profile Data OK?
- [ ] ✅ LoadStats inicia?
- [ ] ✅ Stats carregadas?

Se **TODOS** os checkboxes acima tiverem ✅, o dashboard deve funcionar!

---

## 🚀 Arquivos Alterados

1. **apps/gestao-escolar/src/hooks/useUserProfile.ts**
   - Remove dependência de `user_roles`
   - Busca role diretamente de `profiles`
   - Adiciona logs de erro

2. **packages/ui/src/components/shared/ProtectedRoute.tsx**
   - Remove buscas em `user_roles`
   - Busca role de `profiles` em uma única query
   - Adiciona logs de debug completos

3. **apps/gestao-escolar/src/pages/Dashboard.tsx**
   - Adiciona logs de debug
   - Mostra estado do profileData
   - Mostra stats carregadas

---

## 📊 Status

**Alterações feitas:** ✅ 3 arquivos  
**Logs adicionados:** ✅ 8 pontos de debug  
**Commit feito:** ❌ Aguardando sua permissão  
**Testes:** ⏳ Pronto para testar

---

**Próximo passo:** Teste o login novamente e compartilhe o que aparece no console! 🔍

