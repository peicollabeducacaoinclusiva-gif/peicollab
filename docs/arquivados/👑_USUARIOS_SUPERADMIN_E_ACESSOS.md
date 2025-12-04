# 👑 Usuários SuperAdmin e Níveis de Acesso

## 🎯 Usuário SuperAdmin

### Credenciais do SuperAdmin

**Email:** `peicollabeducacaoinclusiva@gmail.com`  
**Senha:** `Inclusao2025!` ⚠️ **ALTERAR após primeiro login!**  
**Nome:** PEI Collab - Educação Inclusiva

**Permissões:**
- ✅ Acesso a **TODOS os tenants** (redes municipais)
- ✅ Acesso a **TODAS as escolas**
- ✅ Acesso a **TODOS os alunos**
- ✅ Acesso a **TODOS os usuários**
- ✅ Acesso a **TODOS os PEIs**
- ✅ Pode gerenciar tenants e escolas
- ✅ Pode gerenciar roles de usuários

**UUID:** `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`

### ⚠️ SuperAdmin Antigo (REMOVIDO):
- ❌ Email: `superadmin@teste.com` - **NÃO funciona mais**
- ❌ UUID: `11111111-1111-1111-1111-111111111111` - **DELETADO**

---

## 👥 Outros Usuários de Teste

### 1. Coordenador
- **Email:** `coordenador@teste.com`
- **Senha:** `Teste123!`
- **Nome:** Maria Coordenadora
- **Acesso:** Sua escola apenas

### 2. Professor
- **Email:** `professor@teste.com`
- **Senha:** `Teste123!`
- **Nome:** João Professor
- **Acesso:** Apenas alunos com PEI vinculado a ele

### 3. Gestor Escolar
- **Email:** `gestor@teste.com`
- **Senha:** `Teste123!`
- **Nome:** Carlos Gestor Escolar
- **Acesso:** Sua escola apenas

### 4. Professor AEE
- **Email:** `aee@teste.com`
- **Senha:** `Teste123!`
- **Nome:** Ana Professora AEE
- **Acesso:** Todos os alunos da sua escola

### 5. Especialista
- **Email:** `especialista@teste.com`
- **Senha:** `Teste123!`
- **Nome:** Dr. Pedro Especialista
- **Acesso:** Alunos da sua rede

### 6. Família
- **Email:** `familia@teste.com`
- **Senha:** `Teste123!`
- **Nome:** Pedro Família
- **Acesso:** Apenas PEI do seu filho

---

## 🔐 Políticas RLS para Students

### 1. SuperAdmin
```sql
CREATE POLICY "superadmin_view_all_students" ON public.students
  FOR SELECT USING (has_role_direct('superadmin'));
```
**Permissão:** ✅ Vê **TODOS** os alunos de todos os tenants

### 2. Education Secretary
```sql
CREATE POLICY "education_secretary_can_view_students" ON public.students
  FOR SELECT USING (
    is_education_secretary(auth.uid()) AND 
    school_id IN (SELECT id FROM schools WHERE tenant_id = ...)
  );
```
**Permissão:** ✅ Vê todos os alunos da **sua rede**

### 3. School Director
```sql
CREATE POLICY "school_director_can_view_students" ON public.students
  FOR SELECT USING (
    is_school_director(auth.uid()) AND 
    school_id = get_user_school_id(auth.uid())
  );
```
**Permissão:** ✅ Vê apenas alunos da **sua escola**

### 4. Coordinator
```sql
CREATE POLICY "coordinator_can_view_students" ON public.students
  FOR SELECT USING (
    is_coordinator(auth.uid()) AND 
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
  );
```
**Permissão:** ✅ Vê alunos da **sua escola**

### 5. AEE Teacher
```sql
CREATE POLICY "aee_teacher_can_view_students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'aee_teacher') AND 
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
  );
```
**Permissão:** ✅ Vê todos os alunos da **sua escola**

### 6. Teacher
```sql
CREATE POLICY "teacher_can_view_own_students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'teacher') AND 
    id IN (SELECT student_id FROM peis WHERE ...)
  );
```
**Permissão:** ✅ Vê apenas alunos que **têm PEI vinculado a ele**

### 7. Support Professional
```sql
CREATE POLICY "support_professional_can_view_students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'support_professional') AND 
    id IN (SELECT student_id FROM support_professional_students WHERE ...)
  );
```
**Permissão:** ✅ Vê apenas alunos que **acompanha**

### 8. Specialist
```sql
CREATE POLICY "specialist_can_view_students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'specialist') AND 
    school_id IN (SELECT id FROM schools WHERE tenant_id = ...)
  );
```
**Permissão:** ✅ Vê alunos da **sua rede**

---

## 🧪 Como Testar com SuperAdmin

### 1. Fazer Login como SuperAdmin

Acesse o **Gestão Escolar**:
```
http://localhost:5174/login
```

**Credenciais:**
- Email: `superadmin@teste.com`
- Senha: `Teste123!`

### 2. Verificar Acesso Total

Após login, você deve ver:
- ✅ **Todos** os alunos de **todos** os tenants
- ✅ **Todos** os usuários
- ✅ **Todas** as escolas
- ✅ **Todos** os PEIs

### 3. Verificar no Console

```javascript
// Ver dados do usuário logado
const { data: { user } } = await supabase.auth.getUser();
console.log(user);

// Ver perfil
const { data: profile } = await supabase
  .from('profiles')
  .select('*, user_roles(role)')
  .eq('id', user.id)
  .single();
console.log(profile);
```

---

## 🔍 Como Verificar Usuários SuperAdmin no Banco

### Query SQL:

```sql
-- Ver todos os superadmins
SELECT 
  p.id,
  p.email,
  p.full_name,
  ur.role,
  t.network_name as rede,
  s.school_name as escola,
  p.is_active
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN tenants t ON t.id = p.tenant_id
LEFT JOIN schools s ON s.id = p.school_id
WHERE ur.role = 'superadmin'
ORDER BY p.full_name;
```

### Resultado Esperado:

| email | full_name | role | rede | escola | is_active |
|-------|-----------|------|------|--------|-----------|
| superadmin@teste.com | Super Admin Sistema | superadmin | - | - | true |

---

## 🛡️ Diferença entre Papéis

### Hierarquia de Acesso:

```
👑 SuperAdmin
   ├─ Acesso: TODOS os tenants
   └─ Pode: Gerenciar tudo
   
📊 Education Secretary (Secretário de Educação)
   ├─ Acesso: SUA rede (tenant)
   └─ Pode: Gerenciar escolas da rede
   
🏫 School Director (Diretor)
   ├─ Acesso: SUA escola
   └─ Pode: Gerenciar alunos/turmas da escola
   
👨‍🏫 Coordinator (Coordenador)
   ├─ Acesso: SUA escola
   └─ Pode: Ver e gerenciar PEIs
   
👩‍🏫 AEE Teacher (Professor AEE)
   ├─ Acesso: Alunos da SUA escola
   └─ Pode: Criar e gerenciar PEIs
   
👨‍🏫 Teacher (Professor)
   ├─ Acesso: Apenas SEUS alunos (com PEI)
   └─ Pode: Ver PEIs dos seus alunos
   
👨‍⚕️ Support Professional
   ├─ Acesso: Alunos que ACOMPANHA
   └─ Pode: Dar feedbacks
   
🩺 Specialist (Especialista)
   ├─ Acesso: Alunos da SUA rede
   └─ Pode: Avaliar e orientar
   
👨‍👩‍👧 Family (Família)
   ├─ Acesso: Apenas PEI do SEU filho
   └─ Pode: Visualizar e comentar
```

---

## 🚀 Solução para "Alunos não aparecem"

### Opção 1: Usar SuperAdmin (Mais Rápido)

**Faça login com:**
- Email: `superadmin@teste.com`
- Senha: `Teste123!`

✅ **Resultado:** Todos os alunos aparecem imediatamente!

### Opção 2: Aplicar Migration (Recomendado)

Aplique a migration `20251111_add_more_student_policies.sql` para permitir que outros papéis vejam alunos.

```bash
# Via Supabase CLI
supabase db push

# Ou copie o SQL e execute no Supabase Dashboard → SQL Editor
```

### Opção 3: Dar Papel Adequado

Se você está logado com outro usuário, adicione um papel adequado:

```sql
-- Adicionar papel de education_secretary
INSERT INTO user_roles (user_id, role)
VALUES (
  (SELECT id FROM profiles WHERE email = 'seu@email.com'),
  'education_secretary'
);
```

---

## 📊 Resumo de Acessos

| Papel | Ver Alunos | Escopo |
|-------|------------|--------|
| SuperAdmin | ✅ Todos | Global (todos os tenants) |
| Education Secretary | ✅ Todos | Sua rede (tenant) |
| School Director | ✅ Sim | Sua escola |
| Coordinator | ✅ Sim | Sua escola |
| AEE Teacher | ✅ Sim | Sua escola |
| Teacher | ⚠️ Limitado | Apenas alunos com PEI dele |
| Support Professional | ⚠️ Limitado | Apenas alunos que acompanha |
| Specialist | ✅ Sim | Sua rede |
| Family | ❌ Não | Apenas dados do filho |

---

## 🎯 Recomendação

**Para testar o Gestão Escolar rapidamente:**

Use as credenciais do **SuperAdmin**:
```
Email: superadmin@teste.com
Senha: Teste123!
```

Você terá acesso completo a todos os dados! 👑

**Para produção:**

Crie usuários reais com papéis específicos e aplique todas as migrations de RLS.

---

**🌟 O SuperAdmin tem poderes totais no sistema! Use com responsabilidade. 👑**

